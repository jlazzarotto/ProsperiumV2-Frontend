"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MainHeader } from "@/components/main-header"
import { PersonModal } from "@/components/person-modal"
import { ClientBusinessUnitModal } from "@/components/client-business-unit-modal"
import type { Person, ClientBusinessUnit } from "@/types/types"
import { getAllPeople, deletePerson } from "@/app/services/person-service"
import { getClientBusinessUnits, deleteClientBusinessUnit } from "@/app/services/client-business-unit-service"
import { Plus, Search, Users, Trash2, AlertTriangle, Loader2, XCircle, Pencil, Building2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { motion } from "framer-motion"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { maskCPFOrCNPJ } from "@/lib/masks"
import { useAuth } from "@/app/contexts/auth-context"

export default function PeoplePage() {
  const { hasPermission } = useAuth()
  const [people, setPeople] = useState<Person[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false)
  const [isClientBusinessUnitModalOpen, setIsClientBusinessUnitModalOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [selectedClientBusinessUnit, setSelectedClientBusinessUnit] = useState<ClientBusinessUnit | null>(null)
  const [clientBusinessUnits, setClientBusinessUnits] = useState<ClientBusinessUnit[]>([])
  const [activeTab, setActiveTab] = useState("people")
  const [selectedPersonForUnits, setSelectedPersonForUnits] = useState<Person | null>(null)
  const [showIndexAlert, setShowIndexAlert] = useState(false)
  const [indexUrl, setIndexUrl] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null)
  const [isDeleteUnitDialogOpen, setIsDeleteUnitDialogOpen] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState<ClientBusinessUnit | null>(null)

  const peoplePagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  })

  const unitsPagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  })

  // Filter and sort people
  const filteredAndSortedPeople = useMemo(() => {
    let filtered = people
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = people.filter(
        (person) =>
          person.name?.toLowerCase().includes(searchLower) ||
          person.code?.toLowerCase().includes(searchLower) ||
          person.documentId?.toLowerCase().includes(searchLower) ||
          person.registrationType?.toLowerCase().includes(searchLower) ||
          person.city?.toLowerCase().includes(searchLower) ||
          person.state?.toLowerCase().includes(searchLower)
      )
    }

    if (!peoplePagination.sortBy) return filtered

    return [...filtered].sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[peoplePagination.sortBy] ?? ""
      const bValue = (b as unknown as Record<string, unknown>)[peoplePagination.sortBy] ?? ""

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

      return peoplePagination.sortOrder === "asc" ? comparison : -comparison
    })
  }, [people, searchTerm, peoplePagination.sortBy, peoplePagination.sortOrder])

  const { paginatedData: paginatedPeople, totalPages: peopleTotalPages } = useMemo(() => {
    return peoplePagination.paginateData(filteredAndSortedPeople)
  }, [filteredAndSortedPeople, peoplePagination])

  // Filter and sort client business units
  const filteredAndSortedUnits = useMemo(() => {
    let filtered = clientBusinessUnits
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = clientBusinessUnits.filter(
        (unit) =>
          unit.name?.toLowerCase().includes(searchLower) ||
          unit.code?.toLowerCase().includes(searchLower) ||
          unit.documentId?.toLowerCase().includes(searchLower) ||
          unit.city?.toLowerCase().includes(searchLower) ||
          unit.state?.toLowerCase().includes(searchLower)
      )
    }

    if (!unitsPagination.sortBy) return filtered

    return [...filtered].sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[unitsPagination.sortBy] ?? ""
      const bValue = (b as unknown as Record<string, unknown>)[unitsPagination.sortBy] ?? ""

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      let comparison = 0
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue
      } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        comparison = aValue === bValue ? 0 : aValue ? -1 : 1
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return unitsPagination.sortOrder === "asc" ? comparison : -comparison
    })
  }, [clientBusinessUnits, searchTerm, unitsPagination.sortBy, unitsPagination.sortOrder])

  const { paginatedData: paginatedUnits, totalPages: unitsTotalPages } = useMemo(() => {
    return unitsPagination.paginateData(filteredAndSortedUnits)
  }, [filteredAndSortedUnits, unitsPagination])

  useEffect(() => {
    loadPeople()
  }, [])

  const loadPeople = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllPeople()
      setPeople(data)
    } catch (error) {
      console.error("Error loading people:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadClientBusinessUnits = async (personId: string) => {
    try {
      setClientBusinessUnits([]) // Limpar unidades existentes antes de carregar
      const data = await getClientBusinessUnits(personId)
      console.log("Unidades carregadas:", data) // Log para debug
      setClientBusinessUnits(data)
      setShowIndexAlert(false) // Esconder alerta se a consulta for bem-sucedida
    } catch (error) {
      console.error("Error loading client business units:", error)

      // Verificar se é um erro de índice e extrair a URL
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes("The query requires an index")) {
        const indexUrlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
        if (indexUrlMatch) {
          setIndexUrl(indexUrlMatch[0])
          setShowIndexAlert(true)
        }
      }
    }
  }

  const handleAddPerson = () => {
    setSelectedPerson(null)
    setIsPersonModalOpen(true)
  }

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person)
    setIsPersonModalOpen(true)
  }

  const handleDeletePerson = (person: Person) => {
    setPersonToDelete(person)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!personToDelete?.id) return

    // Fechar modal imediatamente
    setIsDeleteDialogOpen(false)

    try {
      await deletePerson(personToDelete.id)
      loadPeople()
    } catch (error) {
      console.error("Error deleting person:", error)
    } finally {
      setPersonToDelete(null)
    }
  }

  const handleAddClientBusinessUnit = () => {
    if (!selectedPersonForUnits) {
      return
    }
    setSelectedClientBusinessUnit(null)
    setIsClientBusinessUnitModalOpen(true)
  }

  const handleEditClientBusinessUnit = (clientBusinessUnit: ClientBusinessUnit) => {
    setSelectedClientBusinessUnit(clientBusinessUnit)
    setIsClientBusinessUnitModalOpen(true)
  }

  const handleDeleteClientBusinessUnit = (unit: ClientBusinessUnit) => {
    setUnitToDelete(unit)
    setIsDeleteUnitDialogOpen(true)
  }

  const confirmDeleteUnit = async () => {
    if (!unitToDelete?.id) return

    // Fechar modal imediatamente
    setIsDeleteUnitDialogOpen(false)

    try {
      await deleteClientBusinessUnit(unitToDelete.id)
      if (selectedPersonForUnits) {
        loadClientBusinessUnits(selectedPersonForUnits.id!)
      }
    } catch (error) {
      console.error("Error deleting client business unit:", error)
    } finally {
      setUnitToDelete(null)
    }
  }

  const handlePersonModalClose = (saved: boolean) => {
    setIsPersonModalOpen(false)
    if (saved) {
      loadPeople()
    }
  }

  const handleClientBusinessUnitModalClose = (saved: boolean) => {
    setIsClientBusinessUnitModalOpen(false)
    if (saved && selectedPersonForUnits) {
      loadClientBusinessUnits(selectedPersonForUnits.id!)
    }
  }

  const handleBackToPeople = () => {
    setActiveTab("people")
    setSelectedPersonForUnits(null)
    setShowIndexAlert(false)
  }

  const openIndexUrl = () => {
    if (indexUrl) {
      window.open(indexUrl, "_blank")
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <motion.div variants={cardVariants}>
              <Card>
                <motion.div variants={itemVariants}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <CardTitle className="text-2xl font-bold flex items-center text-blue-600 whitespace-nowrap">
                          {activeTab === "people" ? (
                            <>
                              <Users className="mr-2 w-8 h-8" />
                              <span className="font-medium text-3xl">Pessoas</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="mr-2 w-8 h-8" />
                              <span className="font-light text-3xl">Unidades de {selectedPersonForUnits?.name}</span>
                            </>
                          )}
                        </CardTitle>
                        {selectedPersonForUnits && (
                          <TabsList>
                            <TabsTrigger value="people" className="flex items-center">
                              <Users className="mr-2 h-4 w-4" />
                              Pessoas
                            </TabsTrigger>
                            <TabsTrigger value="clientBusinessUnits" className="flex items-center">
                              <Building2 className="mr-2 h-4 w-4" />
                              Unidades
                            </TabsTrigger>
                          </TabsList>
                        )}
                      </div>

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
                            {searchTerm ? (
                              <Button variant="ghost" size="icon" onClick={clearSearch} className="h-6 w-6 p-0">
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </motion.div>

                      {activeTab === "people" ? (
                        hasPermission('cadastros.pessoas', 'criar_editar') && (
                          <Button onClick={handleAddPerson} className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Pessoa
                          </Button>
                        )
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={handleBackToPeople} className="whitespace-nowrap">
                            Voltar
                          </Button>
                          {hasPermission('cadastros.pessoas', 'criar_editar') && (
                            <Button onClick={handleAddClientBusinessUnit} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                              <Plus className="h-4 w-4 mr-2" />
                              Nova Unidade
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </motion.div>

                {showIndexAlert && (
                  <div className="px-6 pb-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Índice necessário</AlertTitle>
                      <AlertDescription>
                        É necessário criar um índice no Firebase para visualizar as unidades de negócio.{" "}
                        <Button variant="link" className="p-0 h-auto" onClick={openIndexUrl}>
                          Clique aqui para criar o índice
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                <CardContent>
                  <TabsContent value="people" className="mt-0">
                    <motion.div variants={itemVariants} className="rounded-md p-2 border mt-5">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <SortableTableHead
                              field="name"
                              label="Nome"
                              currentSortBy={peoplePagination.sortBy}
                              currentSortOrder={peoplePagination.sortOrder}
                              onSort={peoplePagination.setSorting}
                            />
                            <SortableTableHead
                              field="registrationType"
                              label="Tipo"
                              currentSortBy={peoplePagination.sortBy}
                              currentSortOrder={peoplePagination.sortOrder}
                              onSort={peoplePagination.setSorting}
                            />
                            <SortableTableHead
                              field="documentId"
                              label="Documento"
                              currentSortBy={peoplePagination.sortBy}
                              currentSortOrder={peoplePagination.sortOrder}
                              onSort={peoplePagination.setSorting}
                            />
                            <SortableTableHead
                              field="city"
                              label="Cidade/UF"
                              currentSortBy={peoplePagination.sortBy}
                              currentSortOrder={peoplePagination.sortOrder}
                              onSort={peoplePagination.setSorting}
                            />
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <span>Carregando pessoas...</span>
                              </TableCell>
                            </TableRow>
                          ) : filteredAndSortedPeople.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                Nenhuma pessoa encontrada.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedPeople.map((person) => (
                              <TableRow key={person.id}>
                                <TableCell className="font-medium">{person.name}</TableCell>
                                <TableCell>{person.registrationType}</TableCell>
                                <TableCell>{person.documentId ? maskCPFOrCNPJ(person.documentId) : ''}</TableCell>
                                <TableCell>{`${person.city}/${person.state}`}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {hasPermission('cadastros.pessoas', 'criar_editar') && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditPerson(person)}
                                        className="h-8 w-8"
                                      >
                                        <Pencil className="h-4 w-4 text-blue-600" />
                                      </Button>
                                    )}
                                    {hasPermission('cadastros.pessoas', 'deletar') && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeletePerson(person)}
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
                    {filteredAndSortedPeople.length > 0 && (
                      <Pagination
                        currentPage={peoplePagination.currentPage}
                        totalPages={peopleTotalPages}
                        totalItems={filteredAndSortedPeople.length}
                        itemsPerPage={peoplePagination.itemsPerPage}
                        onPageChange={peoplePagination.setPage}
                        onItemsPerPageChange={peoplePagination.setItemsPerPage}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="clientBusinessUnits" className="mt-0">
                    <motion.div variants={itemVariants} className="rounded-md p-2 border mt-5">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <SortableTableHead
                              field="name"
                              label="Nome"
                              currentSortBy={unitsPagination.sortBy}
                              currentSortOrder={unitsPagination.sortOrder}
                              onSort={unitsPagination.setSorting}
                            />
                            <SortableTableHead
                              field="documentId"
                              label="Documento"
                              currentSortBy={unitsPagination.sortBy}
                              currentSortOrder={unitsPagination.sortOrder}
                              onSort={unitsPagination.setSorting}
                            />
                            <SortableTableHead
                              field="city"
                              label="Cidade/UF"
                              currentSortBy={unitsPagination.sortBy}
                              currentSortOrder={unitsPagination.sortOrder}
                              onSort={unitsPagination.setSorting}
                            />
                            <SortableTableHead
                              field="isHeadquarters"
                              label="Matriz"
                              currentSortBy={unitsPagination.sortBy}
                              currentSortOrder={unitsPagination.sortOrder}
                              onSort={unitsPagination.setSorting}
                            />
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <span>Carregando unidades...</span>
                              </TableCell>
                            </TableRow>
                          ) : filteredAndSortedUnits.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                Nenhuma unidade de negócio encontrada.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedUnits.map((unit) => (
                              <TableRow key={unit.id}>
                                <TableCell className="font-medium">{unit.name}</TableCell>
                                <TableCell>{unit.documentId ? maskCPFOrCNPJ(unit.documentId) : ''}</TableCell>
                                <TableCell>{`${unit.city}/${unit.state}`}</TableCell>
                                <TableCell>{unit.isHeadquarters ? "Sim" : "Não"}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {hasPermission('cadastros.pessoas', 'criar_editar') && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditClientBusinessUnit(unit)}
                                        className="h-8 w-8"
                                        title="Editar unidade"
                                      >
                                        <Pencil className="h-4 w-4 text-blue-600" />
                                      </Button>
                                    )}
                                    {hasPermission('cadastros.pessoas', 'deletar') && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteClientBusinessUnit(unit)}
                                        className="h-8 w-8"
                                        title="Excluir unidade"
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
                    {filteredAndSortedUnits.length > 0 && (
                      <Pagination
                        currentPage={unitsPagination.currentPage}
                        totalPages={unitsTotalPages}
                        totalItems={filteredAndSortedUnits.length}
                        itemsPerPage={unitsPagination.itemsPerPage}
                        onPageChange={unitsPagination.setPage}
                        onItemsPerPageChange={unitsPagination.setItemsPerPage}
                      />
                    )}
                  </TabsContent>
                </CardContent>
              </Card>
            </motion.div>
          </Tabs>
        </motion.div>
      </div>

      {isPersonModalOpen && <PersonModal person={selectedPerson} onClose={handlePersonModalClose} />}

      {isClientBusinessUnitModalOpen && selectedPersonForUnits && (
        <ClientBusinessUnitModal
          clientBusinessUnit={selectedClientBusinessUnit}
          personId={selectedPersonForUnits.id!}
          onClose={handleClientBusinessUnitModalClose}
        />
      )}

      {/* Diálogo de confirmação de exclusão de pessoa */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a pessoa <span className="font-bold">{personToDelete?.name}</span>? Esta
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

      {/* Diálogo de confirmação de exclusão de unidade */}
      <Dialog open={isDeleteUnitDialogOpen} onOpenChange={setIsDeleteUnitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a unidade <span className="font-bold">{unitToDelete?.name}</span>? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteUnitDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUnit}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}

