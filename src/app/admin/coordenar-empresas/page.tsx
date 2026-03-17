"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  Building2,
  Factory,
  FileText,
  Landmark,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/contexts/auth-context"
import {
  type CompanyItem,
  type EmpresaItem,
  type TenantOption,
} from "@/app/services/core-saas-service"
import customToast from "@/components/ui/custom-toast"
import { cn } from "@/lib/utils"
import { maskCEP, maskCNPJ, maskCPFOrCNPJ, unmaskCPFOrCNPJ, unmaskNumbers, validateCNPJ, validateCPF } from "@/lib/masks"

type EmpresaStatus = "active" | "inactive"
type GrupoEconomicoStatus = "active" | "inactive"

type GrupoEconomicoForm = {
  nome: string
  tenancyMode: "shared" | "dedicated"
  databaseKey: string
  status: GrupoEconomicoStatus
}

type EmpresaForm = {
  companyId: string
  razaoSocial: string
  apelido: string
  abreviatura: string
  cpfCnpj: string
  inscricaoEstadual: string
  inscricaoMunicipal: string
  cep: string
  estado: string
  cidade: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  status: EmpresaStatus
}

const EMPRESA_FORM_INITIAL: EmpresaForm = {
  companyId: "",
  razaoSocial: "",
  apelido: "",
  abreviatura: "",
  cpfCnpj: "",
  inscricaoEstadual: "",
  inscricaoMunicipal: "",
  cep: "",
  estado: "",
  cidade: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  status: "active",
}

const GRUPO_ECONOMICO_FORM_INITIAL: GrupoEconomicoForm = {
  nome: "",
  tenancyMode: "shared",
  databaseKey: "",
  status: "active",
}

const BRAZILIAN_STATES = [
  "Acre",
  "Alagoas",
  "Amapa",
  "Amazonas",
  "Bahia",
  "Ceara",
  "Distrito Federal",
  "Espirito Santo",
  "Goias",
  "Maranhao",
  "Mato Grosso",
  "Mato Grosso do Sul",
  "Minas Gerais",
  "Para",
  "Paraiba",
  "Parana",
  "Pernambuco",
  "Piaui",
  "Rio de Janeiro",
  "Rio Grande do Norte",
  "Rio Grande do Sul",
  "Rondonia",
  "Roraima",
  "Santa Catarina",
  "Sao Paulo",
  "Sergipe",
  "Tocantins",
] as const

function normalizeStatus(status?: string | null): EmpresaStatus {
  return status === "inactive" ? "inactive" : "active"
}

function extractDocument(empresa: EmpresaItem): string {
  return String(empresa.cpfCnpj || empresa.cnpj || "")
}

function extractAddressField(empresa: EmpresaItem, field: keyof NonNullable<EmpresaItem["endereco"]>): string {
  const nestedValue = empresa.endereco?.[field]
  const flatValue = empresa[field]
  return String(nestedValue || flatValue || "")
}

function mapEmpresaToForm(empresa: EmpresaItem): EmpresaForm {
  return {
    companyId: String(empresa.companyId),
    razaoSocial: empresa.razaoSocial || "",
    apelido: String(empresa.apelido || empresa.nomeFantasia || ""),
    abreviatura: String(empresa.abreviatura || ""),
    cpfCnpj: extractDocument(empresa),
    inscricaoEstadual: String(empresa.inscricaoEstadual || ""),
    inscricaoMunicipal: String(empresa.inscricaoMunicipal || ""),
    cep: extractAddressField(empresa, "cep"),
    estado: extractAddressField(empresa, "estado"),
    cidade: extractAddressField(empresa, "cidade"),
    logradouro: extractAddressField(empresa, "logradouro"),
    numero: extractAddressField(empresa, "numero"),
    complemento: extractAddressField(empresa, "complemento"),
    bairro: extractAddressField(empresa, "bairro"),
    status: normalizeStatus(empresa.status),
  }
}

