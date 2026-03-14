import { httpClient } from '@/lib/http-client'
import type {
  ApiCashAccount,
  ApiCashAccountListResponse,
  CreateCashAccountDto,
  UpdateCashAccountDto,
} from '@/types/api'
import type { CashAccount } from '@/types/types'

/**
 * Extrai uma mensagem de erro útil do erro da API
 */
const extractErrorMessage = (error: unknown): string => {
  // Se o erro tem uma resposta da API
  if (error && typeof error === 'object' && 'response' in error) {
    const httpError = error as { response?: { data?: { message?: string; error?: string; debug?: string; details?: unknown } } }
    if (httpError.response?.data) {
      const data = httpError.response.data
    
    // Prioridade: message > error > debug
    if (data.message) return data.message
    if (data.error && data.error !== 'Erro interno') return data.error
    if (data.debug) return data.debug
    
      // Se tem detalhes de validação, formatar
      if (data.details && Array.isArray(data.details)) {
        const fieldErrors = data.details.map((detail: { field?: string; message?: string }) => 
          `${detail.field || 'Campo'}: ${detail.message || 'inválido'}`
        ).join(', ')
        return `Erro de validação: ${fieldErrors}`
      }
    }
  }
  
  // Fallback para mensagem padrão do erro
  if (error && typeof error === 'object' && 'message' in error && typeof (error as Error).message === 'string') {
    return (error as Error).message
  }
  
  return 'Erro inesperado'
}

/**
 * Converte dados da API para o formato interno da aplicação
 */
const mapApiToCashAccount = (apiAccount: ApiCashAccount): CashAccount => {
  const saldoInicial = parseFloat(apiAccount.saldo_inicial || '0')
  const saldoAtual = parseFloat(apiAccount.saldo_atual || apiAccount.saldo_inicial || '0')

  const paymentMethods = apiAccount.formas_pagamento
    ? apiAccount.formas_pagamento.map(id => String(id))
    : []

  return {
    id: String(apiAccount.id_conta_caixa),
    code: String(apiAccount.id_conta_caixa), // Usar ID como código
    account: apiAccount.conta,
    isSaldoAdmto: apiAccount.is_saldo_admto ?? false,
    saldoAdmtoIdOperacao: apiAccount.id_operacao ?? null,
    saldoAdmtoValor: apiAccount.saldo !== undefined ? Number(apiAccount.saldo) : null,
    value: saldoInicial.toString(),
    currentBalance: saldoAtual, // Usar saldo atual da API
    income: 0, // Será calculado depois se necessário
    expense: 0, // Será calculado depois se necessário
    bankAgencyId: apiAccount.id_agencia_bancaria ? String(apiAccount.id_agencia_bancaria) : '',
    businessUnitId: String(apiAccount.id_pessoa),
    personName: apiAccount.nome_pessoa || '',
    showInDashboard: apiAccount.dashboard,
    dashboard: apiAccount.dashboard, // Adicionar campo dashboard
    status: apiAccount.status, // Adicionar campo status
    startDate: new Date(apiAccount.dt_ini_conc_bco),
    accountingAccount: String(apiAccount.id_conta_contabil),
    paymentMethods,
    createdAt: new Date(apiAccount.created_at),
    updatedAt: new Date(apiAccount.updated_at),
  } as CashAccount & { dashboard: boolean, status: boolean }
}

/**
 * Converte dados internos para o formato da API
 */
