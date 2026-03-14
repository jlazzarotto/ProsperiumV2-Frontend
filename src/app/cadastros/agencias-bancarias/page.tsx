"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Building, Plus, Pencil, Trash2, Search, XCircle } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BankAgencyModal } from "@/components/bank-agency-modal"
import {
  getAllBankAgencies,
  addBankAgency,
  updateBankAgency,
  deleteBankAgency,
} from "@/app/services/bank-agency-service"
import type { BankAgency } from "@/types/types"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { useAuth } from "@/app/contexts/auth-context"


export default function BankAgenciesPage() {
  const { hasPermission } = useAuth()
  const [agencies, setAgencies] = useState<BankAgency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentAgency, setCurrentAgency] = useState<BankAgency | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "agencyName",
    defaultSortOrder: "asc",
  })

  // Aplicar sorting apenas (busca é feita na API)
  const sortedAgencies = useMemo(() => {
    if (!pagination.sortBy) return agencies

    return [...agencies].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[pagination.sortBy] ?? ""
      const bValue = (b as Record<string, unknown>)[pagination.sortBy] ?? ""

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

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
  }, [agencies, pagination.sortBy, pagination.sortOrder])

  const { paginatedData, totalPages } = useMemo(() => {
    return pagination.paginateData(sortedAgencies)
  }, [sortedAgencies, pagination])

  // Debounce do searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms de delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchAgencies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllBankAgencies(1, 500, debouncedSearchTerm)
      setAgencies(data)
    } catch (err) {
      console.error("Erro ao carregar agências:", err)
      setError("Não foi possível carregar as agências bancárias. Tente novamente.")
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [debouncedSearchTerm])

  // Carregar agências na montagem e quando o termo de busca mudar
  useEffect(() => {
    // Se ainda está digitando, não busca
    if (debouncedSearchTerm !== searchTerm && searchTerm !== '') return
    
    // Marcar como buscando apenas se há termo de busca
    if (debouncedSearchTerm && debouncedSearchTerm.length > 0) {
      setIsSearching(true)
    }
    
    fetchAgencies()
  }, [debouncedSearchTerm, searchTerm, fetchAgencies])

  const handleAddAgency = () => {
    setCurrentAgency(undefined)
    setIsModalOpen(true)
  }

  const handleEditAgency = (agency: BankAgency) => {
    setCurrentAgency(agency)
    setIsModalOpen(true)
  }

  const handleDeleteAgency = (agency: BankAgency) => {
    setCurrentAgency(agency)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentAgency?.id) return

    // Fechar modal imediatamente
    setIsDeleteDialogOpen(false)

    setLoading(true)
    try {
      await deleteBankAgency(currentAgency.id)
      await fetchAgencies()
    } catch (err) {
      console.error("Erro ao excluir agência:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAgency = async (agencyData: Omit<BankAgency, "id" | "createdAt" | "updatedAt">) => {
    setLoading(true)
    try {
      if (currentAgency?.id) {
        await updateBankAgency(currentAgency.id, agencyData)
      } else {
        await addBankAgency(agencyData)
      }

      setIsModalOpen(false)

      await fetchAgencies()
    } catch (err) {
      console.error("Erro ao salvar agência:", err)
    } finally {
      setLoading(false)
    }
  }



  const clearSearch = () => {
    setSearchTerm("")
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
            <Card>
              <motion.div variants={itemVariants}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-light flex items-center text-blue-600">
                      <Building className="mr-2 w-8 h-8" />
                      <span className="font-medium text-3xl">Agências Bancárias</span>
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
                            setSearchTerm(e.target.value)
                          }}
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
                    {hasPermission('cadastros.agencias_bancarias', 'criar_editar') && (
                      <Button onClick={handleAddAgency} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Agência
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
                          field="agencyName"
                          label="Agência"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="agencyNumber"
                          label="Número"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="bankName"
                          label="Banco"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        {(hasPermission('cadastros.agencias_bancarias', 'criar_editar') || hasPermission('cadastros.agencias_bancarias', 'deletar')) && (
                          <TableHead className="text-right">Ações</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={(hasPermission('cadastros.agencias_bancarias', 'criar_editar') || hasPermission('cadastros.agencias_bancarias', 'deletar')) ? 4 : 3} className="text-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <span>Carregando agências...</span>
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={(hasPermission('cadastros.agencias_bancarias', 'criar_editar') || hasPermission('cadastros.agencias_bancarias', 'deletar')) ? 4 : 3} className="text-center py-10 text-red-500">
                            {error}
                          </TableCell>
                        </TableRow>
                      ) : sortedAgencies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={(hasPermission('cadastros.agencias_bancarias', 'criar_editar') || hasPermission('cadastros.agencias_bancarias', 'deletar')) ? 4 : 3} className="text-center py-10 text-muted-foreground">
                            Nenhuma agência bancária encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((agency) => (
                          <TableRow key={agency.id}>
                            <TableCell className="font-medium">{agency.agencyName}</TableCell>
                            <TableCell>{agency.agencyNumber}</TableCell>
                            <TableCell>{agency.bankName}</TableCell>
                            {(hasPermission('cadastros.agencias_bancarias', 'criar_editar') || hasPermission('cadastros.agencias_bancarias', 'deletar')) && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {hasPermission('cadastros.agencias_bancarias', 'criar_editar') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditAgency(agency)}
                                      className="h-8 w-8"
                                    >
                                      <Pencil className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  )}
                                  {hasPermission('cadastros.agencias_bancarias', 'deletar') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteAgency(agency)}
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </motion.div>
                {sortedAgencies.length > 0 && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={totalPages}
                    totalItems={sortedAgencies.length}
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

      {/* Modal para adicionar/editar agência */}
      <BankAgencyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAgency}
        agency={currentAgency}
        title={currentAgency ? "Editar Agência Bancária" : "Nova Agência Bancária"}
      />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a agência <span className="font-bold">{currentAgency?.agencyName}</span>?
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

