/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getAllCashAccounts } from "@/app/services/cash-account-service"
import { getAllTransactionTypes } from "@/app/services/transaction-type-service"
import { getAllPeople } from "@/app/services/person-service"
import { getClientBusinessUnits } from "@/app/services/client-business-unit-service"
import { TripleSelector } from "@/components/ui/triple-selector"
import type { Tipo8BusinessUnit, Cliente } from "@/services/business-unit-service"
import type { BusinessUnit } from "@/types/types"
import { getAllOperations } from "@/app/services/operation-service"
import type {
  TransactionFilter,
  CashAccount,
  TransactionType,
  Person,
  ClientBusinessUnit,
  Operation,
} from "@/types/types"

interface TransactionFiltersProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onFilter: (filter: TransactionFilter) => Promise<void>
    initialFilter: TransactionFilter
}

interface LancamentoFilterExtended {
  startDate: Date | null
  endDate: Date | null
  dateField: string
  searchField: string
  id_pessoa: string // Devedor/Credor
  id_un_negocio: string // Unidade de Negócio tipo 8
  cashAccountId: string
  transactionTypeId: string
  operationId: string
  type: "entrada" | "saida" | "todos" | undefined
}

// Função auxiliar para garantir que não haja valores vazios
const ensureNonEmptyValue = (value: string | undefined | null): string => {
  if (!value || value === "") {
    return "none"
  }
  return value
}

