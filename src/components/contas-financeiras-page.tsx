"use client"

import { useEffect, useMemo, useState } from "react"
import { Landmark, Pencil, Plus, RefreshCw, Wallet } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchableSelect } from "@/components/ui/searchable-select"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"
import { getCompanies, getEmpresas, getUnidades, type CompanyItem, type EmpresaItem, type UnidadeItem } from "@/app/services/core-saas-service"
import { createContaFinanceira, listBancos, listContasFinanceiras, listPessoas, updateContaFinanceira, type BancoItem, type ContaFinanceiraItem, type PessoaCadastroItem } from "@/app/services/cadastro-service"
import { maskBankAgencyNumber, maskMoney, unmaskBankAgencyNumber, unmaskMoney } from "@/lib/masks"

type FormState = {
  companyId: string
  empresaId: string
  unidadeId: string
  bancoId: string
  titularPessoaId: string
  codigo: string
  nome: string
  tipo: string
  agencia: string
  contaNumero: string
  contaDigito: string
  saldoInicial: string
  dataSaldoInicial: string
  permiteMovimentoNegativo: boolean
  status: "active" | "inactive"
}

const EMPTY_FORM: FormState = {
  companyId: "",
  empresaId: "",
  unidadeId: "",
  bancoId: "",
  titularPessoaId: "",
  codigo: "",
  nome: "",
  tipo: "banco",
  agencia: "",
  contaNumero: "",
  contaDigito: "",
  saldoInicial: "0,00",
  dataSaldoInicial: "",
  permiteMovimentoNegativo: false,
  status: "active",
}

const TIPO_OPTIONS = [
  { value: "banco", label: "Banco" },
  { value: "caixa", label: "Caixa" },
  { value: "cartao", label: "Cartão" },
  { value: "investimento", label: "Investimento" },
  { value: "transitoria", label: "Transitória" },
]

