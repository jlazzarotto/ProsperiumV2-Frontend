"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Loader2 } from "lucide-react"
import { fetchBanksFromAPI, clearBanksCache } from "@/app/services/bank-service"
import type { BankAgency, Bank } from "@/types/types"
import { maskBankAgencyNumber } from "@/lib/masks"
import { handleError } from "@/lib/error-handler"
import customToast from "@/components/ui/custom-toast"

interface BankAgencyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (agency: Omit<BankAgency, "id" | "createdAt" | "updatedAt">) => Promise<void>
  agency?: BankAgency
  title: string
}

export function BankAgencyModal({ isOpen, onClose, onSave, agency, title }: BankAgencyModalProps) {
  const [formState, setFormState] = useState<Omit<BankAgency, "id" | "createdAt" | "updatedAt">>({
    code: "",
    agencyName: "",
    agencyNumber: "",
    bankCode: "",
    bankName: "",
  })
  const [banks, setBanks] = useState<Bank[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        clearBanksCache()
        const banksData = await fetchBanksFromAPI()
        setBanks(banksData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    if (agency) {
      setFormState({
        code: agency.code || "",
        agencyName: agency.agencyName || "",
        agencyNumber: agency.agencyNumber || "",
        bankCode: agency.bankCode || "",
        bankName: agency.bankName || "",
      })
    } else {
      const randomCode = `BANK${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`
      setFormState({
        code: randomCode,
        agencyName: "",
        agencyNumber: "",
        bankCode: "",
        bankName: "",
      })
    }
  }, [agency, isOpen])

  const handleInputChange = (field: string, value: string) => {
    if (field === "agencyNumber") {
      value = maskBankAgencyNumber(value)
    }
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleBankChange = (bankId: string) => {
    const selectedBank = banks.find((bank) => bank.id === bankId)
    if (selectedBank) {
      setFormState((prev) => ({
        ...prev,
        bankCode: selectedBank.id,
        bankName: selectedBank.name,
      }))
    }
  }

  const bankOptions = banks.map((bank) => ({
    value: bank.id,
    label: `${bank.code} - ${bank.name}`,
  }))

  const handleSubmit = async () => {
    if (!formState.agencyName || !formState.agencyNumber || !formState.bankCode) {
      customToast.error("Por favor, preencha todos os campos obrigatórios", {
        position: "bottom-right",
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave(formState)
      customToast.success("Agência salva com sucesso!", {
        position: "bottom-right",
      })
      onClose()
    } catch (error) {
      handleError(error, "salvar agência")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
        <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-blue-900 dark:text-blue-100">{title}</div>
              {agency && <div className="text-sm font-normal text-blue-600 dark:text-blue-400">{agency.agencyName}</div>}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 py-4">
          <div className="space-y-4">
            {/* Card de Identificação */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Identificação
              </h3>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="number" className="text-blue-800 dark:text-blue-200">Número da Agência</Label>
                <Input
                  id="number"
                  placeholder="0000-0"
                  maxLength={10}
                  value={formState.agencyNumber}
                  onChange={(e) => handleInputChange("agencyNumber", e.target.value)}
                  className="border-blue-200 dark:border-blue-700 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Card de Dados da Agência */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Dados da Agência
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="agencyName" className="text-blue-800 dark:text-blue-200">Nome da Agência</Label>
                  <Input
                    id="agencyName"
                    placeholder="Digite o nome da agência"
                    value={formState.agencyName}
                    onChange={(e) => handleInputChange("agencyName", e.target.value)}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="bank" className="text-blue-800 dark:text-blue-200">Banco</Label>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/50">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                      <span className="text-blue-700 dark:text-blue-300">Carregando...</span>
                    </div>
                  ) : (
                    <SearchableSelect
                      options={bankOptions}
                      value={formState.bankCode}
                      onValueChange={handleBankChange}
                      placeholder="Selecione o banco"
                      searchPlaceholder="Pesquisar banco..."
                      emptyMessage="Nenhum banco encontrado"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t border-blue-200 dark:border-blue-800">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {agency ? "Atualizar Agência" : "Criar Agência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
