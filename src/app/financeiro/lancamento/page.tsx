/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useReactTable } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { MainHeader } from "@/components/main-header"
import { useAuth } from "@/app/contexts/auth-context"
import { useUrlParamsWatcher } from "@/hooks/use-url-params-watcher"
import { format } from "date-fns"
import type { FinancialTransaction, LancamentoFilter } from "@/types/types"
import type { Transaction } from "@/app/services/transaction-service"
import type { EditScope } from "@/components/recurring-edit-modal"
import { getLancamentosByRecurrenceId } from "@/app/services/lancamento-service"
import customToast from "@/components/ui/custom-toast"

import { useLancamentoUrlState, type SortCriteria } from "./_hooks/use-lancamento-url-state"
import { useLancamentoData } from "./_hooks/use-lancamento-data"
import { LancamentoToolbar } from "./_components/lancamento-toolbar"
import { LancamentoTable } from "./_components/lancamento-table"
import { LancamentoModals } from "./_components/lancamento-modals"

function sanitizeDateFilters(filter: LancamentoFilter): LancamentoFilter {
  const sanitized: LancamentoFilter = { ...filter }

  delete sanitized.id_conta_contabil

  if (sanitized.tipoData === 'data_emissao') {
    delete sanitized.data_vencimento_inicio
    delete sanitized.data_vencimento_fim
    delete sanitized.data_pagamento_inicio
    delete sanitized.data_pagamento_fim
  } else if (sanitized.tipoData === 'data_vencimento') {
    delete sanitized.data_inicio
    delete sanitized.data_fim
    delete sanitized.data_pagamento_inicio
    delete sanitized.data_pagamento_fim
  } else if (sanitized.tipoData === 'data_pagamento') {
    delete sanitized.data_inicio
    delete sanitized.data_fim
    delete sanitized.data_vencimento_inicio
    delete sanitized.data_vencimento_fim
  }

  return sanitized
}

