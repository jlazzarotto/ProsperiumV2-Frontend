"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, Loader2, Plus, Search, Settings2, X, XCircle } from "lucide-react"
import { motion } from "framer-motion"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"
import {
  type ConfigParam,
  getConfigParams,
  saveConfigParam,
  updateConfigParamRestrict,
  updateConfigParamStatus,
} from "@/app/services/config-params-service"
import { getCompanies, type CompanyItem } from "@/app/services/core-saas-service"

export default function ParametrizacaoSistemaPage() {
  const { user, hasPermission } = useAuth()
  const NEW_TYPE_OPTION = "__new_type__"

  const isRoot = user?.role === "ROLE_ROOT"

  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [params, setParams] = useState<ConfigParam[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusLoadingName, setStatusLoadingName] = useState<string | null>(null)
  const [restrictLoadingName, setRestrictLoadingName] = useState<string | null>(null)

  // Form fields
  const [parametro, setParametro] = useState("")
  const [tipo, setTipo] = useState("")
  const [isCreatingType, setIsCreatingType] = useState(false)
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [originalName, setOriginalName] = useState<string | null>(null)

  const isEditing = useMemo(() => originalName !== null, [originalName])

  const companyId = useMemo(() => {
    if (selectedCompanyId) return Number(selectedCompanyId)
    if (!isRoot) return user?.companyIds?.[0] ?? null
    return null
  }, [selectedCompanyId, isRoot, user?.companyIds])

  const typeOptions = useMemo(() => {
    const normalizedTypes = types
      .map((item) => item.trim())
      .filter(Boolean)

    if (tipo.trim() && !normalizedTypes.includes(tipo.trim())) {
      normalizedTypes.push(tipo.trim())
    }

    return normalizedTypes.sort((a, b) => a.localeCompare(b))
  }, [tipo, types])

  const filteredParams = useMemo(() => {
    if (!searchTerm.trim()) return params
    const lower = searchTerm.toLowerCase()
    return params.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.type?.toLowerCase().includes(lower) ||
        item.value.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower),
    )
  }, [params, searchTerm])

  // Load companies for ROLE_ROOT and set default companyId
  useEffect(() => {
    const init = async () => {
      if (isRoot) {
        try {
          const items = await getCompanies()
          setCompanies(items)
          if (items.length > 0 && !selectedCompanyId) {
            setSelectedCompanyId(String(items[0].id))
          }
        } catch {
          customToast.error("Erro ao carregar companies")
        }
      } else {
        const defaultId = user?.companyIds?.[0]
        if (defaultId) {
          setSelectedCompanyId(String(defaultId))
        }
      }
    }
    init()
  }, [isRoot, user?.companyIds])

  const loadParams = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const response = await getConfigParams(companyId)
      setParams(response.data)
      setTypes(response.types)
    } catch {
      customToast.error("Erro ao carregar parametrização")
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    loadParams()
  }, [loadParams])

  const resetForm = () => {
    setParametro("")
    setTipo("")
    setIsCreatingType(false)
    setValor("")
    setDescricao("")
    setOriginalName(null)
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleSelectParam = (item: ConfigParam) => {
    setParametro(item.name)
    setTipo(item.type || "")
    setIsCreatingType(false)
    setValor(item.value)
    setDescricao(item.description || "")
    setOriginalName(item.name)
    setIsModalOpen(true)
  }

  const handleTypeChange = (value: string) => {
    if (value === NEW_TYPE_OPTION) {
      setTipo("")
      setIsCreatingType(true)
      return
    }
    setTipo(value)
    setIsCreatingType(false)
  }

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value)
    setParams([])
    setTypes([])
  }

  const handleSave = async () => {
    if (!parametro.trim() || !tipo.trim() || !valor.trim()) {
      customToast.error("Informe os campos Parâmetro, Tipo e Valor")
      return
    }

    setSaving(true)
    try {
      await saveConfigParam({
        companyId,
        name: parametro.trim(),
        type: tipo.trim(),
        value: valor.trim(),
        description: descricao.trim(),
        original_name: originalName || undefined,
      })

      customToast.success(isEditing ? "Parâmetro atualizado com sucesso" : "Parâmetro criado com sucesso")
      resetForm()
      setIsModalOpen(false)
      await loadParams()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string }
      const msg = err?.response?.data?.error?.message || err?.message || "Erro ao gravar parâmetro"
      customToast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (item: ConfigParam) => {
    const nextStatus = item.status === 1 ? 2 : 1
    setStatusLoadingName(item.name)

    try {
      await updateConfigParamStatus({ companyId, name: item.name, status: nextStatus })
      setParams((prev) =>
        prev.map((param) => (param.name === item.name ? { ...param, status: nextStatus } : param)),
      )
      customToast.success(nextStatus === 1 ? "Parâmetro ativado com sucesso" : "Parâmetro desativado com sucesso")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string }
      const msg = err?.response?.data?.error?.message || err?.message || "Erro ao atualizar status do parâmetro"
      customToast.error(msg)
    } finally {
      setStatusLoadingName(null)
    }
  }

  const handleToggleRestrict = async (item: ConfigParam) => {
    const nextRestrict = item.restrict === 1 ? 2 : 1
    setRestrictLoadingName(item.name)

    try {
      await updateConfigParamRestrict({ companyId, name: item.name, restrict: nextRestrict })
      setParams((prev) =>
        prev.map((param) => (param.name === item.name ? { ...param, restrict: nextRestrict } : param)),
      )
      customToast.success(nextRestrict === 1 ? "Parâmetro marcado como restrito" : "Parâmetro sem restrição")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string }
      const msg = err?.response?.data?.error?.message || err?.message || "Erro ao atualizar restrição do parâmetro"
      customToast.error(msg)
    } finally {
      setRestrictLoadingName(null)
    }
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
                  <CardTitle className="flex items-center text-indigo-600">
                    <Settings2 className="mr-2 w-8 h-8" />
                    <span className="text-2xl font-medium">Parametrização do sistema</span>
                  </CardTitle>

                  {/* Seletor de Company (apenas para ROLE_ROOT) */}
                  {isRoot && companies.length > 0 && (
                    <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                      <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Selecione a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={String(company.id)}>
                            {company.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

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
                        className="w-full border-0 bg-slate-200 dark:bg-slate-800 px-10 text-center focus:ring-2 focus:ring-indigo-500"
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

                  {hasPermission("admin.parametrizacao_sistema", "criar_editar") && (
                    <Button onClick={handleOpenCreateModal} disabled={!companyId} className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Parâmetro
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parâmetro</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-24 text-center">Restrito</TableHead>
                        <TableHead className="w-24 text-center">Ativado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!companyId ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                            Selecione uma company para visualizar os parâmetros.
                          </TableCell>
                        </TableRow>
                      ) : loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center">
                            <div className="inline-flex items-center gap-2 text-slate-500">
                              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                              Carregando parâmetros...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredParams.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                            {searchTerm
                              ? "Nenhum parâmetro encontrado para a pesquisa."
                              : "Nenhum parâmetro cadastrado."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredParams.map((item) => (
                          <TableRow key={`${item.id}-${item.name}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => handleSelectParam(item)}
                                className="font-medium text-left text-indigo-700 hover:underline"
                              >
                                {item.name}
                              </button>
                              {item.description?.trim() && (
                                <div className="text-[90%] text-gray-500 mt-1 leading-tight">
                                  {item.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{item.type || "-"}</TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                title={item.restrict === 1 ? "Restrito" : "Sem restrição"}
                                onClick={() => handleToggleRestrict(item)}
                                disabled={restrictLoadingName === item.name}
                                className="inline-flex items-center justify-center min-h-5 min-w-5 disabled:opacity-60"
                              >
                                {restrictLoadingName === item.name ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mx-auto" />
                                ) : item.restrict === 1 ? (
                                  <AlertCircle className="h-5 w-5 text-red-600 mx-auto" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-gray-400 mx-auto" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                title={item.status === 1 ? "Desativar" : "Ativar"}
                                onClick={() => handleToggleStatus(item)}
                                disabled={statusLoadingName === item.name}
                                className="inline-flex items-center justify-center disabled:opacity-60"
                              >
                                {statusLoadingName === item.name ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mx-auto" />
                                ) : item.status === 1 ? (
                                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-red-600 mx-auto" />
                                )}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Atualizar Parâmetro" : "Novo Parâmetro"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Parâmetro</label>
              <Input
                value={parametro}
                onChange={(e) => setParametro(e.target.value)}
                placeholder="Informe o parâmetro"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              {isCreatingType ? (
                <Input
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  placeholder="Informe o novo tipo"
                />
              ) : (
                <Select value={tipo} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NEW_TYPE_OPTION} className="font-medium text-blue-600">
                      Criar novo tipo
                    </SelectItem>
                    {typeOptions.map((itemType) => (
                      <SelectItem key={itemType} value={itemType}>
                        {itemType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Valor</label>
              <Input
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Informe o valor"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Informe a descrição"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm() }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 min-w-[96px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gravar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
