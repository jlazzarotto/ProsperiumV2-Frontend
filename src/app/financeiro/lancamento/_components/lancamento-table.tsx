"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  type VisibilityState,
  type ColumnOrderState,
  type Row,
} from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronDown, ChevronRight, RepeatIcon, CreditCard } from "lucide-react"
import { TableRow, TableCell } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { DataTable } from "@/components/ui/data-table/data-table"
import type { FinancialTransaction } from "@/types/types"
import type { SortCriteria } from "../_hooks/use-lancamento-url-state"
import { createLancamentoColumns, type ColumnDeps } from "./lancamento-columns"
import { LancamentoSubRows } from "./lancamento-sub-rows"
import { formatCurrency } from "@/lib/utils"

const COLUMN_VISIBILITY_KEY = 'lancamento-column-visibility'
const COLUMN_ORDER_KEY = 'lancamento-column-order'

// Extended type for special virtual rows in the table data
interface GroupHeaderRow extends FinancialTransaction {
  _isGroupHeader: true
  _groupRecurrenceId: number
  _groupTransactions: FinancialTransaction[]
}

function isGroupHeader(tx: FinancialTransaction): tx is GroupHeaderRow {
  return (tx as any)._isGroupHeader === true
}

interface LancamentoTableProps {
  visibleTransactions: FinancialTransaction[]
  loading: boolean
  refreshing?: boolean
  error: string | null
  isScrolled: boolean
  paginationInfo: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  sortCriteria: SortCriteria[]
  onSort: (field: string, event?: React.MouseEvent) => void
  hasPermission: (modulo: string, operacao: 'ver' | 'criar_editar' | 'deletar') => boolean
  onEdit: (tx: FinancialTransaction) => void
  onViewDetails: (tx: FinancialTransaction, tab?: "capa" | "detalhes" | "anexos" | "historico") => void
  onEditTransfer: (tx: FinancialTransaction) => void
  onViewTransferDetails: (tx: FinancialTransaction) => void
  onDeleteTransfer: (tx: FinancialTransaction) => void
  onMarkAsPaid: (tx: FinancialTransaction) => void
  onCreateRecurrence: (tx: FinancialTransaction) => void
  onOpenBoleto: (tx: FinancialTransaction) => void
  onCancelPayment: (tx: FinancialTransaction) => void
  onDelete: (tx: FinancialTransaction) => void
  selectedTransactions: string[]
  setSelectedTransactions: React.Dispatch<React.SetStateAction<string[]>>
  selectAll: boolean
  setSelectAll: React.Dispatch<React.SetStateAction<boolean>>
  allFilteredTransactions: FinancialTransaction[]
  expandedAdjustments: Set<string>
  toggleAdjustmentExpansion: (id: string) => void
  expandedParcelas: Set<string>
  toggleParcelasExpansion: (id: string) => void
  expandedFaturas: Set<string>
  toggleFaturaExpansion: (id: string) => void
  faturaItemsCache: Record<string, Array<{
    id_item_fatura?: number; id_lcto: number; descricao?: string;
    data_compra?: string; numero_documento?: string; parcela_num: number;
    parcela_total: number; valor: string | number; status: string
  }>>
  loadingFaturaItems: Set<string>
  groupedByRecurrence: boolean
  expandedGroups: Set<number>
  toggleGroupExpansion: (id: number) => void
  hasMoreToRender: boolean
  renderLimit: number
  totalCount: number
  onTableReady: (table: ReturnType<typeof useReactTable<FinancialTransaction>>) => void
}

