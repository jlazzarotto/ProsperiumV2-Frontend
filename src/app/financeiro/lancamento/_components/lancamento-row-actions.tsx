"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pencil,
  Trash2,
  FileText,
  Eye,
  CheckCircle,
  CircleXIcon as XCircle2,
  RepeatIcon,
  Barcode,
} from "lucide-react"
import type { FinancialTransaction } from "@/types/types"

interface LancamentoRowActionsProps {
  transaction: FinancialTransaction
  hasPermission: (modulo: string, operacao: 'ver' | 'criar_editar' | 'deletar') => boolean
  onEdit: (transaction: FinancialTransaction) => void
  onViewDetails: (transaction: FinancialTransaction) => void
  onEditTransfer: (transaction: FinancialTransaction) => void
  onViewTransferDetails: (transaction: FinancialTransaction) => void
  onDeleteTransfer: (transaction: FinancialTransaction) => void
  onMarkAsPaid: (transaction: FinancialTransaction) => void
  onCreateRecurrence: (transaction: FinancialTransaction) => void
  onOpenBoleto: (transaction: FinancialTransaction) => void
  onCancelPayment: (transaction: FinancialTransaction) => void
  onDelete: (transaction: FinancialTransaction) => void
}

export function LancamentoRowActions({
  transaction,
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
}: LancamentoRowActionsProps) {
  const isTransferLancamento = Boolean(transaction.isTransferencia && transaction.idTransferencia)
  const isAtivoPermuta = Boolean(transaction.isAtivoPermuta)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <span className="sr-only">Abrir menu</span>
          <FileText className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isTransferLancamento ? (
          <>
            {hasPermission('financeiro.transferencia', 'criar_editar') && (
              <DropdownMenuItem onClick={() => onEditTransfer(transaction)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onViewTransferDetails(transaction)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            {hasPermission('financeiro.transferencia', 'deletar') && (
              <DropdownMenuItem onClick={() => onDeleteTransfer(transaction)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            )}
          </>
        ) : isAtivoPermuta ? (
          <>
            {hasPermission('financeiro.novo_lancamento', 'criar_editar') && (
              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onViewDetails(transaction)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {hasPermission('financeiro.novo_lancamento', 'criar_editar') && (
              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onViewDetails(transaction)}>
              <FileText className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            {transaction.status === "pendente" && hasPermission('financeiro.novo_lancamento', 'criar_editar') && (
              <DropdownMenuItem onClick={() => onMarkAsPaid(transaction)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Baixar lançamento
              </DropdownMenuItem>
            )}
            {hasPermission('financeiro.novo_lancamento', 'criar_editar') && (
              <DropdownMenuItem onClick={() => onCreateRecurrence(transaction)}>
                <RepeatIcon className="mr-2 h-4 w-4" />
                Gerar Recorrência
              </DropdownMenuItem>
            )}
            {hasPermission('financeiro.novo_lancamento', 'criar_editar') && (
              <DropdownMenuItem onClick={() => onOpenBoleto(transaction)}>
                <Barcode className="mr-2 h-4 w-4" />
                Emitir Boleto/Nota Fiscal
              </DropdownMenuItem>
            )}
            {transaction.status === "baixado" ? (
              hasPermission('financeiro.novo_lancamento', 'criar_editar') && (
                <DropdownMenuItem onClick={() => onCancelPayment(transaction)} className="text-orange-600">
                  <XCircle2 className="mr-2 h-4 w-4" />
                  Cancelar Baixa
                </DropdownMenuItem>
              )
            ) : (
              hasPermission('financeiro.novo_lancamento', 'deletar') && (
                <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
