"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Building2,
  ChevronDown,
  Layers3,
  Shield,
} from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/contexts/auth-context"
import { getDashboardSummary, getCompanies, getEmpresas, type CompanyItem, type EmpresaItem } from "@/app/services/core-saas-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit2 } from "lucide-react"

interface Summary {
  activeCompanies: number
  activeEmpresas: number
  activeUnidades: number
  dedicatedCompanies: number
  sharedCompanies: number
  topCompanies: unknown[]
  recentCompanies: unknown[]
}

export function HomeDashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<Summary>({
    activeCompanies: 0,
    activeEmpresas: 0,
    activeUnidades: 0,
    dedicatedCompanies: 0,
    sharedCompanies: 0,
    topCompanies: [],
    recentCompanies: [],
  })
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null)
  const [editCompanyDialog, setEditCompanyDialog] = useState(false)
  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(null)
  const [companiesEmpresas, setCompaniesEmpresas] = useState<Record<number, EmpresaItem[]>>({})
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaItem | null>(null)
  const [editEmpresaDialog, setEditEmpresaDialog] = useState(false)
  const isRoot = user?.roles?.includes("ROLE_ROOT") ?? false

  useEffect(() => {
    const load = async () => {
      try {
        const [metrics, companiesData] = await Promise.all([
          getDashboardSummary(),
          getCompanies(),
        ])
        setSummary({
          activeCompanies: metrics.activeCompanies,
          activeEmpresas: metrics.empresas.active,
          activeUnidades: metrics.unidades.active,
          dedicatedCompanies: metrics.dedicatedCompanies,
          sharedCompanies: metrics.sharedCompanies,
          topCompanies: [],
          recentCompanies: [],
        })
        setCompanies(companiesData)
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handleEditCompany = (company: CompanyItem) => {
    setEditingCompany(company)
    setEditCompanyDialog(true)
  }

  const handleEditEmpresa = (empresa: EmpresaItem) => {
    setEditingEmpresa(empresa)
    setEditEmpresaDialog(true)
  }

  const handleToggleExpand = async (company: CompanyItem) => {
    if (expandedCompanyId === company.id) {
      // Fechar se já está aberto
      setExpandedCompanyId(null)
    } else {
      // Abrir e carregar empresas se não estiverem carregadas
      setExpandedCompanyId(company.id)
      // Salvar nome da company no sessionStorage para o banner do header
      sessionStorage.setItem("prosperium_selected_company_name", company.nome)
      // Dispatch custom event so hook listeners are notified
      window.dispatchEvent(new CustomEvent("companyNameChanged", { detail: company.nome }))
      if (!companiesEmpresas[company.id]) {
        try {
          const empresas = await getEmpresas(company.id)
          setCompaniesEmpresas((prev) => ({
            ...prev,
            [company.id]: empresas,
          }))
        } catch (error) {
          console.error("Erro ao carregar empresas:", error)
        }
      }
    }
  }

  const kpis = [
    {
      label: "Grupos Econômicos ativos",
      value: summary.activeCompanies,
      tone: "text-sky-600",
      icon: Layers3,
    },
    {
      label: "Empresas ativas",
      value: summary.activeEmpresas,
      tone: "text-emerald-600",
      icon: Building2,
    },
    {
      label: "Unidades ativas",
      value: summary.activeUnidades,
      tone: "text-amber-600",
      icon: Briefcase,
    },
  ]

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.9))] dark:bg-slate-950">
        <div className="w-full px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
          <div className="mb-4 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.35fr_0.65fr] lg:px-6">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{user?.role ?? "Sem papel"}</Badge>
                  <Badge variant="secondary">
                    {loading ? "Carregando..." : "Dashboard carregado"}
                  </Badge>
                </div>
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Dashboard executivo do ecossistema Prosperium
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Bem-vindo ao dashboard executivo. Selecione um Grupo Econômico para acessar os módulos operacionais
                  ou gerenciar a estrutura de companies e empresas.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/financeiro">
                      Ver visão inicial anterior
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div>
                <HighlightCard
                  title="Modelo de tenancy"
                  value={`${summary.sharedCompanies} shared / ${summary.dedicatedCompanies} dedicated`}
                  icon={Banknote}
                  tone="from-sky-500/15 to-cyan-500/5"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.label} className="border-slate-200/80 bg-white/85 dark:border-slate-800 dark:bg-slate-900/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="text-3xl font-semibold text-slate-950 dark:text-white">
                      {loading ? "..." : item.value}
                    </div>
                    <Icon className={`h-6 w-6 ${item.tone}`} />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="px-6 py-5">
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Grupos Econômicos</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tenancy Mode</TableHead>
                    <TableHead>Database Key</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        {loading ? "Carregando..." : "Nenhum grupo econômico encontrado"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.flatMap((company) => [
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.nome}</TableCell>
                        <TableCell>
                          <Badge variant={company.status === "active" ? "default" : "secondary"}>
                            {company.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {company.tenantInstance.tenancyMode === "shared" ? "Shared" : "Dedicated"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{company.tenantInstance.databaseKey}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              title="Editar Company"
                              onClick={() => handleEditCompany(company)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              title={expandedCompanyId === company.id ? "Ocultar Empresas" : "Ver Empresas"}
                              onClick={() => handleToggleExpand(company)}
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedCompanyId === company.id ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>,
                      // Row de expansão com subtabela
                      expandedCompanyId === company.id && (
                        <TableRow key={`${company.id}-expanded`} className="bg-slate-50 dark:bg-slate-800/30">
                          <TableCell colSpan={5} className="p-0">
                            <div className="p-4">
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                Empresas do grupo {company.nome}
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-slate-200 dark:border-slate-700">
                                    <TableHead className="text-xs">Razão Social</TableHead>
                                    <TableHead className="text-xs">Apelido</TableHead>
                                    <TableHead className="text-xs">CNPJ/CPF</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs text-right">Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {companiesEmpresas[company.id]?.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center py-6 text-slate-500 text-sm">
                                        Nenhuma empresa encontrada
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    companiesEmpresas[company.id]?.map((empresa) => (
                                      <TableRow key={empresa.id} className="border-slate-200 dark:border-slate-700">
                                        <TableCell className="text-sm">{empresa.razaoSocial}</TableCell>
                                        <TableCell className="text-sm">{empresa.apelido || "-"}</TableCell>
                                        <TableCell className="text-sm font-mono text-xs">
                                          {empresa.cpfCnpj || empresa.cnpj || "-"}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          <Badge variant={empresa.status === "active" ? "default" : "secondary"} className="text-xs">
                                            {empresa.status === "active" ? "Ativo" : "Inativo"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            title="Editar Empresa"
                                            onClick={() => handleEditEmpresa(empresa)}
                                          >
                                            <Edit2 className="h-4 w-4" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    ])
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Modal - Editar Company */}
          <Dialog open={editCompanyDialog} onOpenChange={setEditCompanyDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Grupo Econômico</DialogTitle>
                <DialogDescription>
                  Atualize as informações do grupo econômico {editingCompany?.nome}
                </DialogDescription>
              </DialogHeader>
              {editingCompany && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-company-name">Nome</Label>
                    <Input
                      id="edit-company-name"
                      defaultValue={editingCompany.nome}
                      placeholder="Nome do grupo econômico"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <div className="text-sm text-slate-600">
                      {editingCompany.status === "active" ? "Ativo" : "Inativo"}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tenancy Mode</Label>
                    <div className="text-sm text-slate-600">
                      {editingCompany.tenantInstance.tenancyMode === "shared" ? "Shared" : "Dedicated"}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditCompanyDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setEditCompanyDialog(false)}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal - Editar Empresa */}
          <Dialog open={editEmpresaDialog} onOpenChange={setEditEmpresaDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Editar Empresa</DialogTitle>
                <DialogDescription>
                  Atualize as informações da empresa {editingEmpresa?.razaoSocial}
                </DialogDescription>
              </DialogHeader>
              {editingEmpresa && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-empresa-razao-social">Razão Social</Label>
                    <Input
                      id="edit-empresa-razao-social"
                      defaultValue={editingEmpresa.razaoSocial}
                      placeholder="Nome completo da empresa"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-empresa-apelido">Apelido</Label>
                    <Input
                      id="edit-empresa-apelido"
                      defaultValue={editingEmpresa.apelido || ""}
                      placeholder="Nome reduzido da empresa"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-empresa-cnpj">CNPJ/CPF</Label>
                    <Input
                      id="edit-empresa-cnpj"
                      defaultValue={editingEmpresa.cpfCnpj || editingEmpresa.cnpj || ""}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-empresa-estado">Estado</Label>
                      <Input
                        id="edit-empresa-estado"
                        defaultValue={editingEmpresa.estado || ""}
                        placeholder="Estado"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-empresa-cidade">Cidade</Label>
                      <Input
                        id="edit-empresa-cidade"
                        defaultValue={editingEmpresa.cidade || ""}
                        placeholder="Cidade"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <div className="text-sm text-slate-600">
                      {editingEmpresa.status === "active" ? "Ativo" : "Inativo"}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditEmpresaDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setEditEmpresaDialog(false)}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  )
}

function HighlightCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  icon: typeof Shield
  tone: string
}) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br ${tone} p-4 dark:border-slate-800`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</div>
          <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{value}</div>
        </div>
        <div className="rounded-xl bg-white/80 p-2 text-slate-700 shadow-sm dark:bg-slate-950/70 dark:text-slate-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
