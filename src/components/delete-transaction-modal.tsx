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
import { Loader2, AlertTriangle } from "lucide-react"
import { deleteFinancialTransaction, deleteRecurrenceSeries } from "@/app/services/financial-transaction-service"
import type { FinancialTransaction } from "@/types/types"
import customToast from "@/components/ui/custom-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface DeleteTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction?: FinancialTransaction
  onDelete: () => void
}

export function DeleteTransactionModal({ isOpen, onClose, transaction, onDelete }: DeleteTransactionModalProps) {
  const [loading, setLoading] = useState(false)
  const [deleteAllRecurrences, setDeleteAllRecurrences] = useState(false)

  const handleDelete = async () => {
    if (!transaction?.id) {
      customToast.error("Transação não encontrada")
      return
    }

    setLoading(true)
    try {
      // Se o usuário escolheu excluir todas as recorrências
      if (deleteAllRecurrences && transaction.recurrenceSeriesId) {
        // Excluir todas as transações da série
        await deleteRecurrenceSeries(transaction.recurrenceSeriesId)
        customToast.success("Série de recorrência excluída com sucesso!")
      } else {
        // Excluir apenas a transação atual
        await deleteFinancialTransaction(transaction.id)
        customToast.success("Lançamento excluído com sucesso!")
      }

      onDelete()
      onClose()
    } catch (error) {
      console.error("Error deleting transaction:", error)
      customToast.error("Erro ao excluir lançamento")
    } finally {
      setLoading(false)
    }
  }

  // Verificar se a transação faz parte de uma série de recorrência
  const isPartOfRecurrenceSeries = !!transaction?.recurrenceSeriesId

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] dark:bg-slate-900 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Confirmar exclusão
          </DialogTitle>
          <DialogDescription className="dark:text-slate-300">
            Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        {isPartOfRecurrenceSeries && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-700 my-4">
            <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">Este lançamento faz parte de uma série de recorrência.</p>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="deleteAllRecurrences"
                checked={deleteAllRecurrences}
                onCheckedChange={(checked) => setDeleteAllRecurrences(checked as boolean)}
              />
              <Label htmlFor="deleteAllRecurrences" className="text-sm font-medium cursor-pointer dark:text-amber-200">
                Excluir todas as transações desta série de recorrência
              </Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
