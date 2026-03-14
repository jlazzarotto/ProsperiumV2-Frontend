/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client"

import { AlertDialogCancel } from "@/components/ui/alert-dialog"
import { AlertDialogFooter } from "@/components/ui/alert-dialog"
import { AlertDialogHeader } from "@/components/ui/alert-dialog"
import { AlertDialogContent as AlertDialogContentComponent } from "@/components/ui/alert-dialog"
import {
  AlertDialog,
  AlertDialogTitle as AlertDialogTitleAlias,
  AlertDialogDescription as AlertDialogDescriptionAlias,
  AlertDialogAction as AlertDialogActionAlias,
} from "@/components/ui/alert-dialog"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Loader2,
  Plus,
  Search,
  XCircle,
  Pencil,
  Trash2,
  FileText,
  CheckCircle,
  CircleXIcon as XCircle2,
  RefreshCw,
  Download,
  Printer,
  FileUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Wallet,
  CalendarIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  X,
  RepeatIcon,
  Clock,
  CalendarIcon as CalendarIconSolid,
  CreditCard,
  BarChart4,
  ListFilter,
  Sparkles,
} from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SimpleCalendar } from "@/components/simple-calendar"
import { format, isValid, parseISO, subDays, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { formatCurrency, getTypeColor } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Add these imports at the top of the file
import { FilterDateField } from "@/components/filter-date-field"
import { TransactionTypeSelector } from "@/components/transaction-type-selector"

// Importação dos serviços
import {
  getFilteredFinancialTransactions,
  deleteFinancialTransaction,
  getRelatedRecurringTransactions,
  getFinancialTransactionsWithPagination,
  getRecurrenceSeries,
} from "@/app/services/financial-transaction-service"
import { getAllCashAccounts } from "@/app/services/cash-account-service"
import { getAllTransactionTypes } from "@/app/services/transaction-type-service"
import { getAllPeople } from "@/app/services/person-service"
import { getClientBusinessUnits } from "@/app/services/client-business-unit-service"
import { getAllOperations } from "@/app/services/operation-service"

// Importação dos componentes de formulário
import { TransactionForm } from "@/components/transaction-form"
import { PaymentModal } from "@/components/payment-modal"
import { CancelPaymentModal } from "@/components/cancel-payment-modal"
import { TransactionDetailsModal } from "@/components/transaction-details-modal"
import { DeleteTransactionModal } from "@/components/delete-transaction-modal"
import customToast from "@/components/ui/custom-toast"
// Adicionar a importação do componente RecurringTransactionModal
import { RecurringTransactionModal } from "@/components/recurring-transaction-modal"
import { RecurrenceBadge } from "@/components/recurrence-badge"

// Importação dos tipos
import type {
  FinancialTransaction,
  TransactionFilter,
  DocumentSnapshot,
  CashAccount,
  TransactionType,
  Person,
  ClientBusinessUnit,
  Operation,
  RecurrenceSeries,
} from "@/types/types"

// Função para formatar datas corretamente
const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return "-"

  try {
    let date: Date

    // Handle Firestore Timestamp objects
    if (typeof dateString === "object" && dateString !== null && "seconds" in dateString) {
      // @ts-ignore - Firestore timestamp object
      date = new Date(dateString.seconds * 1000)
    } else if (dateString instanceof Date) {
      date = dateString
    } else if (typeof dateString === "string") {
      // Tentar converter string para data
      date = parseISO(dateString)
    } else {
      return "-"
    }

    // Check if date is valid
    if (!isValid(date)) {
      return "-"
    }

    // Formatar no padrão brasileiro: dd/MM/yyyy
    return format(date, "dd/MM/yyyy", { locale: ptBR })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "-"
  }
}

// Função para gerar código de competência (YYYYMM) a partir da data
const generateCompetenceCode = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return "-"

  try {
    let date: Date

    // Handle Firestore Timestamp objects
    if (typeof dateString === "object" && dateString !== null && "seconds" in dateString) {
      // @ts-ignore - Firestore timestamp object
      date = new Date(dateString.seconds * 1000)
    } else if (dateString instanceof Date) {
      date = dateString
    } else if (typeof dateString === "string") {
      // Tentar converter string para data
      date = parseISO(dateString)
    } else {
      return "-"
    }

    // Check if date is valid
    if (!isValid(date)) {
      return "-"
    }

    // Formatar como YYYYMM
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() retorna 0-11
    return `${year}${month.toString().padStart(2, "0")}`
  } catch (error) {
    console.error("Error generating competence code:", error)
    return "-"
  }
}

