import { httpClient } from '@/lib/http-client'

/**
 * Interface para o resumo do status das contas
 */
export interface CashAccountStatusSummary {
  total_contas: number
  saldo_total_geral: string
  data_calculo: string
  data_limite?: string | null
}

/**
 * Interface para uma conta no status
 */
export interface CashAccountStatusItem {
  id_conta_caixa: number
  conta: string
  id_agencia_bancaria: number
  id_un_negocio: number
  saldo_atual: string
  saldo_inicial: string
  dashboard: boolean
  status: boolean
}

/**
 * Interface para a resposta completa do status das contas
 */
export interface CashAccountStatusResponse {
  resumo: CashAccountStatusSummary
  contas: CashAccountStatusItem[]
}

/**
 * Busca o status das contas caixa
 * @param dataLimite - Data limite para calcular saldo histórico (formato: YYYY-MM-DD). Se não fornecida, usa HOJE.
 * @param dashboardOnly - Se true, retorna apenas contas marcadas como dashboard
 */
export const getCashAccountsStatus = async (dataLimite?: string, dashboardOnly: boolean = true): Promise<CashAccountStatusResponse> => {
  try {
    let url = '/contas-caixa/status'

    // Se não foi fornecida data limite, usar a data de hoje
    const dataParaUsar = dataLimite || new Date().toISOString().split('T')[0]

    const params = new URLSearchParams()
    params.append('data_limite', dataParaUsar)

    // Adicionar filtro de dashboard se solicitado
    if (dashboardOnly) {
      params.append('dashboard', 'true')
    }

    // Adicionar timestamp para evitar cache do browser
    params.append('_t', Date.now().toString())

    url += `?${params.toString()}`
    const response = await httpClient.get<CashAccountStatusResponse>(url)
    return response
  } catch (error) {
    console.error('Erro ao obter status das contas caixa:', error)
    throw error
  }
}
