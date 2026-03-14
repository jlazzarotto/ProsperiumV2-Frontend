/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { CurrencyInput } from "@/components/currency-input"
import {
  getAllCartoes,
  createCartao,
  updateCartao,
  deleteCartao,
} from "@/app/services/cartao-service"
import type { Cartao } from "@/types/types"
import { motion } from "framer-motion"
import { Pagination } from "@/components/ui/pagination"
import { usePagination } from "@/app/hooks/use-pagination"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { useAuth } from "@/app/contexts/auth-context"

const formatBRL = (val: number | string | null | undefined): string => {
  if (val == null || val === '') return '—'
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type FormState = {
  apelido: string
  operadora: string
  dia_fechamento: string
  dia_vencimento: string
  limite_credito: number
  status: boolean
}

const EMPTY_FORM: FormState = {
  apelido: '',
  operadora: '',
  dia_fechamento: '',
  dia_vencimento: '',
  limite_credito: 0,
  status: true,
}

export default function CartoesPage() {
  const { hasPermission } = useAuth()
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentCartao, setCurrentCartao] = useState<Cartao | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM)

  const pagination = usePagination({
    defaultItemsPerPage: 10,
    defaultSortBy: "apelido",
    defaultSortOrder: "asc",
  })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(t)
  }, [searchTerm])

  const sorted = useMemo(() => {
    if (!pagination.sortBy) return cartoes
    return [...cartoes].sort((a, b) => {
      const av = (a as any)[pagination.sortBy] ?? ""
      const bv = (b as any)[pagination.sortBy] ?? ""
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      let cmp = 0
      if (typeof av === "string" && typeof bv === "string") cmp = av.toLowerCase().localeCompare(bv.toLowerCase())
      else if (typeof av === "number" && typeof bv === "number") cmp = av - bv
      else cmp = String(av).localeCompare(String(bv))
      return pagination.sortOrder === "asc" ? cmp : -cmp
    })
  }, [cartoes, pagination.sortBy, pagination.sortOrder])

  const { paginatedData, totalPages } = useMemo(() => pagination.paginateData(sorted), [sorted, pagination])

  const fetchCartoes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllCartoes({ search: debouncedSearch })
      setCartoes(data)
    } catch {
      setError("Não foi possível carregar os cartões. Tente novamente.")
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }, [debouncedSearch])

  useEffect(() => { fetchCartoes() }, [])

  useEffect(() => {
    if (debouncedSearch !== searchTerm) return
    setIsSearching(true)
    fetchCartoes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    if (currentCartao) {
      setFormState({
        apelido:        currentCartao.apelido ?? '',
        operadora:      currentCartao.operadora ?? '',
        dia_fechamento: currentCartao.dia_fechamento ? String(currentCartao.dia_fechamento) : '',
        dia_vencimento: currentCartao.dia_vencimento ? String(currentCartao.dia_vencimento) : '',
        limite_credito: currentCartao.limite_credito ? Number(currentCartao.limite_credito) : 0,
        status:         currentCartao.status ?? true,
      })
    } else {
      setFormState(EMPTY_FORM)
    }
  }, [currentCartao, isModalOpen])

  const handleAdd = () => { setCurrentCartao(undefined); setIsModalOpen(true) }
  const handleEdit = (c: Cartao) => { setCurrentCartao(c); setIsModalOpen(true) }
  const handleDelete = (c: Cartao) => { setCurrentCartao(c); setIsDeleteDialogOpen(true) }

  const confirmDelete = async () => {
    if (!currentCartao?.id_cartao) return
    setIsDeleteDialogOpen(false)
    setLoading(true)
    try {
      await deleteCartao(currentCartao.id_cartao)
      await fetchCartoes()
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formState.apelido) return
    setLoading(true)
    try {
      const payload = {
        apelido:        formState.apelido,
        operadora:      formState.operadora || '',
        dia_fechamento: formState.dia_fechamento ? Number(formState.dia_fechamento) : 0,
        dia_vencimento: formState.dia_vencimento ? Number(formState.dia_vencimento) : 0,
        limite_credito: formState.limite_credito || 0,
        id_conta_caixa_pagamento: 0,
        id_conta_contabil_passivo: 0,
        id_un_negocio: 0,
        status:         formState.status,
      }
      if (currentCartao?.id_cartao) {
        await updateCartao(currentCartao.id_cartao, payload)
      } else {
        await createCartao(payload)
      }
      setIsModalOpen(false)
      await fetchCartoes()
    } finally {
      setLoading(false)
    }
  }

  const set = (field: keyof FormState, value: string | boolean) =>
    setFormState(prev => ({ ...prev, [field]: value }))

  const canEdit = hasPermission('cadastros.cartoes', 'criar_editar')
  const canDelete = hasPermission('cadastros.cartoes', 'deletar')
  const colSpan = (canEdit || canDelete) ? 6 : 5

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
                      <span className="font-medium text-3xl">Cartões de Crédito</span>
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
                            if (!e.target.value.trim()) fetchCartoes()
                          }}
                          className="w-[400px] border-0 bg-slate-200 dark:bg-slate-800 px-10 text-center focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : searchTerm ? (
                            <Button variant="ghost" size="icon" onClick={() => setSearchTerm("")} className="h-6 w-6 p-0">
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                    {canEdit && (
                      <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Cartão
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
                        <SortableTableHead field="apelido" label="Apelido" currentSortBy={pagination.sortBy} currentSortOrder={pagination.sortOrder} onSort={pagination.setSorting} />
                        <TableHead>Operadora</TableHead>
                        <TableHead>Fechamento</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Limite</TableHead>
                        <SortableTableHead field="status" label="Status" currentSortBy={pagination.sortBy} currentSortOrder={pagination.sortOrder} onSort={pagination.setSorting} />
                        {(canEdit || canDelete) && <TableHead className="text-right">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="text-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            <span>Carregando cartões...</span>
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="text-center py-10 text-red-500">{error}</TableCell>
                        </TableRow>
                      ) : sorted.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={colSpan} className="text-center py-10 text-muted-foreground">
                            Nenhum cartão encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((c) => (
                          <TableRow key={c.id_cartao}>
                            <TableCell className="font-medium">{c.apelido}</TableCell>
                            <TableCell>{c.operadora || <span className="text-slate-400 text-xs">—</span>}</TableCell>
                            <TableCell>{c.dia_fechamento ? `Dia ${c.dia_fechamento}` : <span className="text-slate-400 text-xs">—</span>}</TableCell>
                            <TableCell>{c.dia_vencimento ? `Dia ${c.dia_vencimento}` : <span className="text-slate-400 text-xs">—</span>}</TableCell>
                            <TableCell>{c.limite_credito ? formatBRL(c.limite_credito) : <span className="text-slate-400 text-xs">—</span>}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${c.status ? "bg-blue-600" : "bg-gray-400"}`} />
                                <span className={c.status ? "text-blue-600" : "text-gray-500"}>
                                  {c.status ? "Ativo" : "Inativo"}
                                </span>
                              </div>
                            </TableCell>
                            {(canEdit || canDelete) && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {canEdit && (
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="h-8 w-8">
                                      <Pencil className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  )}
                                  {canDelete && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c)} className="h-8 w-8">
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
                {sorted.length > 0 && (
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={totalPages}
                    totalItems={sorted.length}
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
        <DialogContent className="sm:max-w-[600px] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
          <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-blue-900 dark:text-blue-100">
                  {currentCartao ? "Editar Cartão" : "Novo Cartão"}
                </div>
                {currentCartao && (
                  <div className="text-sm font-normal text-blue-600 dark:text-blue-400">{currentCartao.apelido}</div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-2 py-4 space-y-4">
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide">Identificação</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Apelido *</Label>
                  <Input
                    value={formState.apelido}
                    onChange={(e) => set('apelido', e.target.value)}
                    placeholder="Ex: Nubank, Inter, C6"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Operadora / Bandeira</Label>
                  <Input
                    value={formState.operadora}
                    onChange={(e) => set('operadora', e.target.value)}
                    placeholder="Ex: Visa, Mastercard, Elo"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide">Dados da Fatura</h3>

              <div className="grid grid-cols-3 gap-4">
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
                <div className="space-y-1">
                  <Label>Limite de crédito</Label>
                  <CurrencyInput
                    value={formState.limite_credito}
                    onValueChange={(v) => setFormState(prev => ({ ...prev, limite_credito: v }))}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-5 shadow-sm">
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formState.status}
                  onCheckedChange={(v) => set('status', v)}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="status" className="cursor-pointer">
                  {formState.status ? "Ativo" : "Inativo"}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-4 border-t border-blue-200 dark:border-blue-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
              {currentCartao ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cartão{" "}
              <span className="font-bold">{currentCartao?.apelido}</span>? Esta ação não pode ser desfeita.
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
