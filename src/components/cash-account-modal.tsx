/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, CalendarIcon, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { getAllBankAgencies } from "@/app/services/bank-agency-service"
import { getAllPaymentMethods } from "@/app/services/payment-method-service"
import { getAnalyticAccountingAccounts } from "@/app/services/accounting-account-service"
import { getTipo8BusinessUnits } from "@/services/business-unit-service"
import type { Tipo8BusinessUnit } from "@/services/business-unit-service"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CashAccount, BankAgency, BusinessUnit, PaymentMethod, AccountingAccount } from "@/types/types"
import customToast from "./ui/custom-toast"
import { handleError } from "@/lib/error-handler"
import { applyCurrencyMask } from "@/utils/format"

interface CashAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (accountData: Omit<CashAccount, "id" | "createdAt" | "updatedAt">) => Promise<void>
  account?: CashAccount
  title: string
}

export function CashAccountModal({ isOpen, onClose, onSave, account, title }: CashAccountModalProps) {
  const [formState, setFormState] = useState<Omit<CashAccount, "id" | "createdAt" | "updatedAt">>({
    code: "",
    account: "",
    bankAgencyId: "",
    businessUnitId: "",
    startDate: new Date(),
    value: "R$ 0,00",
    income: 0,
    expense: 0,
    currentBalance: 0,
    accountingAccount: "",
    showInDashboard: false,
    paymentMethods: [],
  })
  const [businessUnits, setBusinessUnits] = useState<Tipo8BusinessUnit[]>([])
  const [agencies, setAgencies] = useState<BankAgency[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [accountingAccounts, setAccountingAccounts] = useState<AccountingAccount[]>([])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadBusinessUnits = async () => {
      try {
        console.log('[CashAccountModal] Carregando unidades tipo 8...')
        const units = await getTipo8BusinessUnits()
        console.log('[CashAccountModal] Unidades tipo 8 carregadas:', units.length, units.map(u => ({ id: u.id, apelido: u.apelido })))
        setBusinessUnits(units)
      } catch (error) {
        console.error("Erro ao carregar unidades de negócio tipo 8:", error)
      }
    }

    const loadPaymentMethods = async () => {
      try {
        const methods = await getAllPaymentMethods()
        setPaymentMethods(methods)
      } catch (error) {
        console.error("Erro ao carregar métodos de pagamento:", error)
      }
    }

    const loadAccountingAccounts = async () => {
      try {
        const accounts = await getAnalyticAccountingAccounts()
        setAccountingAccounts(accounts)
      } catch (error) {
        console.error("Erro ao carregar contas contábeis:", error)
      }
    }

    if (isOpen) {
      loadBusinessUnits()
      loadPaymentMethods()
      loadAccountingAccounts()
    }
  }, [isOpen])

  useEffect(() => {
    if (account) {
      const initialValue = Number.parseFloat(account.value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0
      
      // CORREÇÃO: Se o valor parece estar sem decimais (inflado), divida por 100
      let correctedValue = account.value || "R$ 0,00"
      if (initialValue > 10000 && !account.value.includes(",")) {
        // Se valor > 10k e não tem decimais, provavelmente está inflado
        const deflatedValue = initialValue / 100
        correctedValue = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(deflatedValue)
        console.log(`[Modal] Valor corrigido para conta ${account.id}:`, {
          original: account.value,
          initialValue,
          deflatedValue,
          corrected: correctedValue
        })
      }

      setFormState({
        code: account.code || "",
        account: account.account || "",
        bankAgencyId: account.bankAgencyId || "",
        businessUnitId: account.businessUnitId || "",
        startDate: account.startDate ? new Date(account.startDate) : new Date(),
        value: correctedValue,
        income: account.income || 0,
        expense: account.expense || 0,
        currentBalance: account.currentBalance !== undefined ? account.currentBalance : initialValue,
        accountingAccount: account.accountingAccount || "",
        showInDashboard: account.showInDashboard || false,
        paymentMethods: account.paymentMethods || [],
      })

      setSelectedPaymentMethods(account.paymentMethods || [])

      if (account.businessUnitId) {
        loadAgencies(account.businessUnitId)
      }
    } else {
      const randomCode = `CASH${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`

      setFormState({
        code: randomCode,
        account: "",
        bankAgencyId: "",
        businessUnitId: "",
        startDate: new Date(),
        value: "R$ 0,00",
        income: 0,
        expense: 0,
        currentBalance: 0,
        accountingAccount: "",
        showInDashboard: false,
        paymentMethods: [],
      })
      setSelectedPaymentMethods([])
    }
  }, [account, isOpen])

  const loadAgencies = async (businessUnitId: string) => {
    if (!businessUnitId) return

    setIsLoading(true)
    try {
      const agenciesData = await getAllBankAgencies()
      console.log(businessUnitId)
      setAgencies(agenciesData)
    } catch (error) {
      console.error("Erro ao carregar agências:", error)
      customToast.error("Erro ao carregar agências")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBusinessUnitChange = (businessUnitId: string) => {
    const selectedUnit = businessUnits.find(unit => unit.id_pessoa?.toString() === businessUnitId)
    console.log('[CashAccountModal] Unidade selecionada:', {
      businessUnitId,
      selectedUnit,
      type: typeof businessUnitId
    })

    setFormState((prev) => ({ ...prev, businessUnitId, bankAgencyId: "" }))
    loadAgencies(businessUnitId)

    if (errors.businessUnitId) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.businessUnitId
        return newErrors
      })
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormState((prev) => {
      const newState = { ...prev, [field]: value }

      if (field === "value") {
        const numericValue = Number.parseFloat(value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0
        newState.currentBalance = numericValue + (prev.income || 0) - (prev.expense || 0)
      }

      return newState
    })

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const togglePaymentMethod = (paymentMethodId: string) => {
    setSelectedPaymentMethods((prev) => {
      if (prev.includes(paymentMethodId)) {
        return prev.filter((id) => id !== paymentMethodId)
      } else {
        return [...prev, paymentMethodId]
      }
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formState.code) {
      newErrors.code = "Código é obrigatório"
    }

    if (!formState.account || formState.account.length < 2) {
      newErrors.account = "Conta deve ter no mínimo 2 caracteres"
    }

    if (!formState.businessUnitId) {
      newErrors.businessUnitId = "Selecione a empresa"
    }

    if (!formState.accountingAccount) {
      newErrors.accountingAccount = "Selecione a conta contábil"
    }

    if (
      formState.bankAgencyId &&
      formState.bankAgencyId !== "none" &&
      !agencies.some((agency) => agency.id === formState.bankAgencyId)
    ) {
      newErrors.bankAgencyId = "Agência bancária inválida para o tenant atual"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const initialValue = Number.parseFloat(formState.value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0
      const currentBalance = initialValue + (formState.income || 0) - (formState.expense || 0)

      const accountData = {
        ...formState,
        paymentMethods: selectedPaymentMethods,
        currentBalance,
      }

      await onSave(accountData)
      onClose()
    } catch (error) {
      handleError(error, "salvar conta caixa")
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleCurrencyInput = (value: string) => {
    const formattedValue = applyCurrencyMask(value)
    handleInputChange("value", formattedValue)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 max-h-[90vh]">
        <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-blue-900 dark:text-blue-100">{title}</div>
              {account && <div className="text-sm font-normal text-blue-600 dark:text-blue-400">{account.account}</div>}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="code" className="text-blue-800 dark:text-blue-200">Código</Label>
                  <Input
                    disabled
                    id="code"
                    value={formState.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    className="bg-slate-100 dark:bg-slate-700"
                  />
                  {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="account" className="text-blue-800 dark:text-blue-200">Nome da Conta</Label>
                  <Input
                    id="account"
                    value={formState.account}
                    onChange={(e) => handleInputChange("account", e.target.value)}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500"
                    placeholder="Ex: Caixa Geral"
                  />
                  {errors.account && <p className="text-sm text-red-500">{errors.account}</p>}
                </div>
              </div>
            </div>

            {/* Card de Unidade e Agência */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Empresa e Agência
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="businessUnit" className="text-blue-800 dark:text-blue-200">Empresa</Label>
                  <Select value={formState.businessUnitId} onValueChange={handleBusinessUnitChange}>
                    <SelectTrigger id="businessUnit" className="border-blue-200 dark:border-blue-700 focus:ring-blue-500">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessUnits.map((unit) => (
                        <SelectItem key={unit.id || `unit-${Math.random()}`} value={unit.id_pessoa?.toString() || ""}>
                          {unit.apelido} ({unit.abreviatura})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.businessUnitId && <p className="text-sm text-red-500">{errors.businessUnitId}</p>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="bankAgency" className="text-blue-800 dark:text-blue-200">Agência Bancária</Label>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-3 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/50">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">Carregando...</span>
                    </div>
                  ) : (
                    <Select
                      value={formState.bankAgencyId}
                      onValueChange={(value) => handleInputChange("bankAgencyId", value)}
                      disabled={!formState.businessUnitId}
                    >
                      <SelectTrigger id="bankAgency" className="border-blue-200 dark:border-blue-700 focus:ring-blue-500">
                        <SelectValue placeholder="Selecione a agência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id || `agency-${Math.random()}`} value={agency.id || ""}>
                            {agency.agencyName} [{agency.agencyNumber}]
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.bankAgencyId && <p className="text-sm text-red-500">{errors.bankAgencyId}</p>}
                </div>
              </div>
            </div>

            {/* Card de Valores */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Valores e Data
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="startDate" className="text-blue-800 dark:text-blue-200">Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-blue-200 dark:border-blue-700",
                          !formState.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
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
                  <Label htmlFor="value" className="text-blue-800 dark:text-blue-200">Valor Inicial</Label>
                  <Input
                    id="value"
                    value={formState.value}
                    onChange={(e) => handleCurrencyInput(e.target.value)}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Informações de Saldo - Apenas para edição */}
              {account && (
                <div className="mt-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-950 p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Resumo Financeiro</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mb-1">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Entradas
                      </div>
                      <div className="text-green-600 dark:text-green-400 font-semibold text-sm">
                        {formatCurrency(formState.income || 0)}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mb-1">
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                        Saídas
                      </div>
                      <div className="text-red-600 dark:text-red-400 font-semibold text-sm">
                        {formatCurrency(formState.expense || 0)}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Saldo Atual</div>
                      <div
                        className={`font-semibold text-sm ${(formState.currentBalance || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {formatCurrency(formState.currentBalance || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card de Conta Contábil */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Contabilidade
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="accountingAccount" className="text-blue-800 dark:text-blue-200">Conta Contábil</Label>
                  <SearchableSelect
                    options={accountingAccounts.map((acc) => ({
                      value: acc.id || '',
                      label: acc.description || '',
                    }))}
                    value={formState.accountingAccount}
                    onValueChange={(value) => handleInputChange("accountingAccount", value)}
                    placeholder="Selecione a conta contábil"
                    searchPlaceholder="Pesquisar conta contábil..."
                    emptyMessage="Nenhuma conta contábil encontrada"
                  />
                  {errors.accountingAccount && <p className="text-sm text-red-500">{errors.accountingAccount}</p>}
                </div>

                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Switch
                    id="showInDashboard"
                    checked={formState.showInDashboard}
                    onCheckedChange={(checked) => handleInputChange("showInDashboard", checked)}
                  />
                  <Label htmlFor="showInDashboard" className="text-blue-800 dark:text-blue-200 cursor-pointer">
                    Mostrar no Dashboard
                  </Label>
                </div>
              </div>
            </div>

            {/* Card de Formas de Pagamento */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Formas de Pagamento
              </h3>
              <div className="border border-blue-200 dark:border-blue-700 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-blue-50 dark:bg-blue-950">
                    <TableRow>
                      <TableHead className="text-blue-900 dark:text-blue-100">Nome</TableHead>
                      <TableHead className="w-[100px] text-center text-blue-900 dark:text-blue-100">Disponível</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethods.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          <div className="text-blue-400 dark:text-blue-600">
                            <svg className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <p className="text-sm">Nenhuma forma de pagamento encontrada</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paymentMethods.map((method) => {
                        const isChecked = selectedPaymentMethods.includes(method.id || "")
                        return (
                          <TableRow key={method.id || `method-${Math.random()}`} className="hover:bg-blue-50 dark:hover:bg-blue-950">
                            <TableCell className="text-blue-900 dark:text-blue-100">{method.name}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Switch
                                  checked={isChecked}
                                  onCheckedChange={() => togglePaymentMethod(method.id || "")}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
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
            {account ? "Atualizar Conta" : "Criar Conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
