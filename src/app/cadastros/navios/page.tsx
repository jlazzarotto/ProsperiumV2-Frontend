/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Ship, Plus, Pencil, Trash2, XCircle, Search } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  getAllShips,
  addShip,
  updateShip,
  deleteShip,
  fetchCountries,
} from "@/app/services/ship-service"
import type { Ship as ShipType } from "@/types/types"
import { motion } from "framer-motion"
import { handleError } from "@/lib/error-handler"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { useAuth } from "@/app/contexts/auth-context"

export default function ShipsPage() {
  const { hasPermission } = useAuth()
  const [ships, setShips] = useState<ShipType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentShip, setCurrentShip] = useState<ShipType | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [countries, setCountries] = useState<{ id: number; code: string; name: string }[]>([])
  const [formState, setFormState] = useState({
    shipName: "",
    flag: "",
    status: true,
  })

  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "shipName",
    defaultSortOrder: "asc",
  })

  // Debounce do searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500) // 500ms de delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Aplicar sorting apenas (busca é feita na API)
  const sortedShips = useMemo(() => {
    if (!pagination.sortBy) return ships

    return [...ships].sort((a, b) => {
      const aValue = (a as any)[pagination.sortBy] ?? ""
      const bValue = (b as any)[pagination.sortBy] ?? ""

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
  }, [ships, pagination.sortBy, pagination.sortOrder])

  const { paginatedData, totalPages } = useMemo(() => {
    return pagination.paginateData(sortedShips)
  }, [sortedShips, pagination])

  const fetchShips = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllShips(1, 500, debouncedSearchTerm)
      setShips(data)
    } catch (err) {
      console.error("Erro ao carregar navios:", err)
      setError("Não foi possível carregar os navios. Tente novamente.")
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [debouncedSearchTerm])

  const loadCountries = useCallback(async () => {
    try {
      const countriesData = await fetchCountries()
      setCountries(countriesData)
    } catch (error) {
      console.error("Erro ao carregar países:", error)
    }
  }, [])

  // Carregar navios e países na montagem
  useEffect(() => {
    fetchShips()
    loadCountries()
  }, [])

  // Buscar quando debouncedSearchTerm mudar
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return // Ainda está digitando
    setIsSearching(true)
    fetchShips()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm])

  useEffect(() => {
    if (currentShip) {
      setFormState({
        shipName: currentShip.shipName || "",
        flag: currentShip.flag || "",
        status: currentShip.status ?? true,
      })
    } else {
      setFormState({
        shipName: "",
        flag: "",
        status: true,
      })
    }
  }, [currentShip, isModalOpen])

  const handleAddShip = () => {
    setCurrentShip(undefined)
    setIsModalOpen(true)
  }

  const handleEditShip = (ship: ShipType) => {
    setCurrentShip(ship)
    setIsModalOpen(true)
  }

  const handleDeleteShip = (ship: ShipType) => {
    setCurrentShip(ship)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentShip?.id) return

    // Fechar modal imediatamente
    setIsDeleteDialogOpen(false)

    setLoading(true)
    try {
      await deleteShip(currentShip.id)
      await fetchShips()
    } catch (err) {
      console.error("Erro ao excluir navio:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveShip = async () => {
    if (!formState.shipName || !formState.flag) {
      return
    }

    setLoading(true)
    try {
      if (currentShip?.id) {
        await updateShip(currentShip.id, formState)
      } else {
        await addShip(formState)
      }

      // Fechar modal
      setIsModalOpen(false)

      // Recarregar navios
      await fetchShips()
    } catch (err) {
      handleError(err, "salvar navio")
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
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
                      <Ship className="mr-2 w-8 h-8" />
                      <span className="font-medium text-3xl">Navios</span>
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
                              fetchShips()
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
                    {hasPermission('cadastros.navios', 'criar_editar') && (
                      <Button onClick={handleAddShip} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Navio
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
                          field="shipName"
                          label="Nome do Navio"
                          currentSortBy={pagination.sortBy}
                          currentSortOrder={pagination.sortOrder}
                          onSort={pagination.setSorting}
                        />
                        <SortableTableHead
                          field="flag"
                          label="Bandeira"
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
                        {(hasPermission('cadastros.navios', 'criar_editar') || hasPermission('cadastros.navios', 'deletar')) && (
                          <TableHead className="text-right">Ações</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={(hasPermission('cadastros.navios', 'criar_editar') || hasPermission('cadastros.navios', 'deletar')) ? 4 : 3} className="text-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <span>Carregando navios...</span>
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={(hasPermission('cadastros.navios', 'criar_editar') || hasPermission('cadastros.navios', 'deletar')) ? 4 : 3} className="text-center py-10 text-red-500">
                            {error}
                          </TableCell>
                        </TableRow>
                      ) : sortedShips.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={(hasPermission('cadastros.navios', 'criar_editar') || hasPermission('cadastros.navios', 'deletar')) ? 4 : 3} className="text-center py-10 text-muted-foreground">
                            Nenhum navio encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((ship) => (
                          <TableRow key={ship.id}>
                            <TableCell className="font-medium">{ship.shipName}</TableCell>
                            <TableCell>{ship.flag}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${ship.status ? "bg-blue-600" : "bg-gray-400"
                                    }`}
                                />
                                <span className={ship.status ? "text-blue-600" : "text-gray-500"}>
                                  {ship.status ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                            </TableCell>
                            {(hasPermission('cadastros.navios', 'criar_editar') || hasPermission('cadastros.navios', 'deletar')) && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {hasPermission('cadastros.navios', 'criar_editar') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditShip(ship)}
                                      className="h-8 w-8"
                                    >
                                      <Pencil className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  )}
                                  {hasPermission('cadastros.navios', 'deletar') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteShip(ship)}
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
                {sortedShips.length > 0 && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={totalPages}
                    totalItems={sortedShips.length}
                    itemsPerPage={pagination.itemsPerPage}
                    onPageChange={pagination.setPage}
                    onItemsPerPageChange={pagination.setItemsPerPage}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div >

      {/* Modal para adicionar/editar navio */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen} >
        <DialogContent className="sm:max-w-[700px] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
          <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Ship className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-900 dark:text-blue-100">
                {currentShip ? "Editar Navio" : "Novo Navio"}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-6 py-6">
              {/* Card de Informações */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Informações do Navio
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="shipName" className="text-blue-800 dark:text-blue-200 font-medium">
                      Nome do Navio
                    </Label>
                    <Input
                      id="shipName"
                      value={formState.shipName}
                      onChange={(e) => handleInputChange("shipName", e.target.value)}
                      className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="flag" className="text-blue-800 dark:text-blue-200 font-medium">
                      Bandeira
                    </Label>
                    <SearchableSelect
                      options={countries.map((country) => ({
                        value: country.name,
                        label: country.name,
                      }))}
                      value={formState.flag}
                      placeholder="Selecione o país..."
                      searchPlaceholder="Pesquisar país..."
                      emptyMessage="Nenhum país encontrado."
                      onValueChange={(value) => handleInputChange("flag", value)}
                    />
                  </div>
                </div>
              </div>

              {/* Card de Status */}
              <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Status
                </h3>
                <div className="flex items-center space-x-3 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <Switch
                    id="status"
                    checked={formState.status}
                    onCheckedChange={(checked) => handleInputChange("status", checked)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="status" className="cursor-pointer text-blue-900 dark:text-blue-100 font-medium">
                    {formState.status ? "Navio Ativo" : "Navio Inativo"}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-blue-200 dark:border-blue-800 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950">
              Cancelar
            </Button>
            <Button onClick={handleSaveShip} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o navio{" "}
              <span className="font-bold">{currentShip?.shipName}</span>? Esta ação não pode ser desfeita.
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
