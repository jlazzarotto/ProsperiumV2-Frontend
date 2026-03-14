"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import {
  getAllLancamentos,
  deleteLancamento,
  getLancamentosByRecurrenceId,
} from "@/app/services/lancamento-service"
import { getAllPeople } from "@/app/services/person-api-service"
import { getAllBusinessUnits } from "@/app/services/business-unit-api-service"
import { getTipo8BusinessUnits } from "@/services/business-unit-service"
import { getAllCashAccounts, getCashAccountById } from "@/app/services/cash-account-api-service"
import { getBankAgencyById } from "@/app/services/bank-agency-service"
import { getCashAccountsStatus, type CashAccountStatusResponse } from "@/app/services/cash-account-status-service"
import { getAllPaymentMethodsContaCaixa } from "@/app/services/payment-method-service"
import type { FinancialTransaction, Lancamento, LancamentoFilter, CashAccount } from "@/types/types"
import type { SortCriteria } from "./use-lancamento-url-state"
import { calculateTotalValueWithAdjustments, getSortValue } from "../_lib/lancamento-utils"
import { cached } from "../_lib/reference-cache"
import customToast from "@/components/ui/custom-toast"

export function useLancamentoData(
  currentFilterRef: React.MutableRefObject<LancamentoFilter>,
  paginationInfoRef: React.MutableRefObject<{ currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number }>,
  debouncedSearchTermRef: React.MutableRefObject<string>,
  setPaginationInfo: (updater: (prev: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number }) => { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number }) => void,
) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [selectedAccountData, setSelectedAccountData] = useState<CashAccount | null>(null)
  const [selectedBankAgency, setSelectedBankAgency] = useState('')
  const [totalCashBalance, setTotalCashBalance] = useState<CashAccountStatusResponse | null>(null)

  const fetchTransactions = useCallback(async (
    customFilter?: LancamentoFilter,
    customPage?: number,
    customPageSize?: number,
    forceRefresh?: boolean,
  ) => {
    if (transactions.length > 0) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    const currentFilterValue = currentFilterRef.current
    const paginationInfoValue = paginationInfoRef.current

    let filterToUse: LancamentoFilter

    if (customFilter) {
      filterToUse = {
        ...customFilter,
        page: customPage || customFilter.page || 1,
        limit: customPageSize !== undefined ? customPageSize : (customFilter.limit !== undefined ? customFilter.limit : paginationInfoValue.itemsPerPage || 10),
      }
    } else {
      filterToUse = {
        ...currentFilterValue,
        page: customPage || paginationInfoValue.currentPage,
        limit: customPageSize !== undefined ? customPageSize : paginationInfoValue.itemsPerPage,
      }
    }

    if (!forceRefresh) {
      const searchTermValue = debouncedSearchTermRef.current
      if (customFilter?.search !== undefined) {
        filterToUse.search = customFilter.search
      } else if (searchTermValue && searchTermValue.trim()) {
        filterToUse.search = searchTermValue.trim()
      }
    }

    try {
      const dataLimiteSaldo = filterToUse.data_fim || filterToUse.data_vencimento_fim || filterToUse.data_pagamento_fim

      const [response, pessoas, unidadesNegocio, empresas, contasCaixa, formasPagamento, cashStatus] = await Promise.all([
        getAllLancamentos(filterToUse, forceRefresh),
        cached('pessoas', () => getAllPeople()),
        cached('unidades-negocio', () => getAllBusinessUnits()),
        cached('tipo8-business-units', () => getTipo8BusinessUnits()),
        cached('contas-caixa', () => getAllCashAccounts()),
        cached('formas-pagamento', () => getAllPaymentMethodsContaCaixa()),
        getCashAccountsStatus(dataLimiteSaldo),
      ])

      setCashAccounts(contasCaixa as CashAccount[])
      setTotalCashBalance(cashStatus)

      const pessoasMap = new Map(pessoas.map(p => [p.id, p.name]))
      const unidadesMap = new Map(unidadesNegocio.map(u => [u.id, u.name]))
      const unidadesAbrevMap = new Map(unidadesNegocio.map(u => [u.id, u.abbreviation]))
      const empresasMap = new Map(empresas.map(e => [String(e.id), e.apelido]))
      const empresasAbrevMap = new Map(empresas.map(e => [String(e.id), e.abreviatura]))
      const contasMap = new Map(contasCaixa.map((c: any) => [String(c.id), c.account]))
      const formasPagamentoMap = new Map(formasPagamento.map(f => [f.id, f.name]))

      const convertedData: FinancialTransaction[] = response.data.map((lanc: Lancamento) => {
          const totalAnexos = (lanc as unknown as { total_anexos?: number }).total_anexos || 0
          const cashAccountId = lanc.id_conta_caixa ? String(lanc.id_conta_caixa) : ''
          const cashAccountName = cashAccountId
            ? (lanc.conta_caixa_nome || contasMap.get(cashAccountId) || `Conta ${lanc.id_conta_caixa}`)
            : (lanc.permutado ? 'Permutado' : '-')

          return {
            id: String(lanc.id_lancamento),
            code: String(lanc.id_lancamento),
            idTpLcto: lanc.id_tp_lcto ?? undefined,
            idTransferencia: lanc.id_transferencia ?? null,
            isTransferencia: Boolean(lanc.is_transferencia),
            date: new Date(lanc.data_lancamento),
            dueDate: new Date(lanc.data_vencimento),
            paymentDate: lanc.data_pagamento ? new Date(lanc.data_pagamento) : null,
            description: lanc.descricao,
            value: Number(lanc.valor),
            paidValue: lanc.data_pagamento ? Number(lanc.vlr_pgto || lanc.valor) : Number(lanc.valor),
            type: (lanc.natureza as 'entrada' | 'saida') || 'entrada',
            status: lanc.data_pagamento ? 'baixado' as const : 'pendente' as const,
            transactionTypeId: String(lanc.id_conta_contabil),
            transactionTypeName: lanc.tipo_nome || 'Tipo não informado',
            isAtivoPermuta: Boolean(lanc.is_ativo_permuta),
            operationId: lanc.id_operacao ? String(lanc.id_operacao) : undefined,
            cashAccountId,
            cashAccountName,
            clientId: String(lanc.id_pessoa),
            clientName: pessoasMap.get(String(lanc.id_pessoa)) || `Pessoa ${lanc.id_pessoa}`,
            businessUnitId: String(lanc.id_un_negocio),
            businessUnitName: unidadesMap.get(String(lanc.id_un_negocio)) || `UN ${lanc.id_un_negocio}`,
            businessUnitAbbreviation: unidadesAbrevMap.get(String(lanc.id_un_negocio)) || '',
            empresaId: lanc.id_empresa ? String(lanc.id_empresa) : undefined,
            empresaName: lanc.id_empresa ? (empresasMap.get(String(lanc.id_empresa)) || `Empresa ${lanc.id_empresa}`) : undefined,
            empresaAbbreviation: lanc.id_empresa ? (empresasAbrevMap.get(String(lanc.id_empresa)) || '') : undefined,
            document: lanc.numero_documento || undefined,
            competence: lanc.competencia ? String(lanc.competencia) : undefined,
            isRecurrent: lanc.id_recorrencia ? true : false,
            recurrenceId: lanc.id_recorrencia || null,
            paymentMethod: lanc.id_forma_pgto_conta_caixa ? formasPagamentoMap.get(String(lanc.id_forma_pgto_conta_caixa)) : undefined,
            jurosDescontoAssociados: lanc.juros_desconto_associados || [],
            isJurosDesconto: lanc.id_juros_desconto ? true : false,
            idCartao: lanc.id_cartao || null,
            idFatura: lanc.id_fatura || null,
            idPlanoParcela: lanc.id_plano_parcela || null,
            parcelaNum: lanc.parcela_num || null,
            nomeCartao: lanc.nome_cartao || null,
            competenciaFatura: lanc.competencia_fatura || null,
            statusFatura: lanc.status_fatura || null,
            valorTotalFatura: lanc.valor_total_fatura ? Number(lanc.valor_total_fatura) : null,
            idLctoPagamentoFatura: lanc.id_lcto_pagamento_fatura || null,
            totalAnexos: totalAnexos,
            hasAttachments: totalAnexos > 0,
            permutado: typeof lanc.permutado === "number" ? lanc.permutado : (lanc.permutado ? 1 : 0),
          }
        })

      // Group parcelas
      const planoMap = new Map<number, FinancialTransaction[]>()
      const afterParcelas: FinancialTransaction[] = []

      for (const t of convertedData) {
        if (t.idPlanoParcela && t.parcelaNum && t.parcelaNum > 1) {
          if (!planoMap.has(t.idPlanoParcela)) planoMap.set(t.idPlanoParcela, [])
          planoMap.get(t.idPlanoParcela)!.push(t)
        } else {
          afterParcelas.push(t)
        }
      }

      for (const t of afterParcelas) {
        if (t.idPlanoParcela && planoMap.has(t.idPlanoParcela)) {
          const filhas = planoMap.get(t.idPlanoParcela)!
          filhas.sort((a, b) => (a.parcelaNum || 0) - (b.parcelaNum || 0))
          t.parcelasAgrupadas = filhas
        }
      }

      // Group fatura compras
      const faturaComprasMap = new Map<number, FinancialTransaction[]>()
      const finalData: FinancialTransaction[] = []

      for (const t of afterParcelas) {
        if (t.idCartao && t.idFatura) {
          if (!faturaComprasMap.has(t.idFatura)) faturaComprasMap.set(t.idFatura, [])
          faturaComprasMap.get(t.idFatura)!.push(t)
        } else {
          finalData.push(t)
        }
      }

      for (const [idFatura, compras] of faturaComprasMap) {
        compras.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

        const lctoFaturaIdx = finalData.findIndex(t => t.idFatura === idFatura && !t.idCartao)

        if (lctoFaturaIdx !== -1) {
          finalData[lctoFaturaIdx].itensFatura = compras
          finalData[lctoFaturaIdx].isFaturaRow = true
        } else {
          const primeiraCompra = compras[0]
          const competenciaFatura = primeiraCompra.competenciaFatura
          const nomeCartao = primeiraCompra.nomeCartao || 'Cartão'
          const mesAno = competenciaFatura
            ? `${String(competenciaFatura).slice(4)}/${String(competenciaFatura).slice(0, 4)}`
            : ''
          const valorTotal = primeiraCompra.valorTotalFatura || compras.reduce((sum, c) => sum + c.value, 0)

          const faturaVirtual: FinancialTransaction = {
            id: `fatura-${idFatura}`,
            code: '',
            date: primeiraCompra.date,
            dueDate: primeiraCompra.dueDate,
            paymentDate: null,
            description: `Fatura ${nomeCartao} ${mesAno}`,
            value: Number(valorTotal),
            type: 'saida',
            status: primeiraCompra.statusFatura === 'paga' ? 'baixado' : 'pendente',
            transactionTypeId: primeiraCompra.transactionTypeId,
            transactionTypeName: primeiraCompra.transactionTypeName,
            cashAccountId: primeiraCompra.cashAccountId,
            cashAccountName: primeiraCompra.cashAccountName,
            clientId: primeiraCompra.clientId,
            clientName: primeiraCompra.clientName,
            businessUnitId: primeiraCompra.businessUnitId,
            businessUnitName: primeiraCompra.businessUnitName,
            businessUnitAbbreviation: primeiraCompra.businessUnitAbbreviation,
            empresaId: primeiraCompra.empresaId,
            empresaName: primeiraCompra.empresaName,
            empresaAbbreviation: primeiraCompra.empresaAbbreviation,
            competence: competenciaFatura ? String(competenciaFatura) : primeiraCompra.competence,
            idFatura: idFatura,
            nomeCartao: nomeCartao,
            competenciaFatura: competenciaFatura,
            statusFatura: primeiraCompra.statusFatura,
            valorTotalFatura: Number(valorTotal),
            itensFatura: compras,
            isFaturaRow: true,
          }
          finalData.push(faturaVirtual)
        }
      }

      setTransactions(finalData)

      const isShowingAll = filterToUse.limit === -1

      if (response.pagination) {
        const currentPage = response.pagination.page || filterToUse.page || 1
        const total = response.pagination.total || convertedData.length
        const limit = isShowingAll ? -1 : (response.pagination.limit || filterToUse.limit || 10)

        setPaginationInfo(() => ({
          currentPage: isShowingAll ? 1 : currentPage,
          totalPages: isShowingAll ? 1 : Math.ceil(total / (limit > 0 ? limit : total)),
          totalItems: total,
          itemsPerPage: limit,
        }))
      } else {
        setPaginationInfo(() => ({
          currentPage: 1,
          totalPages: 1,
          totalItems: convertedData.length,
          itemsPerPage: isShowingAll ? -1 : (filterToUse.limit || 10),
        }))
      }
    } catch (err) {
      console.error("Erro ao carregar lançamentos:", err)
      setError("Não foi possível carregar os lançamentos. Tente novamente.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentFilterRef, paginationInfoRef, debouncedSearchTermRef, setPaginationInfo, transactions.length])

  // Load account data when filter changes
  useEffect(() => {
    const loadAccountData = async () => {
      const filter = currentFilterRef.current
      if (filter.id_conta_caixa) {
        try {
          const accountData = await getCashAccountById(String(filter.id_conta_caixa))
          setSelectedAccountData(accountData)

          if (accountData?.bankAgencyId) {
            try {
              const bankAgency = await getBankAgencyById(accountData.bankAgencyId)
              setSelectedBankAgency(bankAgency?.agencyName || '2562')
            } catch {
              setSelectedBankAgency('2562')
            }
          } else {
            setSelectedBankAgency('2562')
          }
        } catch {
          setSelectedAccountData(null)
          setSelectedBankAgency('2562')
        }
      } else {
        setSelectedAccountData(null)
        setSelectedBankAgency('2562')
      }
    }

    loadAccountData()
  }, [currentFilterRef.current.id_conta_caixa])

  // Apply value-based search filter and multi-sort
  const getVisibleTransactions = useCallback((
    debouncedSearchTerm: string,
    sortCriteria: SortCriteria[],
  ) => {
    let result = transactions

    // Value-based search filter
    const searchTermClean = debouncedSearchTerm?.trim() || ''
    const valorPattern = /^R?\$?\s*[\d.,]+$/
    if (searchTermClean && valorPattern.test(searchTermClean)) {
      const valorBuscado = parseFloat(
        searchTermClean
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      )

      if (!isNaN(valorBuscado) && valorBuscado > 0) {
        const tolerancia = 0.01
        result = result.filter(transaction => {
          const valorTotal = calculateTotalValueWithAdjustments(transaction)
          return Math.abs(valorTotal - valorBuscado) <= tolerancia
        })
      }
    }

    // Multi-sort (frontend, when >1 criteria)
    if (sortCriteria.length > 1) {
      result = [...result].sort((a, b) => {
        for (const criteria of sortCriteria) {
          const aValue = getSortValue(a, criteria.field)
          const bValue = getSortValue(b, criteria.field)

          let comparison = 0
          if (aValue < bValue) comparison = -1
          else if (aValue > bValue) comparison = 1

          if (comparison !== 0) {
            return criteria.direction === 'asc' ? comparison : -comparison
          }
        }
        return 0
      })
    }

    return result
  }, [transactions])

  // Delete transactions
  const deleteTransaction = useCallback(async (transaction: FinancialTransaction, currentFilter: LancamentoFilter) => {
    if (!transaction.id) return

    // Optimistic: remove immediately
    setTransactions(prev => prev.filter(t => t.id !== transaction.id))

    try {
      await deleteLancamento(Number(transaction.id))
      customToast.success("Lançamento excluído com sucesso!")
    } catch (err) {
      // Restore on failure
      console.error("Erro ao excluir lançamento:", err)
      setTransactions(prev => {
        // Only restore if not already in list
        if (prev.some(t => t.id === transaction.id)) return prev
        return [...prev, transaction]
      })
      customToast.error("Erro ao excluir lançamento")
    }
  }, [])

  const deleteMultipleTransactions = useCallback(async (
    selectedIds: string[],
    currentFilter: LancamentoFilter,
  ) => {
    // Optimistic: remove all selected immediately
    const removedTransactions = transactions.filter(t => t.id && selectedIds.includes(t.id))
    setTransactions(prev => prev.filter(t => !t.id || !selectedIds.includes(t.id)))

    try {
      let successCount = 0
      let errorCount = 0
      const processedRecurrenceIds = new Set<number>()
      const failedIds: string[] = []

      for (const id of selectedIds) {
        try {
          const transaction = removedTransactions.find(t => t.id === id)
          if (!transaction) { errorCount++; continue }

          if (transaction.isRecurrent && transaction.recurrenceId && !processedRecurrenceIds.has(transaction.recurrenceId)) {
            const sameRecurrenceSelected = selectedIds.filter(selectedId => {
              const selectedTx = removedTransactions.find(t => t.id === selectedId)
              return selectedTx?.recurrenceId === transaction.recurrenceId
            })

            const allRecurrenceTransactions = removedTransactions.filter(t => t.recurrenceId === transaction.recurrenceId)
            if (sameRecurrenceSelected.length === allRecurrenceTransactions.length) {
              const { removerSerieRecorrencia } = await import("@/app/services/lancamento-service")
              await removerSerieRecorrencia(Number(transaction.id))
              successCount += allRecurrenceTransactions.length
              processedRecurrenceIds.add(transaction.recurrenceId)
            } else {
              await deleteLancamento(Number(id))
              successCount++
            }
          } else if (!transaction.isRecurrent) {
            await deleteLancamento(Number(id))
            successCount++
          }
        } catch {
          errorCount++
          failedIds.push(id)
        }
      }

      if (successCount > 0) customToast.success(`${successCount} lançamento(s) excluído(s) com sucesso!`)
      if (errorCount > 0) {
        customToast.error(`Não foi possível excluir ${errorCount} lançamento(s)`)
        // Restore failed ones
        const toRestore = removedTransactions.filter(t => t.id && failedIds.includes(t.id))
        if (toRestore.length > 0) {
          setTransactions(prev => [...prev, ...toRestore])
        }
      }
    } catch {
      // Restore all on catastrophic failure
      setTransactions(prev => {
        const existingIds = new Set(prev.map(t => t.id))
        const toRestore = removedTransactions.filter(t => !existingIds.has(t.id))
        return [...prev, ...toRestore]
      })
      customToast.error("Erro ao excluir lançamentos")
    }
  }, [transactions])

  const getRelatedTransactions = useCallback(async (transaction: FinancialTransaction) => {
    if (!transaction.isRecurrent || !transaction.recurrenceId) return []

    try {
      const related = await getLancamentosByRecurrenceId(transaction.recurrenceId)
      return related.map((lanc) => ({
        id: String(lanc.id_lancamento),
        description: lanc.descricao,
        value: Number(lanc.valor),
        date: new Date(lanc.data_lancamento),
        dueDate: new Date(lanc.data_vencimento),
        paymentDate: lanc.data_pagamento ? new Date(lanc.data_pagamento) : null,
        status: lanc.data_pagamento ? 'baixado' : 'pendente',
        recurrenceId: lanc.id_recorrencia || null,
      })) as FinancialTransaction[]
    } catch {
      return []
    }
  }, [])

  const handleTransactionUpdate = useCallback((transactionId: string, updatedData: Partial<FinancialTransaction>) => {
    setTransactions(prev =>
      prev.map(transaction =>
        transaction.id === transactionId
          ? { ...transaction, ...updatedData }
          : transaction
      )
    )
  }, [])

  return {
    transactions,
    setTransactions,
    loading,
    setLoading,
    refreshing,
    error,
    cashAccounts,
    selectedAccountData,
    setSelectedAccountData,
    selectedBankAgency,
    totalCashBalance,
    fetchTransactions,
    deleteTransaction,
    deleteMultipleTransactions,
    getRelatedTransactions,
    getVisibleTransactions,
    handleTransactionUpdate,
  }
}