export default function FinancialTransactionsPage() {
  const { hasPermission } = useAuth()
  const router = useRouter()

  // --- URL state hook ---
  const urlState = useLancamentoUrlState()
  const {
    currentFilter, setCurrentFilter,
    isDefaultFilter, setIsDefaultFilter,
    sortCriteria, setSortCriteria,
    searchTerm, setSearchTerm,
    debouncedSearchTerm,
    paginationInfo, setPaginationInfo,
    currentFilterRef, paginationInfoRef, debouncedSearchTermRef,
    updateURLWithFilters,
    clearSearch,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleFilter,
    clearSortCriteria,
    searchParams,
  } = urlState

  // --- Data hook ---
  const dataHook = useLancamentoData(
    currentFilterRef,
    paginationInfoRef,
    debouncedSearchTermRef,
    setPaginationInfo,
  )
  const {
    transactions, loading, refreshing, error,
    cashAccounts, selectedAccountData, setSelectedAccountData,
    selectedBankAgency, totalCashBalance,
    fetchTransactions, deleteTransaction, deleteMultipleTransactions,
    getRelatedTransactions, getVisibleTransactions, handleTransactionUpdate,
  } = dataHook

  // --- Scroll state ---
  const [isScrolled, setIsScrolled] = useState(false)
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // --- Progressive rendering ---
  const RENDER_BATCH_SIZE = 100
  const [renderLimit, setRenderLimit] = useState(100)

  useEffect(() => { setRenderLimit(RENDER_BATCH_SIZE) }, [transactions])

  const filteredAndSortedTransactions = useMemo(() =>
    getVisibleTransactions(debouncedSearchTerm, sortCriteria),
    [getVisibleTransactions, debouncedSearchTerm, sortCriteria]
  )

  useEffect(() => {
    const totalItems = filteredAndSortedTransactions.length
    if (renderLimit >= totalItems || totalItems <= RENDER_BATCH_SIZE) return
    const loadMore = () => setRenderLimit(prev => Math.min(prev + RENDER_BATCH_SIZE, totalItems))
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(loadMore, { timeout: 500 })
      return () => (window as any).cancelIdleCallback(id)
    } else {
      const timer = setTimeout(loadMore, 100)
      return () => clearTimeout(timer)
    }
  }, [renderLimit, filteredAndSortedTransactions.length])

  const visibleTransactions = useMemo(() =>
    filteredAndSortedTransactions.slice(0, renderLimit),
    [filteredAndSortedTransactions, renderLimit]
  )
  const hasMoreToRender = renderLimit < filteredAndSortedTransactions.length

  // --- Selection state ---
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // --- Expansion state ---
  const [expandedAdjustments, setExpandedAdjustments] = useState<Set<string>>(new Set())
  const [expandedFaturas, setExpandedFaturas] = useState<Set<string>>(new Set())
  const [expandedParcelas, setExpandedParcelas] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [groupedByRecurrence, setGroupedByRecurrence] = useState(false)
  const [faturaItemsCache, setFaturaItemsCache] = useState<Record<string, Array<{
    id_item_fatura?: number; id_lcto: number; descricao?: string;
    data_compra?: string; numero_documento?: string; parcela_num: number;
    parcela_total: number; valor: string | number; status: string
  }>>>({})
  const [loadingFaturaItems, setLoadingFaturaItems] = useState<Set<string>>(new Set())

  const toggleAdjustmentExpansion = useCallback((id: string) => {
    setExpandedAdjustments(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const toggleParcelasExpansion = useCallback((id: string) => {
    setExpandedParcelas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const toggleFaturaExpansion = useCallback((id: string) => {
    setExpandedFaturas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

    // Load fatura items if needed
    const tx = transactions.find(t => t.id === id)
    if (tx?.idFatura && !tx.idCartao && !faturaItemsCache[String(tx.idFatura)]) {
      setLoadingFaturaItems(prev => { const n = new Set(prev); n.add(id); return n })
      import("@/app/services/fatura-cartao-service").then(async ({ getItensFatura }) => {
        try {
          const itens = await getItensFatura(tx.idFatura!)
          setFaturaItemsCache(prev => ({ ...prev, [String(tx.idFatura)]: itens as any }))
        } catch {
          customToast.error("Erro ao carregar itens da fatura")
          setExpandedFaturas(prev => { const n = new Set(prev); n.delete(id); return n })
        } finally {
          setLoadingFaturaItems(prev => { const n = new Set(prev); n.delete(id); return n })
        }
      })
    }
  }, [transactions, faturaItemsCache])

  const toggleGroupExpansion = useCallback((id: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  // --- Modal state ---
  const [currentTransaction, setCurrentTransaction] = useState<FinancialTransaction | undefined>(undefined)
  const [currentTransactionForModal, setCurrentTransactionForModal] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCancelPaymentModalOpen, setIsCancelPaymentModalOpen] = useState(false)
  const [isTransactionDetailsModalOpen, setIsTransactionDetailsModalOpen] = useState(false)
  const [transactionDetailsInitialTab, setTransactionDetailsInitialTab] = useState<"capa" | "detalhes" | "anexos" | "historico">("capa")
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [isRecurringDeleteModalOpen, setIsRecurringDeleteModalOpen] = useState(false)
  const [isRecurringEditModalOpen, setIsRecurringEditModalOpen] = useState(false)
  const [recurringEditScope, setRecurringEditScope] = useState<EditScope | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleteManyDialogOpen, setIsDeleteManyDialogOpen] = useState(false)
  const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false)
  const [boletoTransaction, setBoletoTransaction] = useState<FinancialTransaction | null>(null)
  const [relatedTransactions, setRelatedTransactions] = useState<FinancialTransaction[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // --- TanStack table ref (exposed by LancamentoTable) ---
  const [tableInstance, setTableInstance] = useState<any>(null)
  const onTableReady = useCallback((t: any) => setTableInstance(t), [])

  // --- URL watcher ---
  useUrlParamsWatcher(
    useCallback((newParams: URLSearchParams) => {
      const limitParam = newParams.get('limit')
      const updatedFilter: LancamentoFilter = {
        page: Number(newParams.get('page')) || 1,
        limit: limitParam !== null ? Number(limitParam) : 10,
      }

      const search = newParams.get('search')
      if (search) updatedFilter.search = search

      const id_tp_lcto = newParams.get('id_tp_lcto')
      if (id_tp_lcto) updatedFilter.id_tp_lcto = Number(id_tp_lcto)
      const id_conta_caixa = newParams.get('id_conta_caixa')
      if (id_conta_caixa) updatedFilter.id_conta_caixa = Number(id_conta_caixa)
      const id_pessoa = newParams.get('id_pessoa')
      if (id_pessoa) updatedFilter.id_pessoa = Number(id_pessoa)
      const id_empresa = newParams.get('id_empresa')
      if (id_empresa) updatedFilter.id_empresa = Number(id_empresa)
      const id_un_negocio = newParams.get('id_un_negocio')
      if (id_un_negocio) updatedFilter.id_un_negocio = Number(id_un_negocio)
      const status = newParams.get('status')
      if (status) updatedFilter.status = status as 'baixado' | 'pendente'
      const natureza = newParams.get('natureza')
      if (natureza) {
        if (natureza === 'credito') updatedFilter.natureza = 'entrada'
        else if (natureza === 'debito') updatedFilter.natureza = 'saida'
        else updatedFilter.natureza = natureza as 'entrada' | 'saida'
      }
      const data_inicio = newParams.get('data_inicio')
      if (data_inicio) updatedFilter.data_inicio = data_inicio
      const data_fim = newParams.get('data_fim')
      if (data_fim) updatedFilter.data_fim = data_fim
      const competencia = newParams.get('competencia')
      if (competencia) updatedFilter.competencia = Number(competencia)
      const tipoData = newParams.get('tipoData')
      if (tipoData) updatedFilter.tipoData = tipoData as 'data_emissao' | 'data_vencimento' | 'data_pagamento'
      const data_vencimento_inicio = newParams.get('data_vencimento_inicio')
      if (data_vencimento_inicio) updatedFilter.data_vencimento_inicio = data_vencimento_inicio
      const data_vencimento_fim = newParams.get('data_vencimento_fim')
      if (data_vencimento_fim) updatedFilter.data_vencimento_fim = data_vencimento_fim
      const data_pagamento_inicio = newParams.get('data_pagamento_inicio')
      if (data_pagamento_inicio) updatedFilter.data_pagamento_inicio = data_pagamento_inicio
      const data_pagamento_fim = newParams.get('data_pagamento_fim')
      if (data_pagamento_fim) updatedFilter.data_pagamento_fim = data_pagamento_fim

      const sortBy = newParams.get('sortBy')
      const sortOrder = newParams.get('sortOrder')
      if (sortBy) {
        updatedFilter.sortBy = sortBy
        updatedFilter.sortOrder = (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder : 'asc'
        const fields = sortBy.split(',')
        const orders = sortOrder?.split(',') || []
        setSortCriteria(fields.map((field, index) => ({
          field,
          direction: (orders[index] === 'desc' || orders[index] === 'asc') ? orders[index] as 'asc' | 'desc' : 'asc'
        })))
      }

      const sanitizedFilter = sanitizeDateFilters(updatedFilter)
      setIsDefaultFilter(false)
      setCurrentFilter(sanitizedFilter)
      fetchTransactions(sanitizedFilter, undefined, undefined, true)
    }, [fetchTransactions, setCurrentFilter, setIsDefaultFilter, setSortCriteria])
  )

  // --- Initial load ---
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch) setSearchTerm(urlSearch)
    fetchTransactions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (groupedByRecurrence) fetchTransactions(currentFilter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedByRecurrence])

  // --- Action handlers ---
  const openEditModal = useCallback((transaction: FinancialTransaction) => {
    const transactionForModal = {
      id_lancamento: Number(transaction.id),
      id_tp_lcto: transaction.idTpLcto ?? null,
      id_conta_contabil: Number(transaction.transactionTypeId),
      id_conta_caixa: transaction.cashAccountId && transaction.cashAccountId !== '' ? Number(transaction.cashAccountId) : null,
      id_pessoa: Number(transaction.clientId),
      id_un_negocio: Number(transaction.businessUnitId),
      id_empresa: transaction.empresaId ? Number(transaction.empresaId) : null,
      id_emissor: Number(transaction.clientId),
      id_pessoa_negocio: Number(transaction.businessUnitId),
      id_porto: null,
      id_navio: null,
      id_operacao: transaction.operationId ? Number(transaction.operationId) : null,
      numero_documento: transaction.document || null,
      descricao: transaction.description,
      valor: transaction.value.toString(),
      data_lancamento: format(transaction.date, 'yyyy-MM-dd HH:mm:ss'),
      data_vencimento: format(transaction.dueDate, 'yyyy-MM-dd HH:mm:ss'),
      data_pagamento: transaction.paymentDate ? format(transaction.paymentDate, 'yyyy-MM-dd HH:mm:ss') : null,
      observacoes: null,
      anexos: null,
      status: transaction.status === 'baixado',
      natureza: transaction.type,
      competencia: transaction.competence ? Number(transaction.competence) : 0,
      id_recorrencia: transaction.recurrenceId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Transaction

    setCurrentTransactionForModal(transactionForModal)
    setIsModalOpen(true)
  }, [])

  const handleEditTransaction = useCallback((transaction: FinancialTransaction) => {
    if (transaction.isRecurrent && transaction.recurrenceId) {
      setCurrentTransaction(transaction)
      setIsRecurringEditModalOpen(true)
      return
    }
    setRecurringEditScope(null)
    openEditModal(transaction)
  }, [openEditModal])

  const handleRecurringEditScopeSelected = useCallback((scope: EditScope, transaction: FinancialTransaction) => {
    setRecurringEditScope(scope)
    setCurrentTransaction(transaction)
    openEditModal(transaction)
  }, [openEditModal])

  const handleDeleteTransaction = useCallback((transaction: FinancialTransaction) => {
    setCurrentTransaction(transaction)
    if (transaction.isRecurrent && transaction.recurrenceId) {
      setIsRecurringDeleteModalOpen(true)
    } else {
      setIsDeleteDialogOpen(true)
    }
  }, [])

  const handleDeleteFromTransactionModal = useCallback((transactionId: number) => {
    const transaction = transactions.find(t => Number(t.id) === transactionId)
    if (transaction) {
      setIsModalOpen(false)
      handleDeleteTransaction(transaction)
      return
    }
    if (!currentTransactionForModal || currentTransactionForModal.id_lancamento !== transactionId) {
      customToast.error("Não foi possível localizar o lançamento para exclusão")
      return
    }
    const fallbackTransaction: FinancialTransaction = {
      id: String(currentTransactionForModal.id_lancamento),
      code: String(currentTransactionForModal.id_lancamento),
      date: new Date(currentTransactionForModal.data_lancamento),
      dueDate: new Date(currentTransactionForModal.data_vencimento),
      paymentDate: currentTransactionForModal.data_pagamento ? new Date(currentTransactionForModal.data_pagamento) : null,
      description: currentTransactionForModal.descricao || "",
      value: Number(currentTransactionForModal.valor || 0),
      type: currentTransactionForModal.natureza === "entrada" ? "entrada" : "saida",
      status: currentTransactionForModal.data_pagamento ? "baixado" : "pendente",
      transactionTypeId: String(currentTransactionForModal.id_conta_contabil || ""),
      transactionTypeName: "",
      cashAccountId: String(currentTransactionForModal.id_conta_caixa || ""),
      cashAccountName: "",
      clientId: String(currentTransactionForModal.id_pessoa || ""),
      businessUnitId: String(currentTransactionForModal.id_un_negocio || ""),
      isRecurrent: Boolean(currentTransactionForModal.id_recorrencia),
      recurrenceId: currentTransactionForModal.id_recorrencia || null,
    }
    setIsModalOpen(false)
    handleDeleteTransaction(fallbackTransaction)
  }, [transactions, currentTransactionForModal, handleDeleteTransaction])

  const handleViewTransactionDetails = useCallback(async (
    transaction: FinancialTransaction,
    initialTab: "capa" | "detalhes" | "anexos" | "historico" = "capa",
  ) => {
    setCurrentTransaction(transaction)
    try {
      if (transaction.isRecurrent && transaction.recurrenceId) {
        const related = await getLancamentosByRecurrenceId(transaction.recurrenceId)
        setRelatedTransactions(related.map(lanc => ({
          id: String(lanc.id_lancamento),
          description: lanc.descricao,
          value: Number(lanc.valor),
          date: new Date(lanc.data_lancamento),
          dueDate: new Date(lanc.data_vencimento),
          paymentDate: lanc.data_pagamento ? new Date(lanc.data_pagamento) : null,
          status: lanc.data_pagamento ? 'baixado' : 'pendente',
          recurrenceId: lanc.id_recorrencia || null,
        })) as FinancialTransaction[])
      } else {
        setRelatedTransactions([])
      }
    } catch {
      setRelatedTransactions([])
    }
    setTransactionDetailsInitialTab(initialTab)
    setIsTransactionDetailsModalOpen(true)
  }, [])

  const handleTransferEdit = useCallback((transaction: FinancialTransaction) => {
    if (!transaction.idTransferencia) {
      customToast.error("Transferência vinculada não encontrada")
      return
    }
    router.push(`/financeiro/transferencia?action=edit&id=${transaction.idTransferencia}&from=lancamentos`)
  }, [router])

  const handleTransferViewDetails = useCallback((transaction: FinancialTransaction) => {
    if (!transaction.idTransferencia) {
      customToast.error("Transferência vinculada não encontrada")
      return
    }
    router.push(`/financeiro/transferencia?action=view&id=${transaction.idTransferencia}&from=lancamentos`)
  }, [router])

  const handleTransferDelete = useCallback((transaction: FinancialTransaction) => {
    if (!transaction.idTransferencia) {
      customToast.error("Transferência vinculada não encontrada")
      return
    }
    router.push(`/financeiro/transferencia?action=delete&id=${transaction.idTransferencia}&from=lancamentos`)
  }, [router])

  const handleAddTransaction = useCallback(() => {
    setCurrentTransactionForModal(null)
    setIsModalOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!currentTransaction) return
    await deleteTransaction(currentTransaction, currentFilter)
    setIsDeleteDialogOpen(false)
  }, [currentTransaction, currentFilter, deleteTransaction])

  const confirmDeleteMany = useCallback(async () => {
    await deleteMultipleTransactions(selectedTransactions, currentFilter)
    setIsDeleteManyDialogOpen(false)
    setSelectedTransactions([])
    setSelectAll(false)
  }, [selectedTransactions, currentFilter, deleteMultipleTransactions])

  const handleOpenEditAfterCreate = useCallback(async (lancamentoId: number) => {
    try {
      const { getLancamentoById } = await import("@/app/services/lancamento-service")
      const lancamento = await getLancamentoById(lancamentoId)
      const lancamentoAny = lancamento as any
      const transactionForModal = {
        id_lancamento: lancamento.id_lancamento!,
        id_tp_lcto: lancamento.id_tp_lcto ?? null,
        id_conta_contabil: lancamento.id_conta_contabil,
        id_pessoa: lancamento.id_pessoa,
        id_un_negocio: lancamento.id_un_negocio,
        id_empresa: lancamentoAny.id_empresa ?? null,
        id_emissor: lancamentoAny.id_emissor,
        id_pessoa_negocio: lancamentoAny.id_pessoa_negocio,
        id_operacao: lancamento.id_operacao ?? null,
        numero_documento: lancamento.numero_documento || "",
        descricao: lancamento.descricao || "",
        valor: String(lancamento.valor || ""),
        data_lancamento: lancamento.data_lancamento || "",
        data_vencimento: lancamento.data_vencimento || "",
        data_pagamento: lancamento.data_pagamento || "",
        natureza: lancamento.natureza,
        status: !lancamento.data_pagamento,
        custeio: lancamento.custeio ?? false,
      } as unknown as Transaction
      setCurrentTransactionForModal(transactionForModal)
      setIsModalOpen(true)
    } catch {
      customToast.error("Erro ao abrir lançamento para edição")
    }
  }, [])

  // Wrappers for URL state handlers that inject fetchTransactions
  const onSort = useCallback((field: string, event?: React.MouseEvent) => {
    handleSort(field, event, fetchTransactions)
  }, [handleSort, fetchTransactions])

  const onPageChange = useCallback((page: number) => {
    handlePageChange(page, fetchTransactions)
  }, [handlePageChange, fetchTransactions])

  const onPageSizeChange = useCallback((size: number) => {
    handlePageSizeChange(size, fetchTransactions)
  }, [handlePageSizeChange, fetchTransactions])

  const onFilter = useCallback((filter: LancamentoFilter) => {
    if (!filter.id_conta_caixa) setSelectedAccountData(null)
    handleFilter(filter, fetchTransactions)
  }, [handleFilter, fetchTransactions, setSelectedAccountData])

  const onClearSort = useCallback(() => {
    clearSortCriteria(fetchTransactions)
  }, [clearSortCriteria, fetchTransactions])

  const onRefresh = useCallback(() => {
    fetchTransactions(currentFilter)
    setSelectedTransactions([])
    setSelectAll(false)
  }, [fetchTransactions, currentFilter])

  const onSave = useCallback(() => {
    fetchTransactions(currentFilter)
  }, [fetchTransactions, currentFilter])

  return (
    <>
      <MainHeader />
      <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 min-h-screen dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
        <div className="w-full px-4 md:px-6 lg:px-8 py-6">

          {/* HEADER FIXO */}
          <div className={`sticky top-14 z-30 backdrop-blur-sm pb-1 transition-colors duration-50 ${isScrolled ? 'bg-slate-50/95 dark:bg-slate-900/95' : ''}`}>
            <LancamentoToolbar
              table={tableInstance}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onClearSearch={clearSearch}
              currentFilter={currentFilter}
              isDefaultFilter={isDefaultFilter}
              isFilterOpen={isFilterOpen}
              onFilterOpenChange={setIsFilterOpen}
              onFilter={onFilter}
              onRefresh={onRefresh}
              selectedTransactions={selectedTransactions}
              onDeleteSelected={() => setIsDeleteManyDialogOpen(true)}
              hasPermission={hasPermission}
              onAddTransaction={handleAddTransaction}
              isScrolled={isScrolled}
              sortCriteria={sortCriteria}
              onClearSort={onClearSort}
              totalCashBalance={totalCashBalance}
              selectedAccountData={selectedAccountData}
              selectedBankAgency={selectedBankAgency}
              paginatedTransactions={filteredAndSortedTransactions}
            />
          </div>

          {/* TABELA */}
          <LancamentoTable
            visibleTransactions={visibleTransactions}
            loading={loading}
            refreshing={refreshing}
            error={error}
            isScrolled={isScrolled}
            paginationInfo={paginationInfo}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            sortCriteria={sortCriteria}
            onSort={onSort}
            hasPermission={hasPermission}
            onEdit={handleEditTransaction}
            onViewDetails={handleViewTransactionDetails}
            onEditTransfer={handleTransferEdit}
            onViewTransferDetails={handleTransferViewDetails}
            onDeleteTransfer={handleTransferDelete}
            onMarkAsPaid={(tx) => { setCurrentTransaction(tx); setIsPaymentModalOpen(true) }}
            onCreateRecurrence={(tx) => { setCurrentTransaction(tx); setIsRecurringModalOpen(true) }}
            onOpenBoleto={(tx) => { setBoletoTransaction(tx); setIsBoletoModalOpen(true) }}
            onCancelPayment={(tx) => { setCurrentTransaction(tx); setIsCancelPaymentModalOpen(true) }}
            onDelete={handleDeleteTransaction}
            selectedTransactions={selectedTransactions}
            setSelectedTransactions={setSelectedTransactions}
            selectAll={selectAll}
            setSelectAll={setSelectAll}
            allFilteredTransactions={filteredAndSortedTransactions}
            expandedAdjustments={expandedAdjustments}
            toggleAdjustmentExpansion={toggleAdjustmentExpansion}
            expandedParcelas={expandedParcelas}
            toggleParcelasExpansion={toggleParcelasExpansion}
            expandedFaturas={expandedFaturas}
            toggleFaturaExpansion={toggleFaturaExpansion}
            faturaItemsCache={faturaItemsCache}
            loadingFaturaItems={loadingFaturaItems}
            groupedByRecurrence={groupedByRecurrence}
            expandedGroups={expandedGroups}
            toggleGroupExpansion={toggleGroupExpansion}
            hasMoreToRender={hasMoreToRender}
            renderLimit={renderLimit}
            totalCount={filteredAndSortedTransactions.length}
            onTableReady={onTableReady}
          />
        </div>
      </div>

      {/* MODALS */}
      <LancamentoModals
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        currentTransactionForModal={currentTransactionForModal}
        setCurrentTransactionForModal={setCurrentTransactionForModal}
        recurringEditScope={recurringEditScope}
        setRecurringEditScope={setRecurringEditScope}
        onModalSuccess={() => { setIsModalOpen(false); setRecurringEditScope(null); fetchTransactions(currentFilter) }}
        onDeleteFromTransactionModal={handleDeleteFromTransactionModal}
        onOpenEditAfterCreate={handleOpenEditAfterCreate}
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        isCancelPaymentModalOpen={isCancelPaymentModalOpen}
        setIsCancelPaymentModalOpen={setIsCancelPaymentModalOpen}
        onEditAfterCancel={handleEditTransaction}
        isTransactionDetailsModalOpen={isTransactionDetailsModalOpen}
        setIsTransactionDetailsModalOpen={setIsTransactionDetailsModalOpen}
        transactionDetailsInitialTab={transactionDetailsInitialTab}
        setTransactionDetailsInitialTab={setTransactionDetailsInitialTab}
        relatedTransactions={relatedTransactions}
        onTransactionUpdate={handleTransactionUpdate}
        hasDeletePermission={hasPermission('financeiro.novo_lancamento', 'deletar')}
        onDeleteTransaction={handleDeleteTransaction}
        isRecurringModalOpen={isRecurringModalOpen}
        setIsRecurringModalOpen={setIsRecurringModalOpen}
        isRecurringDeleteModalOpen={isRecurringDeleteModalOpen}
        setIsRecurringDeleteModalOpen={setIsRecurringDeleteModalOpen}
        isRecurringEditModalOpen={isRecurringEditModalOpen}
        setIsRecurringEditModalOpen={setIsRecurringEditModalOpen}
        onRecurringEditScopeSelected={handleRecurringEditScopeSelected}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        isDeleteManyDialogOpen={isDeleteManyDialogOpen}
        setIsDeleteManyDialogOpen={setIsDeleteManyDialogOpen}
        selectedTransactionsCount={selectedTransactions.length}
        onConfirmDelete={confirmDelete}
        onConfirmDeleteMany={confirmDeleteMany}
        isBoletoModalOpen={isBoletoModalOpen}
        setIsBoletoModalOpen={setIsBoletoModalOpen}
        boletoTransaction={boletoTransaction}
        currentTransaction={currentTransaction}
        loading={loading}
        onSave={onSave}
      />
    </>
  )
}
