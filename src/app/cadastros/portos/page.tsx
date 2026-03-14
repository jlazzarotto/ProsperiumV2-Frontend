"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Anchor, Plus, Pencil, Trash2, XCircle, Search } from "lucide-react"
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
import { getAllPorts, deletePort, searchPorts } from "@/app/services/port-service"
import { PortModal } from "@/components/port-modal"
import type { Port } from "@/types/types"
import { motion } from "framer-motion"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"

export default function PortsPage() {
  const [ports, setPorts] = useState<Port[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPort, setCurrentPort] = useState<Port | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("Novo Porto")

  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  })

  const fetchPorts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllPorts()
      setPorts(data)
    } catch (err) {
      console.error("Erro ao carregar portos:", err)
      setError("Não foi possível carregar os portos. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPorts()
  }, [])

  const handleAddPort = () => {
    setCurrentPort(undefined)
    setModalTitle("Novo Porto")
    setIsModalOpen(true)
  }

  const handleEditPort = (port: Port) => {
    setCurrentPort(port)
    setModalTitle("Editar Porto")
    setIsModalOpen(true)
  }

  const handleDeletePort = (port: Port) => {
    setCurrentPort(port)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentPort?.id) return

    setLoading(true)
    try {
      await deletePort(currentPort.id)
      await fetchPorts()
    } catch (err) {
      console.error("Erro ao excluir porto:", err)
    } finally {
      setLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    fetchPorts()
  }

  // Função para formatar o nome da cidade (primeira letra maiúscula e espaços em vez de hifens)
  const formatCityName = (city: string): string => {
    if (!city) return ""

    return city
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
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

  // Filter and sort ports
  const filteredAndSortedPorts = useMemo(() => {
    let filtered = ports

    if (searchTerm.trim()) {
      filtered = ports.filter(
        (port) =>
          port.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          port.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          port.acronym?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          port.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          port.state?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return pagination.sortData(filtered, pagination.sortBy)
  }, [ports, searchTerm, pagination])

  const { paginatedData, totalPages } = useMemo(() => {
    return pagination.paginateData(filteredAndSortedPorts)
  }, [filteredAndSortedPorts, pagination])

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
                      <span className="text-3xl font-medium">Portos</span>
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
                              fetchPorts()
                            } else {
                              setIsSearching(true)
                              searchPorts(value)
                                .then((results) => setPorts(results))
                                .catch((err) => {
                                  console.error("Erro na pesquisa:", err)
                                })
                                .finally(() => setIsSearching(false))
                            }
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
                    <Button onClick={handleAddPort} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Porto
                    </Button>
                  </div>
                </CardHeader>
              </motion.div>

              <CardContent className="mt-5">
                <motion.div variants={itemVariants} className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          field="name"
                          label="Nome do Porto"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="acronym"
                          label="Sigla"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="state"
                          label="UF"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="city"
                          label="Cidade"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="status"
                          label="Status"
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
                          <TableCell colSpan={6} className="text-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <span>Carregando portos...</span>
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-red-500">
                            {error}
                          </TableCell>
                        </TableRow>
                      ) : filteredAndSortedPorts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            Nenhum porto encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((port) => (
                          <TableRow key={port.id || `port-${Math.random()}`}>
                            <TableCell className="font-medium">{port.name}</TableCell>
                            <TableCell>{port.acronym}</TableCell>
                            <TableCell>{port.state.toUpperCase()}</TableCell>
                            <TableCell>{formatCityName(port.city)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    port.status ? "bg-blue-600" : "bg-gray-400"
                                  }`}
                                />
                                <span className={port.status ? "text-blue-600" : "text-gray-500"}>
                                  {port.status ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditPort(port)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePort(port)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </motion.div>
                {filteredAndSortedPorts.length > 0 && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={totalPages}
                    totalItems={filteredAndSortedPorts.length}
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

      {/* Modal de cadastro/edição de porto */}
      <PortModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchPorts}
        port={currentPort}
        title={modalTitle}
      />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o porto <span className="font-bold">{currentPort?.name}</span>? Esta ação
              não pode ser desfeita.
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
