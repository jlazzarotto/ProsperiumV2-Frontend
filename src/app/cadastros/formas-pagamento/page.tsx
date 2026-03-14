/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CreditCard, Plus, Pencil, Trash2, XCircle, Search } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  getAllPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/app/services/payment-method-service"
import type { PaymentMethod, FormaPgtoTipo } from "@/types/types"
import { motion } from "framer-motion"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { useAuth } from "@/app/contexts/auth-context"

const TIPO_LABELS: Record<FormaPgtoTipo, string> = {
  fatura: 'Fatura (Cartão)',
  cartao_credito: 'Cartão de Crédito',
  liquidacao_bancaria_imediata: 'Liquidação Bancária Imediata',
  titulo_bancario: 'Título Bancário',
  titulo_proprio: 'Título Próprio',
  a_vista: 'À Vista',
}

const TIPO_BADGE_VARIANT: Record<FormaPgtoTipo, string> = {
  fatura: 'bg-purple-100 text-purple-700',
  cartao_credito: 'bg-indigo-100 text-indigo-700',
  liquidacao_bancaria_imediata: 'bg-blue-100 text-blue-700',
  titulo_bancario: 'bg-orange-100 text-orange-700',
  titulo_proprio: 'bg-amber-100 text-amber-700',
  a_vista: 'bg-green-100 text-green-700',
}

type FormState = {
  name: string
  tipo: FormaPgtoTipo
  description: string
  active: boolean
  operadora: string
  dia_fechamento: string
  dia_vencimento: string
  limite_credito: string
}

const isFatura = (tipo: FormaPgtoTipo) => tipo === 'fatura'

const EMPTY_FORM: FormState = {
  name: '',
  tipo: 'a_vista',
  description: '',
  active: true,
  operadora: '',
  dia_fechamento: '',
  dia_vencimento: '',
  limite_credito: '',
}

