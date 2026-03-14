"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Minus,
  RepeatIcon,
  Paperclip,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from "lucide-react"
import { format } from "date-fns"
import type { FinancialTransaction } from "@/types/types"
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header"
import { formatDate, generateCompetenceCode, calculateTotalValueWithAdjustments } from "../_lib/lancamento-utils"
import { formatCurrency } from "@/lib/utils"
import { LancamentoRowActions } from "./lancamento-row-actions"
import type { SortCriteria } from "../_hooks/use-lancamento-url-state"
import customToast from "@/components/ui/custom-toast"

export interface ColumnDeps {
  sortCriteria: SortCriteria[]
  onSort: (field: string, event?: React.MouseEvent) => void
  selectedTransactions: string[]
  selectAll: boolean
  onSelectAll: () => void
  onSelectTransaction: (id: string | undefined) => void
  expandedAdjustments: Set<string>
  toggleAdjustmentExpansion: (id: string) => void
  expandedParcelas: Set<string>
  toggleParcelasExpansion: (id: string) => void
  expandedFaturas: Set<string>
  toggleFaturaExpansion: (id: string) => void
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
}

export const COLUMN_LABELS: Record<string, string> = {
  filial: "Empresa",
  unidade: "Unidade",
  cliente: "Devedor/Credor",
  competencia: "Comp",
  documento: "Doc",
  descricao: "Descrição",
  natureza: "Natureza",
  tipo: "Tipo",
  conta: "Conta Caixa",
  vencimento: "Venc",
  pagamento: "Pgto",
  valor: "Valor",
}