const mapCashAccountToApi = (
  account: Omit<CashAccount, 'id' | 'createdAt' | 'updatedAt'>
): CreateCashAccountDto => {
  const pessoaId = Number(account.businessUnitId)
  const agenciaBancariaId = (account.bankAgencyId && account.bankAgencyId !== 'none')
    ? (Number(account.bankAgencyId) || null)
    : null
  const contaContabilId = Number(account.accountingAccount) || 9 // Padrão 9

  // Validação: garantir que id_pessoa é um número válido
  if (!pessoaId || isNaN(pessoaId)) {
    console.error('[mapCashAccountToApi] ID da pessoa inválido:', {
      businessUnitId: account.businessUnitId,
      pessoaId,
      type: typeof account.businessUnitId
    })
    throw new Error(`ID da pessoa inválido: ${account.businessUnitId}`)
  }

  // Formatar data para ISO string
  const dataInicio = account.startDate
    ? new Date(account.startDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  // Converter IDs das formas de pagamento de string[] para number[]
  const formasPagamento = account.paymentMethods
    ? account.paymentMethods.map(id => Number(id)).filter(id => !isNaN(id))
    : []

  // Limpar e converter o valor (pode vir como "R$ 1.000,00" ou "1000.00")
  const saldoInicialLimpo = typeof account.value === 'string'
    ? account.value.replace(/[^\d,-]/g, '').replace(',', '.')
    : String(account.value)
  const saldoInicial = parseFloat(saldoInicialLimpo) || 0

  const dto = {
    conta: account.account,
    id_agencia_bancaria: agenciaBancariaId,
    id_pessoa: pessoaId,
    dt_ini_conc_bco: dataInicio,
    saldo_inicial: saldoInicial.toFixed(2),
    dashboard: account.showInDashboard || false,
    status: true,
    id_conta_contabil: contaContabilId,
    formas_pagamento: formasPagamento,
  }

  console.log('[mapCashAccountToApi] DTO criado:', dto)
  return dto
}

/**
 * Busca todas as contas caixa com paginação
 */
export const getAllCashAccounts = async (
  page: number = 1,
  perPage?: number,
  search?: string
): Promise<CashAccount[]> => {
  try {
    // Construir URL com parâmetros
    // Se perPage não for passado, usa limit= (sem valor) para puxar todos
    let url = perPage ? `/contas-caixa?page=${page}&per_page=${perPage}` : `/contas-caixa?limit=`

    // Adicionar parâmetro de busca se fornecido
    if (search && search.trim()) {
      url += `${url.includes('?') ? '&' : '?'}search=${encodeURIComponent(search.trim())}`
    }

    const response = await httpClient.get<ApiCashAccountListResponse>(url)

    // Mapear contas
    return response.data.map(mapApiToCashAccount)
  } catch (error) {
    console.error('Erro ao obter contas caixa:', error)
    const message = extractErrorMessage(error)
    throw new Error(message)
  }
}

export const getActiveCashAccounts = async (options?: {
  idEmissor?: number | null
  natureza?: 'entrada' | 'saida' | null
}): Promise<CashAccount[]> => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.set('limit', '')
    queryParams.set('status', '1')
    if (options?.idEmissor) {
      queryParams.set('id_emissor', String(options.idEmissor))
    }
    if (options?.natureza) {
      queryParams.set('natureza', options.natureza)
    }

    const response = await httpClient.get<ApiCashAccountListResponse>(`/contas-caixa?${queryParams.toString()}`)
    return response.data.map(mapApiToCashAccount)
  } catch (error) {
    console.error('Erro ao obter contas caixa ativas:', error)
    const message = extractErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Busca conta caixa por ID
 */
export const getCashAccountById = async (id: string): Promise<CashAccount | null> => {
  try {
    const response = await httpClient.get<ApiCashAccount>(`/contas-caixa/${id}`)
    // A API pode retornar diretamente o objeto ou dentro de { data }
    const apiAccount = (response as unknown as Record<string, unknown>).data || response
    return mapApiToCashAccount(apiAccount as ApiCashAccount)
  } catch (error) {
    console.error('Erro ao obter conta caixa:', error)
    const message = extractErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Adiciona uma nova conta caixa
 */
export const addCashAccount = async (
  account: Omit<CashAccount, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const dto = mapCashAccountToApi(account)
    console.log('[addCashAccount] Enviando:', dto)
    const response = await httpClient.post<ApiCashAccount>('/contas-caixa', dto)
    console.log('[addCashAccount] Resposta recebida:', response)

    // A API pode retornar diretamente o objeto ou dentro de { data }
    const accountData = (response as unknown as Record<string, unknown>).data || response
    return String((accountData as ApiCashAccount).id_conta_caixa)
  } catch (error) {
    console.error('Erro ao adicionar conta caixa:', error)
    const message = extractErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Atualiza uma conta caixa existente
 */
export const updateCashAccount = async (
  id: string,
  account: Partial<Omit<CashAccount, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const dto: UpdateCashAccountDto = {}

    if (account.account) dto.conta = account.account
    if (account.bankAgencyId !== undefined)
      dto.id_agencia_bancaria = account.bankAgencyId ? Number(account.bankAgencyId) : null
    if (account.businessUnitId) dto.id_pessoa = Number(account.businessUnitId)
    if (account.startDate)
      dto.dt_ini_conc_bco = new Date(account.startDate).toISOString().split('T')[0]
    if (account.value !== undefined) {
      // Limpar e converter o valor (pode vir como "R$ 1.000,00" ou "1000.00")
      const saldoInicialLimpo = typeof account.value === 'string'
        ? account.value.replace(/[^\d,-]/g, '').replace(',', '.')
        : String(account.value)
      const saldoInicial = parseFloat(saldoInicialLimpo) || 0
      dto.saldo_inicial = saldoInicial.toFixed(2)
    }
    if (account.showInDashboard !== undefined) dto.dashboard = account.showInDashboard
    if (account.accountingAccount) dto.id_conta_contabil = Number(account.accountingAccount)
    if (account.paymentMethods !== undefined) {
      dto.formas_pagamento = account.paymentMethods.map(id => Number(id)).filter(id => !isNaN(id))
    }

    console.log('[updateCashAccount] Enviando:', dto)
    await httpClient.put(`/contas-caixa/${id}`, dto)
  } catch (error) {
    console.error('Erro ao atualizar conta caixa:', error)
    const message = extractErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Exclui uma conta caixa
 */
export const deleteCashAccount = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/contas-caixa/${id}`)
  } catch (error) {
    console.error('Erro ao excluir conta caixa:', error)
    const message = extractErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Busca contas por termo de pesquisa (filtra no frontend)
 * NOTA: A API não suporta busca livre
 */
export const searchCashAccounts = async (searchTerm: string, page: number = 1, perPage?: number): Promise<CashAccount[]> => {
  const allAccounts = await getAllCashAccounts(page, perPage)
  const lowerSearch = searchTerm.toLowerCase()
  return allAccounts.filter(acc =>
    acc.account?.toLowerCase().includes(lowerSearch) ||
    acc.code?.toLowerCase().includes(lowerSearch)
  )
}

/**
 * Busca contas por unidade de negócio
 */
export const getCashAccountsByBusinessUnit = async (
  businessUnitId: string,
  page: number = 1,
  perPage?: number
): Promise<CashAccount[]> => {
  try {
    // Se perPage não for passado, usa limit= (sem valor) para puxar todos
    const url = perPage
      ? `/contas-caixa?id_unidade_negocio=${businessUnitId}&page=${page}&per_page=${perPage}`
      : `/contas-caixa?id_unidade_negocio=${businessUnitId}&limit=`
    const response = await httpClient.get<ApiCashAccountListResponse>(url)
    return response.data.map(mapApiToCashAccount)
  } catch (error) {
    console.error(`Erro ao obter contas da unidade ${businessUnitId}:`, error)
    throw error
  }
}

/**
 * Interface para resposta do saldo da conta caixa
 */
export interface CashAccountBalance {
  id_conta_caixa: number
  conta: string
  saldo_inicial: string
  data_consulta: string
  saldo_na_data: string
  saldo_atual: string
  diferenca: string
}

/**
 * Busca saldo da conta caixa
 */
export const getCashAccountBalance = async (id: string): Promise<CashAccountBalance> => {
  try {
    const response = await httpClient.get<CashAccountBalance>(`/contas-caixa/${id}/saldo`)
    // A API pode retornar diretamente o objeto ou dentro de { data }
    const balanceData = (response as unknown as Record<string, unknown>).data || response
    return balanceData as CashAccountBalance
  } catch (error) {
    console.error('Erro ao obter saldo da conta caixa:', error)
    throw error
  }
}

/**
 * Interface para forma de pagamento da conta caixa
 */
export interface CashAccountPaymentMethod {
  id: number
  id_forma_pgto: number
  forma_pagamento_nome: string
  dt_vencimento: number | null
  corte: number | null
  complemento: string | null
  status: boolean
  created_at: string
}

/**
 * Interface para adicionar forma de pagamento
 */
export interface AddPaymentMethodDto {
  id_forma_pgto: number
  dt_vencimento?: number
  corte?: number
  complemento?: string
}

/**
 * Lista formas de pagamento da conta caixa
 * GET /api/contas-caixa/{id}/formas-pagamento
 */
export const getCashAccountPaymentMethods = async (
  accountId: string
): Promise<CashAccountPaymentMethod[]> => {
  try {
    const response = await httpClient.get<{ data: CashAccountPaymentMethod[] }>(
      `/contas-caixa/${accountId}/formas-pagamento`
    )
    return response.data
  } catch (error) {
    console.error('Erro ao obter formas de pagamento da conta caixa:', error)
    throw error
  }
}

/**
 * Adiciona forma de pagamento à conta caixa
 * POST /api/contas-caixa/{id}/formas-pagamento
 */
export const addPaymentMethodToCashAccount = async (
  accountId: string,
  data: AddPaymentMethodDto
): Promise<{ message: string; id: number }> => {
  try {
    const response = await httpClient.post<{ message: string; id: number }>(
      `/contas-caixa/${accountId}/formas-pagamento`,
      data
    )
    return response
  } catch (error) {
    console.error('Erro ao adicionar forma de pagamento à conta caixa:', error)
    throw error
  }
}

/**
 * Remove forma de pagamento da conta caixa
 * DELETE /api/contas-caixa/{id}/formas-pagamento/{formaPgtoId}
 */
export const removePaymentMethodFromCashAccount = async (
  accountId: string,
  paymentMethodId: number
): Promise<{ message: string }> => {
  try {
    const response = await httpClient.delete<{ message: string }>(
      `/contas-caixa/${accountId}/formas-pagamento/${paymentMethodId}`
    )
    return response
  } catch (error) {
    console.error('Erro ao remover forma de pagamento da conta caixa:', error)
    throw error
  }
}
