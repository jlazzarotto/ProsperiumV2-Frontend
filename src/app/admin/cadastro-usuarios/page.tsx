"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Unlock,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
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
import { useAuth } from "@/app/contexts/auth-context"
import { getCompanies, type CompanyItem } from "@/app/services/core-saas-service"
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  desbloquearUser,
  type UserItem,
} from "@/app/services/identity-service"
import customToast from "@/components/ui/custom-toast"
import { cn } from "@/lib/utils"

type UserStatus = "ativo" | "bloqueado" | "inativo"

type UserForm = {
  nome: string
  email: string
  password: string
  companyId: string
  role: string
  status: UserStatus
  mfaHabilitado: boolean
}

const USER_FORM_INITIAL: UserForm = {
  nome: "",
  email: "",
  password: "",
  companyId: "",
  role: "ROLE_ADMIN",
  status: "ativo",
  mfaHabilitado: false,
}

function statusLabel(status: string): string {
  switch (status) {
    case "ativo": return "Ativo"
    case "bloqueado": return "Bloqueado"
    case "inativo": return "Inativo"
    default: return status
  }
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case "ativo": return "default"
    case "bloqueado": return "destructive"
    case "inativo": return "secondary"
    default: return "secondary"
  }
}

function roleLabel(role: string): string {
  switch (role) {
    case "ROLE_ROOT": return "Root"
    case "ROLE_ADMIN": return "Administrador"
    default: return role
  }
}

function MetricCard({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint: string }) {
  return (
    <div className="flex items-start gap-4 rounded-[22px] border border-slate-200/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.92))] px-5 py-4 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.12)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold text-slate-900">{value}</p>
        <p className="mt-1 truncate text-xs text-slate-400">{hint}</p>
      </div>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-xl bg-slate-50 px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <span className="mt-0.5 truncate text-sm font-medium text-slate-700">{value}</span>
    </div>
  )
}

function Field({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5">{children}</div>
}

function FormSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function RuleItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-slate-600">
      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
      <span>{text}</span>
    </div>
  )
}

