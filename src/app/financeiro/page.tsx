"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Wallet,
  ArrowRightLeft,
  Plus,
  BarChart3,
  Building2,
  CircleDollarSign,
  Receipt,
  Banknote,
  ChevronRight,
  Landmark,
  Target,
  AlertCircle,
  CheckCircle2,
  Users,
  Ship,
  Calendar as CalendarIcon,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn, formatCurrency } from "@/lib/utils"
import {
  getDashboardData,
  getDashboardCharts,
  type DashboardData,
  type DashboardQueryParams,
  type DashboardChartsData,
} from "@/app/services/dashboard-service"
import { getCashAccountsStatus, type CashAccountStatusResponse } from "@/app/services/cash-account-status-service"
import customToast from "@/components/ui/custom-toast"
import { useRouter } from "next/navigation"
import { ResponsiveBar } from "@nivo/bar"
import { ResponsiveLine } from "@nivo/line"
import { ResponsivePie } from "@nivo/pie"
import { ResponsiveCalendar } from "@nivo/calendar"

const MONTHS_PT: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

function formatPeriod(periodo: string): string {
  const [year, month] = periodo.split('-')
  return `${MONTHS_PT[month] || month}/${year?.slice(2)}`
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`
  if (Math.abs(value) >= 1000) return `R$${(value / 1000).toFixed(0)}k`
  return `R$${value.toFixed(0)}`
}

const CHART_COLORS = {
  receitas: '#10b981',
  despesas: '#f43f5e',
  resultado: '#8b5cf6',
  acumulado: '#3b82f6',
  entradas: '#10b981',
  saidas: '#f43f5e',
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#ec4899', '#84cc16']

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [chartsData, setChartsData] = useState<DashboardChartsData | null>(null)
  const [cashAccountsStatus, setCashAccountsStatus] = useState<CashAccountStatusResponse | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<"semana" | "mes" | "ano">("mes")

  const loadDashboardData = useCallback(async () => {
    setRefreshing(true)
    try {
      const params: DashboardQueryParams = { periodo: selectedPeriod }
      const [data, cashStatus, charts] = await Promise.all([
        getDashboardData(params),
        getCashAccountsStatus(),
        getDashboardCharts(),
      ])
      setDashboardData(data)
      setCashAccountsStatus(cashStatus)
      setChartsData(charts)
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
      customToast.error("Erro ao carregar dashboard.", { position: "top-right" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "semana": return "Esta Semana"
      case "mes": return "Este Mes"
      case "ano": return "Este Ano"
      default: return "Periodo"
    }
  }

  const financialHealth = useMemo(() => {
    if (!dashboardData) return null
    const receitas = dashboardData.financial.receitas_mes || 0
    const despesas = dashboardData.financial.despesas_mes || 0
    const total = receitas + despesas
    const receitaPct = total > 0 ? (receitas / total) * 100 : 50
    const resultado = dashboardData.financial.resultado_mes || 0
    const isPositive = resultado >= 0
    return { receitas, despesas, total, receitaPct, resultado, isPositive }
  }, [dashboardData])

  // Prepare chart data
  const barChartData = useMemo(() => {
    if (!chartsData?.monthly_revenue_expenses) return []
    return chartsData.monthly_revenue_expenses.map(item => ({
      periodo: formatPeriod(item.periodo),
      Receitas: item.receitas,
      Despesas: item.despesas,
      Resultado: item.resultado,
    }))
  }, [chartsData])

  const monthlyAreaData = useMemo(() => {
    if (!chartsData?.monthly_revenue_expenses) return []
    return [
      {
        id: 'Receitas',
        color: '#10b981',
        data: chartsData.monthly_revenue_expenses.map(item => ({
          x: formatPeriod(item.periodo),
          y: item.receitas,
        })),
      },
      {
        id: 'Despesas',
        color: '#f43f5e',
        data: chartsData.monthly_revenue_expenses.map(item => ({
          x: formatPeriod(item.periodo),
          y: item.despesas,
        })),
      },
      {
        id: 'Resultado',
        color: '#8b5cf6',
        data: chartsData.monthly_revenue_expenses.map(item => ({
          x: formatPeriod(item.periodo),
          y: item.resultado,
        })),
      },
    ]
  }, [chartsData])

  const cashFlowLineData = useMemo(() => {
    if (!chartsData?.cash_flow_evolution) return []
    return [
      {
        id: 'Entradas',
        color: CHART_COLORS.entradas,
        data: chartsData.cash_flow_evolution.map(item => ({
          x: formatPeriod(item.periodo),
          y: item.entradas,
        })),
      },
      {
        id: 'Saidas',
        color: CHART_COLORS.saidas,
        data: chartsData.cash_flow_evolution.map(item => ({
          x: formatPeriod(item.periodo),
          y: item.saidas,
        })),
      },
      {
        id: 'Saldo Acumulado',
        color: CHART_COLORS.acumulado,
        data: chartsData.cash_flow_evolution.map(item => ({
          x: formatPeriod(item.periodo),
          y: item.saldo_acumulado,
        })),
      },
    ]
  }, [chartsData])

  const topClientsPieData = useMemo(() => {
    if (!chartsData?.top_clients) return []
    return chartsData.top_clients.map((item, i) => ({
      id: item.cliente.length > 20 ? item.cliente.slice(0, 20) + '...' : item.cliente,
      label: item.cliente,
      value: item.receitas,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }))
  }, [chartsData])

  const expenseCategoriesPieData = useMemo(() => {
    if (!chartsData?.expense_categories) return []
    return chartsData.expense_categories.map((item, i) => ({
      id: item.categoria?.length > 25 ? item.categoria.slice(0, 25) + '...' : (item.categoria || 'Outros'),
      label: item.categoria || 'Outros',
      value: item.valor,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }))
  }, [chartsData])

  const paymentStatusPieData = useMemo(() => {
    if (!chartsData?.payment_status) return []
    const colors: Record<string, string> = { pago: '#10b981', pendente: '#f59e0b', vencido: '#f43f5e' }
    const labels: Record<string, string> = { pago: 'Pago', pendente: 'Pendente', vencido: 'Vencido' }
    return chartsData.payment_status.map(item => ({
      id: labels[item.status] || item.status,
      label: labels[item.status] || item.status,
      value: Number(item.valor_total),
      color: colors[item.status] || '#94a3b8',
    }))
  }, [chartsData])

  const accountBalancesData = useMemo(() => {
    if (!chartsData?.account_balances) return []
    return chartsData.account_balances.slice(0, 8).map(item => ({
      conta: item.conta.length > 20 ? item.conta.slice(0, 20) + '...' : item.conta,
      Saldo: item.saldo,
    }))
  }, [chartsData])

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950">
        <div className="container mx-auto py-6 px-4 sm:px-6 max-w-[1600px]">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5 capitalize">
                {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "semana" | "mes" | "ano")}>
                <SelectTrigger className="w-[145px] border-slate-200 dark:border-slate-700 text-sm h-9">
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mes</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => loadDashboardData()} disabled={refreshing} className="border-slate-200 dark:border-slate-700 h-9 w-9">
                <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              </Button>
              <Button onClick={() => router.push('/financeiro/lancamento?page=1')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold h-9 text-sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Novo Lancamento
              </Button>
            </div>
          </div>

          {/* Financial Health Bar */}
          {!loading && financialHealth && (
            <div className="mb-5 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
              <div className="flex items-center gap-1.5 shrink-0">
                {financialHealth.isPositive
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  : <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                }
                <span className={cn("text-xs font-semibold", financialHealth.isPositive ? "text-emerald-600" : "text-amber-600")}>
                  {financialHealth.isPositive ? "Saldo Positivo" : "Saldo Negativo"}
                </span>
                <span className={cn("text-sm font-bold tabular-nums ml-0.5", financialHealth.isPositive ? "text-emerald-600" : "text-rose-600")}>
                  {financialHealth.isPositive ? "+" : ""}{formatCurrency(financialHealth.resultado)}
                </span>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <div className="relative h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${financialHealth.receitaPct}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-400">Receitas</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(financialHealth.receitas)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-slate-400">Despesas</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(financialHealth.despesas)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Saldo Total", value: dashboardData?.financial.saldo_total || 0, icon: Wallet, gradient: "from-blue-600 to-blue-700", href: '/financeiro/lancamento?page=1' },
              { label: `Receitas ${getPeriodLabel()}`, value: dashboardData?.financial.receitas_mes || 0, icon: ArrowUpRight, gradient: "from-emerald-500 to-emerald-600", href: '/financeiro/lancamento?tipo=receita' },
              { label: `Despesas ${getPeriodLabel()}`, value: dashboardData?.financial.despesas_mes || 0, icon: ArrowDownRight, gradient: "from-rose-500 to-rose-600", href: '/financeiro/lancamento?tipo=despesa' },
              { label: `Resultado ${getPeriodLabel()}`, value: dashboardData?.financial.resultado_mes || 0, icon: dashboardData && dashboardData.financial.resultado_mes >= 0 ? TrendingUp : TrendingDown, gradient: dashboardData && dashboardData.financial.resultado_mes >= 0 ? "from-violet-600 to-violet-700" : "from-amber-500 to-orange-600", href: '/financeiro/lancamento?page=1' },
            ].map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="group cursor-pointer relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'none' }} onClick={() => router.push(card.href)}>
                  <div className={cn("absolute inset-0 bg-gradient-to-br", card.gradient)} />
                  <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
                  <CardContent className="relative p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Icon className="h-[18px] w-[18px] text-white" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-white/70 text-xs font-medium mb-1.5 tracking-wide">{card.label}</p>
                    {loading ? <Skeleton className="h-8 w-3/4 bg-white/20" /> : (
                      <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
                        {formatCurrency(card.value)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Secondary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Pagamentos Pendentes", value: dashboardData?.financial.pagamentos_pendentes || 0, icon: Clock, color: "rose", href: '/financeiro/lancamento?status=pendente' },
              { label: "A Receber (30 dias)", value: dashboardData?.financial.a_receber_30_dias || 0, icon: Banknote, color: "emerald", href: '/financeiro/lancamento?tipo=receita' },
              { label: "A Pagar (30 dias)", value: dashboardData?.financial.a_pagar_30_dias || 0, icon: CircleDollarSign, color: "amber", href: '/financeiro/lancamento?tipo=despesa' },
              { label: "Fluxo Projetado (30d)", value: dashboardData?.financial.fluxo_projetado_30_dias || 0, icon: Target, color: "blue", href: '/financeiro/lancamento?page=1', dynamic: true },
            ].map((metric) => {
              const textColors: Record<string, string> = { rose: "text-rose-600 dark:text-rose-400", emerald: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400", blue: "text-blue-600 dark:text-blue-400" }
              const bgColors: Record<string, string> = { rose: "bg-rose-50 dark:bg-rose-500/10", emerald: "bg-emerald-50 dark:bg-emerald-500/10", amber: "bg-amber-50 dark:bg-amber-500/10", blue: "bg-blue-50 dark:bg-blue-500/10" }
              const borderColors: Record<string, string> = { rose: "border-l-rose-400", emerald: "border-l-emerald-400", amber: "border-l-amber-400", blue: "border-l-blue-400" }
              const Icon = metric.icon
              const effectiveColor = metric.dynamic && (metric.value as number) < 0 ? "rose" : metric.color
              return (
                <div key={metric.label}
                  className={cn("group cursor-pointer rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-4", borderColors[effectiveColor])}
                  onClick={() => router.push(metric.href)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("p-1.5 rounded-lg", bgColors[effectiveColor])}>
                      <Icon className={cn("h-3.5 w-3.5", textColors[effectiveColor])} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{metric.label}</span>
                  </div>
                  {loading ? <Skeleton className="h-7 w-3/4" /> : (
                    <div className={cn("text-xl font-bold tabular-nums", textColors[effectiveColor])}>{formatCurrency(metric.value as number)}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ====== CHARTS SECTION ====== */}

          {/* Chart 1: Full-width Monthly Revenue/Expenses — Area Chart */}
          <div className="mb-5">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Receitas vs Despesas</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Evolucao mensal dos ultimos 12 meses</CardDescription>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-1 rounded-full bg-emerald-500" /><span>Receitas</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-1 rounded-full bg-rose-500" /><span>Despesas</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-1 rounded-full bg-violet-500" /><span>Resultado</span></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-2">
                {loading || !chartsData ? (
                  <Skeleton className="h-[380px] w-full rounded-xl mt-4" />
                ) : monthlyAreaData.length === 0 || monthlyAreaData[0].data.length === 0 ? (
                  <div className="flex items-center justify-center h-[380px] text-slate-400">Sem dados no periodo</div>
                ) : (
                  <div className="h-[380px]">
                    <ResponsiveLine
                      data={monthlyAreaData}
                      margin={{ top: 24, right: 30, bottom: 60, left: 80 }}
                      xScale={{ type: 'point' }}
                      yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
                      curve="monotoneX"
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 0,
                        tickPadding: 12,
                        tickRotation: -35,
                      }}
                      axisLeft={{
                        tickSize: 0,
                        tickPadding: 12,
                        tickValues: 6,
                        format: (v) => formatCompact(Number(v)),
                      }}
                      colors={['#10b981', '#f43f5e', '#8b5cf6']}
                      lineWidth={2.5}
                      enableArea={true}
                      areaOpacity={0.1}
                      areaBaselineValue={0}
                      pointSize={4}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      enableGridX={false}
                      gridYValues={6}
                      useMesh={true}
                      crosshairType="x"
                      theme={{
                        background: 'transparent',
                        crosshair: { line: { stroke: '#94a3b8', strokeWidth: 1, strokeOpacity: 0.5 } },
                        grid: { line: { stroke: '#f1f5f9', strokeWidth: 1 } },
                        axis: { ticks: { text: { fill: '#94a3b8', fontSize: 11, fontFamily: 'inherit' } } },
                        tooltip: { container: { background: '#0f172a', color: '#f8fafc', borderRadius: '10px', fontSize: 13, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', padding: '12px 16px', minWidth: 180 } },
                      }}
                      tooltip={({ point }) => {
                        const colors: Record<string, string> = { Receitas: '#10b981', Despesas: '#f43f5e', Resultado: '#8b5cf6' }
                        return (
                          <div>
                            <div className="text-slate-400 text-xs mb-2">{point.data.xFormatted}</div>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[point.seriesId as string] || '#94a3b8' }} />
                              <span className="text-slate-300">{point.seriesId}:</span>
                              <span className="font-bold">{formatCurrency(Number(point.data.y))}</span>
                            </div>
                          </div>
                        )
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Cash Flow Line + Account Balances */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
            {/* Cash Flow - Line (wider) */}
            <Card className="lg:col-span-3 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Fluxo de Caixa</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Entradas, saidas e saldo acumulado</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-2">
                {loading || !chartsData ? (
                  <Skeleton className="h-[300px] w-full rounded-xl mt-4" />
                ) : cashFlowLineData.length === 0 || cashFlowLineData[0].data.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-slate-400">Sem dados no periodo</div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveLine
                      data={cashFlowLineData}
                      margin={{ top: 24, right: 24, bottom: 56, left: 80 }}
                      xScale={{ type: 'point' }}
                      yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                      curve="monotoneX"
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 0,
                        tickPadding: 10,
                        tickRotation: -40,
                      }}
                      axisLeft={{
                        tickSize: 0,
                        tickPadding: 10,
                        tickValues: 5,
                        format: (v) => formatCompact(Number(v)),
                      }}
                      colors={['#10b981', '#f43f5e', '#3b82f6']}
                      lineWidth={2.5}
                      pointSize={5}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      enableArea={true}
                      areaOpacity={0.06}
                      enableGridX={false}
                      gridYValues={5}
                      useMesh={true}
                      theme={{
                        background: 'transparent',
                        grid: { line: { stroke: '#f1f5f9', strokeWidth: 1 } },
                        axis: { ticks: { text: { fill: '#94a3b8', fontSize: 11, fontFamily: 'inherit' } } },
                        tooltip: { container: { background: '#0f172a', color: '#f8fafc', borderRadius: '10px', fontSize: 13, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', padding: '10px 14px' } },
                      }}
                      legends={[
                        {
                          anchor: 'top',
                          direction: 'row',
                          translateY: -20,
                          itemWidth: 110,
                          itemHeight: 16,
                          symbolSize: 10,
                          symbolShape: 'circle',
                          itemTextColor: '#94a3b8',
                        }
                      ]}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Balances */}
            <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Saldos por Conta</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Contas caixa do dashboard</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-2">
                {loading || !chartsData ? (
                  <Skeleton className="h-[300px] w-full rounded-xl mt-4" />
                ) : accountBalancesData.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-slate-400">Sem dados</div>
                ) : (
                  <div style={{ height: Math.max(300, accountBalancesData.length * 52) }}>
                    <ResponsiveBar
                      data={accountBalancesData}
                      keys={['Saldo']}
                      indexBy="conta"
                      layout="horizontal"
                      margin={{ top: 24, right: 70, bottom: 24, left: 130 }}
                      padding={0.35}
                      valueScale={{ type: 'linear' }}
                      indexScale={{ type: 'band', round: true }}
                      colors={({ data }) => (data.Saldo as number) >= 0 ? '#10b981' : '#f43f5e'}
                      borderRadius={5}
                      axisTop={null}
                      axisBottom={null}
                      axisLeft={{ tickSize: 0, tickPadding: 10 }}
                      axisRight={null}
                      enableLabel={true}
                      label={d => formatCompact(d.value as number)}
                      labelSkipWidth={35}
                      labelTextColor="#fff"
                      enableGridY={false}
                      enableGridX={false}
                      theme={{
                        background: 'transparent',
                        axis: { ticks: { text: { fill: '#64748b', fontSize: 11, fontFamily: 'inherit' } } },
                        tooltip: { container: { background: '#0f172a', color: '#f8fafc', borderRadius: '10px', fontSize: 13, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', padding: '10px 14px' } },
                      }}
                      tooltip={({ indexValue, value }) => (
                        <div>
                          <div className="font-semibold mb-1">{indexValue}</div>
                          <div className="font-bold">{formatCurrency(Number(value))}</div>
                        </div>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 3: 3 Donut Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {/* Top Clients - Donut */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Receitas por Cliente</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Top clientes do ano</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {loading || !chartsData ? (
                  <Skeleton className="h-[240px] w-full rounded-xl" />
                ) : topClientsPieData.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-slate-400">Sem dados</div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsivePie
                      data={topClientsPieData}
                      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      innerRadius={0.62}
                      padAngle={2}
                      cornerRadius={5}
                      activeOuterRadiusOffset={8}
                      colors={PIE_COLORS}
                      borderWidth={0}
                      enableArcLinkLabels={false}
                      arcLabelsSkipAngle={25}
                      arcLabelsTextColor="#fff"
                      theme={{
                        background: 'transparent',
                        tooltip: { container: { background: '#0f172a', color: '#f8fafc', borderRadius: '10px', fontSize: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', padding: '10px 14px' } },
                      }}
                      tooltip={({ datum }) => (
                        <div>
                          <div className="font-semibold mb-1 truncate" style={{ maxWidth: 200 }}>{datum.label}</div>
                          <div className="font-bold">{formatCurrency(Number(datum.value))}</div>
                        </div>
                      )}
                    />
                  </div>
                )}
                {!loading && topClientsPieData.length > 0 && (
                  <div className="space-y-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {topClientsPieData.slice(0, 4).map((item, i) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="truncate text-slate-500 dark:text-slate-400">{item.label}</span>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 ml-2 shrink-0 tabular-nums">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Categories - Donut */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Despesas por Categoria</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Distribuicao do ano</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {loading || !chartsData ? (
                  <Skeleton className="h-[240px] w-full rounded-xl" />
                ) : expenseCategoriesPieData.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-slate-400">Sem dados</div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsivePie
                      data={expenseCategoriesPieData}
                      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      innerRadius={0.62}
                      padAngle={2}
                      cornerRadius={5}
                      activeOuterRadiusOffset={8}
                      colors={PIE_COLORS}
                      borderWidth={0}
                      enableArcLinkLabels={false}
                      arcLabelsSkipAngle={25}
                      arcLabelsTextColor="#fff"
                      theme={{
                        background: 'transparent',
                        tooltip: { container: { background: '#0f172a', color: '#f8fafc', borderRadius: '10px', fontSize: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', padding: '10px 14px' } },
                      }}
                      tooltip={({ datum }) => (
                        <div>
                          <div className="font-semibold mb-1 truncate" style={{ maxWidth: 200 }}>{datum.label}</div>
                          <div className="font-bold">{formatCurrency(Number(datum.value))}</div>
                        </div>
                      )}
                    />
                  </div>
                )}
                {!loading && expenseCategoriesPieData.length > 0 && (
                  <div className="space-y-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {expenseCategoriesPieData.slice(0, 4).map((item, i) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="truncate text-slate-500 dark:text-slate-400">{item.label}</span>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 ml-2 shrink-0 tabular-nums">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Status - Donut */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Status de Pagamentos</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Distribuicao do ano</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {loading || !chartsData ? (
                  <Skeleton className="h-[240px] w-full rounded-xl" />
                ) : paymentStatusPieData.length === 0 ? (
                  <div className="flex items-center justify-center h-[240px] text-slate-400">Sem dados</div>
                ) : (
                  <div className="h-[240px]">
                    <ResponsivePie
                      data={paymentStatusPieData}
                      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      innerRadius={0.62}
                      padAngle={2}
                      cornerRadius={5}
                      activeOuterRadiusOffset={8}
                      colors={({ data }) => data.color}
                      borderWidth={0}
                      enableArcLinkLabels={false}
                      arcLabelsSkipAngle={25}
                      arcLabelsTextColor="#fff"
                      theme={{
                        background: 'transparent',
                        tooltip: { container: { background: '#0f172a', color: '#f8fafc', borderRadius: '10px', fontSize: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', padding: '10px 14px' } },
                      }}
                      tooltip={({ datum }) => (
                        <div>
                          <div className="font-semibold mb-1">{datum.label}</div>
                          <div className="font-bold">{formatCurrency(Number(datum.value))}</div>
                        </div>
                      )}
                    />
                  </div>
                )}
                {!loading && paymentStatusPieData.length > 0 && (
                  <div className="space-y-2 mt-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {paymentStatusPieData.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 4: Operational Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
            {[
              { label: "Ops. Ativas", value: dashboardData?.operational.operacoes_ativas || 0, icon: Ship, color: "blue", href: '/operacional/operacoes', fmt: 'number' as const },
              { label: "Finalizadas", value: dashboardData?.operational.operacoes_finalizadas_mes || 0, icon: Target, color: "emerald", href: '/operacional/operacoes', fmt: 'number' as const },
              { label: "Toneladas", value: dashboardData?.operational.toneladas_movimentadas_mes || 0, icon: BarChart3, color: "slate", href: '/operacional/operacoes', fmt: 'tons' as const },
              { label: "Transferencias", value: dashboardData?.operational.transferencias_mes || 0, icon: ArrowRightLeft, color: "indigo", href: '/financeiro/transferencia', fmt: 'number' as const },
              { label: "Clientes Ativos", value: dashboardData?.clients.clientes_ativos || 0, icon: Users, color: "violet", href: '/cadastros/pessoas', fmt: 'number' as const },
              { label: "Un. de Negocio", value: dashboardData?.clients.unidades_negocio_ativas || 0, icon: Building2, color: "sky", href: '/cadastros/pessoas', fmt: 'number' as const },
            ].map((m) => {
              const txts: Record<string, string> = { blue: "text-blue-600", emerald: "text-emerald-600", slate: "text-slate-700", indigo: "text-indigo-600", violet: "text-violet-600", sky: "text-sky-600" }
              const bgs: Record<string, string> = { blue: "bg-blue-50 dark:bg-blue-500/10", emerald: "bg-emerald-50 dark:bg-emerald-500/10", slate: "bg-slate-100 dark:bg-slate-700/30", indigo: "bg-indigo-50 dark:bg-indigo-500/10", violet: "bg-violet-50 dark:bg-violet-500/10", sky: "bg-sky-50 dark:bg-sky-500/10" }
              const iconBgs: Record<string, string> = { blue: "bg-blue-600", emerald: "bg-emerald-600", slate: "bg-slate-500", indigo: "bg-indigo-600", violet: "bg-violet-600", sky: "bg-sky-600" }
              const Icon = m.icon
              return (
                <div key={m.label}
                  className={cn("rounded-xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5")}
                  onClick={() => router.push(m.href)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("p-1.5 rounded-lg", iconBgs[m.color])}><Icon className="h-3.5 w-3.5 text-white" /></div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{m.label}</span>
                  </div>
                  {loading ? <Skeleton className="h-7 w-16" /> : (
                    <div className={cn("text-xl font-bold tabular-nums", txts[m.color])}>
                      {m.fmt === "tons" ? (m.value as number).toLocaleString("pt-BR", { maximumFractionDigits: 0 }) : m.value}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Row 5: Contas Caixa Cards + Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
            {/* Contas Caixa */}
            <Card className="lg:col-span-3 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Contas Caixa</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Saldos atualizados</CardDescription>
                  </div>
                  {cashAccountsStatus && (() => {
                    const totalSaldo = cashAccountsStatus.contas.filter(c => c.dashboard).reduce((t, c) => t + parseFloat(c.saldo_atual), 0)
                    return (
                      <div className="text-right">
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Saldo Total</div>
                        <div className={cn("text-lg font-bold tabular-nums", totalSaldo >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {formatCurrency(totalSaldo)}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cashAccountsStatus?.contas.filter(c => c.dashboard).map((conta) => {
                      const saldoAtual = parseFloat(conta.saldo_atual)
                      const saldoInicial = parseFloat(conta.saldo_inicial)
                      const variacao = saldoAtual - saldoInicial
                      const isPositive = saldoAtual >= 0
                      const variacaoPct = saldoInicial !== 0 ? ((variacao / Math.abs(saldoInicial)) * 100) : 0
                      return (
                        <div key={conta.id_conta_caixa}
                          className="group relative p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 transition-all cursor-pointer hover:shadow-md hover:bg-white dark:hover:bg-slate-800/60 hover:-translate-y-0.5"
                          onClick={() => router.push(`/financeiro/lancamento?page=1&id_conta_caixa=${conta.id_conta_caixa}`)}
                        >
                          <div className={cn("absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full", isPositive ? "bg-emerald-400" : "bg-rose-400")} />
                          <div className="flex items-start justify-between mb-2 pl-1">
                            <h4 className="font-medium text-slate-700 dark:text-slate-200 text-xs leading-tight truncate max-w-[130px]">{conta.conta}</h4>
                            <div className={cn("text-[10px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shrink-0",
                              variacao >= 0 ? "text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400" : "text-rose-700 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-400"
                            )}>
                              {variacao >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                              {Math.abs(variacaoPct).toFixed(1)}%
                            </div>
                          </div>
                          <div className={cn("text-lg font-bold tabular-nums pl-1", isPositive ? "text-emerald-600" : "text-rose-600")}>
                            {formatCurrency(saldoAtual)}
                          </div>
                          <div className="pl-1 mt-1">
                            <span className="text-[10px] text-slate-400">Inicial: {formatCurrency(saldoInicial)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Transacoes Recentes</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Ultimas movimentacoes</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs h-7 px-2" onClick={() => router.push('/financeiro/lancamento?page=1')}>
                    Ver todas <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2 px-0">
                {loading ? (
                  <div className="space-y-1 px-4 pt-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/30 max-h-[480px] overflow-y-auto">
                    {dashboardData?.recent_transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between px-4 py-3 transition-colors cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-700/20 group" onClick={() => router.push('/financeiro/lancamento?page=1')}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn("p-1.5 rounded-lg shrink-0",
                            transaction.tipo === "receita" ? "bg-emerald-100" : "bg-rose-100"
                          )}>
                            {transaction.tipo === "receita"
                              ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                              : <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100 text-xs truncate">
                              <span className="truncate">{transaction.pessoa_nome}</span>
                              <span>|</span>
                              <span className="shrink-0">
                                {format(new Date(transaction.pagamento || transaction.vencimento || transaction.data), "dd/MM/yy")}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{transaction.descricao}</p>
                          </div>
                        </div>
                        <div className={cn("text-sm font-bold whitespace-nowrap ml-3 tabular-nums",
                          transaction.tipo === "receita" ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {transaction.tipo === "receita" ? "+" : "-"}{formatCurrency(transaction.valor)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 6: Upcoming Payments + Active Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Upcoming Payments */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Proximos Vencimentos</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Pagamentos a vencer nos proximos 15 dias</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                  </div>
                ) : dashboardData?.upcoming_payments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-300" />
                    <p>Nenhum pagamento proximo</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto">
                    {dashboardData?.upcoming_payments.map((payment) => {
                      const urgencyColors: Record<string, string> = {
                        alta: "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
                        media: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
                        baixa: "border-l-blue-400 bg-blue-50/30 dark:bg-blue-950/10",
                      }
                      const urgencyBadge: Record<string, string> = {
                        alta: "bg-red-100 text-red-700",
                        media: "bg-amber-100 text-amber-700",
                        baixa: "bg-blue-100 text-blue-700",
                      }
                      return (
                        <div key={payment.id} className={cn("p-3 rounded-lg border-l-4 border border-slate-100 dark:border-slate-700/30", urgencyColors[(payment as any).urgencia || 'baixa'])}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{payment.descricao}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{payment.pessoa_nome}</p>
                            </div>
                            <div className="text-right ml-3">
                              <div className={cn("font-bold text-sm", payment.tipo === 'receita' ? "text-emerald-600" : "text-rose-600")}>
                                {formatCurrency(payment.valor)}
                              </div>
                              <Badge className={cn("text-[10px] mt-1", urgencyBadge[(payment as any).urgencia || 'baixa'])}>
                                {(payment as any).dias_vencimento === 0 ? "Hoje" : `${(payment as any).dias_vencimento}d`}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Operations */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Operacoes Ativas</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Operacoes em andamento</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
                ) : dashboardData?.active_operations.length === 0 ? (
                  <div className="text-center py-12">
                    <Ship className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400">Nenhuma operacao ativa</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto">
                    {dashboardData?.active_operations.map((op) => (
                      <div key={op.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-700/10 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{op.descricao}</p>
                            <Badge className="bg-blue-100 text-blue-700 text-[10px] border-0">{op.status}</Badge>
                          </div>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">{op.tons.toLocaleString("pt-BR")} t</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[{ l: "Viagem", v: op.viagem }, { l: "Navio", v: op.navio_nome }, { l: "Porto", v: op.porto_nome }, { l: "Cliente", v: op.cliente_nome }].map(item => (
                            <div key={item.l} className="text-xs">
                              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{item.l}</span>
                              <p className="text-slate-700 dark:text-slate-300 font-medium truncate">{item.v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Heatmap */}
          <div className="mb-5">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Atividade de Lancamentos</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Frequencia de lancamentos nos ultimos 12 meses</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {loading || !chartsData ? (
                  <Skeleton className="h-[180px] w-full rounded-xl" />
                ) : !chartsData.daily_activity || chartsData.daily_activity.length === 0 ? (
                  <div className="flex items-center justify-center h-[180px] text-slate-400">Sem dados de atividade</div>
                ) : (
                  <div className="h-[180px]">
                    <ResponsiveCalendar
                      data={chartsData.daily_activity}
                      from={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                      to={new Date().toISOString().slice(0, 10)}
                      emptyColor="#f1f5f9"
                      colors={['#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8']}
                      margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
                      yearSpacing={40}
                      monthBorderColor="#e2e8f0"
                      dayBorderWidth={2}
                      dayBorderColor="#fff"
                      legends={[
                        {
                          anchor: 'bottom-right',
                          direction: 'row',
                          translateY: 36,
                          itemCount: 4,
                          itemWidth: 42,
                          itemHeight: 36,
                          itemsSpacing: 14,
                          itemDirection: 'right-to-left',
                        }
                      ]}
                      tooltip={({ day, value }) => (
                        <div className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm shadow-xl">
                          <strong>{day}</strong>
                          <br />
                          {value} lancamento{Number(value) !== 1 ? 's' : ''}
                        </div>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/financeiro/lancamento?page=1', icon: Receipt, label: "Lancamentos", sub: "Ver todos", bg: "bg-blue-600", text: "text-blue-600", lightBg: "bg-blue-50" },
              { href: '/financeiro/transferencia', icon: ArrowRightLeft, label: "Transferencias", sub: "Entre contas", bg: "bg-indigo-600", text: "text-indigo-600", lightBg: "bg-indigo-50" },
              { href: '/cadastros/contas-caixa', icon: Landmark, label: "Contas Caixa", sub: "Gerenciar", bg: "bg-emerald-600", text: "text-emerald-600", lightBg: "bg-emerald-50" },
              { href: '/cadastros/pessoas', icon: Users, label: "Pessoas", sub: "Cadastros", bg: "bg-amber-500", text: "text-amber-600", lightBg: "bg-amber-50" },
            ].map((action) => {
              const Icon = action.icon
              return (
                <button key={action.label} onClick={() => router.push(action.href)} className="group flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-left">
                  <div className={cn("p-2 rounded-lg shrink-0", action.bg)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{action.label}</p>
                    <p className="text-[11px] text-slate-400">{action.sub}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto shrink-0 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              )
            })}
          </div>

        </div>
      </div>
    </>
  )
}
