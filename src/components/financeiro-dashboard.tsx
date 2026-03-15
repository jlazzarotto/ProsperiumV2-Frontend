"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Building2, Briefcase, Layers3, Shield, ArrowRight, RefreshCw } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"
import { getCompanies, getEmpresas, getUnidades, type CompanyItem, type EmpresaItem, type UnidadeItem } from "@/app/services/core-saas-service"

export function FinanceiroDashboard() {
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
      console.error("Erro ao carregar visão inicial:", error)
      customToast.error("Erro ao carregar a visão inicial do sistema.", { position: "top-right" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const scopeSummary = useMemo(() => {
    return {
      companies: user?.companyIds?.length ?? 0,
      empresas: user?.empresaIds?.length ?? 0,
      unidades: user?.unidadeIds?.length ?? 0,
    }
  }, [user])

  const cards = [
    {
      label: "Companies acessíveis",
      value: companies.length,
      icon: Layers3,
      tone: "text-sky-600",
    },
    {
      label: "Empresas acessíveis",
      value: empresas.length,
      icon: Building2,
      tone: "text-emerald-600",
    },
    {
      label: "Unidades acessíveis",
      value: unidades.length,
      icon: Briefcase,
      tone: "text-amber-600",
    },
  ]

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">{user?.role ?? "Sem papel"}</Badge>
                <Badge variant="secondary">
                  {user?.role === "ROLE_ROOT" ? "Acesso global" : "Acesso por company"}
                </Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Visão Inicial do Sistema
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Painel enxuto e compatível com a API atual do Prosperium.
              </p>
            </div>

            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon

              return (
                <Card key={card.label} className="border-slate-200 dark:border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {card.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="text-3xl font-semibold text-slate-900 dark:text-white">
                      {loading ? "..." : card.value}
                    </div>
                    <Icon className={`h-6 w-6 ${card.tone}`} />
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-base">Escopo autenticado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <span>Usuário</span>
                  <span className="font-medium text-slate-900 dark:text-white">{user?.nome ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <span>Email</span>
                  <span className="font-medium text-slate-900 dark:text-white">{user?.email ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <span>Companies no vínculo</span>
                  <span className="font-medium text-slate-900 dark:text-white">{scopeSummary.companies}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                  <span>Empresas no vínculo</span>
                  <span className="font-medium text-slate-900 dark:text-white">{scopeSummary.empresas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Unidades no vínculo</span>
                  <span className="font-medium text-slate-900 dark:text-white">{scopeSummary.unidades}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Próximos acessos seguros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickLink href="/admin/coordenar-empresas" label="Companies e Empresas" />
                <QuickLink href="/admin/coordenar-unidades" label="Unidades de Negócio" />
                <QuickLink href="/debug" label="Debug da sessão autenticada" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
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
