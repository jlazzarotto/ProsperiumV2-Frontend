import { httpClient } from '@/lib/http-client'

export interface DashboardFinancial {
  saldo_total: number
  receitas_mes: number
  despesas_mes: number
  resultado_mes: number
  pagamentos_pendentes: number
  a_receber_30_dias: number
  a_pagar_30_dias: number
  fluxo_projetado_30_dias: number
}

export interface DashboardOperational {
  operacoes_ativas: number
  operacoes_finalizadas_mes: number
  toneladas_movimentadas_mes: number
  transferencias_mes: number
  valor_transferencias_mes: number
}

export interface DashboardClients {
  clientes_ativos: number
  novos_clientes_mes: number
  clientes_com_operacoes_ativas: number
  unidades_negocio_ativas: number
}

export interface DashboardTransaction {
  id: number
  descricao: string
  valor: number
  data: string
  vencimento: string
  pagamento: string | null
  tipo: "receita" | "despesa"
  pessoa_nome: string
  conta_nome: string
  status_pagamento: "pendente" | "baixado" | "vencido"
}

export interface DashboardOperation {
  id: number
  descricao: string
  viagem: string
  data_inicio: string
  data_final: string
  tons: number
  navio_nome: string
  porto_nome: string
  cliente_nome: string
  status: string
}

export interface DashboardFilters {
  data_inicio: string
  data_fim: string
  periodo: "semana" | "mes" | "ano" | null
  unidade_negocio: number | null
}

export interface DashboardData {
  financial: DashboardFinancial
  operational: DashboardOperational
  clients: DashboardClients
  recent_transactions: DashboardTransaction[]
  upcoming_payments: DashboardTransaction[]
  active_operations: DashboardOperation[]
  filters: DashboardFilters
  last_updated: string
}

export interface DashboardResponse {
  success: boolean
  data: DashboardData
}

export interface DashboardQueryParams {
  data_inicio?: string
  data_fim?: string
  periodo?: "semana" | "mes" | "ano"
  unidade_negocio?: number
}

/**
 * Busca os dados do dashboard
 * @param params Parâmetros opcionais de filtro
 * @returns Dados do dashboard
 */
export async function getDashboardData(params?: DashboardQueryParams): Promise<DashboardData> {
  try {
    const queryParams = new URLSearchParams()

    if (params?.data_inicio) {
      queryParams.append("data_inicio", params.data_inicio)
    }

    if (params?.data_fim) {
      queryParams.append("data_fim", params.data_fim)
    }

    if (params?.periodo) {
      queryParams.append("periodo", params.periodo)
    }

    if (params?.unidade_negocio) {
      queryParams.append("unidade_negocio", params.unidade_negocio.toString())
    }

    const queryString = queryParams.toString()
    const url = queryString ? `/dashboard?${queryString}` : "/dashboard"

    const response = await httpClient.get<DashboardResponse>(url)
    return response.data
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error)
    throw error
  }
}

/**
 * Busca os dados do dashboard para o período atual (mês)
 */
export async function getDashboardCurrentMonth(): Promise<DashboardData> {
  return getDashboardData({ periodo: "mes" })
}

/**
 * Busca os dados do dashboard para a semana atual
 */
export async function getDashboardCurrentWeek(): Promise<DashboardData> {
  return getDashboardData({ periodo: "semana" })
}

/**
 * Busca os dados do dashboard para o ano atual
 */
export async function getDashboardCurrentYear(): Promise<DashboardData> {
  return getDashboardData({ periodo: "ano" })
}

/**
 * Busca os dados do dashboard para um período específico
 */
export async function getDashboardByDateRange(startDate: string, endDate: string): Promise<DashboardData> {
  return getDashboardData({
    data_inicio: startDate,
    data_fim: endDate,
  })
}

/**
 * Busca os dados do dashboard filtrado por unidade de negócio
 */
export async function getDashboardByBusinessUnit(businessUnitId: number, periodo?: "semana" | "mes" | "ano"): Promise<DashboardData> {
  return getDashboardData({
    unidade_negocio: businessUnitId,
    periodo,
  })
}

// ===== Charts Data =====

export interface MonthlyRevenueExpense {
  periodo: string
  receitas: number
  despesas: number
  resultado: number
}

export interface TopClient {
  cliente: string
  receitas: number
}

export interface PaymentStatusItem {
  status: string
  quantidade: number
  valor_total: number
}

export interface DailyActivity {
  day: string
  value: number
}

export interface CategoryBreakdown {
  categoria: string
  valor: number
  quantidade: number
}

export interface AccountBalance {
  conta: string
  saldo: number
}

export interface CashFlowItem {
  periodo: string
  entradas: number
  saidas: number
  saldo_periodo: number
  saldo_acumulado: number
}

export interface DashboardChartsData {
  monthly_revenue_expenses: MonthlyRevenueExpense[]
  top_clients: TopClient[]
  payment_status: PaymentStatusItem[]
  daily_activity: DailyActivity[]
  expense_categories: CategoryBreakdown[]
  revenue_categories: CategoryBreakdown[]
  account_balances: AccountBalance[]
  cash_flow_evolution: CashFlowItem[]
}

export async function getDashboardCharts(): Promise<DashboardChartsData> {
  try {
    const response = await httpClient.get<{ success: boolean; data: DashboardChartsData }>("/dashboard/charts")
    return response.data
  } catch (error) {
    console.error("Erro ao buscar charts do dashboard:", error)
    throw error
  }
}