function buildEmpresaPayload(form: EmpresaForm) {
  const cleanedDocument = unmaskCPFOrCNPJ(form.cpfCnpj)
  const normalizedAbbreviation = form.abreviatura.trim().toUpperCase()

  return {
    companyId: Number(form.companyId),
    razaoSocial: form.razaoSocial.trim(),
    nomeFantasia: form.apelido.trim() || undefined,
    apelido: form.apelido.trim() || undefined,
    abreviatura: normalizedAbbreviation || undefined,
    cnpj: cleanedDocument || undefined,
    cpfCnpj: cleanedDocument || undefined,
    inscricaoEstadual: form.inscricaoEstadual.trim() || undefined,
    inscricaoMunicipal: form.inscricaoMunicipal.trim() || undefined,
    cep: unmaskNumbers(form.cep) || undefined,
    estado: form.estado.trim() || undefined,
    cidade: form.cidade.trim() || undefined,
    logradouro: form.logradouro.trim() || undefined,
    numero: form.numero.trim() || undefined,
    complemento: form.complemento.trim() || undefined,
    bairro: form.bairro.trim() || undefined,
    endereco: {
      cep: unmaskNumbers(form.cep) || undefined,
      estado: form.estado.trim() || undefined,
      cidade: form.cidade.trim() || undefined,
      logradouro: form.logradouro.trim() || undefined,
      numero: form.numero.trim() || undefined,
      complemento: form.complemento.trim() || undefined,
      bairro: form.bairro.trim() || undefined,
    },
    status: form.status,
  }
}

function validateDocument(document: string): boolean {
  const cleaned = unmaskCPFOrCNPJ(document)
  if (!cleaned) return true
  if (cleaned.length === 11) return validateCPF(cleaned)
  if (cleaned.length === 14) return validateCNPJ(cleaned)
  return false
}

function formatDocument(document?: string | null): string {
  if (!document) return "Nao informado"
  const cleaned = unmaskCPFOrCNPJ(document)
  return cleaned.length === 14 ? maskCNPJ(cleaned) : document
}

function formatCompanyScope(company: CompanyItem, empresasCount: number) {
  return `${company.nome} • ${empresasCount} empresa${empresasCount === 1 ? "" : "s"}`
}

