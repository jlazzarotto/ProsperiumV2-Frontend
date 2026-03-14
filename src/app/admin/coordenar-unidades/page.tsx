"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MainHeader } from "@/components/main-header"
import { BusinessUnitModal } from "@/components/business-unit-modal"
import type { BusinessUnitSummary } from "@/app/services/business-unit-summary-service"
import { getAllBusinessUnitSummaries, deleteBusinessUnitSummary } from "@/app/services/business-unit-summary-service"
import { Plus, Building, Trash2, Loader2, XCircle, Pencil, Search } from "lucide-react"
import { motion } from "framer-motion"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"

export default function CoordenarUnidadesPage() {
  const { hasPermission } = useAuth()
  const [unidades, setUnidades] = useState<BusinessUnitSummary[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUnidade, setSelectedUnidade] = useState<BusinessUnitSummary | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [unidadeToDelete, setUnidadeToDelete] = useState<BusinessUnitSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "apelido",
    defaultSortOrder: "asc",
  })

  const filteredAndSorted = useMemo(() => {
    let filtered = unidades
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase()
      filtered = unidades.filter(
        u => u.apelido?.toLowerCase().includes(s) || u.abreviatura?.toLowerCase().includes(s)
      )
    }

    if (!pagination.sortBy) return filtered

    return [...filtered].sort((a, b) => {
      const aVal = (a as any)[pagination.sortBy] ?? ""
      const bVal = (b as any)[pagination.sortBy] ?? ""
      if (!aVal) return 1
      if (!bVal) return -1
      const cmp = typeof aVal === "string"
        ? aVal.toLowerCase().localeCompare(bVal.toLowerCase())
        : aVal - bVal
      return pagination.sortOrder === "asc" ? cmp : -cmp
    })
  }, [unidades, searchTerm, pagination.sortBy, pagination.sortOrder])

  const { paginatedData, totalPages } = useMemo(
    () => pagination.paginateData(filteredAndSorted),
    [filteredAndSorted, pagination]
  )

  const loadUnidades = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllBusinessUnitSummaries()
      setUnidades(data)
    } catch {
      customToast.error("Erro ao carregar unidades")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUnidades() }, [])

  const handleAdd = () => { setSelectedUnidade(null); setIsModalOpen(true) }
  const handleEdit = (u: BusinessUnitSummary) => { setSelectedUnidade(u); setIsModalOpen(true) }
  const handleDelete = (u: BusinessUnitSummary) => { setUnidadeToDelete(u); setIsDeleteDialogOpen(true) }

  const confirmDelete = async () => {
    if (!unidadeToDelete?.id) return
    setIsDeleting(true)
    try {
      await deleteBusinessUnitSummary(unidadeToDelete.id)
      customToast.success("Unidade excluída com sucesso!")
      loadUnidades()
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Erro ao excluir unidade"
      customToast.error(msg)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setUnidadeToDelete(null)
    }
  }

  const handleModalClose = (saved: boolean) => {
    setIsModalOpen(false)
    setSelectedUnidade(null)
    if (saved) loadUnidades()
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  }
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  }

  return (
    <>
      <MainHeader />
      <div className="bg-slate-50 min-h-screen dark:bg-slate-950">
        <motion.div className="px-6 lg:px-10 py-6" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={cardVariants}>
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="px-6 py-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center text-green-600">
                    <Building className="mr-2 w-8 h-8" />
                    <span className="text-2xl font-medium">Coordenar Unidades</span>
                  </CardTitle>

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
                        className="w-full border-0 bg-slate-200 dark:bg-slate-800 px-10 text-center focus:ring-2 focus:ring-green-500"
                      />
                      {searchTerm && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => setSearchTerm("")}>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasPermission('admin.coordenar_unidades', 'criar_editar') && (
                    <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Unidade
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
                          field="apelido"
                          label="Nome"
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
                          <TableCell colSpan={3} className="text-center py-10">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                              <span className="text-slate-500">Carregando unidades...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                            {searchTerm ? "Nenhuma unidade encontrada para a pesquisa." : "Nenhuma unidade cadastrada."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((u) => (
                          <TableRow key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableCell className="font-medium">{u.apelido}</TableCell>
                            <TableCell>{u.abreviatura || "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {hasPermission('admin.coordenar_unidades', 'criar_editar') && (
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(u)} title="Editar">
                                    <Pencil className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                {hasPermission('admin.coordenar_unidades', 'deletar') && (
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(u)} title="Excluir">
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

                {filteredAndSorted.length > 0 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={totalPages}
                      totalItems={filteredAndSorted.length}
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

      {isModalOpen && (
        <BusinessUnitModal unidade={selectedUnidade} onClose={handleModalClose} />
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="pt-2">
              Tem certeza que deseja excluir a unidade{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">{unidadeToDelete?.apelido}</span>?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                Esta ação não pode ser desfeita.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setUnidadeToDelete(null) }} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
