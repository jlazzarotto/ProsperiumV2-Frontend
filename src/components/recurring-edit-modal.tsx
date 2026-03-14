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
import { Badge } from "@/components/ui/badge"
import { RepeatIcon, Pencil, AlertTriangle } from "lucide-react"
import type { FinancialTransaction } from "@/types/types"

export type EditScope = "single" | "all" | "fromThis"

interface RecurringEditModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: FinancialTransaction | null
  onSelectScope: (scope: EditScope, transaction: FinancialTransaction) => void
}

export function RecurringEditModal({
  isOpen,
  onClose,
  transaction,
  onSelectScope,
}: RecurringEditModalProps) {
  const [selectedScope, setSelectedScope] = useState<EditScope | null>(null)

  const handleClose = () => {
    setSelectedScope(null)
    onClose()
  }

  const handleContinue = () => {
    if (!selectedScope || !transaction) return
    handleClose()
    onSelectScope(selectedScope, transaction)
  }

  if (!transaction) return null

  const isPaid = transaction.status === "baixado"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-600 flex items-center">
            <Pencil className="h-5 w-5 mr-2" />
            Editar Lançamento Recorrente
          </DialogTitle>
          <DialogDescription>
            Este lançamento faz parte de uma série recorrente. Como deseja editar?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Informações do lançamento */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md border border-blue-100 dark:border-blue-800">
            <div className="flex items-center mb-2">
              <RepeatIcon className="h-4 w-4 mr-2 text-blue-600" />
              <Badge className="bg-blue-600 text-white">
                Recorrência ID: {transaction.recurrenceId}
              </Badge>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Descrição:</span>{" "}
              {transaction.description}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Valor:</span>{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(transaction.value)}
            </p>
          </div>

          {/* Escopo da edição */}
          <div className="space-y-3">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedScope === "single"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
              }`}
              onClick={() => setSelectedScope("single")}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 mt-1 ${
                    selectedScope === "single"
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedScope === "single" && (
                    <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Somente este lançamento
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Edita apenas o lançamento selecionado.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedScope === "fromThis"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
              }`}
              onClick={() => setSelectedScope("fromThis")}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 mt-1 ${
                    selectedScope === "fromThis"
                      ? "border-purple-500 bg-purple-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedScope === "fromThis" && (
                    <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    A partir deste lançamento
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Edita este e todos os futuros da série.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedScope === "all"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
              }`}
              onClick={() => setSelectedScope("all")}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 mt-1 ${
                    selectedScope === "all"
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedScope === "all" && (
                    <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    Todos os pendentes da série
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Edita todos os lançamentos pendentes (não baixados).
                  </p>
                  {isPaid && (
                    <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded border border-amber-200 dark:border-amber-700">
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Este lançamento já está baixado e não será alterado.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedScope}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continuar para Edição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
