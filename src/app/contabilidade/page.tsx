/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Loader2,
  Plus,
  Search,
  XCircle,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  LayoutGrid,
  FileText,
  Filter,
} from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getAllAccountingAccounts,
  getAnalyticAccountingAccounts,
  createAccountingAccount,
  updateAccountingAccount,
  deleteAccountingAccount,
  getAccountingAccountByCode,
  toggleExibirLancamentos,
} from "@/app/services/accounting-account-service"
import {
  getTransactionTypesWithPagination,
  createTransactionType,
  updateTransactionType,
  deleteTransactionType,
} from "@/app/services/transaction-type-service"
import type { AccountingAccount, TransactionType } from "@/types/types"
import { useAuth } from "@/app/contexts/auth-context"
import { motion } from "framer-motion"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"

// Interface para a estrutura hierárquica de contas
interface HierarchicalAccount extends AccountingAccount {
  children: HierarchicalAccount[]
}

export default function ContabilidadePage(): React.ReactNode {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState("contas-contabeis")
  const [accounts, setAccounts] = useState<AccountingAccount[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<AccountingAccount[]>([])
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([])
  const [filteredTransactionTypes, setFilteredTransactionTypes] = useState<TransactionType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTransactionTypeModalOpen, setIsTransactionTypeModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleteTransactionTypeDialogOpen, setIsDeleteTransactionTypeDialogOpen] = useState(false)
  const [currentAccount, setCurrentAccount] = useState<AccountingAccount | null>(null)
  const [currentTransactionType, setCurrentTransactionType] = useState<TransactionType | null>(null)
  const [formData, setFormData] = useState<AccountingAccount>({
    code: "",
    description: "",
    parentAccountCode: "",
    parentAccountId: "",
    taxRegime: "normal",
    accountType: "sintetica",
    accountNature: "credora",
    isActive: true,
    startDate: new Date(),
    guidelines: "",
    integrationId: null,
  })
  const [transactionTypeFormData, setTransactionTypeFormData] = useState<TransactionType>({
    code: "",
    description: "",
    type: "entrada",
    taxRegime: "todos",
    sourceAccountId: "",
    sourceAccountCode: "",
    targetAccountId: "",
    targetAccountCode: "",
    isActive: true,
    guidelines: "",
  })
  const [hierarchicalAccounts, setHierarchicalAccounts] = useState<HierarchicalAccount[]>([])
  const [analyticAccounts, setAnalyticAccounts] = useState<AccountingAccount[]>([])
  const [filteredAnalyticalAccounts, setFilteredAnalyticalAccounts] = useState<AccountingAccount[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [regimeFilter, setRegimeFilter] = useState<string | null>(null)
  const [showOnlyAnaliticas, setShowOnlyAnaliticas] = useState(false)
  const [showContasResultado, setShowContasResultado] = useState(false)

  const [typesPage, setTypesPage] = useState(1)
  const [typesTotal, setTypesTotal] = useState(0)
  const TYPES_PER_PAGE = 15

  const typesPagination = usePagination({
    defaultItemsPerPage: TYPES_PER_PAGE,
    defaultSortBy: "description",
    defaultSortOrder: "asc",
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async (): Promise<void> => {
    setLoading(true)
    try {
      const [data, analyticData] = await Promise.all([
        getAllAccountingAccounts(),
        getAnalyticAccountingAccounts(),
      ])
      setAccounts(data)
      setFilteredAccounts(data)
      setAnalyticAccounts(analyticData)
      filterAnalyticalAccounts(transactionTypeFormData.taxRegime, analyticData)

      // Organizar contas em estrutura hierárquica
      const hierarchical = organizeAccountsHierarchically(data)
      setHierarchicalAccounts(hierarchical)
    } catch (error) {
      console.error("Erro ao carregar contas contábeis:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactionTypes = async (page = 1, search = ""): Promise<void> => {
    setLoading(true)
    try {
      const result = await getTransactionTypesWithPagination(page, TYPES_PER_PAGE, search)
      setTransactionTypes(result.data)
      setFilteredTransactionTypes(result.data)
      setTypesTotal(result.pagination.total)
      setTypesPage(page)
    } catch (error) {
      console.error("Erro ao carregar tipos de lançamento:", error)
    } finally {
      setLoading(false)
    }
  }

  const organizeAccountsHierarchically = (accounts: AccountingAccount[]): HierarchicalAccount[] => {
    const buildTree = (parentCode: string | null): HierarchicalAccount[] => {
      const children = accounts.filter((account) =>
        parentCode ? account.parentAccountCode === parentCode : !account.parentAccountCode,
      )

      return children.map((child) => ({
        ...child,
        children: buildTree(child.code),
      }))
    }

    return buildTree(null)
  }

  const toggleNodeExpansion = (code: string): void => {
    const newExpandedNodes = new Set(expandedNodes)
    if (newExpandedNodes.has(code)) {
      newExpandedNodes.delete(code)
    } else {
      newExpandedNodes.add(code)
    }
    setExpandedNodes(newExpandedNodes)
  }

  const renderAccountTree = (accounts: HierarchicalAccount[], level = 0): React.ReactNode => {
    return accounts.map((account) => {
      const hasChildren = account.children && account.children.length > 0
      const isExpanded = expandedNodes.has(account.code)

      return (
        <React.Fragment key={account.id || `account-${Math.random()}`}>
          <TableRow className={level > 0 ? "bg-slate-50/50 dark:bg-slate-900/30" : ""}>
            <TableCell style={{ paddingLeft: `${level * 20 + 12}px` }}>
              <div className="flex items-center gap-2">
                {hasChildren ? (
                  <button
                    onClick={() => toggleNodeExpansion(account.code)}
                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  </div>
                )}
                <span className="font-medium text-blue-700 dark:text-blue-400">{account.code}</span>
              </div>
            </TableCell>
            <TableCell className="font-medium">{account.description}</TableCell>
            <TableCell>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${account.accountType === "sintetica"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  }`}
              >
                {account.accountType === "sintetica" ? "Sintética" : "Analítica"}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${account.isActive ? "bg-blue-600" : "bg-gray-400"}`} />
                <span className={account.isActive ? "text-blue-600" : "text-gray-500"}>
                  {account.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              {account.accountType === "analitica" ? (
                <Switch
                  checked={account.exibirLancamentos ?? true}
                  onCheckedChange={(v) => handleToggleExibir(account, v)}
                />
              ) : (
                <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {hasPermission('configuracoes.contabilidade', 'criar_editar') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditAccount(account)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </Button>
                )}
                {hasPermission('configuracoes.contabilidade', 'deletar') && (
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
          </TableRow>

          {hasChildren && isExpanded && renderAccountTree(account.children, level + 1)}
        </React.Fragment>
      )
    })
  }

  // Pesquisa em tempo real
  useEffect(() => {
    if (activeTab === "contas-contabeis") {
      handleRealTimeSearch()
    } else {
      handleRealTimeSearchTransactionTypes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, activeTab])

  useEffect(() => {
    handleRealTimeSearch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, showOnlyAnaliticas, showContasResultado])


  const handleRealTimeSearch = async (): Promise<void> => {
    setIsSearching(true)
    try {
      let filtered = accounts.filter(
        (account) =>
          account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )

      // Filtro "Contas de Resultado": exclui grupos 1 (Ativo) e 2 (Passivo/PL)
      if (showContasResultado) {
        filtered = filtered.filter((account) => {
          const rootSegment = account.code.split(".")[0]
          return rootSegment !== "1" && rootSegment !== "2"
        })
      }

      if (showOnlyAnaliticas) {
        // Modo flat: filtrar só analíticas, não reconstruir árvore
        const analiticas = filtered.filter((account) => account.accountType === "analitica")
        setFilteredAccounts(analiticas)
      } else {
        setFilteredAccounts(filtered)

        const hierarchical = organizeAccountsHierarchically(filtered)
        setHierarchicalAccounts(hierarchical)

        if (searchTerm.trim() || showContasResultado) {
          const allCodes = new Set<string>()
          const collectCodes = (items: HierarchicalAccount[]) => {
            items.forEach((a) => {
              allCodes.add(a.code)
              if (a.children?.length) collectCodes(a.children)
            })
          }
          collectCodes(hierarchical)
          setExpandedNodes(allCodes)
        }
      }
    } catch (error) {
      console.error("Erro na pesquisa:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleRealTimeSearchTransactionTypes = async (): Promise<void> => {
    await fetchTransactionTypes(1, searchTerm)
  }

  const clearSearch = (): void => {
    setSearchTerm("")
    setTypeFilter(null)
    setRegimeFilter(null)
    setShowOnlyAnaliticas(false)
    setShowContasResultado(false)

    if (activeTab === "contas-contabeis") {
      setFilteredAccounts(accounts)
      setHierarchicalAccounts(organizeAccountsHierarchically(accounts))
    } else {
      fetchTransactionTypes(1, "")
    }
  }

  const handleAddAccount = (): void => {
    setCurrentAccount(null)
    setFormData({
      code: "",
      description: "",
      parentAccountCode: "",
      parentAccountId: "",
      taxRegime: "normal",
      accountType: "sintetica",
      accountNature: "credora",
      isActive: true,
      startDate: new Date(),
      guidelines: "",
      integrationId: null,
    })
    setIsModalOpen(true)
  }

  const handleAddTransactionType = (): void => {
    setCurrentTransactionType(null)
    setTransactionTypeFormData({
      code: "",
      description: "",
      type: "entrada",
      taxRegime: "todos",
      sourceAccountId: "",
      sourceAccountCode: "",
      targetAccountId: "",
      targetAccountCode: "",
      isActive: true,
      guidelines: "",
    })
    filterAnalyticalAccounts("todos")
    setIsTransactionTypeModalOpen(true)
  }

  const handleEditAccount = (account: AccountingAccount): void => {
    setCurrentAccount(account)
    setFormData({
      ...account,
      startDate: account.startDate instanceof Date ? account.startDate : new Date(account.startDate),
    })
    setIsModalOpen(true)
  }

  const handleEditTransactionType = (type: TransactionType): void => {
    setCurrentTransactionType(type)
    setTransactionTypeFormData({
      ...type,
    })
    filterAnalyticalAccounts(type.taxRegime)
    setIsTransactionTypeModalOpen(true)
  }

  const handleDeleteAccount = (account: AccountingAccount): void => {
    setCurrentAccount(account)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteTransactionType = (type: TransactionType): void => {
    setCurrentTransactionType(type)
    setIsDeleteTransactionTypeDialogOpen(true)
  }

  const applyCodeMask = (value: string): string => {
    const cleanedValue = value.replace(/[^\d.]/g, "")
    if (!cleanedValue) return ""

    const parts = cleanedValue.split(".")
    let result = parts[0] || ""

    if (parts.length > 1) result += "." + parts[1]
    if (parts.length > 2) result += "." + parts[2]
    if (parts.length > 3) result += "." + parts[3]
    if (parts.length > 4) result += "." + parts[4]
    if (parts.length > 5) result += "." + parts[5]

    return result
  }

  const extractParentCode = (code: string): string => {
    const codeParts = code.split(".")
    if (codeParts.length <= 1) return ""
    return codeParts.slice(0, -1).join(".")
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target
    const maskedValue = applyCodeMask(value)
    const parentCode = extractParentCode(maskedValue)

    setFormData((prev) => ({
      ...prev,
      code: maskedValue,
      parentAccountCode: parentCode,
    }))

    if (parentCode) {
      findParentAccountId(parentCode)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target

    if (name === "code") {
      handleCodeChange(e as React.ChangeEvent<HTMLInputElement>)
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTransactionTypeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target
    setTransactionTypeFormData((prev) => ({ ...prev, [name]: value }))
  }

  const findParentAccountId = async (parentCode: string): Promise<void> => {
    if (!parentCode) {
      setFormData((prev) => ({ ...prev, parentAccountId: "" }))
      return
    }

    try {
      const parentAccount = accounts.find((acc) => acc.code === parentCode)

      if (parentAccount) {
        setFormData((prev) => ({ ...prev, parentAccountId: parentAccount.id || "" }))
      } else {
        const fetchedParent = await getAccountingAccountByCode(parentCode)
        if (fetchedParent) {
          setFormData((prev) => ({ ...prev, parentAccountId: fetchedParent.id || "" }))
        } else {
          setFormData((prev) => ({ ...prev, parentAccountId: "" }))
        }
      }
    } catch (error) {
      console.error("Erro ao buscar conta pai:", error)
      setFormData((prev) => ({ ...prev, parentAccountId: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTransactionTypeSelectChange = (name: string, value: string): void => {
    if (name === "taxRegime") {
      filterAnalyticalAccounts(value)

      setTransactionTypeFormData((prev): any => ({
        ...prev,
        [name]: value,
        sourceAccountId: "",
        sourceAccountCode: "",
        targetAccountId: "",
        targetAccountCode: "",
      }))
    } else {
      setTransactionTypeFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSourceAccountChange = (accountId: string): void => {
    const selectedAccount = filteredAnalyticalAccounts.find((acc) => acc.id === accountId)

    if (selectedAccount) {
      setTransactionTypeFormData((prev) => ({
        ...prev,
        sourceAccountId: accountId,
        sourceAccountCode: selectedAccount.code,
      }))
    }
  }

  const handleTargetAccountChange = (accountId: string): void => {
    const selectedAccount = filteredAnalyticalAccounts.find((acc) => acc.id === accountId)

    if (selectedAccount) {
      setTransactionTypeFormData((prev) => ({
        ...prev,
        targetAccountId: accountId,
        targetAccountCode: selectedAccount.code,
      }))
    }
  }

  const filterAnalyticalAccounts = (taxRegime: string, sourceAccounts = analyticAccounts): void => {
    const analyticalAccounts = sourceAccounts.filter((account) => {
      if (taxRegime !== "todos" && account.taxRegime !== taxRegime) return false
      const codeParts = account.code.split(".")
      return codeParts.length >= 3
    })

    setFilteredAnalyticalAccounts(analyticalAccounts)
  }

  const handleSwitchChange = (checked: boolean): void => {
    setFormData((prev) => ({ ...prev, isActive: checked }))
  }

  const handleTransactionTypeSwitchChange = (checked: boolean): void => {
    setTransactionTypeFormData((prev) => ({ ...prev, isActive: checked }))
  }

  const dateInputRef = useRef<HTMLInputElement>(null)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    try {
      const dateValue = e.target.value

      if (!dateValue) {
        setFormData((prev) => ({ ...prev, startDate: new Date() }))
        return
      }

      const date = new Date(dateValue + "T00:00:00")

      if (isNaN(date.getTime())) {
        throw new Error("Data inválida")
      }

      setFormData((prev) => ({ ...prev, startDate: date }))
    } catch (error) {
      console.error("Erro ao processar a data:", error)
      setFormData((prev) => ({ ...prev, startDate: prev.startDate || new Date() }))
    }
  }

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return ""

    try {
      const validDate = date instanceof Date ? date : new Date(date)

      if (isNaN(validDate.getTime())) {
        return ""
      }

      return format(validDate, "yyyy-MM-dd")
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return ""
    }
  }

  const validateAccountCode = (): boolean => {
    const codePattern =
      /^(\d+|\d+\.\d+|\d+\.\d+\.\d+|\d+\.\d+\.\d+\.\d+|\d+\.\d+\.\d+\.\d+\.\d+|\d+\.\d+\.\d+\.\d+\.\d+\.\d+)$/

    if (!codePattern.test(formData.code)) {
      return false
    }

    return true
  }

  const validateTransactionTypeForm = (): boolean => {
    if (!transactionTypeFormData.description) {
      return false
    }

    if (!transactionTypeFormData.sourceAccountId) {
      return false
    }

    if (!transactionTypeFormData.targetAccountId) {
      return false
    }

    return true
  }

  const ensureParentAccountExists = async (parentCode: string): Promise<any> => {
    const parentExists = accounts.some((acc) => acc.code === parentCode)

    if (parentExists) {
      const existingParent = accounts.find((acc) => acc.code === parentCode)
      return existingParent?.id || ""
    }

    const fetchedParent = await getAccountingAccountByCode(parentCode)
    if (fetchedParent) {
      return fetchedParent.id || ""
    }

    console.log(`Conta superior ${parentCode} não existe. Criando automaticamente...`)

    const grandParentCode = extractParentCode(parentCode)
    let grandParentId = ""

    if (grandParentCode) {
      grandParentId = await ensureParentAccountExists(grandParentCode)
    }

    const newParentAccount: AccountingAccount = {
      code: parentCode,
      description: `Conta ${parentCode} (Criada automaticamente)`,
      parentAccountCode: grandParentCode,
      parentAccountId: grandParentId,
      taxRegime: "normal",
      accountType: "sintetica",
      accountNature: "credora",
      isActive: true,
      startDate: new Date(),
      guidelines: "Conta criada automaticamente pelo sistema",
      integrationId: null,
    }

    await createAccountingAccount(newParentAccount)
    console.log(`Conta superior ${parentCode} criada com sucesso.`)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!validateAccountCode()) {
      return
    }

    setLoading(true)

    try {
      if (formData.parentAccountCode) {
        const parentId = await ensureParentAccountExists(formData.parentAccountCode)
        setFormData((prev) => ({ ...prev, parentAccountId: parentId }))
      }

      if (currentAccount?.id) {
        await updateAccountingAccount(currentAccount.id, formData)
      } else {
        await createAccountingAccount(formData)
      }
      setIsModalOpen(false)
      fetchAccounts()
    } catch (error) {
      console.error("Erro ao salvar conta contábil:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionTypeSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!validateTransactionTypeForm()) {
      return
    }

    setLoading(true)

    try {
      if (currentTransactionType?.id) {
        await updateTransactionType(currentTransactionType.id, transactionTypeFormData)
      } else {
        await createTransactionType(transactionTypeFormData)
      }
      setIsTransactionTypeModalOpen(false)
      fetchTransactionTypes(typesPage, searchTerm)
    } catch (error) {
      console.error("Erro ao salvar tipo de lançamento:", error)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async (): Promise<void> => {
    if (!currentAccount?.id) return

    setLoading(true)
    try {
      await deleteAccountingAccount(currentAccount.id)
      setIsDeleteDialogOpen(false)
      fetchAccounts()
    } catch (error) {
      console.error("Erro ao excluir conta contábil:", error)
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteTransactionType = async (): Promise<void> => {
    if (!currentTransactionType?.id) return

    setLoading(true)
    try {
      await deleteTransactionType(currentTransactionType.id)
      setIsDeleteTransactionTypeDialogOpen(false)
      fetchTransactionTypes(typesPage, searchTerm)
    } catch (error) {
      console.error("Erro ao excluir tipo de lançamento:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleExibir = async (account: AccountingAccount, value: boolean): Promise<void> => {
    if (!account.id) return
    try {
      await toggleExibirLancamentos(account.id, value)
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, exibirLancamentos: value } : a))
    } catch {
      console.error("Erro ao alterar flag exibir_lancamentos")
    }
  }

  const expandAllNodes = (): void => {
    const allCodes = new Set<string>()

    const collectCodes = (accounts: HierarchicalAccount[]) => {
      accounts.forEach((account) => {
        allCodes.add(account.code)
        if (account.children && account.children.length > 0) {
          collectCodes(account.children)
        }
      })
    }

    collectCodes(hierarchicalAccounts)
    setExpandedNodes(allCodes)
  }

  const collapseAllNodes = (): void => {
    setExpandedNodes(new Set())
  }

  // Filter and sort transaction types
  const filteredAndSortedTypes = useMemo(() => {
    const filtered = [...filteredTransactionTypes]

    if (!typesPagination.sortBy) return filtered

    return [...filtered].sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[typesPagination.sortBy] ?? ""
      const bValue = (b as unknown as Record<string, unknown>)[typesPagination.sortBy] ?? ""

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        comparison = aValue === bValue ? 0 : aValue ? -1 : 1
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return typesPagination.sortOrder === "asc" ? comparison : -comparison
    })
  }, [filteredTransactionTypes, typesPagination.sortBy, typesPagination.sortOrder])

  const { paginatedData: paginatedTypes, totalPages: typesTotalPages } = useMemo(() => {
    return typesPagination.paginateData(filteredAndSortedTypes)
  }, [filteredAndSortedTypes, typesPagination])

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

  return (
    <>
      <MainHeader />
      <div className="bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto py-6">
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="ml-2 text-2xl font-light flex items-center text-blue-600">
                      <BookOpen className="mr-2 w-8 h-8" />
                      <span className="text-3xl font-medium">Contabilidade</span>
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
                    {hasPermission('configuracoes.contabilidade', 'criar_editar') && (
                      activeTab === "contas-contabeis" ? (
                        <Button onClick={handleAddAccount} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Conta
                        </Button>
                      ) : (
                        <Button onClick={handleAddTransactionType} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Tipo
                        </Button>
                      )
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="w-full">
                    {/* Tab Navigation */}
                    <div className="flex gap-1 mb-4 border-b border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setActiveTab("contas-contabeis")}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === "contas-contabeis" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"}`}
                      >
                        Contas Contábeis
                      </button>
                      <button
                        onClick={() => setActiveTab("tipos-lancamento")}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === "tipos-lancamento" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"}`}
                      >
                        Tipos de Lançamento
                      </button>
                    </div>

                    {activeTab === "contas-contabeis" && <><div className="flex gap-2 mb-4">
                        <Button variant="outline" size="sm" onClick={expandAllNodes}>
                          <ChevronDown className="h-3.5 w-3.5 mr-1" />
                          Expandir
                        </Button>
                        <Button variant="outline" size="sm" onClick={collapseAllNodes}>
                          <ChevronRight className="h-3.5 w-3.5 mr-1" />
                          Colapsar
                        </Button>
                        <Button
                          variant={showContasResultado ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowContasResultado(!showContasResultado)}
                          className={showContasResultado ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                        >
                          <Filter className="h-3.5 w-3.5 mr-1" />
                          Contas de Resultado
                          {showContasResultado && (
                            <span className="ml-1.5 bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {filteredAccounts.length}
                            </span>
                          )}
                        </Button>
                        <Button
                          variant={showOnlyAnaliticas ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowOnlyAnaliticas(!showOnlyAnaliticas)}
                          className={showOnlyAnaliticas ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        >
                          <Filter className="h-3.5 w-3.5 mr-1" />
                          Somente Analíticas
                          {showOnlyAnaliticas && (
                            <span className="ml-1.5 bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {filteredAccounts.length}
                            </span>
                          )}
                        </Button>
                      </div>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Código</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>{showOnlyAnaliticas ? "Tipo / Natureza" : "Tipo"}</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Escriturável</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                  <span>Carregando contas contábeis...</span>
                                </TableCell>
                              </TableRow>
                            ) : showOnlyAnaliticas ? (
                              filteredAccounts.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                    Nenhuma conta analítica encontrada.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredAccounts
                                  .slice()
                                  .sort((a, b) => a.code.localeCompare(b.code))
                                  .map((account) => (
                                    <TableRow key={account.id || account.code}>
                                      <TableCell>
                                        <span className="font-medium text-blue-700 dark:text-blue-400">{account.code}</span>
                                      </TableCell>
                                      <TableCell className="font-medium">{account.description}</TableCell>
                                      <TableCell>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                          Analítica
                                        </span>
                                        {account.accountNature && (
                                          <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${account.accountNature === "credora" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"}`}>
                                            {account.accountNature === "credora" ? "Credora" : "Devedora"}
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${account.isActive ? "bg-blue-600" : "bg-gray-400"}`} />
                                          <span className={account.isActive ? "text-blue-600" : "text-gray-500"}>
                                            {account.isActive ? "Ativo" : "Inativo"}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Switch
                                          checked={account.exibirLancamentos ?? true}
                                          onCheckedChange={(v) => handleToggleExibir(account, v)}
                                        />
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          {hasPermission('configuracoes.contabilidade', 'criar_editar') && (
                                            <Button variant="ghost" size="icon" onClick={() => handleEditAccount(account)} className="h-8 w-8">
                                              <Pencil className="h-4 w-4 text-blue-600" />
                                            </Button>
                                          )}
                                          {hasPermission('configuracoes.contabilidade', 'deletar') && (
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(account)} className="h-8 w-8">
                                              <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))
                              )
                            ) : hierarchicalAccounts.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                  Nenhuma conta contábil encontrada.
                                </TableCell>
                              </TableRow>
                            ) : (
                              renderAccountTree(hierarchicalAccounts)
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </>}
                    {activeTab === "tipos-lancamento" && <div>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <SortableTableHead
                                field="description"
                                label="Descrição"
                                currentSortBy={typesPagination.sortBy}
                                currentSortOrder={typesPagination.sortOrder}
                                onSort={typesPagination.setSorting}
                              />
                              <TableHead>Conta Contábil</TableHead>
                              <SortableTableHead
                                field="type"
                                label="Tipo"
                                currentSortBy={typesPagination.sortBy}
                                currentSortOrder={typesPagination.sortOrder}
                                onSort={typesPagination.setSorting}
                              />
                              <SortableTableHead
                                field="isActive"
                                label="Status"
                                currentSortBy={typesPagination.sortBy}
                                currentSortOrder={typesPagination.sortOrder}
                                onSort={typesPagination.setSorting}
                              />
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                  <span>Carregando tipos de lançamento...</span>
                                </TableCell>
                              </TableRow>
                            ) : filteredTransactionTypes.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                  Nenhum tipo de lançamento encontrado.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTransactionTypes.map((type) => {
                                // Buscar informações da conta contábil principal (apenas contas não deletadas)
                                const sourceAccount = accounts.find(acc => acc.id === type.sourceAccountId)
                                
                                return (
                                  <TableRow key={type.id}>
                                    <TableCell className="font-medium">{type.description}</TableCell>
                                    <TableCell>
                                      {sourceAccount ? `${sourceAccount.code} - ${sourceAccount.description}` : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${type.type === "entrada"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                          : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                          }`}
                                      >
                                        {type.type === "entrada" ? "Entrada" : "Saída"}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-2 h-2 rounded-full ${type.isActive ? "bg-blue-600" : "bg-gray-400"
                                            }`}
                                        />
                                        <span className={type.isActive ? "text-blue-600" : "text-gray-500"}>
                                          {type.isActive ? "Ativo" : "Inativo"}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        {hasPermission('configuracoes.contabilidade', 'criar_editar') && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditTransactionType(type)}
                                            className="h-8 w-8"
                                          >
                                            <Pencil className="h-4 w-4 text-blue-600" />
                                          </Button>
                                        )}
                                        {hasPermission('configuracoes.contabilidade', 'deletar') && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTransactionType(type)}
                                            className="h-8 w-8"
                                          >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {typesTotal > 0 && (
                        <Pagination
                          currentPage={typesPage}
                          totalPages={Math.ceil(typesTotal / TYPES_PER_PAGE)}
                          totalItems={typesTotal}
                          itemsPerPage={TYPES_PER_PAGE}
                          onPageChange={(page) => fetchTransactionTypes(page, searchTerm)}
                          onItemsPerPageChange={() => {}}
                        />
                      )}
                    </div>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Modal de cadastro/edição de conta contábil */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
          <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-900 dark:text-blue-100">
                {currentAccount ? "Editar Conta Contábil" : "Nova Conta Contábil"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-blue-700 dark:text-blue-300">
              {currentAccount
                ? "Altere os dados da conta contábil conforme necessário."
                : "Preencha os dados para criar uma nova conta contábil."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Card de Código */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  Código da Conta
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-blue-800 dark:text-blue-200 font-medium">Código *</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="x.x.xxx.xxx.xxx.xxx"
                      required
                      className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Formatos aceitos: x, x.x, x.x.xxx, x.x.xxx.xxx, x.x.xxx.xxx.xxx ou x.x.xxx.xxx.xxx.xxx
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentAccountCode" className="text-blue-800 dark:text-blue-200 font-medium">Conta Superior</Label>
                    <Input
                      id="parentAccountCode"
                      name="parentAccountCode"
                      value={formData.parentAccountCode}
                      readOnly
                      className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-700"
                    />
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      A conta superior é determinada automaticamente a partir do código da conta.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card de Descrição */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descrição
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-blue-800 dark:text-blue-200 font-medium">Descrição da Conta *</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Card de Classificação */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Classificação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRegime" className="text-blue-800 dark:text-blue-200 font-medium">Regime Tributário</Label>
                    <Select value={formData.taxRegime} onValueChange={(value) => handleSelectChange("taxRegime", value)}>
                      <SelectTrigger className="border-blue-200 dark:border-blue-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="simplified">Simplificado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType" className="text-blue-800 dark:text-blue-200 font-medium">Tipo</Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value) => handleSelectChange("accountType", value)}
                    >
                      <SelectTrigger className="border-blue-200 dark:border-blue-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sintetica">Sintética</SelectItem>
                        <SelectItem value="analitica">Analítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNature" className="text-blue-800 dark:text-blue-200 font-medium">Natureza</Label>
                    <Select
                      value={formData.accountNature}
                      onValueChange={(value) => handleSelectChange("accountNature", value)}
                    >
                      <SelectTrigger className="border-blue-200 dark:border-blue-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credora">Credora</SelectItem>
                        <SelectItem value="devedora">Devedora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Card de Status e Data */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status e Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-blue-800 dark:text-blue-200 font-medium">Data Início</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      ref={dateInputRef}
                      value={formatDateForInput(formData.startDate)}
                      onChange={handleDateChange}
                      className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="integrationId" className="text-blue-800 dark:text-blue-200 font-medium">ID Integração</Label>
                    <Input
                      id="integrationId"
                      name="integrationId"
                      type="number"
                      value={formData.integrationId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormData((prev) => ({
                          ...prev,
                          integrationId: val === "" ? null : parseInt(val),
                        }))
                      }}
                      placeholder="ID externo"
                      className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isActive" className="text-blue-800 dark:text-blue-200 font-medium block mb-2">
                      Ativo no plano de contas?
                    </Label>
                    <div className="flex items-center space-x-3 h-10 px-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700">
                      <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} className="data-[state=checked]:bg-blue-600" />
                      <Label htmlFor="isActive" className="font-medium cursor-pointer text-blue-900 dark:text-blue-100">
                        {formData.isActive ? "SIM" : "NÃO"}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card de Orientações */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Orientações
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="guidelines" className="text-blue-800 dark:text-blue-200 font-medium">Instruções de Uso</Label>
                  <Textarea
                    id="guidelines"
                    name="guidelines"
                    value={formData.guidelines}
                    onChange={handleInputChange}
                    placeholder="Exemplo: Contas que registram a receita decorrente dos serviços prestados no mercado interno."
                    rows={4}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="shrink-0 border-t border-blue-200 dark:border-blue-800 pt-4 px-6 pb-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de cadastro/edição de tipo de lançamento */}
      <Dialog open={isTransactionTypeModalOpen} onOpenChange={setIsTransactionTypeModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
          <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-blue-600 rounded-lg">
                <LayoutGrid className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-900 dark:text-blue-100">
                {currentTransactionType ? "Editar Tipo de Lançamento" : "Novo Tipo de Lançamento"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-blue-700 dark:text-blue-300">
              {currentTransactionType
                ? "Altere os dados do tipo de lançamento conforme necessário."
                : "Preencha os dados para criar um novo tipo de lançamento."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransactionTypeSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Card de Tipo e Descrição */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Identificação
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-blue-800 dark:text-blue-200 font-medium">Tipo *</Label>
                    <Select
                      value={transactionTypeFormData.type}
                      onValueChange={(value) => handleTransactionTypeSelectChange("type", value)}
                    >
                      <SelectTrigger className="border-blue-200 dark:border-blue-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-blue-800 dark:text-blue-200 font-medium">Descrição *</Label>
                    <Input
                      id="description"
                      name="description"
                      value={transactionTypeFormData.description}
                      onChange={handleTransactionTypeInputChange}
                      placeholder="Ex: Recebimento de Vendas"
                      required
                      className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRegime" className="text-blue-800 dark:text-blue-200 font-medium">Regime Tributário *</Label>
                    <Select
                      value={transactionTypeFormData.taxRegime}
                      onValueChange={(value) => handleTransactionTypeSelectChange("taxRegime", value)}
                    >
                      <SelectTrigger className="border-blue-200 dark:border-blue-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="simplified">Simplificado</SelectItem>
                        <SelectItem value="todos">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Card de Contas Contábeis */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Contas Contábeis
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceAccountId" className="text-blue-800 dark:text-blue-200 font-medium">Conta contábil (origem) *</Label>
                    <SearchableSelect
                      options={filteredAnalyticalAccounts.map((account) => ({
                        value: account.id || "",
                        label: `${account.code} - ${account.description}`,
                      }))}
                      value={transactionTypeFormData.sourceAccountId}
                      onValueChange={handleSourceAccountChange}
                      placeholder="Selecione..."
                      searchPlaceholder="Pesquisar conta contábil..."
                      emptyMessage="Nenhuma conta disponível"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAccountId" className="text-blue-800 dark:text-blue-200 font-medium">Conta contábil (aplicação) *</Label>
                    <SearchableSelect
                      options={filteredAnalyticalAccounts.map((account) => ({
                        value: account.id || "",
                        label: `${account.code} - ${account.description}`,
                      }))}
                      value={transactionTypeFormData.targetAccountId}
                      onValueChange={handleTargetAccountChange}
                      placeholder="Selecione..."
                      searchPlaceholder="Pesquisar conta contábil..."
                      emptyMessage="Nenhuma conta disponível"
                    />
                  </div>
                </div>
              </div>

              {/* Card de Status */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status
                </h3>
                <div className="flex items-center space-x-3 h-10 px-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700">
                  <Switch
                    id="isActive"
                    checked={transactionTypeFormData.isActive}
                    onCheckedChange={handleTransactionTypeSwitchChange}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="isActive" className="font-medium cursor-pointer text-blue-900 dark:text-blue-100">
                    {transactionTypeFormData.isActive ? "Tipo Ativo" : "Tipo Inativo"}
                  </Label>
                </div>
              </div>

              {/* Card de Orientações */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Orientações
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="guidelines" className="text-blue-800 dark:text-blue-200 font-medium">Instruções de Uso</Label>
                  <Textarea
                    id="guidelines"
                    name="guidelines"
                    value={transactionTypeFormData.guidelines}
                    onChange={handleTransactionTypeInputChange}
                    placeholder="Exemplo: Tipo de lançamento para registrar a entrada de receitas provenientes de prestação de serviços."
                    rows={4}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="shrink-0 border-t border-blue-200 dark:border-blue-800 pt-4 px-6 pb-6">
              <Button type="button" variant="outline" onClick={() => setIsTransactionTypeModalOpen(false)} className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão de conta contábil */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a conta contábil <span className="font-bold">{currentAccount?.code}</span> -{" "}
              <span className="font-bold">{currentAccount?.description}</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão de tipo de lançamento */}
      <Dialog open={isDeleteTransactionTypeDialogOpen} onOpenChange={setIsDeleteTransactionTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o tipo de lançamento{" "}
              <span className="font-bold">{currentTransactionType?.description}</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteTransactionTypeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTransactionType} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
