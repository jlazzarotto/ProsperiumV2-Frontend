"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, RepeatIcon, Trash2, AlertTriangle } from "lucide-react"
import { deleteLancamento, removerSerieRecorrencia } from "@/app/services/lancamento-service"
import customToast from "@/components/ui/custom-toast"
import type { FinancialTransaction } from "@/types/types"

interface RecurringDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: FinancialTransaction | null
  onSuccess: () => void
}

export function RecurringDeleteModal({
  isOpen,
  onClose,
  transaction,
  onSuccess
}: RecurringDeleteModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'single' | 'all' | 'fromThis' | null>(null)

  const handleDeleteSingle = async () => {
    if (!transaction?.id) return

    setLoading(true)
    try {
      await deleteLancamento(Number(transaction.id))
      customToast.success("Lançamento individual excluído com sucesso!", {
        position: "bottom-right"
      })
      onSuccess()
      onClose()
    } catch (error: unknown) {
      console.error("Erro ao excluir lançamento individual:", error)
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || (error as Error)?.message || "Erro ao excluir lançamento"
      customToast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!transaction?.id || !transaction?.recurrenceId) return

    setLoading(true)
    try {
      console.log("🗑️ Removendo série de recorrência:", {
        lancamentoId: transaction.id,
        recorrenceId: transaction.recurrenceId
      })

      // Usar qualquer ID da série - o backend irá encontrar todos os lançamentos da recorrência
      const result = await removerSerieRecorrencia(Number(transaction.id))
      customToast.success(
        `Série completa removida com sucesso! ${result.removidos} lançamentos excluídos.`,

      )
      onSuccess()
      onClose()
    } catch (error: unknown) {
      console.error("Erro ao excluir série de recorrência:", error)
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || (error as Error)?.message || "Erro ao excluir série"
      customToast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFromThis = async () => {
    if (!transaction?.id || !transaction?.recurrenceId) return

    setLoading(true)
    try {
      console.log("🗑️ Removendo a partir desta recorrência:", {
        lancamentoId: transaction.id,
        recurrenceId: transaction.recurrenceId
      })

      // O backend pega recurrenceId e data diretamente do lançamento pelo ID
      const { httpClient } = await import('@/lib/http-client')
      const result = await httpClient.delete(`/lancamentos/${transaction.id}/delete-from-this`) as { removidos: number }
      customToast.success(
        `Lançamentos removidos com sucesso! ${result.removidos} lançamentos excluídos a partir desta data.`
      )
      onSuccess()
      onClose()
    } catch (error: unknown) {
      console.error("Erro ao excluir a partir desta recorrência:", error)
      const errorMessage = (error as Error)?.message || "Erro ao excluir lançamentos"
      customToast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (selectedAction === 'single') {
      handleDeleteSingle()
    } else if (selectedAction === 'all') {
      handleDeleteAll()
    } else if (selectedAction === 'fromThis') {
      handleDeleteFromThis()
    }
  }

  if (!transaction) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Excluir Lançamento Recorrente
          </DialogTitle>
          <DialogDescription>
            Este lançamento faz parte de uma série recorrente. Escolha como deseja proceder:
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Informações do lançamento */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <div className="flex items-center mb-2">
              <RepeatIcon className="h-4 w-4 mr-2 text-blue-600" />
              <Badge className="bg-blue-600 text-white">
                Recorrência ID: {transaction.recurrenceId}
              </Badge>
            </div>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Descrição:</span> {transaction.description}
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Valor:</span> {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(transaction.value)}
            </p>
          </div>

          {/* Opções de exclusão */}
          <div className="space-y-3">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedAction === 'single'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
              }`}
              onClick={() => setSelectedAction('single')}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                  selectedAction === 'single' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {selectedAction === 'single' && (
                    <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <Trash2 className="h-4 w-4 mr-2 text-orange-600" />
                    <h4 className="font-medium text-gray-900">Excluir apenas este lançamento</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Remove apenas o lançamento selecionado. Os demais lançamentos da série permanecerão inalterados.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedAction === 'fromThis'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
              }`}
              onClick={() => setSelectedAction('fromThis')}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                  selectedAction === 'fromThis' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                }`}>
                  {selectedAction === 'fromThis' && (
                    <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <RepeatIcon className="h-4 w-4 mr-2 text-purple-600" />
                    <h4 className="font-medium text-gray-900">Excluir a partir desta recorrência</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Remove este lançamento e todos os futuros da série. Os lançamentos anteriores permanecerão inalterados.
                  </p>
                  <div className="mt-2 p-2 bg-purple-100 rounded border border-purple-200">
                    <p className="text-xs text-purple-700 font-medium">
                      Ideal para interromper uma recorrência a partir de uma data específica.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedAction === 'all'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-300 hover:bg-red-25'
              }`}
              onClick={() => setSelectedAction('all')}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                  selectedAction === 'all' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                }`}>
                  {selectedAction === 'all' && (
                    <div className="w-2 h-2 rounded-full bg-white m-0.5"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <RepeatIcon className="h-4 w-4 mr-2 text-red-600" />
                    <h4 className="font-medium text-gray-900">Excluir toda a série de recorrência</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Remove TODOS os lançamentos desta série recorrente (incluindo o pai e todos os filhos).
                  </p>
                  <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                    <p className="text-xs text-red-700 font-medium flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Atenção: Esta ação não pode ser desfeita!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !selectedAction}
            className={
              selectedAction === 'all'
                ? 'bg-red-600 hover:bg-red-700'
                : selectedAction === 'fromThis'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-orange-600 hover:bg-orange-700'
            }
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : selectedAction === 'single' ? (
              <Trash2 className="h-4 w-4 mr-2" />
            ) : (
              <RepeatIcon className="h-4 w-4 mr-2" />
            )}
            {loading
              ? "Excluindo..."
              : selectedAction === 'single'
                ? "Excluir Este"
                : selectedAction === 'fromThis'
                  ? "Excluir Daqui pra Frente"
                  : "Excluir Todos"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
