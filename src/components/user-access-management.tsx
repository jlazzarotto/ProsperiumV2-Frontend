"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, KeyRound, Pencil, RefreshCw, Shield, UserPlus, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"
import { createManagedUser, listManagedUsers, type ManagedUser } from "@/app/services/user-management-service"
import { getCompanies, type CompanyItem } from "@/app/services/core-saas-service"
import { listPermissions, listProfiles, updateProfile, updateUserProfiles, type ManagedPermission, type ManagedProfile } from "@/app/services/access-management-service"
import { MODULOS } from "@/types/permissions"

export function UserAccessManagement() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [profiles, setProfiles] = useState<ManagedProfile[]>([])
  const [permissions, setPermissions] = useState<ManagedPermission[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [userProfilesDialogOpen, setUserProfilesDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ManagedProfile | null>(null)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    role: "ROLE_ADMIN" as "ROLE_ROOT" | "ROLE_ADMIN",
    companyId: "",
    status: "active" as "active" | "inactive",
  })
  const [profileForm, setProfileForm] = useState({
    nome: "",
    status: "active" as "active" | "inactive",
    permissionCodes: [] as string[],
  })
  const [userProfileForm, setUserProfileForm] = useState({
    companyId: "",
    profileCodes: [] as string[],
  })

  const isRoot = user?.role === "ROLE_ROOT"

  const load = async () => {
    if (!isRoot) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [usersData, companiesData, profilesData, permissionsData] = await Promise.all([
        listManagedUsers(),
        getCompanies(),
        listProfiles(),
        listPermissions(),
      ])

      setUsers(usersData)
      setCompanies(companiesData)
      setProfiles(profilesData)
      setPermissions(permissionsData)
    } catch (error) {
      console.error("Erro ao carregar gestão de acessos:", error)
      customToast.error("Erro ao carregar usuários, perfis e permissões.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [isRoot])

  const companiesById = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies])

  const moduleMatrix = useMemo(() => {
    return MODULOS.map((modulo) => ({
      modulo: modulo.key,
      label: modulo.label,
      categoryLabel: modulo.categoryLabel,
      viewCode: `${modulo.key}.view`,
      createEditCode: `${modulo.key}.create_edit`,
      deleteCode: `${modulo.key}.delete`,
    })).filter((modulo) =>
      permissions.some((permission) => permission.codigo === modulo.viewCode || permission.codigo === modulo.createEditCode || permission.codigo === modulo.deleteCode)
    )
  }, [permissions])

  const handleCreate = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.password.trim()) {
      customToast.error("Preencha nome, email e senha.")
      return
    }

    if (form.password.length < 8) {
      customToast.error("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    if (form.role === "ROLE_ADMIN" && !form.companyId) {
      customToast.error("ROLE_ADMIN precisa estar vinculado a uma company.")
      return
    }

    setSaving(true)
    try {
      await createManagedUser({
        nome: form.nome.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        companyId: form.role === "ROLE_ADMIN" ? Number(form.companyId) : null,
        status: form.status,
      })

      customToast.success("Usuário criado com sucesso.")
      setDialogOpen(false)
      setForm({
        nome: "",
        email: "",
        password: "",
        role: "ROLE_ADMIN",
        companyId: "",
        status: "active",
      })
      await load()
    } catch (error: any) {
      customToast.error(error?.response?.data?.error?.message || error?.message || "Erro ao criar usuário.")
    } finally {
      setSaving(false)
    }
  }

  const openProfileEditor = (profile: ManagedProfile) => {
    setEditingProfile(profile)
    setProfileForm({
      nome: profile.nome,
      status: profile.status,
      permissionCodes: profile.permissionCodes,
    })
    setProfileDialogOpen(true)
  }

  const openUserProfilesEditor = (managedUser: ManagedUser) => {
    const companyId = managedUser.companyIds[0]
    setEditingUser(managedUser)
    setUserProfileForm({
      companyId: companyId ? String(companyId) : "",
      profileCodes: managedUser.profileCodes,
    })
    setUserProfilesDialogOpen(true)
  }

  const togglePermissionCode = (permissionCode: string, checked: boolean) => {
    setProfileForm((prev) => ({
      ...prev,
      permissionCodes: checked
        ? Array.from(new Set([...prev.permissionCodes, permissionCode]))
        : prev.permissionCodes.filter((code) => code !== permissionCode),
    }))
  }

  const toggleUserProfileCode = (profileCode: string, checked: boolean) => {
    setUserProfileForm((prev) => ({
      ...prev,
      profileCodes: checked
        ? Array.from(new Set([...prev.profileCodes, profileCode]))
        : prev.profileCodes.filter((code) => code !== profileCode),
    }))
  }

  const handleSaveProfile = async () => {
    if (!editingProfile) return

    if (!profileForm.nome.trim()) {
      customToast.error("Informe o nome do perfil.")
      return
    }

    setSaving(true)
    try {
      await updateProfile(editingProfile.id, {
        nome: profileForm.nome.trim(),
        status: profileForm.status,
        tipo: editingProfile.tipo,
        permissionCodes: profileForm.permissionCodes,
      })

      customToast.success("Perfil atualizado com sucesso.")
      setProfileDialogOpen(false)
      setEditingProfile(null)
      await load()
    } catch (error: any) {
      customToast.error(error?.response?.data?.error?.message || error?.message || "Erro ao atualizar perfil.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUserProfiles = async () => {
    if (!editingUser || !userProfileForm.companyId) {
      customToast.error("Selecione a company do usuário.")
      return
    }

    setSaving(true)
    try {
      await updateUserProfiles(editingUser.id, {
        companyId: Number(userProfileForm.companyId),
        profileCodes: userProfileForm.profileCodes,
      })

      customToast.success("Perfis do usuário atualizados com sucesso.")
      setUserProfilesDialogOpen(false)
      setEditingUser(null)
      await load()
    } catch (error: any) {
      customToast.error(error?.response?.data?.error?.message || error?.message || "Erro ao atualizar perfis do usuário.")
    } finally {
      setSaving(false)
    }
  }

  if (!isRoot) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-amber-600" />
            Acesso restrito
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 dark:text-slate-300">
          A gestão global de usuários e permissões está restrita a `ROLE_ROOT` na configuração atual.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Usuários, Perfis e Permissões
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Edição de perfis, atribuição por usuário e visualização da matriz completa de acesso.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-blue-600" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Metric label="Usuários cadastrados" value={loading ? "..." : String(users.length)} />
            <Metric label="Companies disponíveis" value={loading ? "..." : String(companies.length)} />
            <Metric label="Perfis disponíveis" value={loading ? "..." : String(profiles.length)} />
            <Metric label="Permissões cadastradas" value={loading ? "..." : String(permissions.length)} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Usuários do sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-sm text-slate-500">Carregando usuários...</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhum usuário encontrado.</div>
            ) : (
              users.map((managedUser) => (
                <div key={managedUser.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{managedUser.nome}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{managedUser.email}</div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Companies: {managedUser.companyIds.length > 0
                          ? managedUser.companyIds.map((companyId) => companiesById.get(companyId)?.nome || `#${companyId}`).join(", ")
                          : "acesso global"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Perfis: {managedUser.profileCodes.length > 0 ? managedUser.profileCodes.join(", ") : "nenhum"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge>{managedUser.role}</Badge>
                      <Badge variant={managedUser.status === "active" ? "default" : "secondary"}>
                        {managedUser.status}
                      </Badge>
                      {managedUser.companyIds.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => openUserProfilesEditor(managedUser)}>
                          <KeyRound className="mr-2 h-3.5 w-3.5" />
                          Perfis
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-indigo-600" />
              Perfis de acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-sm text-slate-500">Carregando perfis...</div>
            ) : profiles.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhum perfil encontrado.</div>
            ) : (
              profiles.map((profile) => (
                <div key={profile.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{profile.nome}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {profile.codigo} • {profile.tipo}
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {profile.permissionCodes.length} permissões vinculadas
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={profile.status === "active" ? "default" : "secondary"}>
                        {profile.status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => openProfileEditor(profile)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-emerald-600" />
              Matriz de módulos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {moduleMatrix.map((module) => (
              <div key={module.modulo} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="font-medium text-slate-900 dark:text-white">{module.label}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{module.modulo}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>ver</span>
                  <span>criar_editar</span>
                  <span>deletar</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nome" id="managed-user-name" value={form.nome} onChange={(value) => setForm((prev) => ({ ...prev, nome: value }))} />
            <Field label="Email" id="managed-user-email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
            <Field label="Senha" id="managed-user-password" type="password" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} />

            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={form.role} onValueChange={(value: "ROLE_ROOT" | "ROLE_ADMIN") => setForm((prev) => ({ ...prev, role: value, companyId: value === "ROLE_ROOT" ? "" : prev.companyId }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE_ADMIN">ROLE_ADMIN</SelectItem>
                  <SelectItem value="ROLE_ROOT">ROLE_ROOT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.role === "ROLE_ADMIN" && (
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
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value: "active" | "inactive") => setForm((prev) => ({ ...prev, status: value }))}>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleCreate()} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nome" id="profile-name" value={profileForm.nome} onChange={(value) => setProfileForm((prev) => ({ ...prev, nome: value }))} />
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={profileForm.status} onValueChange={(value: "active" | "inactive") => setProfileForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-[1.6fr_repeat(3,minmax(110px,1fr))] gap-3 border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span>Módulo</span>
                <span>Ver</span>
                <span>Criar/Editar</span>
                <span>Deletar</span>
              </div>
              {moduleMatrix.map((module) => (
                <div key={module.modulo} className="grid grid-cols-[1.6fr_repeat(3,minmax(110px,1fr))] gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0 dark:border-slate-800">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{module.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{module.modulo}</div>
                  </div>
                  <div className="flex items-center">
                    <Checkbox checked={profileForm.permissionCodes.includes(module.viewCode)} onCheckedChange={(checked) => togglePermissionCode(module.viewCode, Boolean(checked))} />
                  </div>
                  <div className="flex items-center">
                    <Checkbox checked={profileForm.permissionCodes.includes(module.createEditCode)} onCheckedChange={(checked) => togglePermissionCode(module.createEditCode, Boolean(checked))} />
                  </div>
                  <div className="flex items-center">
                    <Checkbox checked={profileForm.permissionCodes.includes(module.deleteCode)} onCheckedChange={(checked) => togglePermissionCode(module.deleteCode, Boolean(checked))} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleSaveProfile()} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={userProfilesDialogOpen} onOpenChange={setUserProfilesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perfis do Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-900 dark:text-white">{editingUser?.nome}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{editingUser?.email}</div>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Select value={userProfileForm.companyId} onValueChange={(value) => setUserProfileForm((prev) => ({ ...prev, companyId: value, profileCodes: [] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a company" />
                </SelectTrigger>
                <SelectContent>
                  {(editingUser?.companyIds ?? []).map((companyId) => (
                    <SelectItem key={companyId} value={String(companyId)}>
                      {companiesById.get(companyId)?.nome || `#${companyId}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Perfis atribuídos</Label>
              <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                {profiles
                  .filter((profile) => profile.companyId === null || String(profile.companyId) === userProfileForm.companyId)
                  .map((profile) => (
                    <label key={profile.id} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <Checkbox
                        checked={userProfileForm.profileCodes.includes(profile.codigo)}
                        onCheckedChange={(checked) => toggleUserProfileCode(profile.codigo, Boolean(checked))}
                      />
                      <span>{profile.nome}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">({profile.codigo})</span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserProfilesDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleSaveUserProfiles()} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-sm dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
