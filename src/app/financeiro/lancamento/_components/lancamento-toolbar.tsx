"use client"

import { type Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { LancamentoFilters } from "@/components/lancamento-filter"
import { SearchInputStable } from "@/components/search-input-stable"
import { CashAccountsView } from "@/components/cash-accounts-view"
import { DataTableColumnVisibility } from "@/components/ui/data-table/data-table-column-visibility"
import {
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  CreditCard,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { FinancialTransaction, LancamentoFilter } from "@/types/types"
import type { CashAccountStatusResponse } from "@/app/services/cash-account-status-service"
import type { CashAccount } from "@/types/types"
import type { SortCriteria } from "../_hooks/use-lancamento-url-state"
import { COLUMN_LABELS } from "./lancamento-columns"
import { SORT_FIELD_LABELS } from "../_lib/lancamento-utils"
import { calculateTotalValueWithAdjustments } from "../_lib/lancamento-utils"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface LancamentoToolbarProps {
  table: Table<FinancialTransaction> | null
  searchTerm: string
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  currentFilter: LancamentoFilter
  isDefaultFilter: boolean
  isFilterOpen: boolean
  onFilterOpenChange: (open: boolean) => void
  onFilter: (filter: LancamentoFilter) => void | Promise<void>
  onRefresh: () => void
  selectedTransactions: string[]
  onDeleteSelected: () => void
  hasPermission: (modulo: string, operacao: 'ver' | 'criar_editar' | 'deletar') => boolean
  onAddTransaction: () => void
  isScrolled: boolean
  sortCriteria: SortCriteria[]
  onClearSort: () => void
  totalCashBalance: CashAccountStatusResponse | null
  selectedAccountData: CashAccount | null
  selectedBankAgency: string
  paginatedTransactions: FinancialTransaction[]
}

export function LancamentoToolbar({
  table,
  searchTerm,
  onSearchChange,
  onClearSearch,
  currentFilter,
  isDefaultFilter,
  isFilterOpen,
  onFilterOpenChange,
  onFilter,
  onRefresh,
  selectedTransactions,
  onDeleteSelected,
  hasPermission,
  onAddTransaction,
  isScrolled,
  sortCriteria,
  onClearSort,
  totalCashBalance,
  selectedAccountData,
  selectedBankAgency,
  paginatedTransactions,
}: LancamentoToolbarProps) {
  const router = useRouter()

  return (
    <>
      {/* Linha 1: Título + Busca + Botões — colapsa ao scrollar */}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-3 px-3 sm:px-5 overflow-hidden transition-all duration-300 ease-in-out ${isScrolled ? 'max-h-0 opacity-0 py-0' : 'max-h-40 opacity-100 pt-4 pb-2'}`}>
        {/* Título */}
        <div className="flex items-center text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text whitespace-nowrap flex-shrink-0">
          <FileText className="mr-2 w-7 h-7 text-blue-600 flex-shrink-0" />
          <span className="font-medium text-xl sm:text-2xl">Lançamentos Financeiros</span>
        </div>

        {/* Search — cresce para preencher o espaço disponível */}
        <div className="flex-1 min-w-0">
          <SearchInputStable
            placeholder="Pesquisar lançamentos..."
            value={searchTerm}
            onChange={onSearchChange}
            onClear={onClearSearch}
            className="w-full sm:max-w-md mx-auto"
          />
        </div>

        {/* Botões direita */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/financeiro/cartao')}
            className="whitespace-nowrap hidden sm:flex"
          >
            <CreditCard className="h-4 w-4 mr-1.5" />
            Cartões
          </Button>
          {hasPermission('financeiro.novo_lancamento', 'criar_editar') && (
            <Button
              onClick={onAddTransaction}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-200 border-0"
              size="sm"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Lançamento</span>
            </Button>
          )}
        </div>
      </div>

      {/* Linha 2: Controles + Saldos */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-5 pb-2">
        {/* Controles esquerda */}
        <div className="flex flex-wrap gap-2 items-center">
          <LancamentoFilters
            onFilter={async (f) => { onFilter(f) }}
            initialFilter={currentFilter}
            isDefaultFilter={isDefaultFilter}
            open={isFilterOpen}
            onOpenChange={onFilterOpenChange}
          />
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
            title="Atualizar lista"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <CashAccountsView dataLimite={currentFilter.data_fim} />
          {table && <DataTableColumnVisibility table={table} columnLabels={COLUMN_LABELS} />}
          {selectedTransactions.length > 0 && hasPermission('financeiro.novo_lancamento', 'deletar') && (
            <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Excluir</span> ({selectedTransactions.length})
            </Button>
          )}
        </div>

        {/* Search que aparece ao scrollar — inline no mobile mostra search no topo */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isScrolled ? 'w-full sm:w-[280px] opacity-100' : 'w-0 opacity-0'}`}>
          <SearchInputStable
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={onSearchChange}
            onClear={onClearSearch}
            className="w-full"
          />
        </div>

        {/* Saldos */}
        <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
          {currentFilter.id_conta_caixa ? (
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-sm">
              <div className="flex gap-4 sm:gap-7 text-center">
                <div className="hidden sm:block">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Agência</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedBankAgency || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Conta</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[100px]">
                    {selectedAccountData?.account || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {totalCashBalance?.resumo?.data_limite
                      ? `Saldo ${format(new Date(totalCashBalance.resumo.data_limite), "dd/MM", { locale: ptBR })}`
                      : "Saldo atual"
                    }
                  </p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">
                    {(() => {
                      const contaStatus = totalCashBalance?.contas?.find(c => c.id_conta_caixa === currentFilter.id_conta_caixa)
                      const saldo = contaStatus?.saldo_atual ? parseFloat(contaStatus.saldo_atual) : (selectedAccountData?.currentBalance || 0)
                      return formatCurrency(saldo)
                    })()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-2 shadow-sm">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">$</span>
              </div>
              <div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium leading-none">Saldo total atualizado</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {totalCashBalance ? formatCurrency(parseFloat(totalCashBalance.resumo.saldo_total_geral)) : '—'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-sm text-center">
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium leading-none">Subtotal em tela:</p>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(
                paginatedTransactions.reduce((total, transaction) => {
                  if (transaction.status !== "cancelado") {
                    const valueUsed = calculateTotalValueWithAdjustments(transaction)
                    return transaction.type === "entrada"
                      ? total + valueUsed
                      : total - valueUsed
                  }
                  return total
                }, 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Ordenação */}
      {sortCriteria.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-3 sm:px-5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>Ordenação:</span>
            {sortCriteria.map((criteria, index) => (
              <span key={criteria.field} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                <span className="font-medium">{index + 1}.</span>
                <span>{SORT_FIELD_LABELS[criteria.field] || criteria.field}</span>
                <span className="opacity-70">({criteria.direction === 'asc' ? '↑' : '↓'})</span>
              </span>
            ))}
            <button onClick={onClearSort} className="ml-1 text-red-500 hover:text-red-700 underline">
              Limpar
            </button>
          </div>
          <span className="hidden sm:block text-slate-400">Shift+Click para ordenar múltiplas colunas</span>
        </div>
      )}
      {sortCriteria.length === 0 && (
        <div className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 mb-2 px-3 sm:px-5 text-right">
          Shift+Click para ordenar múltiplas colunas
        </div>
      )}
    </>
  )
}