export default function CadastroUsuariosPage() {
  const { user, canAccess } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<UserItem[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [filters, setFilters] = useState({
    search: "",
    status: "__all__",
    companyId: "",
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [userForm, setUserForm] = useState<UserForm>(USER_FORM_INITIAL)
  const [showPassword, setShowPassword] = useState(false)

  const isRoot = user?.roles?.includes("ROLE_ROOT") ?? false
  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false
  const canViewModule = canAccess("admin.cadastro_usuarios", "ver")
  const canCreateUser = isRoot || isAdmin
  const canEditUser = isRoot || isAdmin
  const canDeleteUser = isRoot

  const load = async () => {
    setLoading(true)
    try {
      const [usersData, companiesData] = await Promise.all([
        getUsers(),
        getCompanies(),
      ])
      setUsers(usersData)
      setCompanies(companiesData)
    } catch (error) {
      console.error("Erro ao carregar usuarios:", error)
      customToast.error("Erro ao carregar dados do modulo de usuarios.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const companiesById = useMemo(() => {
    return new Map(companies.map((c) => [c.id, c]))
  }, [companies])

  const filteredUsers = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    return users.filter((u) => {
      const matchesStatus = filters.status === "__all__" || u.status === filters.status
      const matchesCompany = !filters.companyId || u.companyId === Number(filters.companyId)
      if (!matchesStatus || !matchesCompany) return false
      if (!term) return true
      const haystack = [u.nome, u.email, u.role].filter(Boolean).join(" ").toLowerCase()
      return haystack.includes(term)
    })
  }, [filters, users])

  const summary = useMemo(() => {
    const ativos = users.filter((u) => u.status === "ativo").length
    const bloqueados = users.filter((u) => u.status === "bloqueado").length
    const inativos = users.filter((u) => u.status === "inativo").length
    return { ativos, bloqueados, inativos, total: users.length }
  }, [users])

  const openCreateDialog = () => {
    setEditingUserId(null)
    setUserForm(USER_FORM_INITIAL)
    setShowPassword(false)
    setDialogOpen(true)
  }

  const openEditDialog = (u: UserItem) => {
    setEditingUserId(u.id)
    setUserForm({
      nome: u.nome,
      email: u.email,
      password: "",
      companyId: u.companyId ? String(u.companyId) : "",
      role: u.role,
      status: (u.status as UserStatus) || "ativo",
      mfaHabilitado: u.mfaHabilitado,
    })
    setShowPassword(false)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!userForm.nome.trim()) {
      customToast.error("Preencha o nome do usuario.")
      return
    }
    if (!userForm.email.trim()) {
      customToast.error("Preencha o email do usuario.")
      return
    }
    if (!editingUserId && !userForm.password) {
      customToast.error("Preencha a senha do usuario.")
      return
    }
    if (!editingUserId && userForm.password.length < 8) {
      customToast.error("A senha deve ter no minimo 8 caracteres.")
      return
    }
    if (userForm.role !== "ROLE_ROOT" && !userForm.companyId) {
      customToast.error("Selecione o grupo economico para usuarios ROLE_ADMIN.")
      return
    }

    setSaving(true)
    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          nome: userForm.nome.trim(),
          email: userForm.email.trim().toLowerCase(),
          password: userForm.password || undefined,
          companyId: userForm.companyId ? Number(userForm.companyId) : undefined,
          role: userForm.role,
          status: userForm.status,
          mfaHabilitado: userForm.mfaHabilitado,
        })
      } else {
        await createUser({
          nome: userForm.nome.trim(),
          email: userForm.email.trim().toLowerCase(),
          password: userForm.password,
          companyId: userForm.companyId ? Number(userForm.companyId) : undefined,
          role: userForm.role,
          status: userForm.status,
          mfaHabilitado: userForm.mfaHabilitado,
        })
      }

      customToast.success(editingUserId ? "Usuario atualizado com sucesso." : "Usuario criado com sucesso.")
      setDialogOpen(false)
      setEditingUserId(null)
      setUserForm(USER_FORM_INITIAL)
      await load()
    } catch (error: any) {
      customToast.error(
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        `Erro ao ${editingUserId ? "atualizar" : "criar"} usuario.`
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u: UserItem) => {
    if (!confirm(`Tem certeza que deseja inativar o usuario "${u.nome}"?`)) return

    try {
      await deleteUser(u.id)
      customToast.success("Usuario inativado com sucesso.")
      await load()
    } catch (error: any) {
      customToast.error(
        error?.response?.data?.error?.message ||
        error?.message ||
        "Erro ao inativar usuario."
      )
    }
  }

  const handleDesbloquear = async (u: UserItem) => {
    try {
      await desbloquearUser(u.id)
      customToast.success(`Usuario "${u.nome}" desbloqueado com sucesso.`)
      await load()
    } catch (error: any) {
      customToast.error(
        error?.response?.data?.error?.message ||
        error?.message ||
        "Erro ao desbloquear usuario."
      )
    }
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
                  <Users className="h-3.5 w-3.5" />
                  Identity & Access
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Cadastro de Usuarios
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Gerenciamento de usuarios do sistema com controle de acesso RBAC. Cadastre, edite e gerencie permissoes de usuarios vinculados aos grupos economicos.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void load()} disabled={loading}>
                  <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                  Atualizar
                </Button>
                {canCreateUser && (
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Usuario
                  </Button>
                )}
              </div>
            </div>

            <Separator className="bg-blue-100" />

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Users}
                label="Total de usuarios"
                value={String(summary.total)}
                hint="Usuarios cadastrados no sistema"
              />
              <MetricCard
                icon={UserCheck}
                label="Ativos"
                value={String(summary.ativos)}
                hint="Usuarios com acesso ativo ao sistema"
              />
              <MetricCard
                icon={ShieldAlert}
                label="Bloqueados"
                value={String(summary.bloqueados)}
                hint="Usuarios bloqueados por tentativas de login"
              />
              <MetricCard
                icon={UserMinus}
                label="Inativos"
                value={String(summary.inativos)}
                hint="Usuarios desativados do sistema"
              />
            </div>
          </section>

          {!canViewModule ? (
            <Card className="rounded-[24px] border-slate-200/80 bg-white/90">
              <CardContent className="px-6 py-8 text-sm text-slate-600">
                Seu usuario nao possui permissao para visualizar este modulo.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
              <Card className="rounded-[28px] border-slate-200/80 bg-white/90">
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <CardTitle className="text-xl text-slate-900">Usuarios cadastrados</CardTitle>
                      <p className="mt-1 text-sm text-slate-500">
                        Gerencie os usuarios e suas permissoes de acesso ao sistema.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="relative min-w-[200px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          className="h-11 rounded-2xl border-slate-200 pl-9"
                          placeholder="Buscar nome, email..."
                          value={filters.search}
                          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                        />
                      </div>
                      <Select
                        value={filters.companyId || "__all__"}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, companyId: value === "__all__" ? "" : value }))}
                      >
                        <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                          <SelectValue placeholder="Todos os grupos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os grupos</SelectItem>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-11 rounded-2xl border-slate-200">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos os status</SelectItem>
                          <SelectItem value="ativo">Ativos</SelectItem>
                          <SelectItem value="bloqueado">Bloqueados</SelectItem>
                          <SelectItem value="inativo">Inativos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-10 text-sm text-slate-500">
                      Carregando usuarios...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 px-5 py-10 text-sm text-slate-500">
                      Nenhum usuario encontrado com os filtros atuais.
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const company = u.companyId ? companiesById.get(u.companyId) : null

                      return (
                        <article
                          key={u.id}
                          className="group rounded-[26px] border border-slate-200/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.92))] p-5 transition hover:border-blue-200 hover:shadow-[0_18px_48px_-30px_rgba(37,99,235,0.55)]"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-4">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className={cn(
                                  "flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg",
                                  u.role === "ROLE_ROOT"
                                    ? "bg-slate-900 shadow-slate-500/20"
                                    : "bg-blue-600 shadow-blue-500/20"
                                )}>
                                  {u.role === "ROLE_ROOT" ? <Shield className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-semibold text-slate-900">{u.nome}</h2>
                                    <Badge variant={statusVariant(u.status)}>
                                      {statusLabel(u.status)}
                                    </Badge>
                                    {u.mfaHabilitado && (
                                      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                        <KeyRound className="mr-1 h-3 w-3" />
                                        MFA
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-500">{u.email}</p>
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-3">
                                <InfoPill label="Perfil" value={roleLabel(u.role)} />
                                <InfoPill label="Grupo Economico" value={company?.nome || "Sem vinculo"} />
                                <InfoPill label="Ultimo login" value={u.ultimoLogin || "Nunca"} />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {u.status === "bloqueado" && canEditUser && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                  onClick={() => void handleDesbloquear(u)}
                                >
                                  <Unlock className="mr-1.5 h-3.5 w-3.5" />
                                  Desbloquear
                                </Button>
                              )}
                              {canEditUser && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl border-slate-200 bg-white/80"
                                  onClick={() => openEditDialog(u)}
                                >
                                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                  Editar
                                </Button>
                              )}
                              {canDeleteUser && u.status !== "inativo" && u.role !== "ROLE_ROOT" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  onClick={() => void handleDelete(u)}
                                >
                                  <UserMinus className="mr-1.5 h-3.5 w-3.5" />
                                  Inativar
                                </Button>
                              )}
                            </div>
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
                    <CardTitle className="text-xl text-slate-900">Resumo do modulo</CardTitle>
                    <p className="text-sm text-slate-500">
                      Visao geral dos usuarios e controle de acesso do sistema Prosperium.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-[22px] border border-slate-200/90 bg-slate-50/80 px-4 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Usuarios ativos</span>
                          <span className="text-sm font-semibold text-slate-900">{summary.ativos}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Usuarios bloqueados</span>
                          <span className="text-sm font-semibold text-red-600">{summary.bloqueados}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Usuarios inativos</span>
                          <span className="text-sm font-semibold text-slate-400">{summary.inativos}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-slate-200/80 bg-white/90">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">Regras de acesso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <RuleItem text="ROLE_ROOT tem acesso completo ao sistema." />
                    <RuleItem text="ROLE_ADMIN deve estar vinculado a um grupo economico." />
                    <RuleItem text="Email e unico por grupo economico (company)." />
                    <RuleItem text="Conta e bloqueada apos 5 tentativas de login invalidas." />
                    <RuleItem text="MFA (TOTP) pode ser habilitado por usuario." />
                    <RuleItem text="Somente ROLE_ROOT pode criar e inativar usuarios." />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de criacao/edicao de usuario */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingUserId(null)
            setUserForm(USER_FORM_INITIAL)
          }
        }}
      >
        <DialogContent aria-describedby={undefined} className="max-h-[92vh] max-w-3xl overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 p-0">
          <DialogHeader className="border-b border-blue-100 px-6 py-5 pr-14">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                {editingUserId ? <Pencil className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold text-slate-900">
                  {editingUserId ? "Editar Usuario" : "Novo Usuario"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-500">
                  {editingUserId
                    ? "Atualize os dados do usuario cadastrado no sistema."
                    : "Cadastre um novo usuario vinculado a um grupo economico."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[65vh] px-6 py-5">
            <div className="space-y-5">
              <FormSection icon={Users} title="Dados pessoais">
                <div className="grid gap-4">
                  <Field>
                    <Label htmlFor="user-nome">Nome completo *</Label>
                    <Input
                      id="user-nome"
                      className="h-11 rounded-xl border-slate-200 bg-white"
                      placeholder="Nome do usuario"
                      value={userForm.nome}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, nome: e.target.value }))}
                    />
                  </Field>

                  <Field>
                    <Label htmlFor="user-email">Email *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      className="h-11 rounded-xl border-slate-200 bg-white"
                      placeholder="usuario@empresa.com"
                      value={userForm.email}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </Field>

                  <Field>
                    <Label htmlFor="user-password">{editingUserId ? "Nova senha (deixe em branco para manter)" : "Senha *"}</Label>
                    <div className="relative">
                      <Input
                        id="user-password"
                        type={showPassword ? "text" : "password"}
                        className="h-11 rounded-xl border-slate-200 bg-white pr-12"
                        placeholder={editingUserId ? "Deixe em branco para manter a atual" : "Minimo 8 caracteres"}
                        value={userForm.password}
                        onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={Shield} title="Acesso e permissoes">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <Label>Grupo Economico</Label>
                    <Select
                      value={userForm.companyId || "__none__"}
                      onValueChange={(value) => setUserForm((prev) => ({ ...prev, companyId: value === "__none__" ? "" : value }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="Selecione o grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__" disabled>Selecione o grupo</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <Label>Perfil de acesso</Label>
                    <Select
                      value={userForm.role}
                      onValueChange={(value) => setUserForm((prev) => ({ ...prev, role: value }))}
                      disabled={!isRoot}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isRoot && <SelectItem value="ROLE_ROOT">Root (Super Admin)</SelectItem>}
                        <SelectItem value="ROLE_ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <Label>Status</Label>
                    <Select
                      value={userForm.status}
                      onValueChange={(value: UserStatus) => setUserForm((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="bloqueado">Bloqueado</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <Label>MFA (Autenticacao dois fatores)</Label>
                    <Select
                      value={userForm.mfaHabilitado ? "sim" : "nao"}
                      onValueChange={(value) => setUserForm((prev) => ({ ...prev, mfaHabilitado: value === "sim" }))}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao">Desabilitado</SelectItem>
                        <SelectItem value="sim">Habilitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FormSection>
            </div>
          </ScrollArea>

          <div className="border-t border-slate-200 bg-white px-6 py-4">
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={() => void handleSave()} disabled={saving}>
                {editingUserId ? "Atualizar Usuario" : "Criar Usuario"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
