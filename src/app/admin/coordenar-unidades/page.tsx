"use client"

import { useEffect, useMemo, useState } from "react"
import { Briefcase, Pencil, Plus, RefreshCw } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"
import { useCompany } from "@/app/contexts/company-context"
import { createUnidade, getCompanies, getUnidades, updateUnidade, type CompanyItem, type UnidadeItem } from "@/app/services/core-saas-service"

export default function CoordenarUnidadesPage() {
  const { user } = useAuth()
  const { selectedCompanyId: globalSelectedCompanyId } = useCompany()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [unidades, setUnidades] = useState<UnidadeItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUnidade, setEditingUnidade] = useState<UnidadeItem | null>(null)
  const [form, setForm] = useState({ companyId: "", nome: "", abreviatura: "" })

  const isRoot = user?.role === "ROLE_ROOT"

  const load = async () => {
    setLoading(true)
    try {
      const companyFilter = isRoot ? (globalSelectedCompanyId ?? undefined) : undefined
      const [companiesData, unidadesData] = await Promise.all([getCompanies(), getUnidades(companyFilter)])
      setCompanies(companiesData)
      setUnidades(unidadesData)
    } catch (error) {
      console.error("Erro ao carregar unidades:", error)
      customToast.error("Erro ao carregar unidades de negócio.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [globalSelectedCompanyId])

  const companiesById = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies]
  )

  const defaultCompanyId = useMemo(() => {
    if (isRoot) return globalSelectedCompanyId ? String(globalSelectedCompanyId) : ""
    return user?.companyIds?.[0] ? String(user.companyIds[0]) : ""
  }, [isRoot, globalSelectedCompanyId, user?.companyIds])

  useEffect(() => {
    if (!form.companyId && defaultCompanyId) {
      setForm((prev) => ({ ...prev, companyId: defaultCompanyId }))
    }
  }, [defaultCompanyId, form.companyId])

  const openCreate = () => {
    setEditingUnidade(null)
    setForm({ companyId: defaultCompanyId, nome: "", abreviatura: "" })
    setDialogOpen(true)
  }

  const openEdit = (unidade: UnidadeItem) => {
    setEditingUnidade(unidade)
    setForm({ companyId: String(unidade.companyId), nome: unidade.nome, abreviatura: unidade.abreviatura })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.companyId || !form.nome.trim() || !form.abreviatura.trim()) {
      customToast.error("Preencha company, nome e abreviatura.")
      return
    }

    setSaving(true)
    try {
      if (editingUnidade) {
        await updateUnidade(editingUnidade.id, {
          companyId: Number(form.companyId),
          nome: form.nome.trim(),
          abreviatura: form.abreviatura.trim(),
          status: editingUnidade.status,
        })
        customToast.success("Unidade atualizada com sucesso.")
      } else {
        await createUnidade({
          companyId: Number(form.companyId),
          nome: form.nome.trim(),
          abreviatura: form.abreviatura.trim(),
        })
        customToast.success("Unidade criada com sucesso.")
      }

      setDialogOpen(false)
      setEditingUnidade(null)
      setForm({ companyId: defaultCompanyId, nome: "", abreviatura: "" })
      await load()
    } catch (error: any) {
      customToast.error(error?.response?.data?.error?.message || error?.message || (editingUnidade ? "Erro ao atualizar unidade." : "Erro ao criar unidade."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Unidades de Negócio
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Listagem e cadastro aderentes ao modelo canônico atual.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Unidade
              </Button>
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-amber-600" />
                Unidades acessíveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-slate-500">Carregando unidades...</div>
              ) : unidades.length === 0 ? (
                <div className="text-sm text-slate-500">Nenhuma unidade disponível.</div>
              ) : (
                unidades.map((unidade) => (
                  <div key={unidade.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{unidade.nome}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Abreviatura {unidade.abreviatura} • Company: {companiesById.get(unidade.companyId)?.nome || `#${unidade.companyId}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={unidade.status === "active" ? "default" : "secondary"}>
                          {unidade.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(unidade)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editingUnidade ? "Editar Unidade de Negócio" : "Nova Unidade de Negócio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select value={form.companyId} onValueChange={(value) => setForm((prev) => ({ ...prev, companyId: value }))}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade-nome">Nome</Label>
              <Input id="unidade-nome" value={form.nome} onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidade-abreviatura">Abreviatura</Label>
              <Input id="unidade-abreviatura" value={form.abreviatura} onChange={(e) => setForm((prev) => ({ ...prev, abreviatura: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleSave()} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