// Filtros rápidos predefinidos
const quickFilters = [
  { id: "all", label: "Todos", icon: <ListFilter className="h-3 w-3 mr-1" /> },
  { id: "pending", label: "Em aberto", icon: <Clock className="h-3 w-3 mr-1" /> },
  { id: "paid", label: "Pagos", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  { id: "today", label: "Vence hoje", icon: <CalendarIconSolid className="h-3 w-3 mr-1" /> },
  { id: "thisWeek", label: "Esta semana", icon: <CalendarIconSolid className="h-3 w-3 mr-1" /> },
  { id: "thisMonth", label: "Este mês", icon: <CalendarIconSolid className="h-3 w-3 mr-1" /> },
  { id: "overdue", label: "Atrasados", icon: <XCircle2 className="h-3 w-3 mr-1" /> },
]

// Opções de campo de data para filtro
const dateFieldOptions = [
  { value: "dueDate", label: "Data de Vencimento", icon: <CalendarIconSolid className="h-4 w-4 mr-2" /> },
  { value: "date", label: "Data de Emissão", icon: <Clock className="h-4 w-4 mr-2" /> },
  { value: "paymentDate", label: "Data de Pagamento", icon: <CreditCard className="h-4 w-4 mr-2" /> },
]

export function FinancialReportPage() {
  // 9. Inicializar os estados com "none" em vez de strings vazias
  const [clientId, setClientId] = useState<string>("none")
  const [businessUnitId, setBusinessUnitId] = useState<string>("none")
  const [cashAccountId, setCashAccountId] = useState<string>("none")
  const [transactionTypeId, setTransactionTypeId] = useState<string>("none")
  const [operationId, setOperationId] = useState<string>("none")
  const [selectedRecurrenceSeries, setSelectedRecurrenceSeries] = useState<string>("none")

  // Estados para dados
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([])
  const [clients, setClients] = useState<Person[]>([])
  const [businessUnits, setBusinessUnits] = useState<ClientBusinessUnit[]>([])
  const [operations, setOperations] = useState<Operation[]>([])
  const [relatedTransactions, setRelatedTransactions] = useState<FinancialTransaction[]>([])
  const [recurrenceSeries, setRecurrenceSeries] = useState<RecurrenceSeries[]>([])

  // Estados para UI
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [lastDoc, setLastDoc] = useState<number>(0)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("dueDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Estados para modais e painéis
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isAccountsOpen, setIsAccountsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCancelPaymentModalOpen, setIsCancelPaymentModalOpen] = useState(false)
  const [isTransactionDetailsModalOpen, setIsTransactionDetailsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleteManyDialogOpen, setIsDeleteManyDialogOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("Novo Lançamento")
  const [currentTransaction, setCurrentTransaction] = useState<FinancialTransaction | undefined>(undefined)
  // Adicionar o estado e o modal de recorrência
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)

  // Estados para filtros
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [dateField, setDateField] = useState<string>("dueDate")
  const [transactionType, setTransactionType] = useState<"entrada" | "saida" | "todos">("todos")
  const [status, setStatus] = useState<"pendente" | "baixado" | "cancelado" | "todos">("todos")
  const [competence, setCompetence] = useState<string>("")
  const [currentFilter, setCurrentFilter] = useState<TransactionFilter>({})

  // Estados para valores calculados
  const [totalBalance, setTotalBalance] = useState<number>(0)
  const [subtotalInView, setSubtotalInView] = useState<number>(0)
  const [totalEntradas, setTotalEntradas] = useState<number>(0)
  const [totalSaidas, setTotalSaidas] = useState<number>(0)

  // Calcular o saldo total das contas
  const calculateTotalAccountsBalance = useMemo(() => {
    return cashAccounts.reduce((total, account) => total + (account.currentBalance || 0), 0)
  }, [cashAccounts])

  // Buscar séries de recorrência
  const fetchRecurrenceSeries = async () => {
    try {
      const series = await getRecurrenceSeries()
      setRecurrenceSeries(series)
    } catch (err) {
      console.error("Erro ao carregar séries de recorrência:", err)
    }
  }

  // Buscar transações com paginação
  const fetchTransactions = async (newPage = 1, newPageSize = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      // Adicionar filtro de série de recorrência se selecionado
      const filter = { ...currentFilter }
      if (selectedRecurrenceSeries && selectedRecurrenceSeries !== "none") {
        filter.recurrenceSeriesId = selectedRecurrenceSeries
      }

      // Usar a função de paginação do servidor
      const result = await getFinancialTransactionsWithPagination(newPageSize, newPage === 1 ? 0 : lastDoc, filter)

      setTransactions(result.transactions)
      setLastDoc(result.lastIndex)
      setTotalCount(result.totalCount)

      // Calcular subtotais
      const entradas = result.transactions
        .filter((t) => t.type === "entrada" && t.status !== "cancelado")
        .reduce((sum, t) => sum + t.value, 0)

      const saidas = result.transactions
        .filter((t) => t.type === "saida" && t.status !== "cancelado")
        .reduce((sum, t) => sum + t.value, 0)

      setTotalEntradas(entradas)
      setTotalSaidas(saidas)
      setSubtotalInView(entradas - saidas)

      setCurrentPage(newPage)
      setPageSize(newPageSize)
      setSelectedTransactions([]) // Limpar seleções ao carregar novos dados
      setSelectAll(false)
    } catch (err) {
      console.error("Erro ao carregar lançamentos:", err)
      setError("Não foi possível carregar os lançamentos. Tente novamente.")
      customToast.error("Erro ao carregar lançamentos")
    } finally {
      setLoading(false)
    }
  }

  // Buscar contas bancárias
  const fetchCashAccounts = async () => {
    try {
      const accounts = await getAllCashAccounts()
      setCashAccounts(accounts)
    } catch (err) {
      console.error("Erro ao carregar contas caixa:", err)
      customToast.error("Erro ao carregar contas caixa")
    }
  }

  // Buscar dados para filtros
  const fetchFilterData = async () => {
    try {
      const [typesData, clientsData, operationsData] = await Promise.all([
        getAllTransactionTypes(),
        getAllPeople(),
        getAllOperations(),
      ])

      setTransactionTypes(typesData)

      // Filtrar apenas clientes e fornecedores
      const filteredClients = clientsData.filter(
        (person) => person.registrationType === "Cliente" || person.registrationType === "Fornecedor",
      )
      setClients(filteredClients)
      setOperations(operationsData)
    } catch (err) {
      console.error("Erro ao carregar dados para filtros:", err)
      customToast.error("Erro ao carregar dados para filtros")
    }
  }

  // Carregar unidades de negócio quando o cliente muda
  const loadBusinessUnits = async (clientId: string) => {
    if (!clientId) {
      setBusinessUnits([])
      setBusinessUnitId("none")
      return
    }

    try {
      const data = await getClientBusinessUnits(clientId)
      setBusinessUnits(data)
    } catch (error) {
      console.error("Error loading business units:", error)
      customToast.error("Erro ao carregar unidades de negócio")
    }
  }

  // Atualizar dados
  const refreshData = async () => {
    await fetchTransactions(1)
    await fetchCashAccounts()
  }

  // Efeitos para carregar dados iniciais
  useEffect(() => {
    fetchTransactions()
    fetchCashAccounts()
    fetchFilterData()
    fetchRecurrenceSeries()
    // Removido o intervalo de atualização automática
  }, [])

  // Efeito para carregar unidades de negócio quando o cliente muda
  useEffect(() => {
    loadBusinessUnits(clientId)
  }, [clientId])

  // Efeito para recarregar quando a série de recorrência muda
  useEffect(() => {
    if (selectedRecurrenceSeries !== undefined) {
      fetchTransactions(1)
    }
  }, [selectedRecurrenceSeries])

  // Aplicar filtro rápido
  const applyQuickFilter = async (filterId: string) => {
    setActiveQuickFilter(filterId)
    setLoading(true)

    try {
      const today = new Date()
      let filter: TransactionFilter = {}

      switch (filterId) {
        case "pending":
          filter = { status: "pendente" }
          break
        case "paid":
          filter = { status: "baixado" }
          break
        case "today":
          filter = {
            startDate: today,
            endDate: today,
            status: "pendente",
          }
          break
        case "thisWeek":
          filter = {
            startDate: today,
            endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
            status: "pendente",
          }
          break
        case "thisMonth":
          filter = {
            startDate: startOfMonth(today),
            endDate: endOfMonth(today),
            status: "pendente",
          }
          break
        case "overdue":
          filter = {
            endDate: subDays(today, 1),
            status: "pendente",
          }
          break
        default:
          filter = {}
      }

      setCurrentFilter(filter)
      const results = await getFilteredFinancialTransactions(filter)
      setTransactions(results)

      // Recalcular subtotais
      const entradas = results
        .filter((t) => t.type === "entrada" && t.status !== "cancelado")
        .reduce((sum, t) => sum + t.value, 0)

      const saidas = results
        .filter((t) => t.type === "saida" && t.status !== "cancelado")
        .reduce((sum, t) => sum + t.value, 0)

      setTotalEntradas(entradas)
      setTotalSaidas(saidas)
      setSubtotalInView(entradas - saidas)
    } catch (err) {
      console.error("Erro ao aplicar filtro rápido:", err)
      customToast.error("Erro ao filtrar lançamentos")
    } finally {
      setLoading(false)
    }
  }

  // Ordenar transações
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Inverter direção se o campo já está selecionado
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Novo campo, começar com ascendente
      setSortField(field)
      setSortDirection("asc")
    }

    // Ordenar localmente
    const sortedTransactions = [...transactions].sort((a, b) => {
      let valueA: any = a[field as keyof FinancialTransaction]
      let valueB: any = b[field as keyof FinancialTransaction]

      // Tratamento especial para datas
      if (field === "dueDate" || field === "paymentDate" || field === "date") {
        valueA = valueA ? new Date(valueA).getTime() : 0
        valueB = valueB ? new Date(valueB).getTime() : 0
      }

      // Comparação
      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    setTransactions(sortedTransactions)
  }

  // Pesquisar transações
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await fetchTransactions()
      return
    }

    setIsSearching(true)
    try {
      const filter: TransactionFilter = {
        ...currentFilter,
        searchField: searchTerm,
      }
      const results = await getFilteredFinancialTransactions(filter)
      setTransactions(results)

      // Recalcular subtotais
      const entradas = results
        .filter((t) => t.type === "entrada" && t.status !== "cancelado")
        .reduce((sum, t) => sum + t.value, 0)

      const saidas = results
        .filter((t) => t.type === "saida" && t.status !== "cancelado")
        .reduce((sum, t) => sum + t.value, 0)

      setTotalEntradas(entradas)
      setTotalSaidas(saidas)
      setSubtotalInView(entradas - saidas)
    } catch (err) {
      console.error("Erro na pesquisa:", err)
      customToast.error("Erro ao pesquisar lançamentos")
    } finally {
      setIsSearching(false)
    }
  }

  // Limpar pesquisa
  const clearSearch = async () => {
    setSearchTerm("")
    await fetchTransactions()
  }

  // Aplicar filtros avançados
  const handleApplyFilters = async () => {
    setLoading(true)
    try {
      // Make sure dateField is explicitly set and passed to the filter
      const filter: TransactionFilter = {
        startDate,
        endDate,
        dateField, // Ensure this is properly passed to the backend
        clientId: clientId === "none" ? undefined : clientId,
        businessUnitId: businessUnitId === "none" ? undefined : businessUnitId,
        cashAccountId: cashAccountId === "none" ? undefined : cashAccountId,
        transactionTypeId: transactionTypeId === "none" ? undefined : transactionTypeId,
        operationId: operationId === "none" ? undefined : operationId,
        type: transactionType === "todos" ? undefined : transactionType,
        status: status === "todos" ? undefined : status,
        searchField: searchTerm || undefined,
        competence: competence || undefined,
        recurrenceSeriesId: selectedRecurrenceSeries === "none" ? undefined : selectedRecurrenceSeries,
      }

      console.log("Applying filters with dateField:", dateField)
      setCurrentFilter(filter)
      const results = await getFilteredFinancialTransactions(filter)
      setTransactions(results)

      // Recalcular subtotais
      const entradas = results
        .filter((t) => t.type === "entrada" && t.status !== "cancelado")
        .reduce((sum, t) => sum + t.value, 0)

      const saidas = results
        .filter((t) => t.type === "saida" && t.status !== "cancelado")
        .reduce((sum, t) => sum + t.value, 0)

      setTotalEntradas(entradas)
      setTotalSaidas(saidas)
      setSubtotalInView(entradas - saidas)

      setIsFiltersOpen(false)
    } catch (err) {
      console.error("Erro ao aplicar filtros:", err)
      customToast.error("Erro ao aplicar filtros")
    } finally {
      setLoading(false)
    }
  }

  // Limpar filtros
  const handleClearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setDateField("dueDate")
    setClientId("none")
    setBusinessUnitId("none")
    setCashAccountId("none")
    setTransactionTypeId("none")
    setOperationId("none")
    setTransactionType("todos")
    setStatus("todos")
    setCompetence("")
    setSelectedRecurrenceSeries("none")
  }

  // Mudar tamanho da página
  const handlePageSizeChange = async (newSize: string) => {
    const size = Number.parseInt(newSize)
    setPageSize(size)
    await fetchTransactions(1, size)
  }

  // Mudar página
  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(totalCount / pageSize)) return
    await fetchTransactions(newPage)
  }

  // Adicionar transação
  const handleAddTransaction = () => {
    setCurrentTransaction(undefined)
    setModalTitle("Novo Lançamento")
    setIsModalOpen(true)
  }

  // Editar transação
  const handleEditTransaction = (transaction: FinancialTransaction) => {
    // Não permitir edição de parcelas já pagas
    if (transaction.status === "baixado") {
      customToast.warning("Lançamentos já pagos não podem ser editados")
      return
    }

    setCurrentTransaction(transaction)
    setModalTitle("Editar Lançamento")
    setIsModalOpen(true)
  }

  // Excluir transação
  const handleDeleteTransaction = (transaction: FinancialTransaction) => {
    // Não permitir exclusão de parcelas já pagas
    if (transaction.status === "baixado") {
      customToast.warning("Lançamentos já pagos não podem ser excluídos")
      return
    }

    setCurrentTransaction(transaction)
    setIsDeleteDialogOpen(true)
  }

  // Marcar como pago
  const handleMarkAsPaid = (transaction: FinancialTransaction) => {
    setCurrentTransaction(transaction)
    setIsPaymentModalOpen(true)
  }

  // Marcar como cancelado ou cancelar baixa
  const handleMarkAsCanceled = (transaction: FinancialTransaction) => {
    setCurrentTransaction(transaction)
    setIsCancelPaymentModalOpen(true)
  }

  // Ver detalhes da transação
  const handleViewTransactionDetails = async (transaction: FinancialTransaction) => {
    setCurrentTransaction(transaction)

    try {
      // Buscar transações relacionadas (recorrências)
      if (transaction.code) {
        const baseCode = transaction.code.split("-")[0]
        const related = await getRelatedRecurringTransactions(baseCode)
        setRelatedTransactions(related)
      } else {
        setRelatedTransactions([])
      }
    } catch (error) {
      console.error("Erro ao buscar transações relacionadas:", error)
      setRelatedTransactions([])
    }

    setIsTransactionDetailsModalOpen(true)
  }

  // Selecionar transação
  const handleSelectTransaction = (id: string | undefined) => {
    if (!id) return

    setSelectedTransactions((prev) => {
      if (prev.includes(id)) {
        return prev.filter((transactionId) => transactionId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // Selecionar todas as transações
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions([])
    } else {
      const allIds = transactions
        .filter((transaction) => transaction.id && transaction.status !== "baixado")
        .map((transaction) => transaction.id as string)
      setSelectedTransactions(allIds)
    }
    setSelectAll(!selectAll)
  }

  // Excluir selecionados
  const handleDeleteSelected = async () => {
    setIsDeleteManyDialogOpen(true)
  }

  // Confirmar exclusão em massa
  const confirmDeleteSelected = async () => {
    setLoading(true)
    try {
      let successCount = 0
      let errorCount = 0

      for (const id of selectedTransactions) {
        try {
          await deleteFinancialTransaction(id)
          successCount++
        } catch (err) {
          console.error(`Erro ao excluir lançamento ${id}:`, err)
          errorCount++
        }
      }

      await fetchTransactions(1)

      if (successCount > 0) {
        customToast.success(`${successCount} lançamento(s) excluído(s) com sucesso!`)
      }

      if (errorCount > 0) {
        customToast.error(`Não foi possível excluir ${errorCount} lançamento(s)`)
      }
    } catch (err) {
      console.error("Erro ao excluir lançamentos:", err)
      customToast.error("Erro ao excluir lançamentos")
    } finally {
      setLoading(false)
      setIsDeleteManyDialogOpen(false)
    }
  }

  // Renderizar ícone de banco
  const getBankLogo = (account: CashAccount) => {
    // Extrair o nome do banco da conta
    const bankName = account.account.toLowerCase()

    if (bankName.includes("itaú") || bankName.includes("itau")) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold">I</span>
        </div>
      )
    } else if (bankName.includes("brasil") || bankName.includes("bb")) {
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
          <span className="text-blue-900 font-bold">BB</span>
        </div>
      )
    } else if (bankName.includes("sicredi")) {
      return (
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-white font-bold">S</span>
        </div>
      )
    } else if (bankName.includes("caixa")) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-orange-500 font-bold">CX</span>
        </div>
      )
    } else if (bankName.includes("santander")) {
      return (
        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
          <span className="text-white font-bold">S</span>
        </div>
      )
    } else if (bankName.includes("bradesco")) {
      return (
        <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center">
          <span className="text-white font-bold">B</span>
        </div>
      )
    } else {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-700 font-bold">$</span>
        </div>
      )
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  // Adicionar a função handleCreateRecurringTransaction
  const handleCreateRecurringTransaction = (transaction: FinancialTransaction) => {
    setCurrentTransaction(transaction)
    setIsRecurringModalOpen(true)
  }

  // Filtrar transações por tipo (entrada/saída)
  const filteredTransactions = useMemo(() => {
    if (transactionType === "todos") {
      return transactions
    }
    return transactions.filter((transaction) => transaction.type === transactionType)
  }, [transactions, transactionType])

  // Also update the effect that handles transaction type changes to reset the transaction type ID
  // Add this effect after the existing useEffect hooks
  useEffect(() => {
    if (transactionTypes.length > 0 && transactionTypeId !== "none") {
      const currentType = transactionTypes.find((t) => t.id === transactionTypeId)
      if (currentType && transactionType !== "todos" && currentType.type !== transactionType) {
        // Reset transaction type if it doesn't match the selected nature
        setTransactionTypeId("none")
      }
    }
  }, [transactionType, transactionTypes, transactionTypeId])

  return (
    <>
      <MainHeader />
      <div className="bg-slate-50 min-h-screen dark:bg-slate-950">
        <div className="container mx-auto py-6">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="text-2xl font-bold flex items-center text-blue-600">
                    <FileText className="mr-2" />
                    Relatório de Lançamentos Financeiros
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div
                      className={`${calculateTotalAccountsBalance >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"} border rounded-md px-4 py-2 flex items-center cursor-pointer hover:shadow-sm transition-all duration-200`}
                      onClick={() => setIsAccountsOpen(true)}
                    >
                      <Wallet className="mr-2 h-5 w-5" />
                      <span className="text-sm mr-2">Saldo total:</span>
                      <span className="font-bold">{formatCurrency(calculateTotalAccountsBalance)}</span>
                    </div>
                    <Button
                      onClick={handleAddTransaction}
                      className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Lançamento
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Resumo financeiro */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow transition-all duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Total de Entradas</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(totalEntradas)}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                        <ArrowUpIcon className="h-6 w-6 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow transition-all duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-700 font-medium">Total de Saídas</p>
                        <p className="text-xl font-bold text-red-700">{formatCurrency(totalSaidas)}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-red-200 flex items-center justify-center">
                        <ArrowDownIcon className="h-6 w-6 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className={`${
                      subtotalInView >= 0
                        ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
                        : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
                    } shadow-sm hover:shadow transition-all duration-200`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p
                          className={`text-sm font-medium ${subtotalInView >= 0 ? "text-blue-700" : "text-amber-700"}`}
                        >
                          Saldo em Tela
                        </p>
                        <p className={`text-xl font-bold ${subtotalInView >= 0 ? "text-blue-700" : "text-amber-700"}`}>
                          {formatCurrency(subtotalInView)}
                        </p>
                      </div>
                      <div
                        className={`h-10 w-10 rounded-full ${subtotalInView >= 0 ? "bg-blue-200" : "bg-amber-200"} flex items-center justify-center`}
                      >
                        <BarChart4 className={`h-6 w-6 ${subtotalInView >= 0 ? "text-blue-600" : "text-amber-600"}`} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtros rápidos */}
                <div className="mb-4 overflow-x-auto">
                  <div className="flex space-x-2 pb-2">
                    {quickFilters.map((filter) => (
                      <Button
                        key={filter.id}
                        variant={activeQuickFilter === filter.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyQuickFilter(filter.id)}
                        className={
                          activeQuickFilter === filter.id
                            ? "bg-blue-600 hover:bg-blue-700 shadow-sm"
                            : "hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        }
                      >
                        {filter.icon}
                        {filter.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Filtro de tipo de transação (entrada/saída) */}
                <div className="mb-4">
                  <Tabs
                    defaultValue="todos"
                    value={transactionType}
                    onValueChange={(value) => setTransactionType(value as "entrada" | "saida" | "todos")}
                    className="w-full"
                  >
                    <TabsList className="grid w-full max-w-md grid-cols-3 mb-2">
                      <TabsTrigger value="todos" className="flex items-center gap-1">
                        <ListFilter className="h-4 w-4" />
                        Todos
                      </TabsTrigger>
                      <TabsTrigger value="entrada" className="flex items-center gap-1 text-green-700">
                        <ArrowUpIcon className="h-4 w-4" />
                        Entradas
                      </TabsTrigger>
                      <TabsTrigger value="saida" className="flex items-center gap-1 text-red-700">
                        <ArrowDownIcon className="h-4 w-4" />
                        Saídas
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Filtro de série de recorrência */}
                {recurrenceSeries.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="recurrenceSeries" className="whitespace-nowrap">
                        <RepeatIcon className="h-4 w-4 inline mr-1" />
                        Série de Recorrência:
                      </Label>
                      <Select value={selectedRecurrenceSeries} onValueChange={setSelectedRecurrenceSeries}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Todas as séries" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Todas as séries</SelectItem>
                          {recurrenceSeries.map((series) => (
                            <SelectItem key={series.id} value={series.id}>
                              {series.name || series.code} ({series.totalInstallments} parcelas)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Barra de pesquisa e ações */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Pesquisar lançamentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSearch}
                        className="absolute right-0 top-0 h-full"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSearch}
                      variant="outline"
                      disabled={isSearching}
                      className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 text-blue-700 shadow-sm"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Pesquisar
                    </Button>
                    <Button
                      onClick={() => setIsFiltersOpen(true)}
                      variant="outline"
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                    <Button
                      onClick={refreshData}
                      variant="outline"
                      className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="shadow-sm">
                          <FileUp className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Controles de paginação e ações em massa */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Exibir</span>
                    <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">resultados por página</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTransactions.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={handleDeleteSelected} className="shadow-sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir selecionados ({selectedTransactions.length})
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tabela de transações */}
                <div className="rounded-md border overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={handleSelectAll}
                              aria-label="Selecionar todos"
                            />
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("businessUnitName")}>
                            Unidade
                            {sortField === "businessUnitName" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("competence")}>
                            Comp
                            {sortField === "competence" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("clientName")}>
                            Devedor/Credor
                            {sortField === "clientName" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </TableHead>
                          <TableHead>Doc</TableHead>
                          <TableHead>Conta</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                            Natureza
                            {sortField === "type" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </TableHead>
                          <TableHead>Tipo Lançamento</TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("dueDate")}>
                            Vencimento
                            {sortField === "dueDate" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("paymentDate")}>
                            Pagamento
                            {sortField === "paymentDate" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </TableHead>
                          <TableHead className="cursor-pointer" onClick={() => handleSort("value")}>
                            Valor R$
                            {sortField === "value" && (
                              <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                            )}
                          </TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-10">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <span>Carregando lançamentos...</span>
                            </TableCell>
                          </TableRow>
                        ) : error ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-10 text-red-500">
                              {error}
                            </TableCell>
                          </TableRow>
                        ) : filteredTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                              <div className="flex flex-col items-center">
                                <Sparkles className="h-10 w-10 text-slate-300 mb-2" />
                                <p>Nenhum lançamento encontrado.</p>
                                <p className="text-sm text-slate-400">
                                  Tente ajustar os filtros ou criar um novo lançamento.
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTransactions.map((transaction, index) => (
                            <TableRow
                              key={`${transaction.id || ""}-${index}`}
                              className={
                                transaction.status === "cancelado"
                                  ? "bg-gray-100"
                                  : "hover:bg-slate-50 transition-colors"
                              }
                            >
                              <TableCell>
                                <Checkbox
                                  checked={transaction.id ? selectedTransactions.includes(transaction.id) : false}
                                  onCheckedChange={() => handleSelectTransaction(transaction.id)}
                                  disabled={transaction.status === "baixado" || transaction.status === "cancelado"}
                                  aria-label={`Selecionar lançamento ${transaction.code}`}
                                />
                              </TableCell>
                              <TableCell>{transaction.businessUnitName || "-"}</TableCell>
                              <TableCell>
                                {transaction.competence || generateCompetenceCode(transaction.dueDate)}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>{transaction.clientName || "-"}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{transaction.clientName}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {transaction.installmentNumber && transaction.recurrenceSeriesId && (
                                  <div className="mt-1">
                                    <RecurrenceBadge
                                      installmentNumber={transaction.installmentNumber}
                                      totalInstallments={
                                        recurrenceSeries.find((s) => s.id === transaction.recurrenceSeriesId)
                                          ?.totalInstallments
                                      }
                                    />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{transaction.document || "-"}</TableCell>
                              <TableCell>{transaction.cashAccountName || "-"}</TableCell>
                              <TableCell>
                                <Badge className={getTypeColor(transaction.type)}>
                                  {transaction.type === "entrada" ? "Entrada" : "Saída"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="max-w-[120px] truncate inline-block">
                                        {transaction.transactionTypeName}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{transaction.transactionTypeName}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                {transaction.status === "cancelado" ? (
                                  <span className="line-through">{formatDate(transaction.dueDate)}</span>
                                ) : (
                                  formatDate(transaction.dueDate)
                                )}
                              </TableCell>
                              <TableCell>
                                {transaction.status === "baixado" ? formatDate(transaction.paymentDate) : "-"}
                              </TableCell>
                              <TableCell
                                className={
                                  transaction.status === "cancelado" ? "line-through" : getTypeColor(transaction.type)
                                }
                              >
                                {transaction.type === "entrada" ? "+" : "-"}
                                {formatCurrency(transaction.value)}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <span className="sr-only">Abrir menu</span>
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleEditTransaction(transaction)}
                                      disabled={transaction.status === "baixado" || transaction.status === "cancelado"}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewTransactionDetails(transaction)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Ver detalhes
                                    </DropdownMenuItem>
                                    {transaction.status === "pendente" && (
                                      <DropdownMenuItem onClick={() => handleMarkAsPaid(transaction)}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Baixar lançamento
                                      </DropdownMenuItem>
                                    )}
                                    {transaction.status === "pendente" && (
                                      <DropdownMenuItem onClick={() => handleMarkAsCanceled(transaction)}>
                                        <XCircle2 className="mr-2 h-4 w-4" />
                                        Cancelar
                                      </DropdownMenuItem>
                                    )}
                                    {transaction.status === "baixado" && (
                                      <DropdownMenuItem onClick={() => handleMarkAsCanceled(transaction)}>
                                        <XCircle2 className="mr-2 h-4 w-4" />
                                        Cancelar baixa
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => handleCreateRecurringTransaction(transaction)}>
                                      <RepeatIcon className="mr-2 h-4 w-4" />
                                      Gerar Recorrência
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteTransaction(transaction)}
                                      disabled={transaction.status === "baixado" || transaction.status === "cancelado"}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Paginação */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {filteredTransactions.length > 0 && (
                      <p>
                        Mostrando de {(currentPage - 1) * pageSize + 1} até{" "}
                        {Math.min(currentPage * pageSize, totalCount)} de {totalCount} registros
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1 || loading}
                      className="hover:bg-blue-50"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="hover:bg-blue-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm mx-2">
                      Página {currentPage} de {totalPages || 1}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading || totalPages === 0}
                      className="hover:bg-blue-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages || loading || totalPages === 0}
                      className="hover:bg-blue-50"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Painel de Contas Bancárias */}
      <Sheet open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Posição das contas bancárias
            </SheetTitle>
          </SheetHeader>

          <div className="text-center mb-6">
            <p className="text-sm text-gray-500">Saldo total atualizado</p>
            <p
              className={`text-2xl font-bold ${calculateTotalAccountsBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(calculateTotalAccountsBalance)}
            </p>
          </div>

          <div className="space-y-4">
            {cashAccounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3">{getBankLogo(account)}</div>
                    <div>
                      <div className="text-xs text-gray-500">
                        Agência
                        <span className="block font-medium text-gray-700">{account.code || "-"}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Conta
                        <span className="block font-medium text-gray-700">{account.account}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold text-lg ${(account.currentBalance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(account.currentBalance || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Painel de Filtros */}
      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <div className="flex justify-between items-center">
              <SheetTitle className="text-xl font-bold">Filtros Avançados</SheetTitle>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* Campo de tipo de data para filtro */}
            <FilterDateField value={dateField} onChange={setDateField} />

            {/* Campo de competência */}
            <div className="space-y-2">
              <Label htmlFor="competence">Competência (AAAAMM)</Label>
              <Input
                id="competence"
                placeholder="202401"
                value={competence}
                onChange={(e) => setCompetence(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Formato: AAAAMM (ex: 202401 para Janeiro de 2024)</p>
            </div>

            {/* Filtro de série de recorrência */}
            {recurrenceSeries.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="recurrenceSeries">Série de Recorrência</Label>
                <Select value={selectedRecurrenceSeries} onValueChange={setSelectedRecurrenceSeries}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as séries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas as séries</SelectItem>
                    {recurrenceSeries.map((series) => (
                      <SelectItem key={series.id} value={series.id}>
                        {series.name || series.code} ({series.totalInstallments} parcelas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>De:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <input
                    type="date"
                    value={startDate ? startDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value + "T12:00:00") : undefined)}
                    className="p-2 border rounded"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Até:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <input
                    type="date"
                    value={endDate ? endDate.toISOString().split('T')[0] : ""}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value + "T12:00:00") : undefined)}
                    className="p-2 border rounded"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Natureza do Lançamento</Label>
              <RadioGroup
                value={transactionType}
                onValueChange={(value) => setTransactionType(value as "entrada" | "saida" | "todos")}
                className="grid grid-cols-3 gap-3"
              >
                <div className="flex items-center">
                  <RadioGroupItem value="todos" id="todos" className="peer sr-only" />
                  <Label
                    htmlFor="todos"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full"
                  >
                    <ListFilter className="mb-2 h-6 w-6 text-slate-600" />
                    <span className="text-sm font-medium">Todos</span>
                  </Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="entrada" id="entrada" className="peer sr-only" />
                  <Label
                    htmlFor="entrada"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full"
                  >
                    <ArrowUpIcon className="mb-2 h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Entrada</span>
                  </Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="saida" id="saida" className="peer sr-only" />
                  <Label
                    htmlFor="saida"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary w-full"
                  >
                    <ArrowDownIcon className="mb-2 h-6 w-6 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Saída</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Cliente/Fornecedor</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id ? client.id : client.id || "no_id"}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidade de negócio</Label>
              <Select value={businessUnitId} onValueChange={setBusinessUnitId} disabled={!clientId}>
                <SelectTrigger>
                  <SelectValue placeholder={clientId ? "Selecione uma unidade" : "Selecione um cliente primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas</SelectItem>
                  {businessUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id ? unit.id : unit.id || "no_id"}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TransactionTypeSelector
              value={transactionTypeId}
              onChange={setTransactionTypeId}
              transactionTypes={transactionTypes}
              selectedNature={transactionType}
            />

            <div className="space-y-2">
              <Label>Conta caixa</Label>
              <Select value={cashAccountId} onValueChange={setCashAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas</SelectItem>
                  {cashAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id ? account.id : account.id || "no_id"}>
                      {account.account}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Operação</Label>
              <Select value={operationId} onValueChange={setOperationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos</SelectItem>
                  {operations.map((operation) => (
                    <SelectItem key={operation.id} value={operation.id ? operation.id : operation.id || "no_id"}>
                      {operation.code} - {operation.voyage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Situação</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="baixado">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de cadastro/edição de lançamento */}
      <TransactionForm
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={fetchTransactions}
        transaction={currentTransaction}
        loading={loading}
      />

      {/* Modal de pagamento */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        transaction={currentTransaction}
        onSave={fetchTransactions}
      />

      {/* Modal de cancelamento de pagamento */}
      <CancelPaymentModal
        isOpen={isCancelPaymentModalOpen}
        onClose={() => setIsCancelPaymentModalOpen(false)}
        transaction={currentTransaction}
        onSave={fetchTransactions}
      />

      {/* Modal de detalhes da transação */}
      <TransactionDetailsModal
        isOpen={isTransactionDetailsModalOpen}
        onClose={() => setIsTransactionDetailsModalOpen(false)}
        transaction={currentTransaction}
        recurrenceData={relatedTransactions}
      />

      {/* Modal de exclusão com opções para recorrências */}
      <DeleteTransactionModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        transaction={currentTransaction}
        onDelete={refreshData}
      />

      {/* Adicionar o modal de recorrência */}
      <RecurringTransactionModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        transaction={currentTransaction as Partial<FinancialTransaction>}
        onSave={fetchTransactions}
      />

      {/* Dialog de confirmação para exclusão em massa */}
      <AlertDialog open={isDeleteManyDialogOpen} onOpenChange={setIsDeleteManyDialogOpen}>
        <AlertDialogContentComponent>
          <AlertDialogHeader>
            <AlertDialogTitleAlias>Confirmar exclusão em massa</AlertDialogTitleAlias>
            <AlertDialogDescriptionAlias>
              Tem certeza que deseja excluir {selectedTransactions.length} lançamento(s)? Esta ação não pode ser
              desfeita.
            </AlertDialogDescriptionAlias>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogActionAlias onClick={confirmDeleteSelected} className="bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Excluir
            </AlertDialogActionAlias>
          </AlertDialogFooter>
        </AlertDialogContentComponent>
      </AlertDialog>
    </>
  )
}
