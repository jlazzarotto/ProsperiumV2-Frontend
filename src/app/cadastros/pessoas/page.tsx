"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/contexts/auth-context"
import {
  getPessoas,
  createPessoa,
  updatePessoa,
  deletePessoa,
  getPessoaEnderecos,
  createPessoaEndereco,
  updatePessoaEndereco,
  deletePessoaEndereco,
  getPessoaContatos,
  createPessoaContato,
  updatePessoaContato,
  deletePessoaContato,
  type PessoaItem,
  type PessoaEnderecoItem,
  type PessoaContatoItem,
} from "@/app/services/pessoas-service"
import { getCompanies, type CompanyItem } from "@/app/services/core-saas-service"
import customToast from "@/components/ui/custom-toast"
import { cn } from "@/lib/utils"
import { maskCEP, unmaskNumbers } from "@/lib/masks"

// ── Types ──────────────────────────────────────────────────────────────────────

type PessoaStatus = "active" | "inactive"

type CapaForm = {
  companyId: string
  tipoPessoa: "PF" | "PJ"
  nomeRazao: string
  nomeFantasia: string
  documento: string
  inscricaoEstadual: string
  emailPrincipal: string
  telefonePrincipal: string
  status: PessoaStatus
}

type EnderecoForm = {
  tipoEndereco: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  pais: string
  principal: boolean
}

type ContatoForm = {
  nomeContato: string
  cargo: string
  email: string
  telefone: string
  principal: boolean
}

const EMPTY_CAPA: CapaForm = {
  companyId: "",
  tipoPessoa: "PF",
  nomeRazao: "",
  nomeFantasia: "",
  documento: "",
  inscricaoEstadual: "",
  emailPrincipal: "",
  telefonePrincipal: "",
  status: "active",
}

const EMPTY_ENDERECO: EnderecoForm = {
  tipoEndereco: "Comercial",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  cep: "",
  pais: "Brasil",
  principal: false,
}

