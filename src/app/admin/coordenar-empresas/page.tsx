"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, ChevronDown, ChevronRight, Layers3, Pencil, Plus, RefreshCw } from "lucide-react"
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
import { createCompany, createEmpresa, getCompanies, getEmpresas, updateCompany, updateEmpresa, type CompanyItem, type EmpresaItem } from "@/app/services/core-saas-service"

export default function CoordenarEmpresasPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [empresas, setEmpresas] = useState<EmpresaItem[]>([])
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false)
  const [empresaDialogOpen, setEmpresaDialogOpen] = useState(false)
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null)
  const [editingEmpresaId, setEditingEmpresaId] = useState<number | null>(null)
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<number[]>([])
  const [companyForm, setCompanyForm] = useState({ nome: "", tenancyMode: "shared" as "shared" | "dedicated", databaseKey: "", status: "active" as "active" | "inactive" })
  const [empresaForm, setEmpresaForm] = useState({ companyId: "", razaoSocial: "", nomeFantasia: "", cnpj: "", status: "active" as "active" | "inactive" })
  const [saving, setSaving] = useState(false)

  const isRoot = user?.role === "ROLE_ROOT"

  const load = async () => {
    setLoading(true)
    try {
      const [companiesData, empresasData] = await Promise.all([getCompanies(), getEmpresas()])
      setCompanies(companiesData)
      setEmpresas(empresasData)
    } catch (error) {
      console.error("Erro ao carregar companies/empresas:", error)
      customToast.error("Erro ao carregar companies e empresas.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const empresasByCompany = useMemo(() => {
    const grouped = new Map<number, EmpresaItem[]>()

    for (const empresa of empresas) {
      const items = grouped.get(empresa.companyId) ?? []
      items.push(empresa)
      grouped.set(empresa.companyId, items)
    }

    return grouped
  }, [empresas])

  const handleCreateCompany = async () => {
    if (!companyForm.nome.trim()) {
      customToast.error("Informe o nome da company.")
      return
    }

    if (companyForm.tenancyMode === "dedicated" && !companyForm.databaseKey.trim()) {
      customToast.error("Informe o database key para tenancy dedicated.")
      return
    }

    setSaving(true)
    try {
      if (editingCompanyId) {
        await updateCompany(editingCompanyId, {
          nome: companyForm.nome.trim(),
          tenancyMode: companyForm.tenancyMode,
          databaseKey: companyForm.databaseKey.trim() || undefined,
          status: companyForm.status,
        })
      } else {
        await createCompany({
          nome: companyForm.nome.trim(),
          tenancyMode: companyForm.tenancyMode,
          databaseKey: companyForm.databaseKey.trim() || undefined,
          status: companyForm.status,
        })
      }

      customToast.success(editingCompanyId ? "Company atualizada com sucesso." : "Company criada com sucesso.")
      setCompanyDialogOpen(false)
      setEditingCompanyId(null)
      setCompanyForm({ nome: "", tenancyMode: "shared", databaseKey: "", status: "active" })
      await load()
    } catch (error: any) {
      customToast.error(error?.response?.data?.error?.message || error?.message || `Erro ao ${editingCompanyId ? "atualizar" : "criar"} company.`)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateEmpresa = async () => {
    if (!empresaForm.companyId || !empresaForm.razaoSocial.trim() || !empresaForm.cnpj.trim()) {
      customToast.error("Preencha company, razão social e CNPJ.")
      return
    }

    setSaving(true)
    try {
      if (editingEmpresaId) {
        await updateEmpresa(editingEmpresaId, {
          companyId: Number(empresaForm.companyId),
          razaoSocial: empresaForm.razaoSocial.trim(),
          nomeFantasia: empresaForm.nomeFantasia.trim() || undefined,
          cnpj: empresaForm.cnpj.trim(),
          status: empresaForm.status,
        })
      } else {
        await createEmpresa({
          companyId: Number(empresaForm.companyId),
          razaoSocial: empresaForm.razaoSocial.trim(),
          nomeFantasia: empresaForm.nomeFantasia.trim() || undefined,
          cnpj: empresaForm.cnpj.trim(),
          status: empresaForm.status,
        })
      }

      customToast.success(editingEmpresaId ? "Empresa atualizada com sucesso." : "Empresa criada com sucesso.")
      setEmpresaDialogOpen(false)
      setEditingEmpresaId(null)
      setEmpresaForm({ companyId: "", razaoSocial: "", nomeFantasia: "", cnpj: "", status: "active" })
      await load()
    } catch (error: any) {
      customToast.error(error?.response?.data?.error?.message || error?.message || `Erro ao ${editingEmpresaId ? "atualizar" : "criar"} empresa.`)
    } finally {
      setSaving(false)
    }
  }

  const openCreateCompanyDialog = () => {
    setEditingCompanyId(null)
    setCompanyForm({ nome: "", tenancyMode: "shared", databaseKey: "", status: "active" })
    setCompanyDialogOpen(true)
  }

  const openEditCompanyDialog = (company: CompanyItem) => {
    setEditingCompanyId(company.id)
    setCompanyForm({
      nome: company.nome,
      tenancyMode: company.tenantInstance.tenancyMode,
      databaseKey: company.tenantInstance.databaseKey,
      status: company.status as "active" | "inactive",
    })
    setCompanyDialogOpen(true)
  }

  const openCreateEmpresaDialog = () => {
    setEditingEmpresaId(null)
    setEmpresaForm({ companyId: "", razaoSocial: "", nomeFantasia: "", cnpj: "", status: "active" })
    setEmpresaDialogOpen(true)
  }

  const openEditEmpresaDialog = (empresa: EmpresaItem) => {
    setEditingEmpresaId(empresa.id)
    setEmpresaForm({
      companyId: String(empresa.companyId),
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia ?? "",
      cnpj: empresa.cnpj,
      status: empresa.status as "active" | "inactive",
    })
    setEmpresaDialogOpen(true)
  }

  const toggleExpanded = (companyId: number) => {
    setExpandedCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    )
  }

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Companies e Empresas
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tela compatível com a API atual: listagem e cadastros suportados pelo backend.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              {isRoot && (
                <Button onClick={() => setCompanyDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Company
                </Button>
              )}
              {isRoot && (
                <Button variant="secondary" onClick={() => setEmpresaDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Empresa
                </Button>
              )}
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers3 className="h-4 w-4 text-blue-600" />
                Estrutura de companies e empresas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-slate-500">Carregando companies e empresas...</div>
              ) : companies.length === 0 ? (
                <div className="text-sm text-slate-500">Nenhuma company disponível.</div>
              ) : (
                companies.map((company) => {
                  const companyEmpresas = empresasByCompany.get(company.id) ?? []
                  const isExpanded = expandedCompanyIds.includes(company.id)

                  return (
                    <div key={company.id} className="rounded-2xl border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="flex items-center gap-3 p-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-xl"
                          onClick={() => toggleExpanded(company.id)}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>

                        <button
                          type="button"
                          onClick={() => isRoot && openEditCompanyDialog(company)}
                          className={`flex flex-1 items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition ${
                            isRoot
                              ? "hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                              : "cursor-default"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Layers3 className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-slate-900 dark:text-white">{company.nome}</span>
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              ID {company.id} • {company.tenantInstance.tenancyMode} • DB {company.tenantInstance.databaseKey}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={company.status === "active" ? "default" : "secondary"}>
                              {company.status}
                            </Badge>
                            {isRoot && <Pencil className="h-4 w-4 text-slate-400" />}
                          </div>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                          {companyEmpresas.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-700">
                              Nenhuma empresa vinculada a esta company.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {companyEmpresas.map((empresa) => (
                                <button
                                  key={empresa.id}
                                  type="button"
                                  onClick={() => isRoot && openEditEmpresaDialog(empresa)}
                                  className={`flex w-full items-start justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition dark:border-slate-800 ${
                                    isRoot
                                      ? "hover:border-emerald-200 hover:bg-emerald-50/40 dark:hover:border-emerald-900 dark:hover:bg-slate-900"
                                      : "cursor-default"
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-emerald-600" />
                                      <span className="font-medium text-slate-900 dark:text-white">{empresa.razaoSocial}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                      {empresa.nomeFantasia || "Sem nome fantasia"} • CNPJ {empresa.cnpj}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={empresa.status === "active" ? "default" : "secondary"}>
                                      {empresa.status}
                                    </Badge>
                                    {isRoot && <Pencil className="h-4 w-4 text-slate-400" />}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={companyDialogOpen} onOpenChange={(open) => {
        setCompanyDialogOpen(open)
        if (!open) {
          setEditingCompanyId(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompanyId ? "Editar Company" : "Nova Company"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-nome">Nome</Label>
              <Input id="company-nome" value={companyForm.nome} onChange={(e) => setCompanyForm((prev) => ({ ...prev, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Modo de tenancy</Label>
              <Select value={companyForm.tenancyMode} onValueChange={(value: "shared" | "dedicated") => setCompanyForm((prev) => ({ ...prev, tenancyMode: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">shared</SelectItem>
                  <SelectItem value="dedicated">dedicated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={companyForm.status} onValueChange={(value: "active" | "inactive") => setCompanyForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-db-key">Database key</Label>
              <Input
                id="company-db-key"
                placeholder={companyForm.tenancyMode === "shared" ? "Opcional em shared" : "Obrigatório em dedicated"}
                value={companyForm.databaseKey}
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, databaseKey: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleCreateCompany()} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={empresaDialogOpen} onOpenChange={(open) => {
        setEmpresaDialogOpen(open)
        if (!open) {
          setEditingEmpresaId(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmpresaId ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select value={empresaForm.companyId} onValueChange={(value) => setEmpresaForm((prev) => ({ ...prev, companyId: value }))}>
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
              <Label htmlFor="empresa-razao">Razão social</Label>
              <Input id="empresa-razao" value={empresaForm.razaoSocial} onChange={(e) => setEmpresaForm((prev) => ({ ...prev, razaoSocial: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa-fantasia">Nome fantasia</Label>
              <Input id="empresa-fantasia" value={empresaForm.nomeFantasia} onChange={(e) => setEmpresaForm((prev) => ({ ...prev, nomeFantasia: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa-cnpj">CNPJ</Label>
              <Input id="empresa-cnpj" value={empresaForm.cnpj} onChange={(e) => setEmpresaForm((prev) => ({ ...prev, cnpj: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={empresaForm.status} onValueChange={(value: "active" | "inactive") => setEmpresaForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpresaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleCreateEmpresa()} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
