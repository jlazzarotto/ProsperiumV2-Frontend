"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MainHeader } from "@/components/main-header"
import { BusinessUnitType8Modal } from "@/components/business-unit-type8-modal"
import type { BusinessUnitType8 } from "@/types/types"
import { getAllBusinessUnitsType8, deleteBusinessUnitType8 } from "@/app/services/business-unit-type8-service"
import { Plus, Building2, Trash2, Loader2, XCircle, Pencil, Search } from "lucide-react"
import { motion } from "framer-motion"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"

// Máscara de CNPJ para exibição
const formatCNPJ = (cnpj: string | undefined): string => {
  if (!cnpj) return "-"
  const numbers = cnpj.replace(/\D/g, "")
  if (numbers.length !== 14) return cnpj
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
}

export default function CoordenarEmpresasPage() {
  const { hasPermission } = useAuth()
  const [units, setUnits] = useState<BusinessUnitType8[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnitType8 | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<BusinessUnitType8 | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "nome",
    defaultSortOrder: "asc",
  })

  // Filter and sort units
  const filteredAndSortedUnits = useMemo(() => {
    let filtered = units
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = units.filter(
        (unit) =>
          unit.nome?.toLowerCase().includes(searchLower) ||
          unit.apelido?.toLowerCase().includes(searchLower) ||
          unit.cnpj?.toLowerCase().includes(searchLower) ||
          unit.abreviatura?.toLowerCase().includes(searchLower) ||
          unit.cidade?.toLowerCase().includes(searchLower) ||
          unit.uf?.toLowerCase().includes(searchLower)
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
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return pagination.sortOrder === "asc" ? comparison : -comparison
    })
  }, [units, searchTerm, pagination.sortBy, pagination.sortOrder])

  const { paginatedData, totalPages } = useMemo(() => {
    return pagination.paginateData(filteredAndSortedUnits)
  }, [filteredAndSortedUnits, pagination])

  useEffect(() => {
    loadUnits()
  }, [])

  const loadUnits = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllBusinessUnitsType8()
      setUnits(data)
    } catch (error) {
      console.error("Erro ao carregar unidades:", error)
      customToast.error("Erro ao carregar empresas")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAdd = () => {
    setSelectedUnit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (unit: BusinessUnitType8) => {
    setSelectedUnit(unit)
    setIsModalOpen(true)
  }

  const handleDelete = (unit: BusinessUnitType8) => {
    setUnitToDelete(unit)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!unitToDelete?.id) return

    setIsDeleting(true)
    try {
      await deleteBusinessUnitType8(unitToDelete.id)
      customToast.success("Empresa excluída com sucesso!")
      loadUnits()
    } catch (error: any) {
      console.error("Erro ao excluir:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Erro ao excluir empresa"
      customToast.error(errorMessage)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setUnitToDelete(null)
    }
  }

  const handleModalClose = (saved: boolean) => {
    setIsModalOpen(false)
    setSelectedUnit(null)
    if (saved) {
      loadUnits()
    }
  }

  // Animation variants
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

  const cardVariants = {
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
      <div className="bg-slate-50 min-h-screen dark:bg-slate-950">
        <motion.div
          className="px-6 lg:px-10 py-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={cardVariants}>
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="px-6 py-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center text-blue-600">
                    <Building2 className="mr-2 w-8 h-8" />
                    <span className="text-2xl font-medium">Coordenar Empresas</span>
                  </CardTitle>

                  {/* Campo de busca centralizado */}
                  <div className="flex-1 flex justify-center">
                    <div className="relative w-full max-w-md">
                      {!searchTerm && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">Pesquisar</span>
                        </div>
                      )}
                      <Input
                        placeholder=" "
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border-0 bg-slate-200 dark:bg-slate-800 px-10 text-center focus:ring-2 focus:ring-blue-500"
                      />
                      {searchTerm && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={() => setSearchTerm("")}
                          >
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasPermission('admin.coordenar_unidades', 'criar_editar') && (
                    <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Empresa
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead
                          field="nome"
                          label="Razão Social"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="apelido"
                          label="Apelido"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="cnpj"
                          label="CNPJ"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="abreviatura"
                          label="Abreviatura"
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
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                              <span className="text-slate-500">Carregando empresas...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            {searchTerm
                              ? "Nenhuma empresa encontrada para a pesquisa."
                              : "Nenhuma empresa cadastrada."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((unit) => (
                          <TableRow key={unit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableCell className="font-medium">{unit.nome}</TableCell>
                            <TableCell className="font-medium">{unit.apelido}</TableCell>
                            <TableCell className="font-mono text-sm">{formatCNPJ(unit.cnpj)}</TableCell>
                            <TableCell>{unit.abreviatura || "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {hasPermission('admin.coordenar_unidades', 'criar_editar') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(unit)}
                                    title="Editar"
                                  >
                                    <Pencil className="h-4 w-4 text-blue-600" />
                                  </Button>
                                )}
                                {hasPermission('admin.coordenar_unidades', 'deletar') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(unit)}
                                    title="Excluir"
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
                </div>

                {filteredAndSortedUnits.length > 0 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={totalPages}
                      totalItems={filteredAndSortedUnits.length}
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

      {/* Modal de criação/edição */}
      {isModalOpen && (
        <BusinessUnitType8Modal unit={selectedUnit} onClose={handleModalClose} />
      )}

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir a empresa{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {unitToDelete?.apelido}
              </span>
              ?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                Esta ação não pode ser desfeita. Os vínculos com pessoas serão removidos.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setUnitToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
