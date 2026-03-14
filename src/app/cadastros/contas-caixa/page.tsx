"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wallet, Plus, XCircle, Pencil, Trash2, ArrowUpRight, ArrowDownRight, Search, Eye, TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getAllCashAccounts,
  getCashAccountById,
  deleteCashAccount,
  addCashAccount,
  updateCashAccount,
  getCashAccountBalance,
  type CashAccountBalance,
} from "@/app/services/cash-account-api-service"
import { getAllBankAgencies } from "@/app/services/bank-agency-service"
import { getAllBusinessUnits } from "@/app/services/business-unit-api-service"
import { CashAccountModal } from "@/components/cash-account-modal"
import type { CashAccount, BankAgency, BusinessUnit } from "@/types/types"
import { motion } from "framer-motion"
import { formatCurrency } from "@/utils/format"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { useAuth } from "@/app/contexts/auth-context"

export default function CashAccountsPage() {
  const { hasPermission } = useAuth()
  const [accounts, setAccounts] = useState<CashAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentAccount, setCurrentAccount] = useState<CashAccount | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [agencyDetails, setAgencyDetails] = useState<Record<string, BankAgency>>({})
  const [businessUnitDetails, setBusinessUnitDetails] = useState<Record<string, BusinessUnit>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("Nova Conta Caixa")
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [balanceData, setBalanceData] = useState<Record<string, CashAccountBalance>>({})
  const [loadingBalance, setLoadingBalance] = useState<Record<string, boolean>>({})
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dashboardFilter, setDashboardFilter] = useState<string>("all")
  const [agencyFilter, setAgencyFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "account",
    defaultSortOrder: "asc",
  })

  // Debounce do searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms de delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Aplicar filtros primeiro, depois sorting
  const filteredAndSortedAccounts = useMemo(() => {
    // Aplicar filtros
    const filtered = accounts.filter((account) => {
      // Status filter
      if (statusFilter !== "all") {
        const isActive = (account as CashAccount & { status?: boolean }).status === true
        if (statusFilter === "active" && !isActive) return false
        if (statusFilter === "inactive" && isActive) return false
      }

      // Dashboard filter
      if (dashboardFilter !== "all") {
        const isDashboard = (account as CashAccount & { dashboard?: boolean }).dashboard === true
        if (dashboardFilter === "yes" && !isDashboard) return false
        if (dashboardFilter === "no" && isDashboard) return false
      }


      // Agency filter
      if (agencyFilter !== "all" && account.bankAgencyId !== agencyFilter) {
        return false
      }

      return true
    })

    // Aplicar sorting
    if (!pagination.sortBy) return filtered

    return [...filtered].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      // Handle special fields that need lookups
      if (pagination.sortBy === "businessUnit") {
        aValue = (a.businessUnitId && businessUnitDetails[a.businessUnitId]?.name) || ""
        bValue = (b.businessUnitId && businessUnitDetails[b.businessUnitId]?.name) || ""
      } else if (pagination.sortBy === "agency") {
        aValue = (a.bankAgencyId && agencyDetails[a.bankAgencyId]?.agencyName) || ""
        bValue = (b.bankAgencyId && agencyDetails[b.bankAgencyId]?.agencyName) || ""
      } else if (pagination.sortBy === "initialBalance") {
        aValue = Number(a.value) || 0
        bValue = Number(b.value) || 0
      } else if (pagination.sortBy === "actualBalance") {
        aValue = a.currentBalance || 0
        bValue = b.currentBalance || 0
      } else if (pagination.sortBy === "transactions") {
        // Sort by total transactions (income + expense)
        aValue = (a.income || 0) + (a.expense || 0)
        bValue = (b.income || 0) + (b.expense || 0)
      } else {
        // Default field access
        aValue = (a as unknown as Record<string, string | number>)[pagination.sortBy] || ""
        bValue = (b as unknown as Record<string, string | number>)[pagination.sortBy] || ""
      }

      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1

      let comparison = 0
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return pagination.sortOrder === "asc" ? comparison : -comparison
    })
  }, [accounts, pagination.sortBy, pagination.sortOrder, businessUnitDetails, agencyDetails, statusFilter, dashboardFilter, agencyFilter])

  const { paginatedData, totalPages } = useMemo(() => {
    return pagination.paginateData(filteredAndSortedAccounts)
  }, [filteredAndSortedAccounts, pagination])


  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllCashAccounts(1, 500, debouncedSearchTerm)

      // Buscar saldo atual de cada conta em paralelo
      const accountsWithBalance = await Promise.all(
        data.map(async (account) => {
          try {
            if (account.id) {
              const balance = await getCashAccountBalance(account.id)
              // Comparar valores para detectar discrepância
              const originalValue = parseFloat(account.value || '0')
              const apiValue = parseFloat(balance.saldo_inicial)
              const hasDiscrepancy = Math.abs(originalValue - apiValue) > 0.01 // Margem de 1 centavo

              console.log(`Debug - Account ${account.id}:`, {
                originalValue: account.value,
                apiSaldoInicial: balance.saldo_inicial,
                apiSaldoAtual: balance.saldo_atual,
                hasDiscrepancy,
                usingOriginal: hasDiscrepancy
              })

              return {
                ...account,
                // Se há discrepância, usar valor original (correto do banco)
                // Se não há discrepância, usar valor da API
                value: hasDiscrepancy ? account.value : balance.saldo_inicial,
                currentBalance: parseFloat(balance.saldo_atual),
                income: 0, // Pode ser calculado depois se necessário
                expense: 0, // Pode ser calculado depois se necessário
              }
            }
            return account
          } catch (error) {
            console.error(`Erro ao buscar saldo da conta ${account.id}:`, error)
            // Se houver erro, retorna a conta com o saldo inicial como fallback
            return account
          }
        })
      )

      setAccounts(accountsWithBalance)

      // Buscar TODAS as agências bancárias de uma vez (igual no modal)
      const allAgencies = await getAllBankAgencies(1, 500)
      const agencyDetailsMap: Record<string, BankAgency> = {}

      // Criar mapa de id -> agência
      allAgencies.forEach((agency) => {
        if (agency.id) {
          agencyDetailsMap[agency.id] = agency
        }
      })

      setAgencyDetails(agencyDetailsMap)

      // Buscar TODAS as unidades de negócio de uma vez (igual no modal)
      const allBusinessUnits = await getAllBusinessUnits()
      const businessUnitDetailsMap: Record<string, BusinessUnit> = {}

      // Criar mapa de id -> unidade de negócio
      allBusinessUnits.forEach((businessUnit) => {
        if (businessUnit.id) {
          businessUnitDetailsMap[businessUnit.id] = businessUnit
        }
      })

      setBusinessUnitDetails(businessUnitDetailsMap)
    } catch (err) {
      console.error("Erro ao carregar contas caixa:", err)
      const errorMessage = err instanceof Error ? err.message : "Não foi possível carregar as contas caixa. Tente novamente."
      setError(errorMessage)
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [debouncedSearchTerm])

  // Carregar contas na montagem
  useEffect(() => {
    fetchAccounts()
  }, [])

  // Buscar quando debouncedSearchTerm mudar
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return // Ainda está digitando
    setIsSearching(true)
    fetchAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm])

  const handleAddAccount = () => {
    setCurrentAccount(undefined)
    setModalTitle("Nova Conta Caixa")
    setIsModalOpen(true)
  }

  const handleEditAccount = async (account: CashAccount) => {
    try {
      setLoadingAccountId(account.id!)
      // Buscar conta completa por ID para garantir que temos as formas de pagamento
      const fullAccount = await getCashAccountById(account.id!)
      if (fullAccount) {
        setCurrentAccount(fullAccount)
        setModalTitle("Editar Conta Caixa")
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Erro ao carregar conta completa:', error)
      // const errorMessage = error instanceof Error ? error.message : "Erro ao carregar dados da conta"
    } finally {
      setLoadingAccountId(null)
    }
  }

  const handleDeleteAccount = (account: CashAccount) => {
    setCurrentAccount(account)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentAccount?.id) return

    // Fechar modal imediatamente
    setIsDeleteDialogOpen(false)

    setLoading(true)
    try {
      await deleteCashAccount(currentAccount.id)
      await fetchAccounts()
    } catch (err) {
      console.error("Erro ao excluir conta caixa:", err)
      // const errorMessage = err instanceof Error ? err.message : "Erro ao excluir conta caixa. Tente novamente."
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAccount = async (accountData: Omit<CashAccount, "id" | "createdAt" | "updatedAt">) => {
    setLoading(true)
    try {
      if (currentAccount?.id) {
        await updateCashAccount(currentAccount.id, accountData)
      } else {
        await addCashAccount(accountData)
      }

      // Fechar modal
      setIsModalOpen(false)

      // Recarregar contas
      await fetchAccounts()
    } catch (err) {
      console.error("Erro ao salvar conta caixa:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  const clearFilters = () => {
    setStatusFilter("all")
    setDashboardFilter("all")
    setAgencyFilter("all")
  }

  const hasActiveFilters = () => {
    return statusFilter !== "all" || dashboardFilter !== "all" || agencyFilter !== "all"
  }

  const handleToggleBalance = async (accountId: string) => {
    // Se já está expandido, colapsar
    if (expandedAccountId === accountId) {
      setExpandedAccountId(null)
      return
    }

    // Expandir e buscar saldo se ainda não foi buscado
    setExpandedAccountId(accountId)

    if (!balanceData[accountId]) {
      setLoadingBalance((prev) => ({ ...prev, [accountId]: true }))
      try {
        const balance = await getCashAccountBalance(accountId)
        setBalanceData((prev) => ({ ...prev, [accountId]: balance }))
      } catch (error) {
        console.error("Erro ao buscar saldo:", error)
        setExpandedAccountId(null)
      } finally {
        setLoadingBalance((prev) => ({ ...prev, [accountId]: false }))
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  return (
    <>
      <MainHeader />
      <div className="bg-slate-50 min-h-screen dark:bg-slate-950">
        <motion.div className="container mx-auto py-6" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={cardVariants}>
            <Card className="">
              <motion.div variants={itemVariants}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-2xl font-bold flex items-center text-blue-600 whitespace-nowrap">
                      <Wallet className="mr-2 w-8 h-8" />
                      <span className="font-medium text-3xl">Contas Caixa</span>
                    </CardTitle>

                    <motion.div variants={itemVariants} className="flex-1 flex justify-center">
                      <div className="relative">
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                          {!searchTerm && <Search className="h-4 w-4 text-muted-foreground" />}
                          {!searchTerm && <span className="text-muted-foreground text-sm">Pesquisar</span>}
                        </div>
                        <Input
                          placeholder=" "
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-[400px] border-0 bg-slate-200 dark:bg-slate-800 px-10 text-center focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : searchTerm ? (
                            <Button variant="ghost" size="icon" onClick={clearSearch} className="h-6 w-6 p-0">
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>

                    <div className="flex gap-2">
                      <Button
                        variant={showFilters ? "default" : "outline"}
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 ${showFilters ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                      >
                        <Filter className="h-4 w-4" />
                        Filtros
                      </Button>
                      {hasPermission('cadastros.contas_caixa', 'criar_editar') && (
                        <Button onClick={handleAddAccount} className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Conta Caixa
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </motion.div>

              {/* Filters Section */}
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-4 border-b"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Filtrar por:</h3>
                    {hasActiveFilters() && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dashboard</label>
                      <Select value={dashboardFilter} onValueChange={setDashboardFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="yes">Sim</SelectItem>
                          <SelectItem value="no">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>


                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Agência</label>
                      <Select value={agencyFilter} onValueChange={setAgencyFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {Object.values(agencyDetails).map((agency) => (
                            <SelectItem key={agency.id} value={agency.id!}>
                              {agency.agencyName} [{agency.agencyNumber}]
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              <CardContent>


                <motion.div variants={itemVariants} className="rounded-md p-2 border mt-5">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          field="account"
                          label="Conta"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="agency"
                          label="Agência"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="initialBalance"
                          label="Saldo Inicial"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="actualBalance"
                          label="Saldo Atual"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <TableHead className="text-center">Detalhes</TableHead>
                        {(hasPermission('cadastros.contas_caixa', 'criar_editar') || hasPermission('cadastros.contas_caixa', 'deletar')) && (
                          <TableHead className="text-right">Ações</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={(hasPermission('cadastros.contas_caixa', 'criar_editar') || hasPermission('cadastros.contas_caixa', 'deletar')) ? 6 : 5} className="text-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <span>Carregando contas caixa...</span>
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={(hasPermission('cadastros.contas_caixa', 'criar_editar') || hasPermission('cadastros.contas_caixa', 'deletar')) ? 6 : 5} className="text-center py-10 text-red-500">
                            {error}
                          </TableCell>
                        </TableRow>
                      ) : filteredAndSortedAccounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={(hasPermission('cadastros.contas_caixa', 'criar_editar') || hasPermission('cadastros.contas_caixa', 'deletar')) ? 6 : 5} className="text-center py-10 text-muted-foreground">
                            Nenhuma conta caixa encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((account) => (
                          <>
                            <TableRow key={account.id || `account-${Math.random()}`}>
                              <TableCell className="font-medium">{account.account}</TableCell>
                              <TableCell>
                                {account.bankAgencyId
                                  ? (agencyDetails[account.bankAgencyId]
                                      ? `${agencyDetails[account.bankAgencyId].agencyName} [${agencyDetails[account.bankAgencyId].agencyNumber}]`
                                      : "Agência não encontrada")
                                  : "Não especificada"}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(account.value)}
                              </TableCell>
                              <TableCell
                                className={(account.currentBalance || 0) >= 0 ? "text-green-600" : "text-red-600"}
                              >
                                {formatCurrency(account.currentBalance || 0)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleBalance(account.id!)}
                                  className="h-8 w-8"
                                  title="Ver detalhes do saldo"
                                >
                                  {loadingBalance[account.id!] ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  )}
                                </Button>
                              </TableCell>
                              {(hasPermission('cadastros.contas_caixa', 'criar_editar') || hasPermission('cadastros.contas_caixa', 'deletar')) && (
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {hasPermission('cadastros.contas_caixa', 'criar_editar') && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditAccount(account)}
                                        className="h-8 w-8"
                                        disabled={loadingAccountId === account.id}
                                      >
                                        {loadingAccountId === account.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                        ) : (
                                          <Pencil className="h-4 w-4 text-blue-600" />
                                        )}
                                      </Button>
                                    )}
                                    {hasPermission('cadastros.contas_caixa', 'deletar') && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteAccount(account)}
                                        className="h-8 w-8"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>

                            {/* Linha expandida com detalhes do saldo */}
                            {expandedAccountId === account.id && balanceData[account.id!] && (
                              <TableRow>
                                <TableCell colSpan={(hasPermission('cadastros.contas_caixa', 'criar_editar') || hasPermission('cadastros.contas_caixa', 'deletar')) ? 6 : 5} className="bg-slate-50 dark:bg-slate-900/50 p-4">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                      {/* Saldo Inicial */}
                                      <Card>
                                        <CardContent className="pt-6">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                                              <p className="text-2xl font-bold text-blue-600">
                                                {formatCurrency(parseFloat(balanceData[account.id!].saldo_inicial))}
                                              </p>
                                            </div>
                                            <Wallet className="h-8 w-8 text-blue-600 opacity-20" />
                                          </div>
                                        </CardContent>
                                      </Card>

                                      {/* Saldo na Data */}
                                      <Card>
                                        <CardContent className="pt-6">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Saldo em {new Date(balanceData[account.id!].data_consulta).toLocaleDateString('pt-BR')}
                                              </p>
                                              <p className={`text-2xl font-bold ${parseFloat(balanceData[account.id!].saldo_na_data) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {formatCurrency(parseFloat(balanceData[account.id!].saldo_na_data))}
                                              </p>
                                            </div>
                                            {parseFloat(balanceData[account.id!].saldo_na_data) >= 0 ? (
                                              <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
                                            ) : (
                                              <TrendingDown className="h-8 w-8 text-red-600 opacity-20" />
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>

                                      {/* Saldo Atual */}
                                      <Card>
                                        <CardContent className="pt-6">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-sm text-muted-foreground">Saldo Atual</p>
                                              <p className={`text-2xl font-bold ${parseFloat(balanceData[account.id!].saldo_atual) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {formatCurrency(parseFloat(balanceData[account.id!].saldo_atual))}
                                              </p>
                                            </div>
                                            {parseFloat(balanceData[account.id!].saldo_atual) >= 0 ? (
                                              <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
                                            ) : (
                                              <TrendingDown className="h-8 w-8 text-red-600 opacity-20" />
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>

                                      {/* Diferença */}
                                      <Card>
                                        <CardContent className="pt-6">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-sm text-muted-foreground">Diferença</p>
                                              <div className="flex items-center gap-2">
                                                <p className={`text-2xl font-bold ${parseFloat(balanceData[account.id!].diferenca) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                  {formatCurrency(parseFloat(balanceData[account.id!].diferenca))}
                                                </p>
                                                {parseFloat(balanceData[account.id!].diferenca) === 0 && (
                                                  <Badge variant="outline" className="text-xs">
                                                    Zerado
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            {parseFloat(balanceData[account.id!].diferenca) >= 0 ? (
                                              <ArrowUpRight className="h-8 w-8 text-green-600 opacity-20" />
                                            ) : (
                                              <ArrowDownRight className="h-8 w-8 text-red-600 opacity-20" />
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </motion.div>
                {filteredAndSortedAccounts.length > 0 && (
                  <div className="mt-4">
                    {hasActiveFilters() && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Mostrando {filteredAndSortedAccounts.length} de {accounts.length} contas
                      </div>
                    )}
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={totalPages}
                      totalItems={filteredAndSortedAccounts.length}
                      itemsPerPage={pagination.itemsPerPage}
                      onPageChange={pagination.setPage}
                      onItemsPerPageChange={pagination.setItemsPerPage}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Modal de cadastro/edição de conta caixa */}
      <CashAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAccount}
        account={currentAccount}
        title={modalTitle}
      />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conta <span className="font-bold">{currentAccount?.account}</span>? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
