/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Loader2,
  Plus,
  Search,
  XCircle,
  Pencil,
  FileText,
  CheckCircle,
  CircleXIcon as XCircle2,
  RefreshCw,
  FileUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Trash2,
  Download,
  Printer,
} from "lucide-react"
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
import { TransactionFilters } from "@/components/transaction-filter"
import {
  getFinancialTransactionsWithPagination,
  calculateTotalBalance,
  deleteFinancialTransaction,
  getRelatedRecurringTransactions,
} from "@/app/services/financial-transaction-service"
import { getAllCashAccounts } from "@/app/services/cash-account-service"
import type { FinancialTransaction, TransactionFilter, CashAccount, DocumentSnapshot } from "@/types/types"
import { formatCurrency, getTypeColor } from "@/lib/utils"
import customToast from "@/components/ui/custom-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaymentModal } from "@/components/payment-modal"
import { CancelPaymentModal } from "@/components/cancel-payment-modal"
import { TransactionDetailsModal } from "@/components/transaction-details-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { format, isValid, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

interface FinancialReportProps {
  onAddTransaction: () => void
  onEditTransaction: (transaction: FinancialTransaction) => void
  currentUser?: any
}

export function FinancialReport({ onAddTransaction, onEditTransaction, currentUser }: FinancialReportProps) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTransaction, setCurrentTransaction] = useState<FinancialTransaction | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCancelPaymentModalOpen, setIsCancelPaymentModalOpen] = useState(false)
  const [isTransactionDetailsModalOpen, setIsTransactionDetailsModalOpen] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<TransactionFilter>({})
  const [totalBalance, setTotalBalance] = useState<number>(0)
  const [subtotalInView, setSubtotalInView] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [lastDoc, setLastDoc] = useState<number>(0)
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [accountsDialogOpen, setAccountsDialogOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [isDeleteManyDialogOpen, setIsDeleteManyDialogOpen] = useState(false)
  const [relatedTransactions, setRelatedTransactions] = useState<FinancialTransaction[]>([])

  const fetchTransactions = async (newPage = 1, newPageSize = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      // Usar a função de paginação do servidor
      const result = await getFinancialTransactionsWithPagination(
        newPageSize,
        newPage === 1 ? 0 : lastDoc,
        currentFilter,
      )

      setTransactions(result.transactions)
      setLastDoc(result.lastIndex)
      setTotalCount(result.totalCount)
      setSubtotalInView(0) // Replace with a default value or calculate it if needed
      setCurrentPage(newPage)
      setPageSize(newPageSize)
      setSelectedTransactions([]) // Limpar seleções ao carregar novos dados
      setSelectAll(false)

      // Buscar saldo total
      const balance = await calculateTotalBalance()
      setTotalBalance(balance)

      // Buscar contas caixa
      const accounts = await getAllCashAccounts()
      setCashAccounts(accounts)
    } catch (err) {
      console.error("Erro ao carregar lançamentos:", err)
      setError("Não foi possível carregar os lançamentos. Tente novamente.")
      customToast.error("Erro ao carregar lançamentos")
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    await fetchTransactions(1)
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleSearch = async () => {
    const newFilter = { ...currentFilter }
    if (searchTerm) {
      newFilter.searchField = searchTerm
    } else {
      delete newFilter.searchField
    }

    setCurrentFilter(newFilter)
    await fetchTransactions(1)
  }

  const clearSearch = async () => {
    setSearchTerm("")
    const newFilter = { ...currentFilter }
    delete newFilter.searchField
    setCurrentFilter(newFilter)
    await fetchTransactions(1)
  }

  const handleFilter = async (filter: TransactionFilter) => {
    setCurrentFilter(filter)
    await fetchTransactions(1)
  }

  const handlePageSizeChange = async (newSize: number) => {
    setPageSize(newSize)
    await fetchTransactions(1, newSize)
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(totalCount / pageSize)) return
    await fetchTransactions(newPage)
  }

  const handleMarkAsPaid = (transaction: FinancialTransaction) => {
    setCurrentTransaction(transaction)
    setIsPaymentModalOpen(true)
  }

  const handleMarkAsCanceled = (transaction: FinancialTransaction) => {
    setCurrentTransaction(transaction)
    setIsCancelPaymentModalOpen(true)
  }

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

  const handleDeleteSelected = async () => {
    setIsDeleteManyDialogOpen(true)
  }

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

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="container mx-auto py-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold flex items-center text-blue-600">
              <FileText className="mr-2" />
              Relatório de Lançamentos Financeiros
            </h1>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setAccountsDialogOpen(true)}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <span className="font-medium">Saldo total atualizado:</span>
                <span className="ml-2 font-bold">{formatCurrency(totalBalance)}</span>
              </Button>
              <Button onClick={onAddTransaction} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Lançamento
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Pesquisar lançamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {searchTerm && (
                <Button variant="ghost" size="icon" onClick={clearSearch} className="absolute right-0 top-0 h-full">
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                variant="outline"
                disabled={isSearching}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Pesquisar
              </Button>
              <Button variant="outline" onClick={() => setIsFilterOpen(true)} className="border-slate-200">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button onClick={refreshData} variant="outline" className="border-slate-200">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-slate-200">
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

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Exibir</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => handlePageSizeChange(Number.parseInt(value))}
              >
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
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir selecionados ({selectedTransactions.length})
                </Button>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2">
                <span className="text-sm text-blue-700 mr-2">Subtotal em tela:</span>
                <span className="font-bold text-blue-700">{formatCurrency(subtotalInView)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} aria-label="Selecionar todos" />
                  </TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Comp</TableHead>
                  <TableHead>Devedor/Credor</TableHead>
                  <TableHead>Doc</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Natureza</TableHead>
                  <TableHead>Tipo Lançamento</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Valor R$</TableHead>
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
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                      Nenhum lançamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction, index) => (
                    <TableRow key={`${transaction.id || ""}-${index}`}>
                      <TableCell>
                        <Checkbox
                          checked={transaction.id ? selectedTransactions.includes(transaction.id) : false}
                          onCheckedChange={() => handleSelectTransaction(transaction.id)}
                          disabled={transaction.status === "baixado"}
                          aria-label={`Selecionar lançamento ${transaction.code}`}
                        />
                      </TableCell>
                      <TableCell>{transaction.businessUnitName || "-"}</TableCell>
                      <TableCell>{transaction.competence || generateCompetenceCode(transaction.dueDate)}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{transaction.clientName || "-"}</TableCell>
                      <TableCell>{transaction.document || "-"}</TableCell>
                      <TableCell>{transaction.cashAccountName || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            transaction.type === "entrada"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                        >
                          {transaction.type === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.transactionTypeName || "-"}</TableCell>
                      <TableCell>{formatDate(transaction.dueDate)}</TableCell>
                      <TableCell>{transaction.status === "baixado" ? formatDate(transaction.paymentDate) : "-"}</TableCell>
                      <TableCell className={getTypeColor(transaction.type)}>
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
                              onClick={() => onEditTransaction(transaction)}
                              disabled={transaction.status === "baixado"}
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {transactions.length > 0 && (
                <p>
                  Mostrando de {(currentPage - 1) * pageSize + 1} até {Math.min(currentPage * pageSize, totalCount)} de{" "}
                  {totalCount} registros
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
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
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loading || totalPages === 0}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de pagamento */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        transaction={currentTransaction}
        onSave={refreshData}
        currentUser={currentUser}
      />

      {/* Modal de cancelamento de pagamento */}
      <CancelPaymentModal
        isOpen={isCancelPaymentModalOpen}
        onClose={() => setIsCancelPaymentModalOpen(false)}
        transaction={currentTransaction}
        onSave={refreshData}
      />

      {/* Modal de detalhes da transação */}
      <TransactionDetailsModal
        isOpen={isTransactionDetailsModalOpen}
        onClose={() => setIsTransactionDetailsModalOpen(false)}
        transaction={currentTransaction}
        recurrenceData={relatedTransactions}
      />

      {/* Modal de contas caixa */}
      <Dialog open={accountsDialogOpen} onOpenChange={setAccountsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Saldos por Conta Caixa</DialogTitle>
            <DialogDescription>Visualize os saldos de todas as contas caixa do sistema.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Saldo Inicial</TableHead>
                    <TableHead>Entradas</TableHead>
                    <TableHead>Saídas</TableHead>
                    <TableHead>Saldo Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Nenhuma conta caixa encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.account}</TableCell>
                        <TableCell>{account.code}</TableCell>
                        <TableCell>
                          {formatCurrency(
                            Number.parseFloat(account.value?.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0,
                          )}
                        </TableCell>
                        <TableCell className="text-green-600">{formatCurrency(account.income || 0)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(account.expense || 0)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(account.currentBalance || 0)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Saldo Total:</span>
                <span className="text-blue-700 font-bold text-lg">{formatCurrency(totalBalance)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setAccountsDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de filtros */}
      <TransactionFilters
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        onFilter={handleFilter}
        initialFilter={currentFilter}
      />

      {/* Dialog de confirmação para exclusão em massa */}
      <AlertDialog open={isDeleteManyDialogOpen} onOpenChange={setIsDeleteManyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedTransactions.length} lançamento(s)? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSelected} className="bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