const EMPTY_CONTATO: ContatoForm = {
  nomeContato: "",
  cargo: "",
  email: "",
  telefone: "",
  principal: false,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapPessoaToForm(p: PessoaItem): CapaForm {
  return {
    companyId: String(p.companyId),
    tipoPessoa: p.tipoPessoa,
    nomeRazao: p.nomeRazao ?? "",
    nomeFantasia: p.nomeFantasia ?? "",
    documento: p.documento ?? "",
    inscricaoEstadual: p.inscricaoEstadual ?? "",
    emailPrincipal: p.emailPrincipal ?? "",
    telefonePrincipal: p.telefonePrincipal ?? "",
    status: (p.status as PessoaStatus) ?? "active",
  }
}

function mapEnderecoToForm(e: PessoaEnderecoItem): EnderecoForm {
  return {
    tipoEndereco: e.tipoEndereco ?? "Comercial",
    logradouro: e.logradouro ?? "",
    numero: e.numero ?? "",
    complemento: e.complemento ?? "",
    bairro: e.bairro ?? "",
    cidade: e.cidade ?? "",
    uf: e.uf ?? "",
    cep: e.cep ?? "",
    pais: e.pais ?? "Brasil",
    principal: e.principal ?? false,
  }
}

function mapContatoToForm(c: PessoaContatoItem): ContatoForm {
  return {
    nomeContato: c.nomeContato ?? "",
    cargo: c.cargo ?? "",
    email: c.email ?? "",
    telefone: c.telefone ?? "",
    principal: c.principal ?? false,
  }
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function MetricCard({ title, value, icon, color }: { title: string; value: number | string; icon: ReactNode; color: string }) {
  return (
    <Card className="border-slate-200/60 dark:border-slate-800/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl", color)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function FormSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</Label>
      {children}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function PessoasPage() {
  const { user, canAccess, isRoot, isAdmin } = useAuth()

  const canViewModule = canAccess("cadastros.pessoas", "ver")
  const canCreate = canAccess("cadastros.pessoas.create_edit", "ver") || isRoot || isAdmin
  const canEdit = canAccess("cadastros.pessoas.create_edit", "ver") || isRoot || isAdmin
  const canDelete = isRoot

  // ── State ──────────────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [pessoas, setPessoas] = useState<PessoaItem[]>([])
  const [enderecos, setEnderecos] = useState<PessoaEnderecoItem[]>([])
  const [contatos, setContatos] = useState<PessoaContatoItem[]>([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Filtros da listagem
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterTipo, setFilterTipo] = useState<string>("all")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")

  // Dialogo
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPessoa, setEditingPessoa] = useState<PessoaItem | null>(null)
  const [dialogTab, setDialogTab] = useState("capa")

  // Forms
  const [capaForm, setCapaForm] = useState<CapaForm>(EMPTY_CAPA)
  const [enderecoForm, setEnderecoForm] = useState<EnderecoForm>(EMPTY_ENDERECO)
  const [editingEnderecoId, setEditingEnderecoId] = useState<number | null>(null)
  const [contatoForm, setContatoForm] = useState<ContatoForm>(EMPTY_CONTATO)
  const [editingContatoId, setEditingContatoId] = useState<number | null>(null)

  // ── Load ───────────────────────────────────────────────────────────────────
  const companyId = useMemo(() => {
    if (selectedCompanyId) return Number(selectedCompanyId)
    if (!isRoot && user?.companyId) return Number(user.companyId)
    return companies[0]?.id ?? 0
  }, [selectedCompanyId, isRoot, user, companies])

  useEffect(() => {
    getCompanies().then(setCompanies).catch(console.error)
  }, [])

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    getPessoas(companyId)
      .then(setPessoas)
      .catch(() => customToast.error("Erro ao carregar pessoas"))
      .finally(() => setLoading(false))
  }, [companyId])

  const loadEnderecos = async (pessoaId: number) => {
    const items = await getPessoaEnderecos(pessoaId)
    setEnderecos(items)
  }

  const loadContatos = async (pessoaId: number) => {
    const items = await getPessoaContatos(pessoaId)
    setContatos(items)
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return pessoas.filter((p) => {
      const matchSearch =
        !searchTerm ||
        p.nomeRazao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.documento ?? "").includes(searchTerm) ||
        (p.emailPrincipal ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = filterStatus === "all" || p.status === filterStatus
      const matchTipo = filterTipo === "all" || p.tipoPessoa === filterTipo
      return matchSearch && matchStatus && matchTipo
    })
  }, [pessoas, searchTerm, filterStatus, filterTipo])

  const metrics = useMemo(() => ({
    total: pessoas.length,
    ativas: pessoas.filter((p) => p.status === "active").length,
    pf: pessoas.filter((p) => p.tipoPessoa === "PF").length,
    pj: pessoas.filter((p) => p.tipoPessoa === "PJ").length,
  }), [pessoas])

  // ── Open dialog ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingPessoa(null)
    setCapaForm({ ...EMPTY_CAPA, companyId: String(companyId) })
    setEnderecos([])
    setContatos([])
    setEnderecoForm(EMPTY_ENDERECO)
    setContatoForm(EMPTY_CONTATO)
    setEditingEnderecoId(null)
    setEditingContatoId(null)
    setDialogTab("capa")
    setDialogOpen(true)
  }

  const openEdit = async (p: PessoaItem) => {
    setEditingPessoa(p)
    setCapaForm(mapPessoaToForm(p))
    setEnderecoForm(EMPTY_ENDERECO)
    setContatoForm(EMPTY_CONTATO)
    setEditingEnderecoId(null)
    setEditingContatoId(null)
    setDialogTab("capa")
    setDialogOpen(true)
    await Promise.all([loadEnderecos(p.id), loadContatos(p.id)])
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingPessoa(null)
  }

  // ── Save capa ──────────────────────────────────────────────────────────────
  const saveCapa = async () => {
    if (!capaForm.nomeRazao.trim()) {
      customToast.error("Nome/Razão Social é obrigatório")
      return
    }
    setSaving(true)
    try {
      const payload = {
        tipoPessoa: capaForm.tipoPessoa,
        nomeRazao: capaForm.nomeRazao,
        nomeFantasia: capaForm.nomeFantasia || null,
        documento: capaForm.documento ? unmaskNumbers(capaForm.documento) : null,
        inscricaoEstadual: capaForm.inscricaoEstadual || null,
        emailPrincipal: capaForm.emailPrincipal || null,
        telefonePrincipal: capaForm.telefonePrincipal || null,
        status: capaForm.status,
      }

      if (editingPessoa) {
        const updated = await updatePessoa(editingPessoa.id, payload)
        setEditingPessoa(updated)
        setPessoas((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        customToast.success("Pessoa atualizada com sucesso")
      } else {
        const created = await createPessoa({ ...payload, companyId: Number(capaForm.companyId) })
        setEditingPessoa(created)
        setPessoas((prev) => [...prev, created])
        customToast.success("Pessoa criada com sucesso")
      }
    } catch {
      customToast.error("Erro ao salvar pessoa")
    } finally {
      setSaving(false)
    }
  }

  // ── Save endereco ──────────────────────────────────────────────────────────
  const saveEndereco = async () => {
    if (!editingPessoa) {
      customToast.error("Salve a capa antes de adicionar endereços")
      return
    }
    if (!enderecoForm.logradouro.trim() || !enderecoForm.cidade.trim()) {
      customToast.error("Logradouro e Cidade são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const payload = {
        tipoEndereco: enderecoForm.tipoEndereco,
        logradouro: enderecoForm.logradouro,
        numero: enderecoForm.numero || null,
        complemento: enderecoForm.complemento || null,
        bairro: enderecoForm.bairro || null,
        cidade: enderecoForm.cidade,
        uf: enderecoForm.uf || null,
        cep: enderecoForm.cep ? unmaskNumbers(enderecoForm.cep) : null,
        pais: enderecoForm.pais || "Brasil",
        principal: enderecoForm.principal,
      }

      if (editingEnderecoId) {
        const updated = await updatePessoaEndereco(editingPessoa.id, editingEnderecoId, payload)
        setEnderecos((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
        customToast.success("Endereço atualizado")
      } else {
        const created = await createPessoaEndereco(editingPessoa.id, payload)
        setEnderecos((prev) => [...prev, created])
        customToast.success("Endereço adicionado")
      }
      setEnderecoForm(EMPTY_ENDERECO)
      setEditingEnderecoId(null)
    } catch {
      customToast.error("Erro ao salvar endereço")
    } finally {
      setSaving(false)
    }
  }

  const editEndereco = (e: PessoaEnderecoItem) => {
    setEditingEnderecoId(e.id)
    setEnderecoForm(mapEnderecoToForm(e))
  }

  const removeEndereco = async (id: number) => {
    if (!editingPessoa) return
    setSaving(true)
    try {
      await deletePessoaEndereco(editingPessoa.id, id)
      setEnderecos((prev) => prev.filter((e) => e.id !== id))
      customToast.success("Endereço removido")
    } catch {
      customToast.error("Erro ao remover endereço")
    } finally {
      setSaving(false)
    }
  }

  // ── Save contato ───────────────────────────────────────────────────────────
  const saveContato = async () => {
    if (!editingPessoa) {
      customToast.error("Salve a capa antes de adicionar contatos")
      return
    }
    if (!contatoForm.nomeContato.trim()) {
      customToast.error("Nome do contato é obrigatório")
      return
    }
    setSaving(true)
    try {
      const payload = {
        nomeContato: contatoForm.nomeContato,
        cargo: contatoForm.cargo || null,
        email: contatoForm.email || null,
        telefone: contatoForm.telefone || null,
        principal: contatoForm.principal,
      }

      if (editingContatoId) {
        const updated = await updatePessoaContato(editingPessoa.id, editingContatoId, payload)
        setContatos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        customToast.success("Contato atualizado")
      } else {
        const created = await createPessoaContato(editingPessoa.id, payload)
        setContatos((prev) => [...prev, created])
        customToast.success("Contato adicionado")
      }
      setContatoForm(EMPTY_CONTATO)
      setEditingContatoId(null)
    } catch {
      customToast.error("Erro ao salvar contato")
    } finally {
      setSaving(false)
    }
  }

  const editContato = (c: PessoaContatoItem) => {
    setEditingContatoId(c.id)
    setContatoForm(mapContatoToForm(c))
  }

  const removeContato = async (id: number) => {
    if (!editingPessoa) return
    setSaving(true)
    try {
      await deletePessoaContato(editingPessoa.id, id)
      setContatos((prev) => prev.filter((c) => c.id !== id))
      customToast.success("Contato removido")
    } catch {
      customToast.error("Erro ao remover contato")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete pessoa ──────────────────────────────────────────────────────────
  const handleDeletePessoa = async (p: PessoaItem) => {
    if (!confirm(`Deseja excluir "${p.nomeRazao}"?`)) return
    try {
      await deletePessoa(p.id)
      setPessoas((prev) => prev.filter((x) => x.id !== p.id))
      customToast.success("Pessoa removida")
    } catch {
      customToast.error("Erro ao remover pessoa")
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!canViewModule) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <MainHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-slate-500">Você não tem permissão para acessar este módulo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <MainHeader />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pessoas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Cadastro de pessoas físicas e jurídicas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (companyId) {
                  setLoading(true)
                  getPessoas(companyId).then(setPessoas).finally(() => setLoading(false))
                }
              }}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Atualizar
            </Button>
            {canCreate && (
              <Button size="sm" onClick={openCreate} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Nova Pessoa
              </Button>
            )}
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total" value={metrics.total} icon={<Users className="h-4 w-4 text-blue-600" />} color="bg-blue-50 dark:bg-blue-950/30" />
          <MetricCard title="Ativas" value={metrics.ativas} icon={<User className="h-4 w-4 text-emerald-600" />} color="bg-emerald-50 dark:bg-emerald-950/30" />
          <MetricCard title="Pessoa Física" value={metrics.pf} icon={<User className="h-4 w-4 text-indigo-600" />} color="bg-indigo-50 dark:bg-indigo-950/30" />
          <MetricCard title="Pessoa Jurídica" value={metrics.pj} icon={<Building2 className="h-4 w-4 text-amber-600" />} color="bg-amber-50 dark:bg-amber-950/30" />
        </div>

        {/* Filtros */}
        <Card className="border-slate-200/60 dark:border-slate-800/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {isRoot && (
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="w-full sm:w-52 h-9 text-sm">
                    <SelectValue placeholder="Selecionar company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, documento ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full sm:w-36 h-9 text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-36 h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="border-slate-200/60 dark:border-slate-800/60">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {filtered.length} pessoa{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Nenhuma pessoa encontrada</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Tipo</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Nome / Razão Social</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">Documento</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden lg:table-cell">E-mail</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px] font-semibold", p.tipoPessoa === "PJ" ? "text-amber-700 border-amber-200 bg-amber-50 dark:bg-amber-950/20" : "text-indigo-700 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20")}>
                            {p.tipoPessoa}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{p.nomeRazao}</div>
                          {p.nomeFantasia && <div className="text-xs text-slate-500 dark:text-slate-400">{p.nomeFantasia}</div>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-400 font-mono text-xs">
                          {p.documento ?? "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-slate-600 dark:text-slate-400 text-xs">
                          {p.emailPrincipal ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("text-[10px]", p.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                            {p.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDeletePessoa(p)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent aria-describedby={undefined} className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7 -ml-1" onClick={closeDialog}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-base font-semibold">
                {editingPessoa ? `Editar: ${editingPessoa.nomeRazao}` : "Nova Pessoa"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <Tabs value={dialogTab} onValueChange={setDialogTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-6 mt-3 grid w-auto grid-cols-3 h-9">
              <TabsTrigger value="capa" className="text-xs">Capa</TabsTrigger>
              <TabsTrigger value="enderecos" className="text-xs" disabled={!editingPessoa}>Endereços</TabsTrigger>
              <TabsTrigger value="contatos" className="text-xs" disabled={!editingPessoa}>Contatos</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* ── ABA CAPA ── */}
              <TabsContent value="capa" className="mt-0 px-6 py-4 space-y-5">
                <FormSection icon={<User className="h-4 w-4 text-indigo-500" />} title="Identificação">
                  <Field label="Tipo de Pessoa">
                    <Select
                      value={capaForm.tipoPessoa}
                      onValueChange={(v) => setCapaForm((f) => ({ ...f, tipoPessoa: v as "PF" | "PJ" }))}
                      disabled={!canCreate && !canEdit}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {isRoot && !editingPessoa && (
                    <Field label="Company (Tenant)">
                      <Select
                        value={capaForm.companyId}
                        onValueChange={(v) => setCapaForm((f) => ({ ...f, companyId: v }))}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selecionar company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                  <Field label="Nome / Razão Social *" className="sm:col-span-2">
                    <Input
                      value={capaForm.nomeRazao}
                      onChange={(e) => setCapaForm((f) => ({ ...f, nomeRazao: e.target.value }))}
                      placeholder={capaForm.tipoPessoa === "PJ" ? "Razão Social" : "Nome completo"}
                      className="h-9 text-sm"
                      disabled={!canCreate && !canEdit}
                    />
                  </Field>
                  <Field label="Nome Fantasia">
                    <Input
                      value={capaForm.nomeFantasia}
                      onChange={(e) => setCapaForm((f) => ({ ...f, nomeFantasia: e.target.value }))}
                      placeholder="Nome fantasia (opcional)"
                      className="h-9 text-sm"
                      disabled={!canCreate && !canEdit}
                    />
                  </Field>
                  <Field label="Status">
                    <Select
                      value={capaForm.status}
                      onValueChange={(v) => setCapaForm((f) => ({ ...f, status: v as PessoaStatus }))}
                      disabled={!canCreate && !canEdit}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FormSection>

                <Separator />

                <FormSection icon={<Building2 className="h-4 w-4 text-amber-500" />} title="Documentos">
                  <Field label={capaForm.tipoPessoa === "PJ" ? "CNPJ" : "CPF"}>
                    <Input
                      value={capaForm.documento}
                      onChange={(e) => setCapaForm((f) => ({ ...f, documento: e.target.value }))}
                      placeholder={capaForm.tipoPessoa === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                      className="h-9 text-sm font-mono"
                      disabled={!canCreate && !canEdit}
                    />
                  </Field>
                  <Field label="Inscrição Estadual">
                    <Input
                      value={capaForm.inscricaoEstadual}
                      onChange={(e) => setCapaForm((f) => ({ ...f, inscricaoEstadual: e.target.value }))}
                      placeholder="Inscrição estadual"
                      className="h-9 text-sm"
                      disabled={!canCreate && !canEdit}
                    />
                  </Field>
                </FormSection>

                <Separator />

                <FormSection icon={<Mail className="h-4 w-4 text-blue-500" />} title="Contato Principal">
                  <Field label="E-mail">
                    <Input
                      type="email"
                      value={capaForm.emailPrincipal}
                      onChange={(e) => setCapaForm((f) => ({ ...f, emailPrincipal: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="h-9 text-sm"
                      disabled={!canCreate && !canEdit}
                    />
                  </Field>
                  <Field label="Telefone">
                    <Input
                      value={capaForm.telefonePrincipal}
                      onChange={(e) => setCapaForm((f) => ({ ...f, telefonePrincipal: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      className="h-9 text-sm"
                      disabled={!canCreate && !canEdit}
                    />
                  </Field>
                </FormSection>
              </TabsContent>

              {/* ── ABA ENDEREÇOS ── */}
              <TabsContent value="enderecos" className="mt-0 px-6 py-4 space-y-5">
                {/* Tabela de endereços */}
                {enderecos.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Tipo</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Logradouro</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 hidden sm:table-cell">Cidade/UF</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 hidden md:table-cell">CEP</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enderecos.map((e) => (
                          <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-600 dark:text-slate-400">{e.tipoEndereco}</span>
                                {e.principal && <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Principal</Badge>}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                              {e.logradouro}{e.numero ? `, ${e.numero}` : ""}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                              {e.cidade}{e.uf ? `/${e.uf}` : ""}
                            </td>
                            <td className="px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-400 hidden md:table-cell">
                              {e.cep ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {canEdit && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editEndereco(e)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => removeEndereco(e.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Form de endereço */}
                {(canCreate || canEdit) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        {editingEnderecoId ? "Editar Endereço" : "Novo Endereço"}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Tipo de Endereço">
                          <Select value={enderecoForm.tipoEndereco} onValueChange={(v) => setEnderecoForm((f) => ({ ...f, tipoEndereco: v }))}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Comercial">Comercial</SelectItem>
                              <SelectItem value="Residencial">Residencial</SelectItem>
                              <SelectItem value="Cobrança">Cobrança</SelectItem>
                              <SelectItem value="Entrega">Entrega</SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="CEP">
                          <Input value={enderecoForm.cep} onChange={(e) => setEnderecoForm((f) => ({ ...f, cep: maskCEP(e.target.value) }))} placeholder="00000-000" className="h-9 text-sm font-mono" />
                        </Field>
                        <Field label="Logradouro *" className="sm:col-span-2">
                          <Input value={enderecoForm.logradouro} onChange={(e) => setEnderecoForm((f) => ({ ...f, logradouro: e.target.value }))} placeholder="Rua, Av., Travessa..." className="h-9 text-sm" />
                        </Field>
                        <Field label="Número">
                          <Input value={enderecoForm.numero} onChange={(e) => setEnderecoForm((f) => ({ ...f, numero: e.target.value }))} placeholder="123" className="h-9 text-sm" />
                        </Field>
                        <Field label="Complemento">
                          <Input value={enderecoForm.complemento} onChange={(e) => setEnderecoForm((f) => ({ ...f, complemento: e.target.value }))} placeholder="Apto, Sala..." className="h-9 text-sm" />
                        </Field>
                        <Field label="Bairro">
                          <Input value={enderecoForm.bairro} onChange={(e) => setEnderecoForm((f) => ({ ...f, bairro: e.target.value }))} placeholder="Bairro" className="h-9 text-sm" />
                        </Field>
                        <Field label="Cidade *">
                          <Input value={enderecoForm.cidade} onChange={(e) => setEnderecoForm((f) => ({ ...f, cidade: e.target.value }))} placeholder="Cidade" className="h-9 text-sm" />
                        </Field>
                        <Field label="UF">
                          <Input value={enderecoForm.uf} onChange={(e) => setEnderecoForm((f) => ({ ...f, uf: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="SP" className="h-9 text-sm" maxLength={2} />
                        </Field>
                        <Field label="País">
                          <Input value={enderecoForm.pais} onChange={(e) => setEnderecoForm((f) => ({ ...f, pais: e.target.value }))} placeholder="Brasil" className="h-9 text-sm" />
                        </Field>
                        <Field label="Principal?" className="sm:col-span-2">
                          <div className="flex items-center gap-2 pt-1">
                            <input type="checkbox" id="end-principal" checked={enderecoForm.principal} onChange={(e) => setEnderecoForm((f) => ({ ...f, principal: e.target.checked }))} className="rounded" />
                            <label htmlFor="end-principal" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">Marcar como endereço principal</label>
                          </div>
                        </Field>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEndereco} disabled={saving} className="gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          {editingEnderecoId ? "Atualizar Endereço" : "Adicionar Endereço"}
                        </Button>
                        {editingEnderecoId && (
                          <Button size="sm" variant="outline" onClick={() => { setEnderecoForm(EMPTY_ENDERECO); setEditingEnderecoId(null) }}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ── ABA CONTATOS ── */}
              <TabsContent value="contatos" className="mt-0 px-6 py-4 space-y-5">
                {/* Tabela de contatos */}
                {contatos.length > 0 && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Nome</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 hidden sm:table-cell">Cargo</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 hidden md:table-cell">E-mail</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 hidden lg:table-cell">Telefone</th>
                          <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contatos.map((c) => (
                          <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.nomeContato}</span>
                                {c.principal && <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Principal</Badge>}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hidden sm:table-cell">{c.cargo ?? "—"}</td>
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hidden md:table-cell">{c.email ?? "—"}</td>
                            <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hidden lg:table-cell">{c.telefone ?? "—"}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {canEdit && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editContato(c)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => removeContato(c.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Form de contato */}
                {(canCreate || canEdit) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-blue-500" />
                        {editingContatoId ? "Editar Contato" : "Novo Contato"}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Nome do Contato *" className="sm:col-span-2">
                          <Input value={contatoForm.nomeContato} onChange={(e) => setContatoForm((f) => ({ ...f, nomeContato: e.target.value }))} placeholder="Nome completo do contato" className="h-9 text-sm" />
                        </Field>
                        <Field label="Cargo">
                          <Input value={contatoForm.cargo} onChange={(e) => setContatoForm((f) => ({ ...f, cargo: e.target.value }))} placeholder="Diretor, Gerente..." className="h-9 text-sm" />
                        </Field>
                        <Field label="E-mail">
                          <Input type="email" value={contatoForm.email} onChange={(e) => setContatoForm((f) => ({ ...f, email: e.target.value }))} placeholder="contato@empresa.com" className="h-9 text-sm" />
                        </Field>
                        <Field label="Telefone">
                          <Input value={contatoForm.telefone} onChange={(e) => setContatoForm((f) => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" className="h-9 text-sm" />
                        </Field>
                        <Field label="Principal?" className="sm:col-span-2">
                          <div className="flex items-center gap-2 pt-1">
                            <input type="checkbox" id="cont-principal" checked={contatoForm.principal} onChange={(e) => setContatoForm((f) => ({ ...f, principal: e.target.checked }))} className="rounded" />
                            <label htmlFor="cont-principal" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">Marcar como contato principal</label>
                          </div>
                        </Field>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveContato} disabled={saving} className="gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          {editingContatoId ? "Atualizar Contato" : "Adicionar Contato"}
                        </Button>
                        {editingContatoId && (
                          <Button size="sm" variant="outline" onClick={() => { setContatoForm(EMPTY_CONTATO); setEditingContatoId(null) }}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </ScrollArea>

            {/* Footer com botão Salvar da aba ativa */}
            <DialogFooter className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/60">
              <Button variant="outline" size="sm" onClick={closeDialog}>Fechar</Button>
              {dialogTab === "capa" && (canCreate || canEdit) && (
                <Button size="sm" onClick={saveCapa} disabled={saving}>
                  {saving ? "Salvando..." : editingPessoa ? "Salvar Capa" : "Criar Pessoa"}
                </Button>
              )}
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
