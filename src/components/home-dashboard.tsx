"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Briefcase,
  Building2,
  Clock3,
  Layers3,
  LayoutGrid,
  RefreshCw,
  Shield,
} from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"
import { getCompanies, getEmpresas, getUnidades, type CompanyItem, type EmpresaItem, type UnidadeItem } from "@/app/services/core-saas-service"

export function HomeDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [empresas, setEmpresas] = useState<EmpresaItem[]>([])
  const [unidades, setUnidades] = useState<UnidadeItem[]>([])

  const load = async () => {
    setLoading(true)

    try {
      const [companiesData, empresasData, unidadesData] = await Promise.all([
        getCompanies(),
        getEmpresas(),
        getUnidades(),
      ])

      setCompanies(companiesData)
      setEmpresas(empresasData)
      setUnidades(unidadesData)
    } catch (error) {
      console.error("Erro ao carregar dashboard da home:", error)
      customToast.error("Erro ao carregar a home do sistema.", { position: "top-right" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const summary = useMemo(() => {
    const activeCompanies = companies.filter((company) => company.status === "active")
    const activeEmpresas = empresas.filter((empresa) => empresa.status === "active")
    const activeUnidades = unidades.filter((unidade) => unidade.status === "active")
    const dedicatedCompanies = companies.filter((company) => company.tenantInstance.tenancyMode === "dedicated")
    const sharedCompanies = companies.filter((company) => company.tenantInstance.tenancyMode === "shared")
    const empresaCountByCompany = new Map<number, number>()

    for (const empresa of empresas) {
      empresaCountByCompany.set(empresa.companyId, (empresaCountByCompany.get(empresa.companyId) ?? 0) + 1)
    }

    const topCompanies = companies
      .map((company) => ({
        ...company,
        empresas: empresaCountByCompany.get(company.id) ?? 0,
      }))
      .sort((a, b) => b.empresas - a.empresas)
      .slice(0, 4)

    const recentCompanies = [...companies]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)

    return {
      activeCompanies: activeCompanies.length,
      activeEmpresas: activeEmpresas.length,
      activeUnidades: activeUnidades.length,
      dedicatedCompanies: dedicatedCompanies.length,
      sharedCompanies: sharedCompanies.length,
      topCompanies,
      recentCompanies,
    }
  }, [companies, empresas, unidades])

  const kpis = [
    {
      label: "Companies ativas",
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
    {
      label: "Tenants dedicated",
      value: summary.dedicatedCompanies,
      tone: "text-rose-600",
      icon: Shield,
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
                    {loading ? "Atualizando" : `${companies.length} companies no radar`}
                  </Badge>
                </div>
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Dashboard executivo do ecossistema Prosperium
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Estrutura inspirada no dashboard legado, reorganizada para a operação atual. A home prioriza
                  indicadores de tenancy, cobertura operacional e atalhos de gestão.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => void load()} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Atualizar home
                  </Button>
                  <Button asChild>
                    <Link href="/financeiro">
                      Ver visão inicial anterior
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <HighlightCard
                  title="Modelo de tenancy"
                  value={`${summary.sharedCompanies} shared / ${summary.dedicatedCompanies} dedicated`}
                  icon={Banknote}
                  tone="from-sky-500/15 to-cyan-500/5"
                />
                <HighlightCard
                  title="Cobertura de acesso"
                  value={`${user?.companyIds?.length ?? 0} companies no vínculo`}
                  icon={BadgeCheck}
                  tone="from-emerald-500/15 to-green-500/5"
                />
                <HighlightCard
                  title="Base operacional"
                  value={`${empresas.length} empresas e ${unidades.length} unidades`}
                  icon={LayoutGrid}
                  tone="from-amber-500/15 to-orange-500/5"
                />
                <HighlightCard
                  title="Última leitura"
                  value={loading ? "Sincronizando..." : "Atualizado agora"}
                  icon={Clock3}
                  tone="from-violet-500/15 to-fuchsia-500/5"
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

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="border-slate-200/80 bg-white/85 dark:border-slate-800 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-base">Companies com maior distribuição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-slate-500">Carregando distribuição...</p>
                ) : summary.topCompanies.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma company encontrada.</p>
                ) : (
                  summary.topCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{company.nome}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {company.tenantInstance.tenancyMode} • DB {company.tenantInstance.databaseKey}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-slate-900 dark:text-white">{company.empresas}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">empresas</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white/85 dark:border-slate-800 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-base">Próximos acessos seguros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickLink href="/admin/coordenar-empresas" label="Governar companies e empresas" />
                <QuickLink href="/admin/coordenar-unidades" label="Revisar unidades de negócio" />
                <QuickLink href="/financeiro" label="Abrir visão inicial do sistema" />
                <QuickLink href="/admin/permissoes" label="Gerenciar acessos e perfis" />
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-slate-200/80 bg-white/85 dark:border-slate-800 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-base">Escopo autenticado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <ScopeRow label="Usuário" value={user?.nome ?? "-"} />
                <ScopeRow label="Email" value={user?.email ?? "-"} />
                <ScopeRow label="Companies no vínculo" value={String(user?.companyIds?.length ?? 0)} />
                <ScopeRow label="Empresas no vínculo" value={String(user?.empresaIds?.length ?? 0)} />
                <ScopeRow label="Unidades no vínculo" value={String(user?.unidadeIds?.length ?? 0)} />
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white/85 dark:border-slate-800 dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-base">Mudanças recentes em companies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-slate-500">Carregando atividades...</p>
                ) : summary.recentCompanies.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma alteração recente encontrada.</p>
                ) : (
                  summary.recentCompanies.map((company) => (
                    <div key={company.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 px-4 py-3 dark:border-slate-800">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{company.nome}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Atualizado em {formatDateTime(company.updatedAt)}
                        </div>
                      </div>
                      <Badge variant={company.status === "active" ? "default" : "secondary"}>
                        {company.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
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

function ScopeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3 last:border-b-0 last:pb-0 dark:border-slate-800">
      <span>{label}</span>
      <span className="font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}
