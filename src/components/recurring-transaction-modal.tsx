/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createLancamento, createRecorrenteLancamento, updateLancamento, createLancamentoRecorrente, clearLancamentosCache } from "@/app/services/lancamento-service"
import { addMonths, addWeeks, format, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import customToast from "@/components/ui/custom-toast"
import type { FinancialTransaction } from "@/types/types"
import { Loader2, CalendarIcon, CheckIcon, InfoIcon } from "lucide-react"

interface RecurringTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Partial<FinancialTransaction>
  onSave: () => void
}

type FrequencyType =
  | "semanal"
  | "mensal"
  | "quinzenal"
  | "anual"
  | "diaria"
  | "bimestral"
  | "trimestral"
  | "semestral"
  | "a_cada_15_dias"
  | "a_cada_20_dias"
  | "a_cada_28_dias"
  | "a_cada_30_dias"

// interface CustomFrequency {
//   type: "dias"
//   value: number
// }

export function RecurringTransactionModal({ isOpen, onClose, transaction, onSave }: RecurringTransactionModalProps) {
  const [frequency, setFrequency] = useState<FrequencyType>("mensal")
  const [installments, setInstallments] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [seriesName, setSeriesName] = useState("")
  const [updateCompetence, setUpdateCompetence] = useState(true)
  const [startingInstallment, setStartingInstallment] = useState<number>(1)
  const [recurrenceDescription, setRecurrenceDescription] = useState("")

  const handleFrequencyChange = (value: string) => {
    setFrequency(value as FrequencyType)
  }

  const handleInstallmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setInstallments(value)
    }
  }

  const handleStartingInstallmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0 && value <= installments) {
      setStartingInstallment(value)
    }
  }


  // Normalize date to ensure it's valid
  const normalizeDate = (dateInput: any): Date => {
    if (!dateInput) return new Date()

    // If it's already a Date object
    if (dateInput instanceof Date) {
      // Check if it's a valid date and not too old
      if (isValid(dateInput) && dateInput.getFullYear() > 2000) {
        return dateInput
      }
      return new Date()
    }

    // If it's a string, try to parse it
    if (typeof dateInput === "string") {
      // Try ISO format first
      const isoDate = new Date(dateInput)
      if (isValid(isoDate) && isoDate.getFullYear() > 2000) {
        return isoDate
      }
    }

    // Handle Firestore Timestamp objects
    if (typeof dateInput === "object" && dateInput !== null && "seconds" in dateInput) {
      // @ts-ignore - Firestore timestamp object
      return new Date(dateInput.seconds * 1000)
    }

    // Default to current date if all else fails
    return new Date()
  }

  const calculateNextDate = (baseDate: Date, index: number): Date => {
    const date = normalizeDate(baseDate)

    switch (frequency) {
      case "semanal":
        return addWeeks(date, index)
      case "mensal":
        return addMonths(date, index)
      case "quinzenal":
        return addWeeks(date, index * 2)
      case "diaria": {
        const newDate = new Date(date)
        newDate.setDate(date.getDate() + index)
        return newDate
      }
      case "anual":
        return addMonths(date, index * 12)
      case "bimestral":
        return addMonths(date, index * 2)
      case "trimestral":
        return addMonths(date, index * 3)
      case "semestral":
        return addMonths(date, index * 6)
      case "a_cada_15_dias": {
        const newDate15 = new Date(date)
        newDate15.setDate(date.getDate() + (index * 15))
        return newDate15
      }
      case "a_cada_20_dias": {
        const newDate20 = new Date(date)
        newDate20.setDate(date.getDate() + (index * 20))
        return newDate20
      }
      case "a_cada_28_dias": {
        const newDate28 = new Date(date)
        newDate28.setDate(date.getDate() + (index * 28))
        return newDate28
      }
      case "a_cada_30_dias": {
        const newDate30 = new Date(date)
        newDate30.setDate(date.getDate() + (index * 30))
        return newDate30
      }
      default:
        return addMonths(date, index)
    }
  }

  // Gerar código de competência (YYYYMM) a partir da data
  const generateCompetenceCode = (date: Date): string => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() retorna 0-11
    return `${year}${month.toString().padStart(2, "0")}`
  }

  // Função para criar recorrência baseada em transação existente
  const createRecurringTransactionsWithCompetence = async () => {
    if (!transaction || !transaction.dueDate || !transaction.id) {
      customToast.error("Dados da transação incompletos - ID obrigatório para criar recorrência")
      return
    }

    setLoading(true)
    try {
      const baseDate = normalizeDate(transaction.dueDate)
      
      // Usar o ID da transação existente como base para a recorrência
      // Calcular quantas parcelas gerar (do startingInstallment até installments)
      const quantidadeAGerar = installments - startingInstallment + 1

      const recorrenciaData = {
        base_lancamento_id: Number(transaction.id),
        frequencia: frequency as 'semanal' | 'mensal' | 'quinzenal' | 'anual' | 'diaria',
        quantidade: quantidadeAGerar, // Gerar apenas as parcelas restantes
        atualizar_competencia: updateCompetence,
        parcela_inicial: startingInstallment,
        total_parcelas: installments,
        descricao_recorrencia: recurrenceDescription || undefined
      }
      
      console.log("🚀 Criando recorrência para lançamento base existente:", recorrenciaData)
      const result = await createRecorrenteLancamento(recorrenciaData)
      console.log("✅ Recorrência criada:", result)
      
      // Limpar cache para forçar recarregamento
      await clearLancamentosCache()
      
      customToast.success(
        `Recorrência criada com sucesso! Lançamento base + ${result.total_gerados} lançamentos filhos = ${result.total_gerados + 1} total.`
      )
      
      onSave()
      onClose()
    } catch (error: any) {
      console.error("❌ Erro ao criar lançamentos recorrentes:", error)
      const errorMessage = error?.response?.data?.error || error?.message || "Erro ao criar lançamentos recorrentes"
      customToast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getFrequencyLabel = (): string => {
    switch (frequency) {
      case "semanal":
        return "Semanal"
      case "mensal":
        return "Mensal"
      case "quinzenal":
        return "Quinzenal"
      case "diaria":
        return "Diária"
      case "anual":
        return "Anual"
      case "bimestral":
        return "Bimestral"
      case "trimestral":
        return "Trimestral"
      case "semestral":
        return "Semestral"
      case "a_cada_15_dias":
        return "A cada 15 dias"
      case "a_cada_20_dias":
        return "A cada 20 dias"
      case "a_cada_28_dias":
        return "A cada 28 dias"
      case "a_cada_30_dias":
        return "A cada 30 dias"
      default:
        return "Mensal"
    }
  }

  const getPreviewText = (): string => {
    if (!transaction || !transaction.dueDate) return "Selecione uma data de vencimento para visualizar a prévia."

    const baseDate = normalizeDate(transaction.dueDate)
    const quantidadeAGerar = installments - startingInstallment + 1
    const firstDate = calculateNextDate(baseDate, 0)
    const lastDate = calculateNextDate(baseDate, quantidadeAGerar - 1)

    const parcelaInicial = String(startingInstallment).padStart(3, '0')
    const parcelaFinal = String(installments).padStart(3, '0')
    const totalParcelas = String(installments).padStart(3, '0')

    return `Serão criados ${quantidadeAGerar} lançamentos ${getFrequencyLabel().toLowerCase()},
    da parcela ${parcelaInicial}/${totalParcelas} até ${parcelaFinal}/${totalParcelas},
    começando em ${format(firstDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
    até ${format(lastDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">Configurar Recorrência</DialogTitle>
          <DialogDescription className="dark:text-slate-300">
            Configure a frequência e o número de parcelas para este lançamento. Esta ação criará múltiplos lançamentos
            baseados nas configurações abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="seriesName" className="dark:text-slate-200">Nome da Série (opcional)</Label>
            <Input
              id="seriesName"
              placeholder="Ex: Aluguel 2024"
              value={seriesName}
              onChange={(e) => setSeriesName(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="frequency" className="dark:text-slate-200">Frequência</Label>
            <Select value={frequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="quinzenal">Quinzenal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="bimestral">Bimestral</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
                <SelectItem value="a_cada_15_dias">A cada 15 dias</SelectItem>
                <SelectItem value="a_cada_20_dias">A cada 20 dias</SelectItem>
                <SelectItem value="a_cada_28_dias">A cada 28 dias</SelectItem>
                <SelectItem value="a_cada_30_dias">A cada 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="installments" className="dark:text-slate-200">Quantidade total de parcelas</Label>
            <Input id="installments" type="number" min="1" max="120" value={installments} onChange={handleInstallmentsChange} />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="startingInstallment" className="dark:text-slate-200">A partir da parcela nº</Label>
            <Input
              id="startingInstallment"
              type="number"
              min="1"
              max={installments}
              value={startingInstallment}
              onChange={handleStartingInstallmentChange}
            />
            <p className="text-xs text-muted-foreground">
              Ex: Se são 10 parcelas e o cliente já pagou 4, coloque 5 aqui para gerar da parcela 5/10 em diante.
            </p>
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="recurrenceDescription" className="dark:text-slate-200">Descrição da recorrência (opcional)</Label>
            <Input
              id="recurrenceDescription"
              placeholder="Ex: Aluguel, Financiamento, etc."
              value={recurrenceDescription}
              onChange={(e) => setRecurrenceDescription(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Será exibida como: Recorrência: 005/010 - {recurrenceDescription || "sua descrição"}
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="updateCompetence"
              checked={updateCompetence}
              onCheckedChange={(checked) => setUpdateCompetence(checked as boolean)}
            />
            <Label htmlFor="updateCompetence" className="text-sm font-medium dark:text-slate-200">
              Atualizar competências de acordo com as datas
            </Label>
          </div>


          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-700 text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-2 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Prévia da Recorrência:
            </p>
            <p className="mb-2">{getPreviewText()}</p>
            <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-600">
              {updateCompetence ? (
                <div className="flex items-center">
                  <CheckIcon className="h-4 w-4 mr-2 text-green-600" />
                  <p className="text-xs">
                    As competências serão atualizadas de acordo com o mês e ano de cada vencimento.
                  </p>
                </div>
              ) : (
                <div className="flex items-center">
                  <InfoIcon className="h-4 w-4 mr-2 text-amber-600" />
                  <p className="text-xs">
                    Todas as parcelas terão a mesma competência:{" "}
                    {generateCompetenceCode(normalizeDate(transaction?.dueDate))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={createRecurringTransactionsWithCompetence}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Gerar Lançamentos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