export function ContasFinanceirasPage() {
  const { user, canAccess } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContaId, setEditingContaId] = useState<number | null>(null)
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [empresas, setEmpresas] = useState<EmpresaItem[]>([])
  const [unidades, setUnidades] = useState<UnidadeItem[]>([])
  const [bancos, setBancos] = useState<BancoItem[]>([])
  const [pessoas, setPessoas] = useState<PessoaCadastroItem[]>([])
  const [contas, setContas] = useState<ContaFinanceiraItem[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [selectedEmpresaId, setSelectedEmpresaId] = useState("")
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const isRoot = user?.role === "ROLE_ROOT"
  const canManage = canAccess("cadastros.contas_financeiras", "criar_editar")

  const loadReferenceData = async (companyId: string, empresaId = "") => {
    if (!companyId) {
      setEmpresas([])
      setUnidades([])
      setBancos([])
      setPessoas([])
      return
    }

    const [empresasData, unidadesData, bancosData] = await Promise.all([
      getEmpresas(Number(companyId)),
      getUnidades(Number(companyId)),
      listBancos(Number(companyId)),
    ])

    setEmpresas(empresasData)
    setUnidades(unidadesData)
    setBancos(bancosData)

    try {
      const pessoasData = await listPessoas(Number(companyId), empresaId ? Number(empresaId) : undefined)
      setPessoas(pessoasData)
    } catch {
      setPessoas([])
    }
  }

  const load = async (filters?: { companyId?: string; empresaId?: string }) => {
    const companyId = filters?.companyId ?? selectedCompanyId ?? (isRoot ? "" : String(user?.companyIds?.[0] ?? ""))
    const empresaId = filters?.empresaId ?? selectedEmpresaId

    setLoading(true)
    try {
      const [companiesData] = await Promise.all([getCompanies()])

      setCompanies(companiesData)
      await loadReferenceData(companyId, empresaId)

      if (companyId) {
        const contasData = await listContasFinanceiras(Number(companyId), empresaId ? Number(empresaId) : undefined)
        setContas(contasData)
      } else {
        setContas([])
      }
    } catch (error) {
      console.error("Erro ao carregar contas financeiras:", error)
      customToast.error("Erro ao carregar contas financeiras.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const defaultCompanyId = isRoot ? "" : String(user?.companyIds?.[0] ?? "")
    setSelectedCompanyId(defaultCompanyId)
    void load({ companyId: defaultCompanyId, empresaId: "" })
  }, [isRoot, user?.companyIds])

  const companiesById = useMemo(() => new Map(companies.map((company) => [company.id, company])), [companies])
  const empresasById = useMemo(() => new Map(empresas.map((empresa) => [empresa.id, empresa])), [empresas])
  const unidadesById = useMemo(() => new Map(unidades.map((unidade) => [unidade.id, unidade])), [unidades])
  const filteredEmpresas = useMemo(() => (
    selectedCompanyId ? empresas.filter((empresa) => empresa.companyId === Number(selectedCompanyId)) : empresas
  ), [empresas, selectedCompanyId])

  const filteredUnidades = useMemo(() => (
    form.companyId ? unidades.filter((unidade) => unidade.companyId === Number(form.companyId)) : unidades
  ), [unidades, form.companyId])

  const filteredPessoas = useMemo(() => (
    form.companyId
      ? pessoas.filter((pessoa) => pessoa.companyId === Number(form.companyId) && (!form.empresaId || pessoa.empresaId === null || pessoa.empresaId === Number(form.empresaId)))
      : pessoas
  ), [pessoas, form.companyId, form.empresaId])

  const selectedBanco = useMemo(
    () => bancos.find((banco) => String(banco.id) === form.bancoId) ?? null,
    [bancos, form.bancoId]
  )

  const bancoOptions = useMemo(
    () => [
      {
        value: "__none__",
        label: "Sem banco vinculado",
        description: "Remover vínculo bancário",
      },
      ...bancos.map((banco) => ({
        value: String(banco.id),
        label: `${banco.codigoCompe} - ${banco.nomeCurto || banco.nome}`,
        description: [banco.nome, banco.ispb, banco.tipo, banco.documento]
          .filter(Boolean)
          .join(" • "),
        keywords: [
          banco.codigoCompe,
          banco.nome,
          banco.nomeCurto,
          banco.ispb,
          banco.documento,
          banco.tipo,
          banco.rede,
        ].filter(Boolean) as string[],
      })),
    ],
    [bancos]
  )

  const openCreateDialog = () => {
    const companyId = selectedCompanyId || (isRoot ? "" : String(user?.companyIds?.[0] ?? ""))
    setEditingContaId(null)
    setForm({
      ...EMPTY_FORM,
      companyId,
      empresaId: selectedEmpresaId || "",
      saldoInicial: "0,00",
    })
    setDialogOpen(true)
  }

  const openEditDialog = (conta: ContaFinanceiraItem) => {
    setEditingContaId(conta.id)
    setForm({
      companyId: String(conta.companyId),
      empresaId: String(conta.empresaId),
      unidadeId: conta.unidadeId ? String(conta.unidadeId) : "",
      bancoId: conta.bancoId ? String(conta.bancoId) : "",
      titularPessoaId: conta.titularPessoaId ? String(conta.titularPessoaId) : "",
      codigo: conta.codigo,
      nome: conta.nome,
      tipo: conta.tipo,
      agencia: conta.agencia ?? "",
      contaNumero: conta.contaNumero ?? "",
      contaDigito: conta.contaDigito ?? "",
      saldoInicial: maskMoney(conta.saldoInicial),
      dataSaldoInicial: conta.dataSaldoInicial ?? "",
      permiteMovimentoNegativo: conta.permiteMovimentoNegativo,
      status: conta.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.companyId || !form.empresaId || !form.codigo.trim() || !form.nome.trim() || !form.tipo.trim()) {
      customToast.error("Preencha company, empresa, código, nome e tipo.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        companyId: Number(form.companyId),
        empresaId: Number(form.empresaId),
        unidadeId: form.unidadeId ? Number(form.unidadeId) : null,
        bancoId: form.bancoId ? Number(form.bancoId) : null,
        titularPessoaId: form.titularPessoaId ? Number(form.titularPessoaId) : null,
        codigo: form.codigo.trim(),
        nome: form.nome.trim(),
        tipo: form.tipo.trim(),
        agencia: form.agencia ? unmaskBankAgencyNumber(form.agencia) : null,
        contaNumero: form.contaNumero.trim() || null,
        contaDigito: form.contaDigito.trim() || null,
        saldoInicial: unmaskMoney(form.saldoInicial),
        dataSaldoInicial: form.dataSaldoInicial || null,
        permiteMovimentoNegativo: form.permiteMovimentoNegativo,
        status: form.status,
      }

      if (editingContaId) {
        await updateContaFinanceira(editingContaId, payload)
        customToast.success("Conta financeira atualizada com sucesso.")
      } else {
        await createContaFinanceira(payload)
        customToast.success("Conta financeira criada com sucesso.")
      }

      setDialogOpen(false)
      setEditingContaId(null)
      setForm(EMPTY_FORM)
      await load({ companyId: selectedCompanyId, empresaId: selectedEmpresaId })
    } catch (error: any) {
      customToast.error(error?.response?.data?.error?.message || error?.message || `Erro ao ${editingContaId ? "atualizar" : "criar"} conta financeira.`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Contas Financeiras
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Cadastro operacional de contas financeiras para movimentos, extratos e conciliação.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button onClick={openCreateDialog} disabled={!canManage}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </div>
          </div>

          <Card className="mb-6 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4 text-blue-600" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Company</Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={(value) => {
                    setSelectedCompanyId(value)
                    setSelectedEmpresaId("")
                    void load({ companyId: value, empresaId: "" })
                  }}
                  disabled={!isRoot}
                >
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
                <Label>Empresa</Label>
                <Select
                  value={selectedEmpresaId || "__all__"}
                  onValueChange={(value) => {
                    const nextValue = value === "__all__" ? "" : value
                    setSelectedEmpresaId(nextValue)
                    void load({ companyId: selectedCompanyId, empresaId: nextValue })
                  }}
                  disabled={!selectedCompanyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas as empresas</SelectItem>
                    {filteredEmpresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={String(empresa.id)}>
                        {empresa.razaoSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4 text-emerald-600" />
                Contas financeiras acessíveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedCompanyId ? (
                <div className="text-sm text-slate-500">Selecione uma company para listar as contas.</div>
              ) : loading ? (
                <div className="text-sm text-slate-500">Carregando contas...</div>
              ) : contas.length === 0 ? (
                <div className="text-sm text-slate-500">Nenhuma conta financeira encontrada.</div>
              ) : (
                contas.map((conta) => (
                  <div key={conta.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{conta.nome}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Código {conta.codigo} • Tipo {conta.tipo}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Banco: {conta.banco?.codigoCompe ? `${conta.banco.codigoCompe} - ${conta.banco.nomeCurto || conta.banco.nome}` : "Não informado"} • Agência: {conta.agencia || "Não informada"} • Conta: {conta.contaNumero ? `${conta.contaNumero}${conta.contaDigito ? `-${conta.contaDigito}` : ""}` : "Não informada"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Catálogo banco: {conta.banco?.tipo || "Tipo não informado"} • ISPB: {conta.banco?.ispb || "Não informado"}{conta.banco?.site ? ` • ${conta.banco.site}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Company: {companiesById.get(conta.companyId)?.nome || `#${conta.companyId}`} • Empresa: {empresasById.get(conta.empresaId)?.razaoSocial || `#${conta.empresaId}`}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Unidade: {conta.unidadeId ? unidadesById.get(conta.unidadeId)?.nome || `#${conta.unidadeId}` : "Sem unidade vinculada"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Titular: {conta.titularPessoaNome || "Não informado"} • Saldo inicial: R$ {Number(conta.saldoInicial || 0).toFixed(2)} • Negativo: {conta.permiteMovimentoNegativo ? "permitido" : "bloqueado"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={conta.status === "active" ? "default" : "secondary"}>
                          {conta.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(conta)} disabled={!canManage}>
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
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContaId ? "Editar Conta Financeira" : "Nova Conta Financeira"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Select
                value={form.companyId}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, companyId: value, empresaId: "", unidadeId: "", bancoId: "", titularPessoaId: "" }))
                  void loadReferenceData(value, "")
                }}
                disabled={!isRoot}
              >
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
              <Label>Empresa</Label>
              <Select
                value={form.empresaId}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, empresaId: value, titularPessoaId: "" }))
                  void loadReferenceData(form.companyId, value)
                }}
                disabled={!form.companyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.filter((empresa) => empresa.companyId === Number(form.companyId)).map((empresa) => (
                    <SelectItem key={empresa.id} value={String(empresa.id)}>
                      {empresa.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={form.unidadeId || "__none__"} onValueChange={(value) => setForm((prev) => ({ ...prev, unidadeId: value === "__none__" ? "" : value }))} disabled={!form.companyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem unidade</SelectItem>
                  {filteredUnidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={String(unidade.id)}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta-codigo">Código</Label>
              <Input id="conta-codigo" value={form.codigo} onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta-nome">Nome</Label>
              <Input id="conta-nome" value={form.nome} onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta-tipo">Tipo</Label>
              <Select value={form.tipo} onValueChange={(value) => setForm((prev) => ({ ...prev, tipo: value }))}>
                <SelectTrigger id="conta-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Banco</Label>
                <SearchableSelect
                  options={bancoOptions}
                  value={form.bancoId || "__none__"}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, bancoId: value === "__none__" ? "" : value }))}
                  placeholder="Selecione o banco"
                  searchPlaceholder="Buscar por COMPE, nome, nome curto ou ISPB..."
                  emptyMessage="Nenhum banco encontrado"
                />
                {selectedBanco ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <div>{selectedBanco.nome}</div>
                    <div className="mt-1">
                      ISPB: {selectedBanco.ispb || "Não informado"} • Tipo: {selectedBanco.tipo || "Não informado"} • Rede: {selectedBanco.rede || "Não informada"}
                    </div>
                    {selectedBanco.site ? (
                      <div className="mt-1 break-all">
                        Site: {selectedBanco.site}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Titular</Label>
                <Select value={form.titularPessoaId || "__none__"} onValueChange={(value) => setForm((prev) => ({ ...prev, titularPessoaId: value === "__none__" ? "" : value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o titular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem titular vinculado</SelectItem>
                    {filteredPessoas.map((pessoa) => (
                      <SelectItem key={pessoa.id} value={String(pessoa.id)}>
                        {pessoa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="conta-agencia">Agência</Label>
                <Input id="conta-agencia" value={form.agencia} onChange={(e) => setForm((prev) => ({ ...prev, agencia: maskBankAgencyNumber(e.target.value) }))} placeholder="0001" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta-numero">Conta</Label>
                <Input id="conta-numero" value={form.contaNumero} onChange={(e) => setForm((prev) => ({ ...prev, contaNumero: e.target.value.replace(/[^0-9A-Za-z]/g, "").slice(0, 30) }))} placeholder="12345678" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta-digito">Dígito</Label>
                <Input id="conta-digito" value={form.contaDigito} onChange={(e) => setForm((prev) => ({ ...prev, contaDigito: e.target.value.replace(/[^0-9A-Za-z]/g, "").slice(0, 5) }))} placeholder="9" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="conta-saldo-inicial">Saldo inicial</Label>
                <Input id="conta-saldo-inicial" value={form.saldoInicial} onChange={(e) => setForm((prev) => ({ ...prev, saldoInicial: maskMoney(e.target.value) }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta-data-saldo">Data do saldo inicial</Label>
                <Input id="conta-data-saldo" type="date" value={form.dataSaldoInicial} onChange={(e) => setForm((prev) => ({ ...prev, dataSaldoInicial: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
              <Checkbox
                id="conta-permite-negativo"
                checked={form.permiteMovimentoNegativo}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, permiteMovimentoNegativo: checked === true }))}
              />
              <Label htmlFor="conta-permite-negativo" className="text-sm font-normal">
                Permitir movimento com saldo negativo
              </Label>
            </div>

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
            <Button onClick={() => void handleSave()} disabled={saving || !canManage}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
