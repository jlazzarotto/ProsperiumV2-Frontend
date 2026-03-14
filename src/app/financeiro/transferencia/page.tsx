"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeftRight, Plus, XCircle, Pencil, Trash2, Search, Eye } from "lucide-react"
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
import { getAllTransfers, deleteTransfer } from "@/app/services/transfer-api-service"
import { authService } from "@/app/services/auth-service"
import { useAuth } from "@/app/contexts/auth-context"
import { TransferModal } from "@/components/transfer-modal"
import { TransferDetailsModal } from "@/components/transfer-details-modal"
import type { Transfer } from "@/types/types"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import customToast from "@/components/ui/custom-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"

export default function TransfersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, hasPermission } = useAuth()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentTransfer, setCurrentTransfer] = useState<Transfer | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("Nova Transferência")
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [shouldReturnToLancamentos, setShouldReturnToLancamentos] = useState(false)

  const goBackToLancamentosIfNeeded = useCallback(() => {
    if (shouldReturnToLancamentos && typeof window !== "undefined") {
      window.history.go(-1)
    }
  }, [shouldReturnToLancamentos])

  // Pagination hook
  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "date",
    defaultSortOrder: "desc",
  })

  // Carregar transferências
  const fetchTransfers = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔄 Buscando transferências...')
      const transfersResponse = await getAllTransfers(1, 0) // 0 = sem limite
      console.log('✅ Resposta da API:', transfersResponse)
      
      if (transfersResponse && transfersResponse.data) {
        setTransfers(transfersResponse.data)
        console.log('📋 Transferências carregadas:', transfersResponse.data.length)
      } else {
        console.log('⚠️ Nenhum dado retornado da API')
        setTransfers([])
      }
    } catch (err) {
      console.error("❌ Erro ao carregar transferências:", err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Falha ao carregar dados: ${errorMessage}`)
      setTransfers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Só carregar dados se estiver autenticado
    if (user) {
      fetchTransfers()
    } else {
      console.log('⚠️ Usuário não autenticado, não carregando dados')
      setLoading(false)
      setError('Usuário não autenticado')
    }
  }, [user])

  useEffect(() => {
    if (loading) return

    const action = searchParams.get("action")
    const transferId = searchParams.get("id")
    const from = searchParams.get("from")
    if (!action || !transferId) return

    if (from === "lancamentos") {
      setShouldReturnToLancamentos(true)
    }

    const transfer = transfers.find(t => String(t.id) === String(transferId))
    if (!transfer) return

    if (action === "edit") {
      handleEditTransfer(transfer)
    } else if (action === "view") {
      handleViewDetails(transfer)
    } else if (action === "delete") {
      setCurrentTransfer(transfer)
      setIsDeleteDialogOpen(true)
    }

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("action")
    nextParams.delete("id")
    nextParams.delete("from")
    const nextUrl = nextParams.toString()
      ? `/financeiro/transferencia?${nextParams.toString()}`
      : "/financeiro/transferencia"
    router.replace(nextUrl)
  }, [loading, searchParams, transfers, router])

  // Filtrar e ordenar transferências
  const filteredAndSortedTransfers = useMemo(() => {
    let filtered = transfers

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = transfers.filter(
        (transfer) =>
          transfer.code?.toLowerCase().includes(searchLower) ||
          transfer.description?.toLowerCase().includes(searchLower) ||
          transfer.origem?.toLowerCase().includes(searchLower) ||
          transfer.destino?.toLowerCase().includes(searchLower)
      )
    }

    if (!pagination.sortBy) return filtered

    return [...filtered].sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[pagination.sortBy] ?? ""
      const bValue = (b as unknown as Record<string, unknown>)[pagination.sortBy] ?? ""

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return pagination.sortOrder === "asc" ? comparison : -comparison
    })
  }, [transfers, searchTerm, pagination.sortBy, pagination.sortOrder])

  const { paginatedData: paginatedTransfers, totalPages } = useMemo(() => {
    return pagination.paginateData(filteredAndSortedTransfers)
  }, [filteredAndSortedTransfers, pagination])

  const handleAddTransfer = () => {
    setCurrentTransfer(undefined)
    setModalTitle("Nova Transferência")
    setIsModalOpen(true)
  }

  const handleEditTransfer = (transfer: Transfer) => {
    setCurrentTransfer(transfer)
    setModalTitle("Editar Transferência")
    setIsModalOpen(true)
  }

  const handleDeleteTransfer = (transfer: Transfer) => {
    setCurrentTransfer(transfer)
    setIsDeleteDialogOpen(true)
  }

  const handleViewDetails = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setIsDetailsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentTransfer?.id) return

    setLoading(true)
    let deleted = false
    try {
      await deleteTransfer(currentTransfer.id)
      await fetchTransfers()
      deleted = true
      customToast.success("Transferência excluída com sucesso!")
    } catch (err) {
      console.error("Erro ao excluir transferência:", err)
      customToast.error("Erro ao excluir transferência")
    } finally {
      setLoading(false)
      setIsDeleteDialogOpen(false)
      if (deleted) {
        goBackToLancamentosIfNeeded()
      }
    }
  }

  const handleTransferModalClose = useCallback(() => {
    setIsModalOpen(false)
    goBackToLancamentosIfNeeded()
  }, [goBackToLancamentosIfNeeded])

  const handleTransferModalSave = useCallback(async () => {
    await fetchTransfers()
    goBackToLancamentosIfNeeded()
  }, [goBackToLancamentosIfNeeded])

  const handleTransferDetailsClose = useCallback(() => {
    setIsDetailsModalOpen(false)
    goBackToLancamentosIfNeeded()
  }, [goBackToLancamentosIfNeeded])

  const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      goBackToLancamentosIfNeeded()
    }
  }, [goBackToLancamentosIfNeeded])

  const handleDeleteDialogCancel = useCallback(() => {
    setIsDeleteDialogOpen(false)
    goBackToLancamentosIfNeeded()
  }, [goBackToLancamentosIfNeeded])

  const clearSearch = () => {
    setSearchTerm("")
  }

  // Função de teste para fazer login automático (apenas dev)
  const testLogin = async () => {
    try {
      console.log('🔐 Fazendo login de teste...')
      const response = await authService.login("root@prosperium.com", "123456")
      console.log("✅ Login de teste realizado com sucesso!", response)
      
      // Aguardar um pouco para o contexto atualizar
      setTimeout(() => {
        fetchTransfers()
      }, 500)
    } catch (error) {
      console.error("❌ Erro no login de teste:", error)
      customToast.error("Erro no login de teste")
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-4">
              <motion.div variants={cardVariants}>
                <Card>
                  <motion.div variants={itemVariants}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-3">
                        {/* Título */}
                        <CardTitle className="text-2xl font-bold flex items-center text-blue-600 whitespace-nowrap">
                          <ArrowLeftRight className="mr-2 w-8 h-8" />
                          <span className="font-medium text-3xl">Transferências Entre Contas</span>
                        </CardTitle>

                        {/* Campo de pesquisa centralizado */}
                        <div className="flex-1 flex justify-center">
                          <div className="relative w-[400px]">
                            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                              {!searchTerm && <Search className="h-4 w-4 text-muted-foreground" />}
                              {!searchTerm && <span className="text-muted-foreground text-sm">Pesquisar</span>}
                            </div>
                            <Input
                              placeholder=" "
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full border-0 bg-slate-200 dark:bg-slate-800 px-10 text-center focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {searchTerm ? (
                                <Button variant="ghost" size="icon" onClick={clearSearch} className="h-6 w-6 p-0">
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {hasPermission('financeiro.transferencia', 'criar_editar') && (
                          <Button onClick={handleAddTransfer} className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Transferência
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                  </motion.div>

                  <CardContent>
                    <motion.div variants={itemVariants} className="rounded-md p-2 border mt-5">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <SortableTableHead
                              field="date"
                              label="Data"
                              currentSortBy={pagination.sortBy}
                              currentSortOrder={pagination.sortOrder}
                              onSort={pagination.setSorting}
                            />
                            <SortableTableHead
                              field="originAccountId"
                              label="Origem"
                              currentSortBy={pagination.sortBy}
                              currentSortOrder={pagination.sortOrder}
                              onSort={pagination.setSorting}
                            />
                            <SortableTableHead
                              field="destinationAccountId"
                              label="Destino"
                              currentSortBy={pagination.sortBy}
                              currentSortOrder={pagination.sortOrder}
                              onSort={pagination.setSorting}
                            />
                            <SortableTableHead
                              field="value"
                              label="Valor"
                              currentSortBy={pagination.sortBy}
                              currentSortOrder={pagination.sortOrder}
                              onSort={pagination.setSorting}
                            />
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <span>Carregando transferências...</span>
                              </TableCell>
                            </TableRow>
                          ) : error ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10 text-red-500">
                                <div className="space-y-4">
                                  <p>{error}</p>
                                  {process.env.NODE_ENV === 'development' && (
                                    <Button 
                                      onClick={testLogin}
                                      variant="outline"
                                      size="sm"
                                    >
                                      🔧 Login de Teste (DEV)
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : filteredAndSortedTransfers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                <div className="space-y-4">
                                  <p>Nenhuma transferência encontrada.</p>
                                  {process.env.NODE_ENV === 'development' && !user && (
                                    <Button 
                                      onClick={testLogin}
                                      variant="outline"
                                      size="sm"
                                    >
                                      🔧 Login de Teste (DEV)
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedTransfers.map((transfer) => (
                              <TableRow key={transfer.id || `transfer-${Math.random()}`}>
                                <TableCell>
                                  {transfer.date ? format(new Date(transfer.date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {transfer.origem ? (
                                    <span className="text-green-600 font-medium">
                                      {transfer.origem}
                                    </span>
                                  ) : (
                                    <span className="text-red-500 text-sm">
                                      ⚠️ Conta {transfer.originAccountId} não encontrada
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {transfer.destino ? (
                                    <span className="text-green-600 font-medium">
                                      {transfer.destino}
                                    </span>
                                  ) : (
                                    <span className="text-red-500 text-sm">
                                      ⚠️ Conta {transfer.destinationAccountId} não encontrada
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 whitespace-nowrap hover:bg-blue-100 dark:hover:bg-blue-900/30">{transfer.value}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewDetails(transfer)}
                                      className="h-8 w-8"
                                      title="Ver detalhes dos lançamentos"
                                    >
                                      <Eye className="h-4 w-4 text-green-600" />
                                    </Button>
                                    {hasPermission('financeiro.transferencia', 'criar_editar') && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditTransfer(transfer)}
                                        className="h-8 w-8"
                                      >
                                        <Pencil className="h-4 w-4 text-blue-600" />
                                      </Button>
                                    )}
                                    {hasPermission('financeiro.transferencia', 'deletar') && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTransfer(transfer)}
                                        className="h-8 w-8"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </motion.div>
                    {filteredAndSortedTransfers.length > 0 && (
                      <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={totalPages}
                        totalItems={filteredAndSortedTransfers.length}
                        itemsPerPage={pagination.itemsPerPage}
                        onPageChange={pagination.setPage}
                        onItemsPerPageChange={pagination.setItemsPerPage}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal de cadastro/edição de transferência */}
      <TransferModal
        isOpen={isModalOpen}
        onClose={handleTransferModalClose}
        onSave={handleTransferModalSave}
        transfer={currentTransfer}
        title={modalTitle}
      />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a transferência <span className="font-bold">{currentTransfer?.code}</span>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteDialogCancel}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes da transferência */}
      <TransferDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleTransferDetailsClose}
        transfer={selectedTransfer}
      />
    </>
  )
}