export default function PaymentMethodsPage() {
  const { hasPermission } = useAuth()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM)

  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "name",
    defaultSortOrder: "asc",
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const sortedMethods = useMemo(() => {
    if (!pagination.sortBy) return methods
    return [...methods].sort((a, b) => {
      const aValue = (a as any)[pagination.sortBy] ?? ""
      const bValue = (b as any)[pagination.sortBy] ?? ""
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
  }, [methods, pagination.sortBy, pagination.sortOrder])

  const { paginatedData, totalPages } = useMemo(() => {
    return pagination.paginateData(sortedMethods)
  }, [sortedMethods, pagination])

  const fetchMethods = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllPaymentMethods(1, 500, debouncedSearchTerm)
      setMethods(data)
    } catch (err) {
      console.error("Erro ao carregar métodos de pagamento:", err)
      setError("Não foi possível carregar os métodos de pagamento. Tente novamente.")
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [debouncedSearchTerm])

  useEffect(() => { fetchMethods() }, [])

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return
    setIsSearching(true)
    fetchMethods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm])

  useEffect(() => {
    if (currentMethod) {
      setFormState({
        name: currentMethod.name || "",
        tipo: (currentMethod.tipo ?? 'a_vista') as FormaPgtoTipo,
        description: currentMethod.description || "",
        active: currentMethod.active ?? true,
        operadora: currentMethod.operadora ?? '',
        dia_fechamento: currentMethod.dia_fechamento != null ? String(currentMethod.dia_fechamento) : '',
        dia_vencimento: currentMethod.dia_vencimento != null ? String(currentMethod.dia_vencimento) : '',
        limite_credito: currentMethod.limite_credito != null ? String(currentMethod.limite_credito) : '',
      })
    } else {
      setFormState(EMPTY_FORM)
    }
  }, [currentMethod, isModalOpen])

  const handleAddMethod = () => {
    setCurrentMethod(undefined)
    setIsModalOpen(true)
  }

  const handleEditMethod = (method: PaymentMethod) => {
    setCurrentMethod(method)
    setIsModalOpen(true)
  }

  const handleDeleteMethod = (method: PaymentMethod) => {
    setCurrentMethod(method)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentMethod?.id) return
    setIsDeleteDialogOpen(false)
    setLoading(true)
    try {
      await deletePaymentMethod(currentMethod.id)
      await fetchMethods()
    } catch (err) {
      console.error("Erro ao excluir forma de pagamento:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMethod = async () => {
    if (!formState.name) return
    setLoading(true)
    try {
      const payload: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formState.name,
        tipo: formState.tipo,
        description: formState.description,
        active: formState.active,
        ...(isFatura(formState.tipo) && {
          operadora: formState.operadora || null,
          dia_fechamento: formState.dia_fechamento ? Number(formState.dia_fechamento) : null,
          dia_vencimento: formState.dia_vencimento ? Number(formState.dia_vencimento) : null,
          limite_credito: formState.limite_credito ? Number(formState.limite_credito) : null,
        }),
      }

      if (currentMethod?.id) {
        await updatePaymentMethod(currentMethod.id, payload)
      } else {
        await addPaymentMethod(payload)
      }
      setIsModalOpen(false)
      await fetchMethods()
    } catch (err) {
      console.error("Erro ao salvar forma de pagamento:", err)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => setSearchTerm("")

  const set = (field: keyof FormState, value: string | boolean) =>
    setFormState(prev => ({ ...prev, [field]: value }))

  const colSpan = (hasPermission('cadastros.formas_pagamento', 'criar_editar') || hasPermission('cadastros.formas_pagamento', 'deletar')) ? 5 : 4

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  }
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
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
                      <CreditCard className="mr-2 w-8 h-8" />
                      <span className="font-medium text-3xl">Formas de Pagamento</span>
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
                            if (!value.trim()) fetchMethods()
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
                    {hasPermission('cadastros.formas_pagamento', 'criar_editar') && (
                      <Button onClick={handleAddMethod} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Forma de Pagamento
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
                        <SortableTableHead field="name" label="Nome" currentSortBy={pagination.sortBy} currentSortOrder={pagination.sortOrder} onSort={pagination.setSorting} />
                        <TableHead>Tipo</TableHead>
                        <SortableTableHead field="description" label="Descrição" currentSortBy={pagination.sortBy} currentSortOrder={pagination.sortOrder} onSort={pagination.setSorting} />
                        <SortableTableHead field="active" label="Status" currentSortBy={pagination.sortBy} currentSortOrder={pagination.sortOrder} onSort={pagination.setSorting} />
                        {(hasPermission('cadastros.formas_pagamento', 'criar_editar') || hasPermission('cadastros.formas_pagamento', 'deletar')) && (
                          <TableHead className="text-right">Ações</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="text-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <span>Carregando formas de pagamento...</span>
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="text-center py-10 text-red-500">{error}</TableCell>
                        </TableRow>
                      ) : sortedMethods.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="text-center py-10 text-muted-foreground">
                            Nenhuma forma de pagamento encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((method) => (
                          <TableRow key={method.id}>
                            <TableCell className="font-medium">{method.name}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${TIPO_BADGE_VARIANT[(method.tipo ?? 'a_vista') as FormaPgtoTipo] ?? ''}`}>
                                {TIPO_LABELS[(method.tipo ?? 'a_vista') as FormaPgtoTipo] ?? method.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>{method.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${method.active ? "bg-blue-600" : "bg-gray-400"}`} />
                                <span className={method.active ? "text-blue-600" : "text-gray-500"}>
                                  {method.active ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                            </TableCell>
                            {(hasPermission('cadastros.formas_pagamento', 'criar_editar') || hasPermission('cadastros.formas_pagamento', 'deletar')) && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {hasPermission('cadastros.formas_pagamento', 'criar_editar') && (
                                    <Button variant="ghost" size="icon" onClick={() => handleEditMethod(method)} className="h-8 w-8">
                                      <Pencil className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  )}
                                  {hasPermission('cadastros.formas_pagamento', 'deletar') && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteMethod(method)} className="h-8 w-8">
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
                {sortedMethods.length > 0 && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={totalPages}
                    totalItems={sortedMethods.length}
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

      {/* Modal criar/editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
          <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-blue-900 dark:text-blue-100">
                  {currentMethod ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
                </div>
                {currentMethod && <div className="text-sm font-normal text-blue-600 dark:text-blue-400">{currentMethod.name}</div>}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-2 py-4 space-y-4">
            {/* Informações básicas */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide">Informações</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nome *</Label>
                  <Input
                    value={formState.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Ex: Cartão Visa"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Tipo *</Label>
                  <Select value={formState.tipo} onValueChange={(v) => set('tipo', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(TIPO_LABELS) as [FormaPgtoTipo, string][]).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Descrição</Label>
                <Textarea
                  value={formState.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={2}
                  className="resize-none"
                  placeholder="Detalhes desta forma de pagamento..."
                />
              </div>

            </div>

            {/* Campos extras para fatura (cartão) */}
            {isFatura(formState.tipo) && (
              <div className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-lg p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide">
                  Dados da Fatura
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Bandeira (operadora)</Label>
                    <Input
                      value={formState.operadora}
                      onChange={(e) => set('operadora', e.target.value)}
                      placeholder="Ex: Visa, Mastercard, Elo"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Limite de crédito (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formState.limite_credito}
                      onChange={(e) => set('limite_credito', e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Dia de fechamento (1–28)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      value={formState.dia_fechamento}
                      onChange={(e) => set('dia_fechamento', e.target.value)}
                      placeholder="Ex: 20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Dia de vencimento (1–28)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      value={formState.dia_vencimento}
                      onChange={(e) => set('dia_vencimento', e.target.value)}
                      placeholder="Ex: 10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-5 shadow-sm">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formState.active}
                  onCheckedChange={(checked) => set('active', checked)}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="active" className="cursor-pointer">
                  {formState.active ? "Ativo" : "Inativo"}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-4 border-t border-blue-200 dark:border-blue-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMethod} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
              {currentMethod ? "Atualizar" : "Criar"}
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
              Tem certeza que deseja excluir a forma de pagamento{" "}
              <span className="font-bold">{currentMethod?.name}</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