export function TransactionFilters({ open, onOpenChange, onFilter, initialFilter }: TransactionFiltersProps) {
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([])
  const [clients, setClients] = useState<Person[]>([])
  const [businessUnits, setBusinessUnits] = useState<ClientBusinessUnit[]>([])
  const [operations, setOperations] = useState<Operation[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>("none")
  
  // Estados para o TripleSelector
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState<string>("")
  const [selectedPersonId, setSelectedPersonId] = useState<string>("")
  const [selectedUnitId, setSelectedUnitId] = useState<string>("")

  // Inicializar filtro com valores seguros (nunca vazios)
  const defaultFilter: LancamentoFilterExtended = {
    startDate: null,
    endDate: null,
    dateField: "dueDate",
    searchField: "",
    id_pessoa: "none",
    id_un_negocio: "none",
    cashAccountId: "none",
    transactionTypeId: "none",
    operationId: "none",
    type: "todos"
  }

  const [filter, setFilter] = useState<LancamentoFilterExtended>(initialFilter as LancamentoFilterExtended || defaultFilter)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (initialFilter) {
      // Garantir que todos os valores de string nunca sejam vazios
      const safeFilter = {
        ...defaultFilter,
        ...initialFilter,
        id_pessoa: ensureNonEmptyValue((initialFilter as any).id_pessoa),
        id_un_negocio: ensureNonEmptyValue((initialFilter as any).id_un_negocio),
        cashAccountId: ensureNonEmptyValue(initialFilter.cashAccountId),
        transactionTypeId: ensureNonEmptyValue(initialFilter.transactionTypeId),
        operationId: ensureNonEmptyValue(initialFilter.operationId),
      }

      setFilter(safeFilter)
      
      // Configurar estados do TripleSelector (apenas Business Unit e Person)
      setSelectedBusinessUnitId((initialFilter as any).id_un_negocio || "")
      setSelectedPersonId((initialFilter as any).id_pessoa || "")
      // Não usar selectedUnitId no filtro
    }
  }, [initialFilter])

  const loadData = async () => {
    try {
      const [accountsData, typesData, clientsData, operationsData] = await Promise.all([
        getAllCashAccounts(),
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

      // Lógica removida - TripleSelector gerencia seus próprios dados
    } catch (error) {
      console.error("Error loading filter data:", error)
    }
  }

  const loadBusinessUnits = async (clientId: string) => {
    if (clientId === "none") return

    try {
      const data = await getClientBusinessUnits(clientId)
      setBusinessUnits(data)
    } catch (error) {
      console.error("Error loading business units:", error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    // Para campos de string, garantir que nunca sejam vazios
    if (typeof value === "string" && value === "") {
      value = "none"
    }

    setFilter((prev) => ({ ...prev, [field]: value }))
  }

  // Handlers para o TripleSelector
  const handleBusinessUnitChange = (businessUnitId: string, businessUnit: Tipo8BusinessUnit | null) => {
    console.log('🏢 Filtro - Unidade de negócio mudou:', businessUnitId, businessUnit)
    setSelectedBusinessUnitId(businessUnitId)
    setFilter(prev => ({
      ...prev,
      id_un_negocio: businessUnitId || "none",
      id_pessoa: "none" // Resetar pessoa quando muda unidade de negócio
    }))
  }
  
  const handlePersonChange = (personId: string, person: Cliente | null) => {
    console.log('👤 Filtro - Pessoa mudou:', personId, person)
    setSelectedPersonId(personId)
    setFilter(prev => ({
      ...prev,
      id_pessoa: personId || "none"
    }))
  }
  
  // Não precisamos de handleUnitChange para filtro
  const handleUnitChange = (unitId: string, unit: BusinessUnit | null) => {
    // No filtro, ignoramos a unidade específica
    console.log('🏢 Filtro - Unidade ignorada (não usado no filtro):', unitId, unit)
  }

  const handleApplyFilter = () => {
    // Converter para o formato esperado pela API
    const apiFilter: any = {
      ...filter,
      // Converter none para undefined/empty para a API
      id_pessoa: filter.id_pessoa === "none" ? undefined : filter.id_pessoa,
      id_un_negocio: filter.id_un_negocio === "none" ? undefined : filter.id_un_negocio,
      cashAccountId: filter.cashAccountId === "none" ? undefined : filter.cashAccountId,
      transactionTypeId: filter.transactionTypeId === "none" ? undefined : filter.transactionTypeId,
      operationId: filter.operationId === "none" ? undefined : filter.operationId,
    }
    
    console.log('🔍 Filtro aplicado:', apiFilter)
    onFilter(apiFilter)
    onOpenChange(false)
  }

  const handleClearFilter = () => {
    setFilter(defaultFilter)
    setSelectedBusinessUnitId("")
    setSelectedPersonId("")
    setSelectedUnitId("")
    onFilter(defaultFilter)
    onOpenChange(false)
  }

  // Opções para o campo de data
  const dateFieldOptions = [
    { value: "dueDate", label: "Data de Vencimento" },
    { value: "date", label: "Data de Emissão" },
    { value: "paymentDate", label: "Data de Pagamento" },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:max-w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros de Lançamentos</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
            {/* Campo de tipo de data */}
            <div className="space-y-2">
              <Label htmlFor="dateField">Filtrar por tipo de data:</Label>
              <Select value={filter.dateField} onValueChange={(value) => handleInputChange("dateField", value)}>
                <SelectTrigger id="dateField">
                  <SelectValue placeholder="Selecione o tipo de data" />
                </SelectTrigger>
                <SelectContent>
                  {dateFieldOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">De:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filter.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filter.startDate ? format(filter.startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filter.startDate as Date}
                    onSelect={(date) => handleInputChange("startDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Até:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filter.endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filter.endDate ? format(filter.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filter.endDate as Date}
                    onSelect={(date) => handleInputChange("endDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashAccountId">Conta Caixa:</Label>
              <Select value={filter.cashAccountId} onValueChange={(value) => handleInputChange("cashAccountId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as contas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas as contas</SelectItem>
                  {cashAccounts.map((account) => {
                    // Criar um ID seguro que nunca será vazio
                    const safeId = account.id ? account.id : `account_${Math.random().toString(36).substring(2, 9)}`
                    return (
                      <SelectItem key={safeId} value={safeId}>
                        {account.account}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionTypeId">Natureza:</Label>
              <Select
                value={filter.transactionTypeId}
                onValueChange={(value) => handleInputChange("transactionTypeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as naturezas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas as naturezas</SelectItem>
                  {transactionTypes.map((type) => {
                    // Criar um ID seguro que nunca será vazio
                    const safeId = type.id ? type.id : `type_${Math.random().toString(36).substring(2, 9)}`
                    return (
                      <SelectItem key={safeId} value={safeId}>
                        {type.type === "entrada" ? "(+) " : "(-) "}
                        {type.description}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo:</Label>
              <Select value={filter.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seleção usando TripleSelector */}
            <div className="space-y-2">
              <Label>Unidade de Negócio, Devedor/Credor e Unidade:</Label>
              <div className="border rounded-md p-3">
                <div className="grid grid-cols-1 gap-3">
                  {/* Apenas Unidade de Negócio e Pessoa para filtro */}
                  <TripleSelector
                    selectedBusinessUnitId={selectedBusinessUnitId}
                    selectedPersonId={selectedPersonId}
                    selectedUnitId="" // Não usado no filtro
                    onBusinessUnitChange={handleBusinessUnitChange}
                    onPersonChange={handlePersonChange}
                    onUnitChange={handleUnitChange}
                    required={false}
                    personLabel="Devedor/Credor"
                    label=""
                    showFullInfo={false}
                    vertical={true}
                    disabled={false}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Para filtros, selecione apenas Unidade de Negócio e Devedor/Credor
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operationId">Operação:</Label>
              <Select value={filter.operationId} onValueChange={(value) => handleInputChange("operationId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as operações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas as operações</SelectItem>
                  {operations.map((operation) => {
                    // Criar um ID seguro que nunca será vazio
                    const safeId = operation.id
                      ? operation.id
                      : `operation_${Math.random().toString(36).substring(2, 9)}`
                    return (
                      <SelectItem key={safeId} value={safeId}>
                        {operation.operationLabel || `${operation.shipName || operation.code} - ${operation.voyage}`}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchField">Pesquisar por:</Label>
              <Input
                id="searchField"
                value={filter.searchField}
                onChange={(e) => handleInputChange("searchField", e.target.value)}
                placeholder="Código, descrição, documento..."
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={handleClearFilter} className="flex items-center">
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button onClick={handleApplyFilter}>Aplicar Filtros</Button>
            </div>
          </div>
      </SheetContent>
    </Sheet>
  )
}
