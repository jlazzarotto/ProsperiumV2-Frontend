"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  Anchor,
  Plus,
  Pencil,
  Trash2,
  XCircle,
  Ship,
  Building2,
  CheckCircle2,
  FileText,
  RefreshCw,
  MoreHorizontal,
  Clock,
  Search,
  AlertCircle,
} from "lucide-react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  getAllOperations,
  deleteOperation,
  closeOperation,
  reopenOperation,
  operationServiceWithToasts,
} from "@/app/services/operation-service"
import { getAllShips } from "@/app/services/ship-service"
import { getAllPorts } from "@/app/services/port-service"
import { getAllPeople } from "@/app/services/person-api-service"
import { getAllBusinessUnits } from "@/app/services/business-unit-api-service"
import { OperationModal } from "@/components/operation-form"
import { OperationAttachmentsModal } from "@/components/operation-attachments-modal"
import type { Operation } from "@/types/types"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { useAuth } from "@/app/contexts/auth-context"

export default function OperationsPage() {
  const { hasPermission } = useAuth()
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<Operation | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("Nova Operação")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [operationToClose, setOperationToClose] = useState<Operation | null>(null)
  const [closeDate, setCloseDate] = useState("")
  const [operationAttachments, setOperationAttachments] = useState<Record<string, number>>({})
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false)
  const [selectedOperationForAttachments, setSelectedOperationForAttachments] = useState<Operation | undefined>(undefined)

  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "code",
    defaultSortOrder: "asc",
  })

  // Filter and sort operations
  const filteredAndSortedOperations = useMemo(() => {
    // Apply search filter
    let filtered = operations
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = operations.filter(
        (operation) =>
          operation.code?.toLowerCase().includes(searchLower) ||
          operation.voyage?.toLowerCase().includes(searchLower) ||
          operation.shipName?.toLowerCase().includes(searchLower) ||
          operation.portName?.toLowerCase().includes(searchLower) ||
          operation.clientName?.toLowerCase().includes(searchLower) ||
          operation.businessUnitName?.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    if (!pagination.sortBy) return filtered

    return [...filtered].sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[pagination.sortBy] ?? ""
      const bValue = (b as unknown as Record<string, unknown>)[pagination.sortBy] ?? ""

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Handle date comparisons
      if (pagination.sortBy === "startDate" || pagination.sortBy === "endDate") {
        const dateA = aValue ? new Date(aValue as string).getTime() : 0
        const dateB = bValue ? new Date(bValue as string).getTime() : 0
        return pagination.sortOrder === "asc" ? dateA - dateB : dateB - dateA
      }

      // Handle number comparisons
      if (pagination.sortBy === "tons" || pagination.sortBy === "tonnage") {
        const numA = typeof aValue === "number" ? aValue : Number.parseFloat(String(aValue)) || 0
        const numB = typeof bValue === "number" ? bValue : Number.parseFloat(String(bValue)) || 0
        return pagination.sortOrder === "asc" ? numA - numB : numB - numA
      }

      // Compare values
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
  }, [operations, searchTerm, pagination.sortBy, pagination.sortOrder])

  const { paginatedData, totalPages } = useMemo(() => {
    return pagination.paginateData(filteredAndSortedOperations)
  }, [filteredAndSortedOperations, pagination])

  const fetchOperations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Buscar operações e dados relacionados em paralelo
      const [operationsData, shipsData, portsData, peopleData, businessUnitsData] = await Promise.all([
        getAllOperations(),
        getAllShips(),
        getAllPorts(),
        getAllPeople(),
        getAllBusinessUnits(),
      ])

      // Enriquecer operações com dados relacionados
      const enrichedOperations = operationsData.map((operation) => {
        const ship = shipsData.find((s) => s.id === operation.shipId)
        const port = portsData.find((p) => p.id === operation.portId)
        const client = peopleData.find((p) => p.id === operation.clientId)
        const businessUnit = businessUnitsData.find((bu) => bu.id === operation.businessUnitId)

        return {
          ...operation,
          shipName: ship?.shipName || `Navio #${operation.shipId}`,
          portName: port?.name || `Porto #${operation.portId}`,
          clientName: client?.name || `Cliente #${operation.clientId}`,
          businessUnitName: businessUnit?.name || businessUnit?.abbreviation || `Unidade #${operation.businessUnitId}`,
        }
      })

      setOperations(enrichedOperations)
      
      // Buscar quantidade de anexos para cada operação
      await loadOperationAttachments(enrichedOperations)
    } catch (err) {
      console.error("Erro ao carregar operações:", err)
      setError("Não foi possível carregar as operações. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadOperationAttachments = useCallback(async (operations: Operation[]) => {
    const attachmentCounts: Record<string, number> = {}
    
    // Buscar anexos para cada operação em paralelo
    const promises = operations.map(async (operation) => {
      if (operation.id) {
        try {
          const response = await fetch(`/api/proxy/operacoes/${operation.id}/anexos`)
          if (response.ok) {
            const data = await response.json()
            attachmentCounts[operation.id] = data.total_anexos || 0
          } else {
            attachmentCounts[operation.id] = 0
          }
        } catch (error) {
          console.error(`Erro ao buscar anexos da operação ${operation.id}:`, error)
          attachmentCounts[operation.id] = 0
        }
      }
    })
    
    await Promise.all(promises)
    setOperationAttachments(attachmentCounts)
  }, [])

  useEffect(() => {
    fetchOperations()
  }, [])

  const handleAddOperation = () => {
    setCurrentOperation(undefined)
    setModalTitle("Nova Operação")
    setIsModalOpen(true)
  }

  const handleEditOperation = (operation: Operation) => {
    setCurrentOperation(operation)
    setModalTitle("Editar Operação")
    setIsModalOpen(true)
  }

  const handleDeleteOperation = (operation: Operation) => {
    setCurrentOperation(operation)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentOperation?.id) return

    setLoading(true)
    try {
      await operationServiceWithToasts.delete(currentOperation.id)
      await fetchOperations()
    } catch (err) {
      console.error("Erro ao excluir operação:", err)
    } finally {
      setLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleCloseOperation = (operation: Operation) => {
    setOperationToClose(operation)
    setCloseDate("") // Limpar data anterior
    setIsCloseDialogOpen(true)
  }

  const confirmCloseOperation = async () => {
    if (!operationToClose?.id) return

    setIsCloseDialogOpen(false)
    setActionLoading(operationToClose.id)

    try {
      // Se closeDate estiver vazio, a API usará a data atual
      const formattedDate = closeDate ? `${closeDate} ${new Date().toTimeString().slice(0, 8)}` : undefined
      await operationServiceWithToasts.close(operationToClose.id, formattedDate)
      await fetchOperations()
    } catch (err) {
      console.error("Erro ao encerrar operação:", err)
    } finally {
      setActionLoading(null)
      setOperationToClose(null)
      setCloseDate("")
    }
  }


  const handleReopenOperation = async (operation: Operation) => {
    if (!operation.id) return

    setActionLoading(operation.id)
    try {
      await operationServiceWithToasts.reopen(operation.id)
      await fetchOperations()
    } catch (err) {
      console.error("Erro ao reabrir operação:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  const handleOpenAttachments = (operation: Operation) => {
    setSelectedOperationForAttachments(operation)
    setIsAttachmentsModalOpen(true)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "-"
    return format(date, "dd/MM/yyyy", { locale: ptBR })
  }

  // Formatar toneladas com 4 casas decimais
  const formatTonnage = (tonnage: number | string) => {
    // Se for string, converter para número
    const numValue = typeof tonnage === "string" ? Number.parseFloat(tonnage.replace(",", ".")) : tonnage

    // Se não for um número válido, retornar zero formatado
    if (isNaN(numValue)) return "0,0000"

    return numValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })
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

  // LÓGICA CORRETA: Determinar status baseado em encerrada vs dt_final vs datas
  const getOperationStatus = (operation: Operation): { status: string; statusClass: string } => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalizar para comparação de datas

    // 1. Se foi MANUALMENTE ENCERRADA (closedAt = campo 'encerrada')
    if (operation.closedAt) {
      return {
        status: "Encerrada",
        statusClass: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
      }
    }

    // 2. Se a data de início for futura (aguardando início)
    if (operation.startDate) {
      const startDate = new Date(operation.startDate)
      startDate.setHours(0, 0, 0, 0)
      
      if (startDate > today) {
        return {
          status: "Aguardando",
          statusClass: "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100",
        }
      }
    }

    // 3. Se a data final foi preenchida e já passou → operação concluída
    if (operation.endDate) {
      const endDate = new Date(operation.endDate)
      endDate.setHours(0, 0, 0, 0)

      if (endDate <= today) {
        return {
          status: "Finalizada",
          statusClass: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
        }
      }
    }

    // 4. Em andamento (dentro do período planejado)
    return {
      status: "Em andamento",
      statusClass: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    }
  }

  return (
    <>
      <MainHeader />
      <div className="bg-slate-50 min-h-screen dark:bg-slate-950">
        <motion.div className="container mx-auto py-6" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={cardVariants}>
            <Card>
              <motion.div variants={itemVariants}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-light flex items-center text-blue-600">
                      <Anchor className="mr-2 w-8 h-8" />
                      <span className="font-medium text-3xl">Operações</span>
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
                          onChange={(e) => {
                            const value = e.target.value
                            setSearchTerm(value)

                            if (!value.trim()) {
                              fetchOperations()
                            }
                          }}
                          className="w-[400px] border-0 bg-slate-200 dark:bg-slate-800 px-10 text-center focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {searchTerm ? (
                            <Button variant="ghost" size="icon" onClick={clearSearch} className="h-6 w-6 p-0">
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                    {hasPermission('cadastros.operacoes', 'criar_editar') && (
                      <Button onClick={handleAddOperation} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Operação
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </motion.div>

              <CardContent className="mt-5">
                <motion.div variants={itemVariants} className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          field="voyage"
                          label="Viagem"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="shipName"
                          label="Navio"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="portName"
                          label="Porto"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="clientName"
                          label="Cliente"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="businessUnitName"
                          label="Unidade"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="startDate"
                          label="Início"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="endDate"
                          label="Término"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="tons"
                          label="Toneladas"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <span>Carregando operações...</span>
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-10 text-red-500">
                            {error}
                          </TableCell>
                        </TableRow>
                      ) : filteredAndSortedOperations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                            Nenhuma operação encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((operation) => (
                          <TableRow key={operation.id}>
                            <TableCell className="font-medium">{operation.voyage}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Ship className="h-4 w-4 mr-1 text-blue-600" />
                                {operation.shipName}
                              </div>
                            </TableCell>
                            <TableCell>{operation.portName}</TableCell>
                            <TableCell>{operation.clientName}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 mr-1 text-blue-600" />
                                {operation.businessUnitName}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(operation.startDate ?? null)}</TableCell>
                            <TableCell>{formatDate(operation.endDate ?? null)}</TableCell>
                            <TableCell>{formatTonnage(operation.tons || 0)}</TableCell>
                            <TableCell>
                              {(() => {
                                const { status, statusClass } = getOperationStatus(operation)
                                return (
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                                  >
                                    {status === "Encerrada" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                    {status === "Finalizada" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                    {status === "Em andamento" && <Clock className="h-3 w-3 mr-1" />}
                                    {status === "Aguardando" && <Clock className="h-3 w-3 mr-1" />}
                                    {status}
                                  </span>
                                )
                              })()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {hasPermission('cadastros.operacoes', 'criar_editar') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditOperation(operation)}
                                    className="h-8 w-8"
                                  >
                                    <Pencil className="h-4 w-4 text-blue-600" />
                                  </Button>
                                )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      {actionLoading === operation.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <MoreHorizontal className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleOpenAttachments(operation)}
                                    >
                                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                      Detalhes e Anexos
                                    </DropdownMenuItem>
                                    {hasPermission('cadastros.operacoes', 'criar_editar') && (
                                      <DropdownMenuItem
                                        onClick={() => handleCloseOperation(operation)}
                                        disabled={
                                          !!operation.closedAt ||
                                          actionLoading === operation.id ||
                                          (operation.startDate && new Date(operation.startDate) > new Date()) || undefined
                                        }
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                        Encerrar Operação
                                      </DropdownMenuItem>
                                    )}
                                    {hasPermission('cadastros.operacoes', 'criar_editar') && (
                                      <DropdownMenuItem
                                        onClick={() => handleReopenOperation(operation)}
                                        disabled={
                                          !operation.closedAt || actionLoading === operation.id
                                        }
                                      >
                                        <RefreshCw className="h-4 w-4 mr-2 text-amber-600" />
                                        Reabrir Operação
                                      </DropdownMenuItem>
                                    )}
                                    {hasPermission('cadastros.operacoes', 'deletar') && (
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteOperation(operation)}
                                        disabled={actionLoading === operation.id}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </motion.div>
                {filteredAndSortedOperations.length > 0 && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={totalPages}
                    totalItems={filteredAndSortedOperations.length}
                    itemsPerPage={pagination.itemsPerPage}
                    onPageChange={pagination.setPage}
                    onItemsPerPageChange={pagination.setItemsPerPage}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Modal de cadastro/edição de operação */}
      <OperationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchOperations}
        operation={currentOperation}
        title={modalTitle}
      />

      {/* Modal de anexos da operação */}
      <OperationAttachmentsModal
        isOpen={isAttachmentsModalOpen}
        onClose={() => setIsAttachmentsModalOpen(false)}
        operation={selectedOperationForAttachments}
      />

      {/* Diálogo para encerrar operação */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar Operação</DialogTitle>
            <DialogDescription>
              Informe a data de encerramento da operação <span className="font-bold">{operationToClose?.code}</span>.
              Se não informar uma data, será usada a data e hora atual.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="closeDate">Data de Encerramento (opcional)</Label>
            <Input
              id="closeDate"
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmCloseOperation} className="bg-green-600 hover:bg-green-700">
              Encerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a operação <span className="font-bold">{currentOperation?.code}</span>?
              Esta ação não pode ser desfeita.
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