export function createLancamentoColumns(deps: ColumnDeps): ColumnDef<FinancialTransaction>[] {
  const {
    sortCriteria,
    onSort,
    selectedTransactions,
    selectAll,
    onSelectAll,
    onSelectTransaction,
    expandedAdjustments,
    toggleAdjustmentExpansion,
    expandedParcelas,
    toggleParcelasExpansion,
    expandedFaturas,
    toggleFaturaExpansion,
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
  } = deps

  return [
    // Select column
    {
      id: "select",
      size: 40,
      enableHiding: false,
      header: () => (
        <Checkbox
          checked={selectAll}
          onCheckedChange={onSelectAll}
          aria-label="Selecionar todos"
        />
      ),
      cell: ({ row }) => {
        const tx = row.original
        return (
          <Checkbox
            checked={tx.id ? selectedTransactions.includes(tx.id) : false}
            onCheckedChange={() => onSelectTransaction(tx.id)}
            disabled={tx.status === "baixado"}
            aria-label={`Selecionar lançamento ${tx.code}`}
          />
        )
      },
    },

    // Empresa
    {
      id: "filial",
      accessorFn: (row) => row.empresaAbbreviation || '-',
      size: 70,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="filial" label="Empresa" sortCriteria={sortCriteria} onSort={onSort} />
      ),
      cell: ({ row }) => {
        const tx = row.original
        return (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate block" title={tx.empresaName}>
            {tx.empresaAbbreviation || '-'}
          </span>
        )
      },
    },

    // Unidade de Negócio
    {
      id: "unidade",
      accessorFn: (row) => row.businessUnitAbbreviation || '-',
      size: 70,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="unidade" label="Unidade" sortCriteria={sortCriteria} onSort={onSort} />
      ),
      cell: ({ row }) => {
        const tx = row.original
        return (
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate block" title={tx.businessUnitName}>
            {tx.businessUnitAbbreviation || '-'}
          </span>
        )
      },
    },

    // Devedor/Credor
    {
      id: "cliente",
      accessorFn: (row) => row.clientName || '',
      size: 220,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="cliente" label="Devedor/Credor" sortCriteria={sortCriteria} onSort={onSort} />
      ),
      cell: ({ row }) => {
        const tx = row.original
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium truncate" title={tx.clientName}>
                {tx.clientName ? (tx.clientName.length > 20 ? `${tx.clientName.substring(0, 20)}...` : tx.clientName) : "-"}
              </span>
              {tx.isRecurrent && (
                <button
                  type="button"
                  onClick={() => onViewDetails(tx, "historico")}
                  className="ml-1"
                  title="Abrir detalhes na aba Recorrência"
                >
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 cursor-pointer hover:bg-blue-100 transition-colors">
                    <RepeatIcon className="h-3 w-3" />
                  </Badge>
                </button>
              )}
              {tx.hasAttachments && tx.totalAnexos ? (
                <button
                  type="button"
                  onClick={() => onViewDetails(tx, "anexos")}
                  className="ml-1"
                  title="Abrir detalhes na aba Anexos"
                >
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 cursor-pointer hover:bg-green-100 transition-colors">
                    <Paperclip className="h-3 w-3" />
                    <span className="text-xs font-medium">{tx.totalAnexos}</span>
                  </Badge>
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {tx.jurosDescontoAssociados && tx.jurosDescontoAssociados.length > 0 && (
                <button
                  onClick={() => toggleAdjustmentExpansion(tx.id || '')}
                  className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1 rounded-md transition-colors duration-200"
                  title={`${tx.jurosDescontoAssociados.length} ajuste${tx.jurosDescontoAssociados.length > 1 ? 's' : ''}`}
                >
                  <span>{tx.jurosDescontoAssociados.length} ajuste{tx.jurosDescontoAssociados.length > 1 ? 's' : ''}</span>
                  {expandedAdjustments.has(tx.id || '') ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
        )
      },
    },

    // Competência
    {
      id: "competencia",
      accessorFn: (row) => row.competence || generateCompetenceCode(row.dueDate),
      size: 80,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="competencia" label="Comp" sortCriteria={sortCriteria} onSort={onSort} className="justify-center" />
      ),
      cell: ({ row }) => {
        const tx = row.original
        return (
          <span className="text-xs">{tx.competence || generateCompetenceCode(tx.dueDate)}</span>
        )
      },
    },

    // Documento
    {
      id: "documento",
      accessorFn: (row) => row.document || '',
      size: 100,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="documento" label="Doc" sortCriteria={sortCriteria} onSort={onSort} />
      ),
      cell: ({ row }) => {
        const tx = row.original
        if (!tx.document) return <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>

        return (
          <button
            onClick={() => {
              if (tx.document?.startsWith('http')) {
                window.open(tx.document, '_blank')
              } else {
                customToast.info(`Doc: ${tx.document}`)
              }
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline text-xs truncate block w-full text-left"
            title={tx.document}
          >
            {tx.document.length > 10 ? `${tx.document.substring(0, 10)}...` : tx.document}
          </button>
        )
      },
    },

    // Descrição
    {
      id: "descricao",
      accessorFn: (row) => row.description,
      size: 280,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="descricao" label="Descrição" sortCriteria={sortCriteria} onSort={onSort} />
      ),
      cell: ({ row }) => {
        const tx = row.original
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate" title={tx.description}>
                {tx.description.length > 35 ? `${tx.description.substring(0, 35)}...` : tx.description}
              </span>
              {tx.idCartao && tx.idFatura && !tx.isFaturaRow && (
                <span title="Compra no cartão de crédito"><CreditCard className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" /></span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {tx.parcelasAgrupadas && tx.parcelasAgrupadas.length > 0 && (
                <button
                  onClick={() => toggleParcelasExpansion(tx.id || '')}
                  className="flex items-center gap-1 bg-violet-500 hover:bg-violet-600 text-white text-xs px-2 py-0.5 rounded-md transition-colors duration-200"
                  title={`${tx.parcelasAgrupadas.length + 1} parcelas`}
                >
                  <CreditCard className="h-3 w-3" />
                  <span>1/{tx.parcelasAgrupadas.length + 1} parcelas</span>
                  {expandedParcelas.has(tx.id || '') ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
              {tx.isFaturaRow && tx.itensFatura && tx.itensFatura.length > 0 && (
                <button
                  onClick={() => toggleFaturaExpansion(tx.id || '')}
                  className="flex items-center gap-1 bg-violet-500 hover:bg-violet-600 text-white text-xs px-2 py-0.5 rounded-md transition-colors duration-200"
                  title={`${tx.itensFatura.length} compras na fatura`}
                >
                  <CreditCard className="h-3 w-3" />
                  <span>{tx.itensFatura.length} compras</span>
                  {expandedFaturas.has(tx.id || '') ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
        )
      },
    },

    // Natureza
    {
      id: "natureza",
      accessorFn: (row) => row.type,
      size: 100,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="natureza" label="Natureza" sortCriteria={sortCriteria} onSort={onSort} className="justify-center" />
      ),
      cell: ({ row }) => {
        const tx = row.original
        return (
          <div className="flex justify-center">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 min-w-[70px] justify-center ${tx.type === "entrada"
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
              : "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
            }`}>
              {tx.type === "entrada" ? (
                <><Plus className="h-3 w-3" /><span>ENT</span></>
              ) : (
                <><Minus className="h-3 w-3" /><span>SAI</span></>
              )}
            </span>
          </div>
        )
      },
    },

    // Tipo
    {
      id: "tipo",
      accessorFn: (row) => row.transactionTypeName || '',
      size: 140,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="tipo" label="Tipo" sortCriteria={sortCriteria} onSort={onSort} />
      ),
      cell: ({ row }) => {
        const tx = row.original
        return (
          <span className="truncate text-xs text-slate-700 dark:text-slate-300 block" title={tx.transactionTypeName}>
            {tx.transactionTypeName.length > 16 ? `${tx.transactionTypeName.substring(0, 16)}...` : tx.transactionTypeName}
          </span>
        )
      },
    },

    // Conta Caixa
    {
      id: "conta",
      accessorFn: (row) => row.cashAccountName || '',
      size: 140,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="conta" label="Conta Caixa" sortCriteria={sortCriteria} onSort={onSort} />
      ),
      cell: ({ row }) => {
        const tx = row.original
        const cashAccountLabel = tx.cashAccountName || "-"
        return (
          <span
            className={`text-xs text-slate-700 dark:text-slate-300 block ${cashAccountLabel === "-" ? "text-center" : "truncate"}`}
            title={cashAccountLabel}
          >
            {cashAccountLabel !== "-" && cashAccountLabel.length > 16 ? `${cashAccountLabel.substring(0, 16)}...` : cashAccountLabel}
          </span>
        )
      },
    },

    // Vencimento
    {
      id: "vencimento",
      accessorFn: (row) => row.dueDate,
      size: 100,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="vencimento" label="Venc" sortCriteria={sortCriteria} onSort={onSort} className="justify-center" />
      ),
      cell: ({ row }) => {
        const tx = row.original
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dueDate = new Date(tx.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const isOverdue = tx.status === 'pendente' && dueDate < today
        const isDueToday = tx.status === 'pendente' && dueDate.getTime() === today.getTime()
        const dueDateClass = isOverdue
          ? 'text-red-600 dark:text-red-400 font-bold'
          : isDueToday
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-600 dark:text-slate-400'

        return (
          <span className={`text-xs text-center block ${dueDateClass}`}>
            {format(tx.dueDate, "dd/MM/yyyy")}
            {isOverdue && <span className="ml-1 text-red-500 dark:text-red-400" title="Vencido">!</span>}
          </span>
        )
      },
    },

    // Pagamento
    {
      id: "pagamento",
      accessorFn: (row) => row.paymentDate,
      size: 100,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="pagamento" label="Pgto" sortCriteria={sortCriteria} onSort={onSort} className="justify-center" />
      ),
      cell: ({ row }) => {
        const tx = row.original
        if (!tx.paymentDate) return <span className="text-slate-400 dark:text-slate-500 text-xs text-center block">-</span>

        return (
          <span className="text-emerald-700 dark:text-emerald-400 font-medium text-xs text-center block">
            {format(tx.paymentDate, "dd/MM/yyyy")}
          </span>
        )
      },
    },

    // Valor
    {
      id: "valor",
      accessorFn: (row) => row.value,
      size: 120,
      enableHiding: true,
      header: () => (
        <DataTableColumnHeader field="valor" label="Valor" sortCriteria={sortCriteria} onSort={onSort} className="justify-end" />
      ),
      cell: ({ row }) => {
        const tx = row.original
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dueDate = new Date(tx.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const isOverdue = tx.status === 'pendente' && dueDate < today
        const isDueToday = tx.status === 'pendente' && dueDate.getTime() === today.getTime()
        const valueClass = isOverdue
          ? 'text-red-600 dark:text-red-400 font-bold'
          : isDueToday
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-600 dark:text-slate-400'
        const totalValue = calculateTotalValueWithAdjustments(tx)
        const formattedValue = tx.type === 'saida'
          ? `(${formatCurrency(Math.abs(totalValue))})`
          : formatCurrency(totalValue)

        return (
          <div className="flex flex-col text-right">
            <span className={`text-xs font-semibold ${valueClass}`}>
              {formattedValue}
            </span>
            {tx.status === 'baixado' && tx.paidValue && tx.paidValue !== tx.value && (
              <span className={`text-xs font-medium ${tx.paidValue > tx.value
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {tx.paidValue > tx.value ? 'c/ juros' : 'c/ desconto'}
              </span>
            )}
          </div>
        )
      },
    },

    // Ações
    {
      id: "acoes",
      size: 60,
      enableHiding: false,
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const tx = row.original
        return (
          <div className="text-right">
            <LancamentoRowActions
              transaction={tx}
              hasPermission={hasPermission}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
              onEditTransfer={onEditTransfer}
              onViewTransferDetails={onViewTransferDetails}
              onDeleteTransfer={onDeleteTransfer}
              onMarkAsPaid={onMarkAsPaid}
              onCreateRecurrence={onCreateRecurrence}
              onOpenBoleto={onOpenBoleto}
              onCancelPayment={onCancelPayment}
              onDelete={onDelete}
            />
          </div>
        )
      },
    },
  ]
}
