/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from '@/lib/http-client'
import type {
  ApiAccountingAccount,
  ApiAccountingAccountListResponse,
  CreateAccountingAccountDto,
  UpdateAccountingAccountDto
} from '@/types/api'
import type { AccountingAccount } from '@/types/types'

/**
 * Converte dados da API para o formato interno da aplicação
 */
const mapApiToAccountingAccount = (apiAccount: ApiAccountingAccount): AccountingAccount => {
  // Determinar o tipo da conta baseado no campo 'tipo'
  // S = Sintética, A = Analítica
  const accountType = apiAccount.tipo === 'A' ? 'analitica' : 'sintetica'

  // Determinar a natureza baseado no campo 'natureza'
  // 1 = Devedora, 2 = Credora
  const accountNature = apiAccount.natureza === 1 ? 'devedora' : 'credora'

  // Determinar o regime tributário baseado no campo 'regime_tributario'
  // 1 = Normal, 2 = Simplificado
  const taxRegime = apiAccount.regime_tributario === 1 ? 'normal' : 'simplified'

  return {
    id: String(apiAccount.id_conta_contabil),
    code: apiAccount.codigo,
    description: apiAccount.descricao,
    parentAccountCode: apiAccount.conta_superior || '',
    parentAccountId: '', // Será preenchido posteriormente se necessário
    taxRegime,
    accountType,
    accountNature,
    isActive: apiAccount.status,
    startDate: new Date(apiAccount.dt_ini),
    guidelines: apiAccount.orientacoes || '',
    integrationId: apiAccount.id_integracao,
    exibirLancamentos: apiAccount.exibir_lancamentos ?? true,
  }
}

/**
 * Busca todas as contas contábeis
 */
export const getAllAccountingAccounts = async (): Promise<AccountingAccount[]> => {
  try {
    // Usa limit= (sem valor) para puxar todos os registros
    const url = `/contas-contabeis?limit=`
    const response = await httpClient.get<ApiAccountingAccountListResponse>(url)

    console.log('Response from API:', response)

    // A resposta pode vir como { data: [...] } ou diretamente como [...]
    const data = (response as any).data || response

    console.log('Data to map:', data)

    if (Array.isArray(data)) {
      return data.map(mapApiToAccountingAccount)
    }

    // Se a resposta vier no formato { data: [...], pagination: {...} }
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(mapApiToAccountingAccount)
    }

    console.error('Formato inesperado da resposta:', data)
    return []
  } catch (error) {
    console.error('Erro ao obter contas contábeis:', error)
    throw error
  }
}

/**
 * Busca apenas contas contábeis analíticas (tipo='A')
 * Para uso em dropdowns de seleção de conta contábil
 */
export const getAnalyticAccountingAccounts = async (): Promise<AccountingAccount[]> => {
  try {
    const response = await httpClient.get<ApiAccountingAccountListResponse>('/contas-contabeis/analiticas')
    const data = (response as any).data || response

    if (Array.isArray(data)) {
      return data.map(mapApiToAccountingAccount)
    }

    if (data.data && Array.isArray(data.data)) {
      return data.data.map(mapApiToAccountingAccount)
    }

    console.error('Formato inesperado da resposta (analíticas):', data)
    return []
  } catch (error) {
    console.error('Erro ao obter contas contábeis analíticas:', error)
    throw error
  }
}

/**
 * Busca conta contábil por ID
 */
export const getAccountingAccountById = async (id: string): Promise<AccountingAccount | null> => {
  try {
    const response = await httpClient.get<ApiAccountingAccount>(`/contas-contabeis/${id}`)
    const apiAccount = (response as any).data || response
    return mapApiToAccountingAccount(apiAccount)
  } catch (error) {
    console.error('Erro ao obter conta contábil:', error)
    throw error
  }
}

/**
 * Busca conta contábil por código
 */
export const getAccountingAccountByCode = async (code: string): Promise<AccountingAccount | null> => {
  try {
    // Buscar todas as contas e filtrar pelo código
    const accounts = await getAllAccountingAccounts()
    const account = accounts.find(acc => acc.code === code)
    return account || null
  } catch (error) {
    console.error('Erro ao buscar conta contábil por código:', error)
    throw error
  }
}

/**
 * Cria uma nova conta contábil
 */
export const createAccountingAccount = async (data: AccountingAccount): Promise<AccountingAccount> => {
  try {
    const apiData: CreateAccountingAccountDto = {
      codigo: data.code,
      descricao: data.description,
      conta_superior: data.parentAccountCode || null,
      regime_tributario: data.taxRegime === 'normal' ? 1 : 2,
      tipo: data.accountType === 'analitica' ? 'A' : 'S',
      natureza: data.accountNature === 'devedora' ? 1 : 2,
      dt_ini: data.startDate.toISOString().split('T')[0],
      orientacoes: data.guidelines || '',
      status: data.isActive,
      id_integracao: data.integrationId ?? null,
    }

    const response = await httpClient.post<ApiAccountingAccount>('/contas-contabeis', apiData)
    const apiAccount = (response as any).data || response
    return mapApiToAccountingAccount(apiAccount)
  } catch (error) {
    console.error('Erro ao criar conta contábil:', error)
    throw error
  }
}

/**
 * Atualiza uma conta contábil
 */
export const updateAccountingAccount = async (id: string, data: AccountingAccount): Promise<AccountingAccount> => {
  try {
    const apiData: UpdateAccountingAccountDto = {
      codigo: data.code,
      descricao: data.description,
      conta_superior: data.parentAccountCode || null,
      regime_tributario: data.taxRegime === 'normal' ? 1 : 2,
      tipo: data.accountType === 'analitica' ? 'A' : 'S',
      natureza: data.accountNature === 'devedora' ? 1 : 2,
      dt_ini: data.startDate.toISOString().split('T')[0],
      orientacoes: data.guidelines || '',
      status: data.isActive,
      id_integracao: data.integrationId ?? null,
    }

    const response = await httpClient.put<ApiAccountingAccount>(`/contas-contabeis/${id}`, apiData)
    const apiAccount = (response as any).data || response
    return mapApiToAccountingAccount(apiAccount)
  } catch (error) {
    console.error('Erro ao atualizar conta contábil:', error)
    throw error
  }
}

/**
 * Alterna o flag exibir_lancamentos de uma conta contábil
 */
export const toggleExibirLancamentos = async (id: string, value: boolean): Promise<void> => {
  try {
    await httpClient.put(`/contas-contabeis/${id}`, { exibir_lancamentos: value })
  } catch (error) {
    console.error('Erro ao atualizar exibir_lancamentos:', error)
    throw error
  }
}

/**
 * Deleta uma conta contábil
 */
export const deleteAccountingAccount = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/contas-contabeis/${id}`)
  } catch (error) {
    console.error('Erro ao deletar conta contábil:', error)
    throw error
  }
}
