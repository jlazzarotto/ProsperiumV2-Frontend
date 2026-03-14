/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, CalendarIcon } from "lucide-react"
import { getBankAgenciesByBusinessUnit } from "@/app/services/bank-agency-service"
import { useBusinessUnits } from "@/app/hooks/use-business-units"
import { cn } from "@/lib/utils"
import type {BankAgency } from "@/types/types"

interface BankAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (account: Omit<any, "id" | "createdAt" | "updatedAt">) => Promise<void>
  account?: any
  title: string
}

const accountingAccounts = [
  "Caixa Geral",
  "Bancos Conta Movimento",
  "Aplicações Financeiras",
  "Contas a Receber",
  "Adiantamentos",
]

export function BankAccountModal({ isOpen, onClose, onSave, account, title }: BankAccountModalProps) {
  const { businessUnits } = useBusinessUnits()
  const [formState, setFormState] = useState<Omit<any, "id" | "createdAt" | "updatedAt">>({
    code: "",
    account: "",
    bankAgencyId: "",
    businessUnitId: "",
    startDate: new Date(),
    value: "R$ 0,00",
    accountingAccount: "",
    showInDashboard: false,
    paymentMethods: [],
  })
  const [agencies, setAgencies] = useState<BankAgency[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (account) {
      setFormState({
        code: account.code || "",
        account: account.account || "",
        bankAgencyId: account.bankAgencyId || "",
        businessUnitId: account.businessUnitId || "",
        startDate: account.startDate || new Date(),
        value: account.value || "R$ 0,00",
        accountingAccount: account.accountingAccount || "",
        showInDashboard: account.showInDashboard || false,
        paymentMethods: account.paymentMethods || [],
      })

      if (account.businessUnitId) {
        loadAgencies(account.businessUnitId)
      }
    } else {
      const defaultBusinessUnitId = businessUnits[0]?.id || ""
      setFormState({
        code: "",
        account: "",
        bankAgencyId: "",
        businessUnitId: defaultBusinessUnitId,
        startDate: new Date(),
        value: "R$ 0,00",
        accountingAccount: "",
        showInDashboard: false,
        paymentMethods: [],
      })

      if (defaultBusinessUnitId) {
        loadAgencies(defaultBusinessUnitId)
      }
    }
  }, [account, businessUnits, isOpen])

  const loadAgencies = async (businessUnitId: string) => {
    if (!businessUnitId) return

    setIsLoading(true)
    try {
      const agenciesData = await getBankAgenciesByBusinessUnit(businessUnitId)
      setAgencies(agenciesData)
    } catch (error) {
      console.error("Erro ao carregar agências:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBusinessUnitChange = (businessUnitId: string) => {
    setFormState((prev) => ({ ...prev, businessUnitId }))
    loadAgencies(businessUnitId)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      await onSave(formState)
      onClose()
    } catch (error) {
      console.error("Erro ao salvar conta:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-600">{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formState.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="account">Conta</Label>
              <Input
                id="account"
                value={formState.account}
                onChange={(e) => handleInputChange("account", e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="businessUnit">Unidade de Negócio</Label>
              <Select value={formState.businessUnitId} onValueChange={handleBusinessUnitChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade de negócio" />
                </SelectTrigger>
                <SelectContent>
                  {businessUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id || ""}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="bankAgency">Agência Bancária</Label>
              {isLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Carregando agências...</span>
                </div>
              ) : (
                <Select
                  value={formState.bankAgencyId}
                  onValueChange={(value) => handleInputChange("bankAgencyId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a agência" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id || ""}>
                        {agency.agencyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="startDate">Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formState.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.startDate ? (
                      format(formState.startDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formState.startDate}
                    onSelect={(date) => handleInputChange("startDate", date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="value">Valor</Label>
              <Input id="value" value={formState.value} onChange={(e) => handleInputChange("value", e.target.value)} />
            </div>

            <div className="flex flex-col space-y-1.5 sm:col-span-2">
              <Label htmlFor="accountingAccount">Conta Contábil</Label>
              <Select
                value={formState.accountingAccount}
                onValueChange={(value) => handleInputChange("accountingAccount", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta contábil" />
                </SelectTrigger>
                <SelectContent>
                  {accountingAccounts.map((acc) => (
                    <SelectItem key={acc} value={acc.toLowerCase().replace(/\s+/g, "-")}>
                      {acc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showInDashboard"
                checked={formState.showInDashboard}
                onCheckedChange={(checked) => handleInputChange("showInDashboard", checked)}
              />
              <Label htmlFor="showInDashboard">Mostrar no Dashboard</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