export function LancamentoTable(props: LancamentoTableProps) {
  const {
    visibleTransactions, loading, refreshing, error, isScrolled,
    paginationInfo, onPageChange, onPageSizeChange,
    sortCriteria, onSort, hasPermission,
    onEdit, onViewDetails, onEditTransfer, onViewTransferDetails, onDeleteTransfer, onMarkAsPaid, onCreateRecurrence,
    onOpenBoleto, onCancelPayment, onDelete,
    selectedTransactions, setSelectedTransactions, selectAll, setSelectAll,
    allFilteredTransactions,
    expandedAdjustments, toggleAdjustmentExpansion,
    expandedParcelas, toggleParcelasExpansion,
    expandedFaturas, toggleFaturaExpansion,
    faturaItemsCache, loadingFaturaItems,
    groupedByRecurrence, expandedGroups, toggleGroupExpansion,
    hasMoreToRender, renderLimit, totalCount,
    onTableReady,
  } = props

  // Column visibility from localStorage
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  useEffect(() => {
    try { localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility)) } catch {}
  }, [columnVisibility])

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(COLUMN_ORDER_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    if (columnOrder.length > 0) {
      try { localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrder)) } catch {}
    }
  }, [columnOrder])

  const handleSelectTransaction = useCallback((id: string | undefined) => {
    if (!id) return
    setSelectedTransactions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }, [setSelectedTransactions])

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedTransactions([])
    } else {
      const allIds = allFilteredTransactions
        .filter(t => t.id && t.status !== "baixado")
        .map(t => t.id as string)
      setSelectedTransactions(allIds)
    }
    setSelectAll(prev => !prev)
  }, [selectAll, allFilteredTransactions, setSelectedTransactions, setSelectAll])

  const columnDeps: ColumnDeps = useMemo(() => ({
    sortCriteria,
    onSort,
    selectedTransactions,
    selectAll,
    onSelectAll: handleSelectAll,
    onSelectTransaction: handleSelectTransaction,
    expandedAdjustments,
    toggleAdjustmentExpansion,
    expandedParcelas,
    toggleParcelasExpansion,
    expandedFaturas,
    toggleFaturaExpansion: (id: string) => toggleFaturaExpansion(id),
    hasPermission,
    onEdit,
    onViewDetails,
    onEditTransfer,
    onViewTransferDetails,
    onDeleteTransfer,
    onMarkAsPaid,
    onCreateRecurrence,
    onOpenBoleto,
    onCancelPayment,
    onDelete,
  }), [
    sortCriteria, onSort, selectedTransactions, selectAll,
    handleSelectAll, handleSelectTransaction,
    expandedAdjustments, toggleAdjustmentExpansion,
    expandedParcelas, toggleParcelasExpansion,
    expandedFaturas, toggleFaturaExpansion,
    hasPermission, onEdit, onViewDetails, onEditTransfer, onViewTransferDetails, onDeleteTransfer, onMarkAsPaid,
    onCreateRecurrence, onOpenBoleto, onCancelPayment, onDelete,
  ])

  const columns = useMemo(() => createLancamentoColumns(columnDeps), [columnDeps])

  // In grouped mode, inject virtual group header rows into the data
  const tableData = useMemo(() => {
    if (!groupedByRecurrence) return visibleTransactions

    const recurrentGroups = new Map<number, FinancialTransaction[]>()
    const nonRecurrent: FinancialTransaction[] = []

    visibleTransactions.forEach(t => {
      if (t.isRecurrent && t.recurrenceId) {
        const group = recurrentGroups.get(t.recurrenceId)
        if (group) group.push(t)
        else recurrentGroups.set(t.recurrenceId, [t])
      } else {
        nonRecurrent.push(t)
      }
    })

    // Single-item groups go to non-recurrent
    const toMove: number[] = []
    recurrentGroups.forEach((txs, id) => {
      if (txs.length === 1) { nonRecurrent.push(txs[0]); toMove.push(id) }
    })
    toMove.forEach(id => recurrentGroups.delete(id))

    const result: FinancialTransaction[] = []
    recurrentGroups.forEach((txs, recurrenceId) => {
      // Virtual group header
      result.push({
        ...txs[0],
        id: `recurrence-header-${recurrenceId}`,
        _isGroupHeader: true,
        _groupRecurrenceId: recurrenceId,
        _groupTransactions: txs,
      } as unknown as FinancialTransaction)

      if (expandedGroups.has(recurrenceId)) {
        result.push(...txs)
      }
    })
    result.push(...nonRecurrent)
    return result
  }, [visibleTransactions, groupedByRecurrence, expandedGroups])

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: paginationInfo.totalItems,
    state: { columnVisibility, columnOrder },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    enableRowSelection: (row) => row.original.status !== 'baixado',
    getRowId: (row) => row.id || '',
  })

  // Expose table instance to parent (for toolbar column visibility)
  useEffect(() => {
    onTableReady(table)
  }, [table, onTableReady])

  const colSpan = table.getVisibleFlatColumns().length

  // Row className based on transaction type
  const getRowClassName = useCallback((row: Row<FinancialTransaction>) => {
    const tx = row.original

    // Fatura-linked rows
    if (tx.isFaturaRow) {
      return "bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/15 border-l-2 border-violet-400"
    }

    // Rows with adjustments
    if (tx.jurosDescontoAssociados && tx.jurosDescontoAssociados.length > 0) {
      return "bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/15 border-l-2 border-orange-400"
    }

    return undefined
  }, [])

  // Custom row rendering for group headers and virtual fatura rows
  const renderCustomRow = useCallback((row: Row<FinancialTransaction>, colCount: number) => {
    const tx = row.original

    // Recurrence group header
    if (isGroupHeader(tx)) {
      const recurrenceId = tx._groupRecurrenceId
      const transactions = tx._groupTransactions
      const isExpanded = expandedGroups.has(recurrenceId)
      const totalValue = transactions.reduce((sum, t) => t.type === 'entrada' ? sum + t.value : sum - t.value, 0)
      const paidCount = transactions.filter(t => t.status === 'baixado').length
      const selectableTransactions = transactions.filter(t => t.status !== "baixado")
      const isFullGroupSelected = selectableTransactions.length > 0 && selectableTransactions.every(t => t.id && selectedTransactions.includes(t.id))

      return (
        <TableRow className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/15 border-l-4 border-blue-500">
          <TableCell>
            <Checkbox
              checked={isFullGroupSelected}
              onCheckedChange={() => {
                const txIds = selectableTransactions.map(t => t.id as string)
                if (isFullGroupSelected) {
                  setSelectedTransactions(prev => prev.filter(id => !txIds.includes(id)))
                } else {
                  setSelectedTransactions(prev => [...new Set([...prev, ...txIds])])
                }
              }}
              disabled={selectableTransactions.length === 0}
              aria-label={`Selecionar grupo de recorrência ${recurrenceId}`}
            />
          </TableCell>
          <TableCell colSpan={colCount - 1}>
            <button
              onClick={() => toggleGroupExpansion(recurrenceId)}
              className="flex items-center gap-3 w-full text-left hover:text-blue-700 dark:hover:text-blue-300"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Badge className="bg-blue-600 text-white">
                <RepeatIcon className="h-3 w-3 mr-1" />
                Recorrência ID: {recurrenceId}
              </Badge>
              <span className="font-medium">
                {transactions[0]?.description || 'Lançamento recorrente'}
                ({transactions.length} lançamentos - {paidCount} baixados)
              </span>
              <span className={`font-bold ${totalValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(Math.abs(totalValue))}
              </span>
            </button>
          </TableCell>
        </TableRow>
      )
    }

    // Virtual fatura rows (group header for fatura)
    if (tx.isFaturaRow && tx.id?.startsWith('fatura-')) {
      const isExpanded = expandedFaturas.has(tx.id || '')
      const compras = tx.itensFatura || []
      const mesAno = tx.competenciaFatura
        ? `${String(tx.competenciaFatura).slice(4)}/${String(tx.competenciaFatura).slice(0, 4)}`
        : ''

      return (
        <>
          <TableRow className="bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/15 border-l-4 border-violet-500">
            <TableCell><div className="w-4" /></TableCell>
            <TableCell colSpan={colCount - 1}>
              <button
                onClick={() => toggleFaturaExpansion(tx.id || '')}
                className="flex items-center gap-3 w-full text-left hover:text-violet-700 dark:hover:text-violet-300"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Badge className="bg-violet-600 text-white">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Fatura
                </Badge>
                <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                  {tx.nomeCartao} {mesAno}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({compras.length} {compras.length === 1 ? 'compra' : 'compras'})
                </span>
                {tx.statusFatura && (
                  <Badge className={`text-xs ${
                    tx.statusFatura === 'paga' ? 'bg-emerald-500 text-white' :
                    tx.statusFatura === 'fechada' ? 'bg-amber-500 text-white' :
                    tx.statusFatura === 'em_atraso' ? 'bg-red-500 text-white' :
                    tx.statusFatura === 'parcial' ? 'bg-orange-500 text-white' :
                    'bg-violet-500 text-white'
                  }`}>
                    {tx.statusFatura === 'aberta' ? 'Aberta' :
                     tx.statusFatura === 'fechada' ? 'Fechada' :
                     tx.statusFatura === 'paga' ? 'Paga' :
                     tx.statusFatura === 'parcial' ? 'Parcial' :
                     tx.statusFatura === 'em_atraso' ? 'Em atraso' :
                     tx.statusFatura}
                  </Badge>
                )}
                <span className="ml-auto font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(tx.value)}
                </span>
              </button>
            </TableCell>
          </TableRow>
          {/* Compras da fatura expanded */}
          {isExpanded && (
            <LancamentoSubRows
              transaction={tx}
              colSpan={colCount}
              expandedAdjustments={expandedAdjustments}
              expandedParcelas={expandedParcelas}
              expandedFaturas={expandedFaturas}
              faturaItemsCache={faturaItemsCache}
              loadingFaturaItems={loadingFaturaItems}
              onViewDetails={onViewDetails}
            />
          )}
        </>
      )
    }

    // All other rows: use default DataTable rendering
    return null
  }, [
    expandedGroups, toggleGroupExpansion, selectedTransactions, setSelectedTransactions,
    expandedFaturas, toggleFaturaExpansion, expandedAdjustments, expandedParcelas,
    faturaItemsCache, loadingFaturaItems, onViewDetails,
  ])

  // Sub-row renderer for regular rows (adjustments, parcelas, fatura items)
  const renderSubRow = useCallback((row: Row<FinancialTransaction>) => {
    const tx = row.original

    // Skip group headers and virtual fatura rows (handled by renderCustomRow)
    if (isGroupHeader(tx)) return null
    if (tx.isFaturaRow && tx.id?.startsWith('fatura-')) return null

    return (
      <LancamentoSubRows
        transaction={tx}
        colSpan={colSpan}
        expandedAdjustments={expandedAdjustments}
        expandedParcelas={expandedParcelas}
        expandedFaturas={expandedFaturas}
        faturaItemsCache={faturaItemsCache}
        loadingFaturaItems={loadingFaturaItems}
        onViewDetails={onViewDetails}
      />
    )
  }, [colSpan, expandedAdjustments, expandedParcelas, expandedFaturas, faturaItemsCache, loadingFaturaItems, onViewDetails])

  // Footer content for progressive rendering
  const footerContent = useMemo(() => {
    if (!hasMoreToRender) return null
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando mais... ({renderLimit} de {totalCount})</span>
          </div>
        </TableCell>
      </TableRow>
    )
  }, [hasMoreToRender, colSpan, renderLimit, totalCount])

  return (
    <>
      <DataTable
        table={table}
        loading={loading}
        refreshing={refreshing}
        error={error}
        emptyMessage="Nenhum lançamento encontrado."
        renderSubRow={renderSubRow}
        getRowClassName={getRowClassName}
        renderCustomRow={renderCustomRow}
        stickyHeader
        isScrolled={isScrolled}
        footerContent={footerContent}
      />

      {/* Pagination */}
      {visibleTransactions.length > 0 && !groupedByRecurrence && (
        <Pagination
          currentPage={paginationInfo.currentPage}
          totalPages={paginationInfo.totalPages}
          totalItems={paginationInfo.totalItems}
          itemsPerPage={paginationInfo.itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onPageSizeChange}
          itemsPerPageOptions={[10, 25, 50, 100]}
          showAllOption={true}
        />
      )}
    </>
  )
}
