/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Loader2, CalendarIcon, ArrowUpCircle, ArrowDownCircle, RepeatIcon } from "lucide-react"
import { createFinancialTransaction, updateFinancialTransaction } from "@/app/services/financial-transaction-service"
import { getActiveCashAccounts } from "@/app/services/cash-account-api-service"
import { getAllTransactionTypes } from "@/app/services/transaction-type-service"
import { getAllPeople } from "@/app/services/person-service"
import { getClientBusinessUnits } from "@/app/services/client-business-unit-service"
import { getAllOperations } from "@/app/services/operation-service"
import type {
  FinancialTransaction,
  CashAccount,
  TransactionType,
  Person,
  ClientBusinessUnit,
  Operation,
} from "@/types/types"
import customToast from "@/components/ui/custom-toast"
import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RecurringTransactionModal } from "@/components/recurring-transaction-modal"
import { CurrencyInput } from "@/components/currency-input"

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data?: any) => void
  loading: boolean
  transaction?: FinancialTransaction
  operationId?: string
  businessUnitId?: string
  clientId?: string
}

export function TransactionForm({
  open,
  onOpenChange,
  onSave,
  loading: externalLoading,
  transaction,
  operationId,
  businessUnitId,
  clientId,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([])
  const [filteredTransactionTypes, setFilteredTransactionTypes] = useState<TransactionType[]>([])
  const [clients, setClients] = useState<Person[]>([])
  const [businessUnits, setBusinessUnits] = useState<ClientBusinessUnit[]>([])
  const [operations, setOperations] = useState<Operation[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false)
  const [formState, setFormState] = useState<Partial<FinancialTransaction>>({
    code: "",
    date: new Date(),
    dueDate: new Date(),
    description: "",
    value: 0,
    type: "entrada",
    transactionTypeId: "",
    transactionTypeName: "",
    cashAccountId: "",
    cashAccountName: "",
    clientId: "",
    clientName: "",
    businessUnitId: "",
    businessUnitName: "",
    operationId: "",
    operationCode: "",
    document: "",
    status: "pendente",
  })

  // Improved date validation and normalization
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

      // Try DD/MM/YYYY format
      try {
        const parsedDate = parse(dateInput, "dd/MM/yyyy", new Date())
        if (isValid(parsedDate) && parsedDate.getFullYear() > 2000) {
          return parsedDate
        }
      } catch (e) {
        console.error("Error parsing date:", e)
      }
    }

    // Default to current date if all else fails
    return new Date()
  }

  // Gerar código de competência (YYYYMM) a partir da data
  const generateCompetenceCode = (date: Date): string => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() retorna 0-11
    return `${year}${month.toString().padStart(2, "0")}`
  }

  // Filter transaction types based on selected type (entrada/saida)
  useEffect(() => {
    if (transactionTypes.length > 0) {
      const filtered = transactionTypes.filter((type) => type.type === formState.type)
      setFilteredTransactionTypes(filtered)

      // Clear selected transaction type if it doesn't match the current type filter
      if (formState.transactionTypeId) {
        const currentType = transactionTypes.find((t) => t.id === formState.transactionTypeId)
        if (currentType && currentType.type !== formState.type) {
          setFormState((prev) => ({
            ...prev,
            transactionTypeId: "",
            transactionTypeName: "",
          }))
        }
      }
    }
  }, [formState.type, transactionTypes, formState.transactionTypeId])

  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setLoading(true)
        try {
          // Carregar todos os dados necessários
          const [accountsData, typesData, clientsData, operationsData] = await Promise.all([
            getActiveCashAccounts(),
            getAllTransactionTypes(),
            getAllPeople(),
            getAllOperations(),
          ])

          setCashAccounts(accountsData)
          setTransactionTypes(typesData)

          // Filtrar apenas clientes e fornecedores
          const filteredClients = clientsData.filter(
            (person) => person.registrationType === "Cliente" || person.registrationType === "Fornecedor",
          )
          setClients(filteredClients)
          setOperations(operationsData)

          // Configurar o estado do formulário
          if (transaction) {
            // Normalize dates
            const normalizedDate = normalizeDate(transaction.date)
            const normalizedDueDate = normalizeDate(transaction.dueDate)

            setFormState({
              ...transaction,
              date: normalizedDate,
              dueDate: normalizedDueDate,
            })

            if (transaction.clientId) {
              setSelectedClientId(transaction.clientId)
              const businessUnitsData = await getClientBusinessUnits(transaction.clientId)
              setBusinessUnits(businessUnitsData)
            }
          } else {
            // Gerar código automático para novo lançamento
            const randomCode = `LANC${Math.floor(Math.random() * 10000)
              .toString()
              .padStart(4, "0")}`

            const initialState: Partial<FinancialTransaction> = {
              code: randomCode,
              date: new Date(),
              dueDate: new Date(),
              description: "",
              value: 0,
              type: "entrada",
              transactionTypeId: "",
              transactionTypeName: "",
              cashAccountId: "",
              cashAccountName: "",
              clientId: "",
              clientName: "",
              businessUnitId: "",
              businessUnitName: "",
              operationId: "",
              operationCode: "",
              document: "",
              status: "pendente",
            }

            // Se tiver operationId, preencher dados da operação
            if (operationId) {
              const operation = operationsData.find((op) => op.id === operationId)
              if (operation) {
                initialState.operationId = operationId
                initialState.operationCode = operation.code
                initialState.description = `Lançamento referente à operação ${operation.code}`

                if (operation.clientId) {
                  initialState.clientId = operation.clientId
                  initialState.clientName = operation.clientName
                  setSelectedClientId(operation.clientId)

                  const businessUnitsData = await getClientBusinessUnits(operation.clientId)
                  setBusinessUnits(businessUnitsData)

                  if (operation.businessUnitId) {
                    initialState.businessUnitId = operation.businessUnitId
                    initialState.businessUnitName = operation.businessUnitName
                  }
                }
              }
            } else if (clientId) {
              // Se tiver clientId, preencher dados do cliente
              initialState.clientId = clientId
              const client = clientsData.find((c) => c.id === clientId)
              if (client) {
                initialState.clientName = client.name
                setSelectedClientId(clientId)

                const businessUnitsData = await getClientBusinessUnits(clientId)
                setBusinessUnits(businessUnitsData)

                // Se também tiver businessUnitId
                if (businessUnitId) {
                  initialState.businessUnitId = businessUnitId
                  const businessUnit = businessUnitsData.find((unit) => unit.id === businessUnitId)
                  if (businessUnit) {
                    initialState.businessUnitName = businessUnit.name
                  }
                }
              }
            } else if (businessUnitId) {
              // Se só tiver businessUnitId (caso raro)
              initialState.businessUnitId = businessUnitId
            }

            setFormState(initialState)
          }

          // Inicializar os tipos de transação filtrados
          if (typesData.length > 0) {
            const initialType = transaction?.type || "entrada"
            setFilteredTransactionTypes(typesData.filter((type) => type.type === initialType))
          }
        } catch (error) {
          console.error("Error loading form data:", error)
          customToast.error("Erro ao carregar dados do formulário")
        } finally {
          setLoading(false)
        }
      }

      loadData()
    }
  }, [open, transaction, operationId, businessUnitId, clientId])

  const loadBusinessUnits = async (clientId: string) => {
    try {
      const data = await getClientBusinessUnits(clientId)
      setBusinessUnits(data)
      // Auto-selecionar quando houver apenas uma unidade de negócio
      if (data.length === 1) {
        setFormState(prev => ({
          ...prev,
          businessUnitId: data[0].id,
          businessUnitName: data[0].name,
        }))
      }
    } catch (error) {
      console.error("Error loading business units:", error)
      customToast.error("Erro ao carregar unidades de negócio")
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleTransactionTypeChange = (type: "entrada" | "saida") => {
    setFormState((prev) => ({
      ...prev,
      type,
      transactionTypeId: "",
      transactionTypeName: "",
    }))
  }

  const handleCashAccountChange = (accountId: string) => {
    const selectedAccount = cashAccounts.find((account) => account.id === accountId)
    if (selectedAccount) {
      setFormState((prev) => ({
        ...prev,
        cashAccountId: accountId,
        cashAccountName: selectedAccount.account,
      }))
    }
  }

  const handleNatureChange = (typeId: string) => {
    const selectedType = transactionTypes.find((type) => type.id === typeId)
    if (selectedType) {
      setFormState((prev) => ({
        ...prev,
        transactionTypeId: typeId,
        transactionTypeName: selectedType.description,
      }))
    }
  }

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find((client) => client.id === clientId)
    if (selectedClient) {
      setFormState((prev) => ({
        ...prev,
        clientId,
        clientName: selectedClient.name,
        businessUnitId: "",
        businessUnitName: "",
      }))
      setSelectedClientId(clientId)
      loadBusinessUnits(clientId)
    }
  }

  const handleBusinessUnitChange = (businessUnitId: string) => {
    const selectedUnit = businessUnits.find((unit) => unit.id === businessUnitId)
    if (selectedUnit) {
      setFormState((prev) => ({
        ...prev,
        businessUnitId,
        businessUnitName: selectedUnit.name,
      }))
    }
  }

  const handleOperationChange = (operationId: string) => {
    const selectedOperation = operations.find((op) => op.id === operationId)
    if (selectedOperation) {
      setFormState((prev) => ({
        ...prev,
        operationId,
        operationCode: selectedOperation.code,
      }))
    }
  }

  const handleOpenRecurrenceModal = () => {
    setIsRecurrenceModalOpen(true)
  }

  // Modificar a função handleSave para melhorar a validação e mostrar exatamente quais campos estão faltando
  const handleSave = async () => {
    // Criar uma lista de campos obrigatórios faltantes
    const missingFields = []

    if (!formState.description || formState.description.trim() === "") {
      missingFields.push("Descrição")
    }

    if (!formState.value || formState.value <= 0) {
      missingFields.push("Valor")
    }

    if (!formState.transactionTypeId) {
      missingFields.push("Tipo do Lançamento")
    }

    if (!formState.cashAccountId) {
      missingFields.push("Conta Caixa")
    }

    // Se houver campos faltantes, mostrar mensagem específica
    if (missingFields.length > 0) {
      customToast.error(`Preencha os campos obrigatórios: ${missingFields.join(", ")}`)
      return
    }

    // Ensure dates are valid before saving
    const normalizedDate = normalizeDate(formState.date)
    const normalizedDueDate = normalizeDate(formState.dueDate)

    // Gerar competência automaticamente baseada na data de emissão
    const competence = generateCompetenceCode(normalizedDate)

    // Adicionar logs para debug
    console.log("Dados do lançamento a ser salvo:", {
      ...formState,
      date: normalizedDate,
      dueDate: normalizedDueDate,
      competence,
    })

    const dataToSave = {
      ...formState,
      date: normalizedDate,
      dueDate: normalizedDueDate,
      competence, // Adicionar competência gerada automaticamente
    }

    setLoading(true)
    try {
      if (transaction?.id) {
        // Atualizar transação existente - apenas datas podem ser editadas
        const updateData = {
          date: dataToSave.date,
          dueDate: dataToSave.dueDate,
          competence: dataToSave.competence,
        }
        await updateFinancialTransaction(transaction.id, updateData)
        customToast.success("Lançamento atualizado com sucesso!")
      } else {
        // Criar nova transação (sempre simples, sem recorrência)
        await createFinancialTransaction(dataToSave as Omit<FinancialTransaction, "id">)
        customToast.success("Lançamento cadastrado com sucesso!")
      }
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving financial transaction:", error)
      customToast.error(`Erro ao salvar lançamento: ${error instanceof Error ? error.message : "Erro desconhecido"}`, {
        position: "bottom-right",
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormLoading = loading || externalLoading
  const isPaid = transaction?.status === "baixado"
  const isEditing = !!transaction?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-600">
            {transaction ? "Editar Lançamento" : "Criar Lançamento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Você só pode editar as datas de emissão e vencimento."
              : "Preencha os dados do lançamento. Campos marcados com * são obrigatórios."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formState.code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                disabled
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="document">Documento</Label>
              <Input
                id="document"
                value={formState.document}
                onChange={(e) => handleInputChange("document", e.target.value)}
                placeholder="Número do documento/nota"
                disabled={isPaid || isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="date">Data de Emissão *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formState.date && "text-muted-foreground",
                    )}
                    disabled={isPaid}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.date
                      ? format(normalizeDate(formState.date), "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={normalizeDate(formState.date)}
                    onSelect={(date) => handleInputChange("date", date || new Date())}
                    initialFocus
                    disabled={isPaid}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formState.dueDate && "text-muted-foreground",
                    )}
                    disabled={isPaid}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.dueDate
                      ? format(normalizeDate(formState.dueDate), "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={normalizeDate(formState.dueDate)}
                    onSelect={(date) => handleInputChange("dueDate", date || new Date())}
                    initialFocus
                    disabled={isPaid}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label>Natureza</Label>
            <RadioGroup
              value={formState.type}
              onValueChange={(value) => handleTransactionTypeChange(value as "entrada" | "saida")}
              className="flex space-x-4"
              disabled={isPaid || isEditing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="entrada" id="entrada" disabled={isPaid || isEditing} />
                <Label htmlFor="entrada" className="flex items-center cursor-pointer">
                  <ArrowUpCircle className="h-4 w-4 mr-1 text-green-600" />
                  <span>Entrada</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="saida" id="saida" disabled={isPaid || isEditing} />
                <Label htmlFor="saida" className="flex items-center cursor-pointer">
                  <ArrowDownCircle className="h-4 w-4 mr-1 text-red-600" />
                  <span>Saída</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="transactionType">Tipo do Lançamento *</Label>
              <SearchableSelect
                options={filteredTransactionTypes.map((type) => ({
                  value: type.id || "",
                  label: type.description,
                }))}
                value={formState.transactionTypeId || ""}
                onValueChange={handleNatureChange}
                placeholder="Selecione o tipo do lançamento"
                searchPlaceholder="Pesquisar tipo..."
                emptyMessage="Nenhum tipo encontrado"
                disabled={isPaid || isEditing}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="cashAccount">Conta Caixa *</Label>
              <SearchableSelect
                options={cashAccounts.map((account) => ({
                  value: account.id || "",
                  label: account.account,
                }))}
                value={formState.cashAccountId || ""}
                onValueChange={handleCashAccountChange}
                placeholder="Selecione a conta"
                searchPlaceholder="Pesquisar conta caixa..."
                emptyMessage="Nenhuma conta encontrada"
                disabled={isPaid || isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="client">Cliente/Fornecedor</Label>
              <SearchableSelect
                options={clients.map((client) => ({
                  value: client.id || "",
                  label: client.name,
                }))}
                value={formState.clientId || ""}
                onValueChange={handleClientChange}
                placeholder="Selecione o cliente"
                searchPlaceholder="Pesquisar cliente/fornecedor..."
                emptyMessage="Nenhum cliente encontrado"
                disabled={isPaid || isEditing}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="businessUnit">Unidade de Negócio</Label>
              <SearchableSelect
                options={businessUnits.map((unit) => ({
                  value: unit.id || "",
                  label: unit.name,
                }))}
                value={formState.businessUnitId || ""}
                onValueChange={handleBusinessUnitChange}
                placeholder={selectedClientId ? "Selecione a unidade" : "Selecione um cliente primeiro"}
                searchPlaceholder="Pesquisar unidade de negócio..."
                emptyMessage="Nenhuma unidade encontrada"
                disabled={!selectedClientId || isPaid || isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="operation">Operação</Label>
              <SearchableSelect
                options={operations.map((operation) => ({
                  value: operation.id || "",
                  label: operation.operationLabel || `${operation.shipName || operation.code} - ${operation.voyage}`,
                }))}
                value={formState.operationId || ""}
                onValueChange={handleOperationChange}
                placeholder="Selecione a operação (opcional)"
                searchPlaceholder="Pesquisar operação..."
                emptyMessage="Nenhuma operação encontrada"
                disabled={isPaid || isEditing}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="value">Valor *</Label>
              <CurrencyInput
                id="value"
                value={formState.value || 0}
                onValueChange={(value) => handleInputChange("value", value)}
                className={
                  formState.type === "entrada"
                    ? "border-green-500 focus:ring-green-500"
                    : "border-red-500 focus:ring-red-500"
                }
                disabled={isPaid || isEditing}
              />
            </div>
          </div>

          {!transaction && (
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={formState.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              disabled={isPaid || isEditing}
            />
          </div>

          {/* Informações adicionais para lançamentos pagos */}
          {isPaid && transaction?.paymentDate && (
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
              <h3 className="text-sm font-medium text-green-800 mb-2">Informações de Pagamento</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-green-700">Data de Pagamento:</span>
                  <p className="font-medium">
                    {format(new Date(transaction.paymentDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <span className="text-green-700">Valor Pago:</span>
                  <p className="font-medium">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      transaction.paidValue || transaction.value,
                    )}
                  </p>
                </div>
                {transaction.paidValue !== undefined && transaction.paidValue < transaction.value && (
                  <div className="col-span-2">
                    <span className="text-amber-600 font-medium">
                      Este lançamento foi baixado com desconto de{" "}
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        transaction.value - transaction.paidValue,
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenRecurrenceModal}
              disabled={isFormLoading || isPaid}
              className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <RepeatIcon className="h-4 w-4" />
              Configurar Recorrência
            </Button>
          </div>
          <Button
            onClick={handleSave}
            disabled={isFormLoading || isPaid}
            className={formState.type === "entrada" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {isFormLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Salvar Lançamento Simples"}
          </Button>
        </DialogFooter>

        <RecurringTransactionModal
          isOpen={isRecurrenceModalOpen}
          onClose={() => setIsRecurrenceModalOpen(false)}
          transaction={formState}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  )
}