export default function CoordenarEmpresasPage() {
  const { user, canAccess } = useAuth()
  const [companies] = useState<CompanyItem[]>([])
  const [empresas] = useState<EmpresaItem[]>([])
  const [tenantOptions] = useState<TenantOption[]>([])
  const [filters, setFilters] = useState({
    search: "",
    status: "__all__",
  })
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [grupoDialogOpen, setGrupoDialogOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [empresaDialogOpen, setEmpresaDialogOpen] = useState(false)
  const [editingEmpresaId, setEditingEmpresaId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("dados-basicos")
  const [grupoForm, setGrupoForm] = useState<GrupoEconomicoForm>(GRUPO_ECONOMICO_FORM_INITIAL)
  const [empresaForm, setEmpresaForm] = useState<EmpresaForm>(EMPRESA_FORM_INITIAL)

  const isRoot = user?.roles?.includes("ROLE_ROOT") ?? false
  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false
  const canViewModule = canAccess("admin.coordenar_empresas", "ver")
  const canCreateEmpresa = isRoot
  const canEditEmpresa = isRoot || isAdmin
  const canManageStatus = isRoot
  const canManageGrupoEconomico = isRoot

  const availableCompanyIds = useMemo(() => {
    if (isRoot) return null
    return new Set(user?.companyIds ?? [])
  }, [isRoot, user?.companyIds])

  const visibleCompanies = useMemo(() => {
    if (!availableCompanyIds) return companies
    return companies.filter((company) => availableCompanyIds.has(company.id))
  }, [availableCompanyIds, companies])

  const visibleEmpresas = useMemo(() => {
    if (!availableCompanyIds) return empresas
    return empresas.filter((empresa) => availableCompanyIds.has(empresa.companyId))
  }, [availableCompanyIds, empresas])

  const selectedCompany = useMemo(() => {
    return selectedCompanyId ? visibleCompanies.find((company) => company.id === Number(selectedCompanyId)) ?? null : null
  }, [selectedCompanyId, visibleCompanies])

  const filteredEmpresas = useMemo(() => {
    const term = filters.search.trim().toLowerCase()

    return visibleEmpresas.filter((empresa) => {
      const matchesCompany = !selectedCompanyId || empresa.companyId === Number(selectedCompanyId)
      const matchesStatus = filters.status === "__all__" || normalizeStatus(empresa.status) === filters.status
      if (!matchesCompany || !matchesStatus) return false

      if (!term) return true

      const haystack = [
        empresa.razaoSocial,
        empresa.apelido,
        empresa.nomeFantasia,
        empresa.abreviatura,
        extractDocument(empresa),
        extractAddressField(empresa, "cidade"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [filters.search, filters.status, selectedCompanyId, visibleEmpresas])

  const companiesById = useMemo(() => {
    return new Map(visibleCompanies.map((company) => [company.id, company]))
  }, [visibleCompanies])

  const empresaSummary = useMemo(() => {
    const active = visibleEmpresas.filter((empresa) => normalizeStatus(empresa.status) === "active").length
    const inactive = visibleEmpresas.length - active
    const withDocument = visibleEmpresas.filter((empresa) => Boolean(extractDocument(empresa))).length
    return { active, inactive, withDocument }
  }, [visibleEmpresas])

  const companiesWithTotals = useMemo(() => {
    const totals = new Map<number, number>()
    for (const empresa of visibleEmpresas) {
      totals.set(empresa.companyId, (totals.get(empresa.companyId) ?? 0) + 1)
    }
    return visibleCompanies.map((company) => ({
      ...company,
      empresasCount: totals.get(company.id) ?? 0,
    }))
  }, [visibleCompanies, visibleEmpresas])

  const selectedCompanySummary = useMemo(() => {
    if (!selectedCompanyId) {
      return { total: 0, active: 0, inactive: 0, withDocument: 0 }
    }

    const scoped = visibleEmpresas.filter((empresa) => empresa.companyId === Number(selectedCompanyId))
    const active = scoped.filter((empresa) => normalizeStatus(empresa.status) === "active").length
    const inactive = scoped.length - active
    const withDocument = scoped.filter((empresa) => Boolean(extractDocument(empresa))).length
    return { total: scoped.length, active, inactive, withDocument }
  }, [selectedCompanyId, visibleEmpresas])

  const openCreateEmpresaDialog = () => {
    const defaultCompanyId = selectedCompanyId || (!isRoot ? String(user?.companyIds?.[0] ?? "") : "")
    setEditingEmpresaId(null)
    setEmpresaForm({
      ...EMPRESA_FORM_INITIAL,
      companyId: defaultCompanyId,
    })
    setActiveTab("dados-basicos")
    setEmpresaDialogOpen(true)
  }

  const openCreateGrupoDialog = () => {
    setEditingGroupId(null)
    setGrupoForm(GRUPO_ECONOMICO_FORM_INITIAL)
    setGrupoDialogOpen(true)
  }

  const openEditGrupoDialog = (company: CompanyItem) => {
    setEditingGroupId(company.id)
    setGrupoForm({
      nome: company.nome,
      tenancyMode: company.tenantInstance.tenancyMode,
      databaseKey: company.tenantInstance.databaseKey || "",
      status: normalizeStatus(company.status),
    })
    setGrupoDialogOpen(true)
  }

  const handleSaveGrupoEconomico = async () => {
    customToast.info("Backend desativado para este módulo.")
  }

  const openEditEmpresaDialog = (empresa: EmpresaItem) => {
    setEditingEmpresaId(empresa.id)
    setEmpresaForm(mapEmpresaToForm(empresa))
    setActiveTab("dados-basicos")
    setEmpresaDialogOpen(true)
  }

  const handleSaveEmpresa = async () => {
    customToast.info("Backend desativado para este módulo.")
  }

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(241,245,249,0.92))]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
          <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-blue-700">
                  <Factory className="h-3.5 w-3.5" />
                  Governanca Fiscal
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  {selectedCompany ? "Modulo Empresas" : "Coordenar Empresas"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {selectedCompany
                    ? "Cadastro da pessoa juridica que ancora financeiro, contas caixa, centros de custo, movimento contabil e integracao ASAAS dentro do tenant."
                    : "Relatorio consolidado de grupos economicos. Selecione um grupo economico para abrir o modulo Empresas no contexto fiscal correto."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedCompany && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCompanyId("")}
                    className="border-slate-200"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Grupos Economicos
                  </Button>
                )}
                <Button variant="outline" disabled>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
                {canManageGrupoEconomico && !selectedCompany && (
                  <Button className="bg-slate-900 hover:bg-slate-800" onClick={openCreateGrupoDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    + Grupo Economico
                  </Button>
                )}
                {canCreateEmpresa && selectedCompany && (
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateEmpresaDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Empresa
                  </Button>
                )}
              </div>
            </div>

            <Separator className="bg-blue-100" />

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={selectedCompany ? Building2 : Factory}
                label={selectedCompany ? "Empresas ativas" : "Grupos Economicos"}
                value={selectedCompany ? String(selectedCompanySummary.active) : String(visibleCompanies.length)}
                hint={selectedCompany ? "Disponiveis para vinculos fiscais e financeiros" : "Estruturas economicas visiveis para o usuario atual"}
              />
              <MetricCard
                icon={Landmark}
                label={selectedCompany ? "Empresas inativas" : "Grupos ativos"}
                value={selectedCompany ? String(selectedCompanySummary.inactive) : String(visibleCompanies.filter((company) => company.status === "active").length)}
                hint={selectedCompany ? "Nao aparecem em consultas usuais do dominio" : "Grupos economicos operacionais no tenant"}
              />
              <MetricCard
                icon={FileText}
                label={selectedCompany ? "Documentacao" : "Empresas vinculadas"}
                value={selectedCompany ? `${selectedCompanySummary.withDocument}/${selectedCompanySummary.total || 0}` : String(visibleEmpresas.length)}
                hint={selectedCompany ? "Cadastros com CPF/CNPJ informado" : "Empresas fiscais distribuidas nos grupos economicos"}
              />
              <MetricCard
                icon={selectedCompany ? Factory : Building2}
                label={selectedCompany ? "Grupo selecionado" : "Empresas ativas"}
                value={selectedCompany ? selectedCompany.nome : String(empresaSummary.active)}
                hint={selectedCompany ? "Tenant obrigatorio para o contexto de empresa" : "Cadastros fiscais ativos no ecossistema"}
              />
            </div>
          </section>

          {!canViewModule ? (
            <Card className="rounded-[24px] border-slate-200/80 bg-white/90">
              <CardContent className="px-6 py-8 text-sm text-slate-600">
                Seu usuario nao possui permissao para visualizar este modulo.
              </CardContent>
            </Card>
          ) : !selectedCompany ? (
            <Card className="rounded-[28px] border-slate-200/80 bg-white/90">
              <CardHeader className="gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="text-xl text-slate-900">Relatorio de grupos economicos</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Escolha um grupo economico para entrar no modulo Empresas com o contexto fiscal filtrado.
                    </p>
                  </div>
                  <div className="relative min-w-[260px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="h-11 rounded-2xl border-slate-200 pl-9"
                      placeholder="Buscar grupo economico..."
                      value={filters.search}
                      onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                {companiesWithTotals.filter((company) => company.nome.toLowerCase().includes(filters.search.trim().toLowerCase())).length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-10 text-sm text-slate-500">
                    Nenhum grupo economico encontrado.
                  </div>
                ) : (
                  companiesWithTotals
                    .filter((company) => company.nome.toLowerCase().includes(filters.search.trim().toLowerCase()))
                    .map((company) => (
                      <div
                        key={company.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedCompanyId(String(company.id))
                          setFilters((prev) => ({ ...prev, search: "" }))
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            setSelectedCompanyId(String(company.id))
                            setFilters((prev) => ({ ...prev, search: "" }))
                          }
                        }}
                        className="cursor-pointer rounded-[26px] border border-slate-200/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.92))] p-5 text-left transition hover:border-blue-200 hover:shadow-[0_18px_48px_-30px_rgba(37,99,235,0.55)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                <Factory className="h-5 w-5" />
                              </div>
                              <div>
                                <h2 className="truncate text-lg font-semibold text-slate-900">{company.nome}</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                  {company.tenantInstance.tenancyMode} • DB {company.tenantInstance.databaseKey || "padrao"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <InfoPill label="Empresas" value={String(company.empresasCount)} />
                              <InfoPill label="Status" value={company.status} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={company.status === "active" ? "default" : "secondary"}>
                              {company.status}
                            </Badge>
                            {canManageGrupoEconomico && (
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl border-slate-200 bg-white/90"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  openEditGrupoDialog(company)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
              <Card className="rounded-[28px] border-slate-200/80 bg-white/90">
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <CardTitle className="text-xl text-slate-900">Cadastro e governanca</CardTitle>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedCompany.nome} • empresas vinculadas ao contexto fiscal deste grupo economico.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="relative min-w-[220px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          className="h-11 rounded-2xl border-slate-200 pl-9"
                          placeholder="Buscar razao social, apelido, CNPJ..."
                          value={filters.search}
                          onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        />
                      </div>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os status</SelectItem>
                          <SelectItem value="active">Ativas</SelectItem>
                          <SelectItem value="inactive">Inativas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredEmpresas.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-10 text-sm text-slate-500">
                      Nenhuma empresa encontrada com os filtros atuais.
                    </div>
                  ) : (
                    filteredEmpresas.map((empresa) => {
                      const company = companiesById.get(empresa.companyId)
                      const status = normalizeStatus(empresa.status)
                      const document = extractDocument(empresa)
                      const addressSummary = [extractAddressField(empresa, "cidade"), extractAddressField(empresa, "estado")]
                        .filter(Boolean)
                        .join(" • ")

                      return (
                        <article
                          key={empresa.id}
                          className="group rounded-[26px] border border-slate-200/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.92))] p-5 transition hover:border-blue-200 hover:shadow-[0_18px_48px_-30px_rgba(37,99,235,0.55)]"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                                  <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-semibold text-slate-900">{empresa.razaoSocial}</h2>
                                    <Badge variant={status === "active" ? "default" : "secondary"}>
                                      {status === "active" ? "Ativa" : "Inativa"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-500">
                                    {empresa.apelido || empresa.nomeFantasia || "Sem apelido"} {empresa.abreviatura ? `• ${String(empresa.abreviatura).toUpperCase()}` : ""}
                                  </p>
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-3">
                                <InfoPill label="Grupo Economico" value={company?.nome || `#${empresa.companyId}`} />
                                <InfoPill label="CPF/CNPJ" value={formatDocument(document)} />
                                <InfoPill label="Inscricoes" value={[
                                  empresa.inscricaoEstadual ? `IE ${empresa.inscricaoEstadual}` : null,
                                  empresa.inscricaoMunicipal ? `IM ${empresa.inscricaoMunicipal}` : null,
                                ].filter(Boolean).join(" • ") || "Nao informadas"} />
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <InfoPill label="Endereco" value={addressSummary || "Endereco nao informado"} />
                                <InfoPill label="Contexto" value="Financeiro, cobranca ASAAS e governanca fiscal" />
                              </div>
                            </div>

                            {canEditEmpresa && (
                              <Button
                                variant="outline"
                                className="rounded-2xl border-slate-200 bg-white/80 px-4"
                                onClick={() => openEditEmpresaDialog(empresa)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                            )}
                          </div>
                        </article>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="rounded-[28px] border-slate-200/80 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">Escopo do grupo economico</CardTitle>
                    <p className="text-sm text-slate-500">
                      {selectedCompany.nome} concentra o tenant selecionado; `empresa_id` define o contexto fiscal interno.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-[22px] border border-slate-200/90 bg-slate-50/80 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{selectedCompany.nome}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatCompanyScope(selectedCompany, selectedCompanySummary.total)}
                          </p>
                        </div>
                        <Badge variant={selectedCompany.status === "active" ? "default" : "secondary"}>
                          {selectedCompany.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-slate-200/80 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">Regras visiveis na UI</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <RuleItem text="Nome e apelido sao obrigatorios no frontend." />
                    <RuleItem text="CPF/CNPJ e opcional, mas se informado precisa ser valido." />
                    <RuleItem text="Somente ROLE_ROOT pode cadastrar ou inativar empresa." />
                    <RuleItem text="ROLE_ROOT e ROLE_ADMIN podem alterar o cadastro existente." />
                    <RuleItem text="Exclusao deve ser bloqueada quando houver dados vinculados a empresa." />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={grupoDialogOpen}
        onOpenChange={(open) => {
          setGrupoDialogOpen(open)
          if (!open) {
            setEditingGroupId(null)
            setGrupoForm(GRUPO_ECONOMICO_FORM_INITIAL)
          }
        }}
      >
        <DialogContent aria-describedby={undefined} className="max-w-2xl rounded-[24px] border border-slate-200 bg-slate-50 p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-14">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold text-slate-900">
                  {editingGroupId ? "Editar Grupo Economico" : "Novo Grupo Economico"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  Estrutura economica superior do ERP. No backend o contrato permanece em `company`.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <Field>
              <Label htmlFor="grupo-nome">Nome do Grupo Economico</Label>
              <Input
                id="grupo-nome"
                className="h-11 rounded-xl border-slate-200 bg-white"
                value={grupoForm.nome}
                onChange={(event) => setGrupoForm((prev) => ({ ...prev, nome: event.target.value }))}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label>Modo de tenancy</Label>
                <Select
                  value={grupoForm.tenancyMode}
                  onValueChange={(value: "shared" | "dedicated") => setGrupoForm((prev) => ({ ...prev, tenancyMode: value, databaseKey: "" }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">shared</SelectItem>
                    <SelectItem value="dedicated">dedicated</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label>Status</Label>
                <Select
                  value={grupoForm.status}
                  onValueChange={(value: GrupoEconomicoStatus) => setGrupoForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <Label>Database key *</Label>
              <Select
                value={grupoForm.databaseKey || "__none__"}
                onValueChange={(value) => {
                  if (value === "__none__") return
                  setGrupoForm((prev) => ({ ...prev, databaseKey: value }))
                }}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                  <SelectValue placeholder="Selecione o database key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" disabled>Selecione o database key</SelectItem>
                  {tenantOptions.filter((t) => t.type === grupoForm.tenancyMode).map((tenant) => (
                    <SelectItem key={tenant.key} value={tenant.key}>{tenant.key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="border-t border-slate-200 bg-white px-6 py-4">
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setGrupoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="rounded-xl bg-slate-900 hover:bg-slate-800" onClick={() => void handleSaveGrupoEconomico()} disabled={saving}>
                {editingGroupId ? "Atualizar Grupo Economico" : "Criar Grupo Economico"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={empresaDialogOpen}
        onOpenChange={(open) => {
          setEmpresaDialogOpen(open)
          if (!open) {
            setEditingEmpresaId(null)
            setEmpresaForm(EMPRESA_FORM_INITIAL)
            setActiveTab("dados-basicos")
          }
        }}
      >
        <DialogContent aria-describedby={undefined} className="max-h-[92vh] max-w-5xl overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 p-0">
          <DialogHeader className="border-b border-blue-100 px-6 py-5 pr-14">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-semibold text-blue-900">
                  {editingEmpresaId ? "Editar Empresa" : "Nova Empresa"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-blue-700/80">
                  {empresaForm.apelido || "Cadastro fiscal da empresa"} {empresaForm.abreviatura ? `• ${empresaForm.abreviatura.toUpperCase()}` : ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
            <div className="px-6 pb-0 pt-5">
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-blue-100/80 p-1">
                <TabsTrigger
                  value="dados-basicos"
                  className="h-10 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Dados Basicos
                </TabsTrigger>
                <TabsTrigger
                  value="endereco"
                  className="h-10 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Endereco
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[62vh] px-6 pb-6">
              <TabsContent value="dados-basicos" className="mt-5 space-y-4">
                <FormSection icon={Building2} title="Identificacao">
                  <div className="grid gap-4">
                    <Field>
                      <Label htmlFor="empresa-company">Grupo Economico</Label>
                      <Select
                        value={empresaForm.companyId}
                        onValueChange={(value) => setEmpresaForm((prev) => ({ ...prev, companyId: value }))}
                        disabled={!isRoot}
                      >
                        <SelectTrigger id="empresa-company" className="h-11 rounded-xl border-slate-200 bg-white">
                          <SelectValue placeholder="Selecione o grupo economico" />
                        </SelectTrigger>
                        <SelectContent>
                          {visibleCompanies.map((company) => (
                            <SelectItem key={company.id} value={String(company.id)}>
                              {company.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <Label htmlFor="empresa-razao">Razao Social *</Label>
                      <Input
                        id="empresa-razao"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.razaoSocial}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, razaoSocial: event.target.value }))}
                      />
                    </Field>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field>
                        <Label htmlFor="empresa-apelido">Apelido *</Label>
                        <Input
                          id="empresa-apelido"
                          className="h-11 rounded-xl border-slate-200 bg-white"
                          value={empresaForm.apelido}
                          onChange={(event) => setEmpresaForm((prev) => ({ ...prev, apelido: event.target.value }))}
                        />
                      </Field>

                      <Field>
                        <Label htmlFor="empresa-abreviatura">Abreviatura</Label>
                        <Input
                          id="empresa-abreviatura"
                          className="h-11 rounded-xl border-slate-200 bg-white uppercase"
                          value={empresaForm.abreviatura}
                          onChange={(event) => setEmpresaForm((prev) => ({ ...prev, abreviatura: event.target.value.toUpperCase() }))}
                        />
                      </Field>
                    </div>
                  </div>
                </FormSection>

                <FormSection icon={FileText} title="Documentacao">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field>
                      <Label htmlFor="empresa-cpfcnpj">CPF/CNPJ</Label>
                      <Input
                        id="empresa-cpfcnpj"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.cpfCnpj}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, cpfCnpj: maskCPFOrCNPJ(unmaskCPFOrCNPJ(event.target.value)) }))}
                        placeholder="00.000.000/0000-00"
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="empresa-ie">Inscricao Estadual</Label>
                      <Input
                        id="empresa-ie"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.inscricaoEstadual}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, inscricaoEstadual: event.target.value }))}
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="empresa-im">Inscricao Municipal</Label>
                      <Input
                        id="empresa-im"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.inscricaoMunicipal}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, inscricaoMunicipal: event.target.value }))}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={Landmark} title="Governanca">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <Label>Status</Label>
                      <Select
                        value={empresaForm.status}
                        onValueChange={(value: EmpresaStatus) => setEmpresaForm((prev) => ({ ...prev, status: value }))}
                        disabled={!canManageStatus}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="inactive">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
                      A empresa funciona como chave de contexto para contas, titulos, baixas,
                      transferencias financeiras, conciliacoes e workflows.
                    </div>
                  </div>
                </FormSection>
              </TabsContent>

              <TabsContent value="endereco" className="mt-5 space-y-4">
                <FormSection icon={MapPin} title="Localizacao">
                  <div className="grid gap-4 md:grid-cols-[1.1fr_1fr_1.2fr]">
                    <Field>
                      <Label htmlFor="empresa-cep">CEP</Label>
                      <Input
                        id="empresa-cep"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.cep}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, cep: maskCEP(event.target.value) }))}
                        placeholder="00000-000"
                      />
                    </Field>

                    <Field>
                      <Label>Estado</Label>
                      <Select
                        value={empresaForm.estado || "__none__"}
                        onValueChange={(value) => setEmpresaForm((prev) => ({ ...prev, estado: value === "__none__" ? "" : value }))}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Selecione</SelectItem>
                          {BRAZILIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <Label htmlFor="empresa-cidade">Cidade</Label>
                      <Input
                        id="empresa-cidade"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.cidade}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, cidade: event.target.value }))}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={MapPin} title="Detalhes do Endereco">
                  <div className="grid gap-4 md:grid-cols-[1.3fr_0.6fr_0.8fr]">
                    <Field>
                      <Label htmlFor="empresa-logradouro">Logradouro</Label>
                      <Input
                        id="empresa-logradouro"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.logradouro}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, logradouro: event.target.value }))}
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="empresa-numero">Numero</Label>
                      <Input
                        id="empresa-numero"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.numero}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, numero: event.target.value }))}
                      />
                    </Field>

                    <Field>
                      <Label htmlFor="empresa-complemento">Complemento</Label>
                      <Input
                        id="empresa-complemento"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.complemento}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, complemento: event.target.value }))}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <Label htmlFor="empresa-bairro">Bairro</Label>
                      <Input
                        id="empresa-bairro"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                        value={empresaForm.bairro}
                        onChange={(event) => setEmpresaForm((prev) => ({ ...prev, bairro: event.target.value }))}
                      />
                    </Field>
                  </div>
                </FormSection>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="border-t border-blue-100 bg-white px-6 py-4">
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setEmpresaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={() => void handleSaveEmpresa()} disabled={saving}>
                {editingEmpresaId ? "Atualizar Empresa" : "Cadastrar Empresa"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Building2
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.9))] px-5 py-4">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-2 text-xs leading-5 text-slate-500">{hint}</div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-700">{value}</div>
    </div>
  )
}

function RuleItem({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      {text}
    </div>
  )
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[20px] border border-blue-100 bg-white px-5 py-5 shadow-[0_12px_40px_-32px_rgba(37,99,235,0.6)]">
      <div className="mb-5 flex items-center gap-2 text-blue-800">
        <Icon className="h-4 w-4" />
        <h3 className="text-lg font-semibold tracking-tight text-blue-900">
          {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>
}
