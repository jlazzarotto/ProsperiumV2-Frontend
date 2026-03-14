/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeftRight } from "lucide-react"
import { getActiveCashAccounts } from "@/app/services/cash-account-api-service"
import { getAllBankAgencies } from "@/app/services/bank-agency-service"
import { getTipo8BusinessUnits } from "@/services/business-unit-service"
import type { Tipo8BusinessUnit } from "@/services/business-unit-service"
import { addTransfer, updateTransfer } from "@/app/services/transfer-api-service"
import { Textarea } from "@/components/ui/textarea"
import { DatePickerInput } from "@/components/date-picker-input"
import { MoneyInput } from "@/components/ui/money-input"
import type { CashAccount } from "@/types/types"
import type { Transfer } from "@/types/types"
import customToast from "./ui/custom-toast"

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  transfer?: Transfer
  title: string
}

export function TransferModal({ isOpen, onClose, onSave, transfer, title }: TransferModalProps) {
  const [formState, setFormState] = useState({
    selectedEmpresa: "",
    originAccountId: "",
    destinationAccountId: "",
    value: "",
    description: "",
    date: new Date(),
  })

  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [bankAgencyMap, setBankAgencyMap] = useState<Map<string, string>>(new Map())
  const [tipo8Units, setTipo8Units] = useState<Tipo8BusinessUnit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    if (transfer) {
      // Ao editar, determinar empresa a partir da conta de origem
      const origemConta = cashAccounts.find(c => c.id === transfer.originAccountId)
      setFormState({
        selectedEmpresa: origemConta?.businessUnitId || "",
        originAccountId: transfer.originAccountId || "",
        destinationAccountId: transfer.destinationAccountId || "",
        value: transfer.value?.replace(/[R$\s.]/g, '').replace(',', '.') || "",
        description: transfer.description || "",
        date: transfer.date ? new Date(transfer.date) : new Date(),
      })
    } else {
      setFormState({
        selectedEmpresa: "",
        originAccountId: "",
        destinationAccountId: "",
        value: "",
        description: "",
        date: new Date(),
      })
    }
  }, [transfer, isOpen, cashAccounts])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [allAccounts, allAgencies, units] = await Promise.all([
        getActiveCashAccounts(),
        getAllBankAgencies(),
        getTipo8BusinessUnits(),
      ])

      const agencyMap = new Map<string, string>()
      allAgencies.forEach(agency => {
        if (agency.id) {
          agencyMap.set(agency.id, agency.bankName || agency.agencyName || 'Sem banco')
        }
      })

      setBankAgencyMap(agencyMap)
      setCashAccounts(allAccounts)
      setTipo8Units(units)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      if (!(error as any)?.response) {
        customToast.error("Erro ao carregar dados")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Mapa id_pessoa (string) → apelido das unidades tipo 8 (igual ao TripleSelector)
  const tipo8Map = useMemo(() => {
    const m = new Map<string, string>()
    tipo8Units.forEach(u => {
      m.set(String(u.id_pessoa), u.apelido)
    })
    return m
  }, [tipo8Units])

  // Empresas únicas derivadas das contas caixa, com nome igual ao TripleSelector
  const empresas = useMemo(() => {
    const seen = new Set<string>()
    const list: { id: string; name: string }[] = []
    cashAccounts.forEach(acc => {
      if (acc.businessUnitId && !seen.has(acc.businessUnitId)) {
        seen.add(acc.businessUnitId)
        list.push({
          id: acc.businessUnitId,
          name: tipo8Map.get(acc.businessUnitId) || acc.personName || `Empresa ${acc.businessUnitId}`,
        })
      }
    })
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [cashAccounts, tipo8Map])

  // Contas filtradas pela empresa selecionada
  const accountsByEmpresa = useMemo(() => {
    if (!formState.selectedEmpresa) return []
    return cashAccounts.filter(acc => acc.businessUnitId === formState.selectedEmpresa)
  }, [cashAccounts, formState.selectedEmpresa])

  // Contas de destino: mesma empresa, excluir a conta de origem
  const destinationAccounts = useMemo(() => {
    return accountsByEmpresa.filter(acc => acc.id !== formState.originAccountId)
  }, [accountsByEmpresa, formState.originAccountId])

  const getAccountLabel = (account: CashAccount) => {
    const bank = account.bankAgencyId ? bankAgencyMap.get(account.bankAgencyId) || 'Sem banco' : 'Sem banco'
    return `${account.account} - ${bank}`
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formState.selectedEmpresa) {
      newErrors.selectedEmpresa = "Selecione a empresa"
    }

    if (!formState.originAccountId) {
      newErrors.originAccountId = "Selecione a conta origem"
    }

    if (!formState.destinationAccountId) {
      newErrors.destinationAccountId = "Selecione a conta destino"
    }

    if (formState.originAccountId === formState.destinationAccountId) {
      newErrors.destinationAccountId = "Conta destino deve ser diferente da origem"
    }

    if (!formState.value || parseFloat(formState.value) <= 0) {
      newErrors.value = "Informe um valor válido"
    }

    if (!formState.description?.trim()) {
      newErrors.description = "Informe uma descrição"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const contaOrigem = cashAccounts.find(c => c.id === formState.originAccountId)
      const transferData: Omit<Transfer, "id" | "code" | "createdAt" | "updatedAt"> = {
        originAccountId: formState.originAccountId,
        destinationAccountId: formState.destinationAccountId,
        value: `R$ ${parseFloat(formState.value).toFixed(2).replace('.', ',')}`,
        description: formState.description,
        date: formState.date,
        transactionTypeId: "",
        businessUnitId: contaOrigem?.businessUnitId,
      }

      if (transfer?.id) {
        await updateTransfer(transfer.id, transferData)
        customToast.success("Transferência atualizada com sucesso!")
      } else {
        await addTransfer(transferData)
        customToast.success("Transferência criada com sucesso!")
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error("Erro ao salvar transferência:", error)
      customToast.error("Erro ao salvar transferência")
      const detailedMessage = typeof error?.message === "string" ? error.message.trim() : ""
      if (detailedMessage && detailedMessage !== "Erro ao salvar transferência") {
        customToast.error(detailedMessage)
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-600 flex items-center">
            <ArrowLeftRight className="mr-2 h-6 w-6" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Empresa */}
          <div>
            <Label htmlFor="empresa" className="text-blue-800 font-medium">Empresa *</Label>
            <Select
              value={formState.selectedEmpresa}
              onValueChange={(value) => {
                setFormState(prev => ({
                  ...prev,
                  selectedEmpresa: value,
                  originAccountId: "",
                  destinationAccountId: "",
                }))
                if (errors.selectedEmpresa) {
                  const newErrors = { ...errors }
                  delete newErrors.selectedEmpresa
                  setErrors(newErrors)
                }
              }}
            >
              <SelectTrigger id="empresa" className="border-blue-200">
                <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione a empresa"} />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.selectedEmpresa && <p className="text-sm text-red-500">{errors.selectedEmpresa}</p>}
          </div>

          {/* Conta Origem */}
          <div>
            <Label htmlFor="originAccount" className="text-blue-800 font-medium">Conta Origem *</Label>
            <Select
              value={formState.originAccountId}
              disabled={!formState.selectedEmpresa}
              onValueChange={(value) => {
                setFormState(prev => ({
                  ...prev,
                  originAccountId: value,
                  // limpar destino se for igual à nova origem
                  destinationAccountId: prev.destinationAccountId === value ? "" : prev.destinationAccountId,
                }))
                if (errors.originAccountId) {
                  const newErrors = { ...errors }
                  delete newErrors.originAccountId
                  setErrors(newErrors)
                }
              }}
            >
              <SelectTrigger id="originAccount" className="border-blue-200">
                <SelectValue placeholder={formState.selectedEmpresa ? "Selecione a conta origem" : "Selecione a empresa primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {accountsByEmpresa.map((account) => (
                  <SelectItem key={account.id} value={account.id || ""}>
                    {getAccountLabel(account)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.originAccountId && <p className="text-sm text-red-500">{errors.originAccountId}</p>}
          </div>

          {/* Conta Destino */}
          <div>
            <Label htmlFor="destinationAccount" className="text-blue-800 font-medium">Conta Destino *</Label>
            <Select
              value={formState.destinationAccountId}
              disabled={!formState.originAccountId}
              onValueChange={(value) => {
                setFormState(prev => ({ ...prev, destinationAccountId: value }))
                if (errors.destinationAccountId) {
                  const newErrors = { ...errors }
                  delete newErrors.destinationAccountId
                  setErrors(newErrors)
                }
              }}
            >
              <SelectTrigger id="destinationAccount" className="border-blue-200">
                <SelectValue placeholder={formState.originAccountId ? "Selecione a conta destino" : "Selecione a conta origem primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {destinationAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id || ""}>
                    {getAccountLabel(account)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destinationAccountId && <p className="text-sm text-red-500">{errors.destinationAccountId}</p>}
          </div>

          {/* Valor */}
          <div>
            <Label htmlFor="value" className="text-blue-800 font-medium">Valor (R$) *</Label>
            <MoneyInput
              id="value"
              value={formState.value ? parseFloat(formState.value) : 0}
              onChange={(value) => {
                setFormState(prev => ({ ...prev, value: value.toString() }))
                if (errors.value) {
                  const newErrors = { ...errors }
                  delete newErrors.value
                  setErrors(newErrors)
                }
              }}
              className="border-blue-200"
            />
            {errors.value && <p className="text-sm text-red-500">{errors.value}</p>}
          </div>

          {/* Data */}
          <div>
            <Label htmlFor="date" className="text-blue-800 font-medium">Data</Label>
            <DatePickerInput
              date={formState.date}
              setDate={(date) => setFormState(prev => ({ ...prev, date: date || new Date() }))}
              placeholder="dd/mm/aaaa"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description" className="text-blue-800 font-medium">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descrição da transferência"
              value={formState.description}
              onChange={(e) => {
                setFormState(prev => ({ ...prev, description: e.target.value }))
                if (errors.description) {
                  const newErrors = { ...errors }
                  delete newErrors.description
                  setErrors(newErrors)
                }
              }}
              className="border-blue-200"
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {transfer ? "Atualizar" : "Criar"} Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
