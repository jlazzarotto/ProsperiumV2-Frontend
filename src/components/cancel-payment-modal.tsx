"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"
import { deleteLancamento, cancelarBaixaLancamento } from "@/app/services/lancamento-service"
import customToast from "@/components/ui/custom-toast"
import type { FinancialTransaction } from "@/types/types"
import { formatCurrency, formatDate } from "@/lib/utils"

interface CancelPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: FinancialTransaction | undefined
  onSave: () => Promise<void>
  onOpenEditModal?: (transaction: FinancialTransaction) => void
}

export function CancelPaymentModal({ isOpen, onClose, transaction, onSave, onOpenEditModal }: CancelPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")
  const isPaid = transaction?.status === "baixado"

  const handleCancel = async () => {
    if (!transaction?.id) return


    setLoading(true)
    try {
      if (isPaid) {
        // Cancelar baixa usando o endpoint específico (não precisa de motivo)
        await cancelarBaixaLancamento(Number(transaction.id))
        customToast.success("Baixa cancelada com sucesso!")

        await onSave()
        onClose()
        setReason("") // Limpar campo

        // Após cancelar a baixa, abrir o modal de edição
        if (onOpenEditModal && transaction) {
          // Atualizar o status para pendente e limpar data de pagamento antes de passar para o modal de edição
          const updatedTransaction = {
            ...transaction,
            status: 'pendente' as const,
            paymentDate: null // Limpar data de pagamento para que o modal não mostre como baixado
          }
          setTimeout(() => {
            onOpenEditModal(updatedTransaction)
          }, 100)
        }
      } else {
        // Cancelar lançamento - deletar (soft delete) (precisa de motivo)
        await deleteLancamento(Number(transaction.id))
        customToast.success("Lançamento cancelado com sucesso!")

        await onSave()
        onClose()
        setReason("") // Limpar campo
      }
    } catch (err) {
      console.error("Erro ao cancelar lançamento:", err)
      customToast.error("Erro ao cancelar lançamento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-slate-900 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{isPaid ? "Cancelar Baixa" : "Cancelar Lançamento"}</DialogTitle>
          <DialogDescription className="dark:text-slate-300">
            {isPaid
              ? "Você está prestes a cancelar a baixa deste lançamento, o que o retornará para o status pendente."
              : "Você está prestes a cancelar este lançamento. Ele permanecerá visível, mas será marcado como cancelado."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {transaction && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Código:</span>
                  <p className="font-medium dark:text-white">{transaction.code || "-"}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Valor:</span>
                  <p className="font-medium dark:text-white">{formatCurrency(transaction.value)}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Vencimento:</span>
                  <p className="font-medium dark:text-white">{formatDate(transaction.dueDate)}</p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Status:</span>
                  <p className="font-medium dark:text-white">{transaction.status}</p>
                </div>
                {isPaid && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Data de Pagamento:</span>
                    <p className="font-medium dark:text-white">{formatDate(transaction.paymentDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}


          {isPaid && (
            <div className="flex items-start bg-amber-50 p-3 rounded-md border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Atenção: Cancelar a baixa retornará este lançamento para o status pendente. Todas as informações de
                pagamento serão removidas.
              </p>
            </div>
          )}

          {isPaid && transaction?.idCartao && transaction?.idFatura && (
            <div className="flex items-start bg-violet-50 p-3 rounded-md border border-violet-200">
              <AlertCircle className="h-5 w-5 text-violet-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-violet-700">
                Este lançamento está vinculado ao cartão de crédito. Cancelar a baixa também estornará o item da fatura e, se parcelado, removerá todas as parcelas futuras.
              </p>
            </div>
          )}

          {isPaid && transaction?.idFatura && !transaction?.idCartao && (
            <div className="flex items-start bg-amber-50 p-3 rounded-md border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Este lançamento é o pagamento de uma fatura do cartão. Cancelar a baixa retornará a fatura para o status &quot;fechada&quot;.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPaid ? "Cancelar Baixa" : "Cancelar Lançamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
