import { httpClient } from '@/lib/http-client'
import type {
  ApiPaymentMethod,
  ApiPaymentMethodListResponse,
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto
} from '@/types/api'
import type { PaymentMethod } from '@/types/types'

/**
 * Converte dados da API para o formato interno da aplicação
 */
const mapApiToPaymentMethod = (apiMethod: ApiPaymentMethod): PaymentMethod => {
  const method: PaymentMethod = {
    id: String(apiMethod.id_forma_pgto),
    name: apiMethod.nome,
    tipo: (apiMethod as any).tipo ?? 'a_vista',
    description: apiMethod.descricao || '',
    active: apiMethod.status,
    id_conta_caixa_pagamento: (apiMethod as any).id_conta_caixa_pagamento ?? null,
    createdAt: new Date(apiMethod.created_at),
    updatedAt: new Date(apiMethod.updated_at),
  }
  if ((apiMethod as any).operadora !== undefined)      method.operadora      = (apiMethod as any).operadora
  if ((apiMethod as any).dia_fechamento !== undefined) method.dia_fechamento = (apiMethod as any).dia_fechamento
  if ((apiMethod as any).dia_vencimento !== undefined) method.dia_vencimento = (apiMethod as any).dia_vencimento
  if ((apiMethod as any).limite_credito !== undefined) method.limite_credito = (apiMethod as any).limite_credito
  return method
}

/**
 * Converte dados internos para o formato da API
 */
const mapPaymentMethodToApi = (method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): CreatePaymentMethodDto => {
  const dto: CreatePaymentMethodDto = {
    nome: method.name,
    descricao: method.description || undefined,
    status: method.active,
    tipo: method.tipo ?? 'a_vista',
    id_conta_caixa_pagamento: method.id_conta_caixa_pagamento ?? null,
  }
  if (method.tipo === 'fatura') {
    Object.assign(dto, {
      operadora:      method.operadora ?? null,
      dia_fechamento: method.dia_fechamento ?? null,
      dia_vencimento: method.dia_vencimento ?? null,
      limite_credito: method.limite_credito ?? null,
    })
  }
  return dto
}

/**
 * Busca todas as formas de pagamento com suporte a busca
 */
export const getAllPaymentMethods = async (
  page: number = 1,
  perPage?: number,
  search?: string
): Promise<PaymentMethod[]> => {
  try {
    // Se perPage não for passado, usa limit= (sem valor) para puxar todos
    let url = perPage ? `/formas-pagamento?page=${page}&per_page=${perPage}` : `/formas-pagamento?limit=`

    // Adicionar parâmetro de busca se fornecido
    if (search && search.trim()) {
      url += `${url.includes('?') ? '&' : '?'}search=${encodeURIComponent(search.trim())}`
    }

    const response = await httpClient.get<ApiPaymentMethodListResponse>(url)

    return response.data.map(mapApiToPaymentMethod)
  } catch (error) {
    console.error('Erro ao obter formas de pagamento:', error)
    throw error
  }
}

/**
 * Busca forma de pagamento por ID
 */
export const getPaymentMethodById = async (id: string): Promise<PaymentMethod | null> => {
  try {
    const response = await httpClient.get<ApiPaymentMethod>(`/formas-pagamento/${id}`)
    const apiMethod = (response as unknown as Record<string, unknown>).data || response
    return mapApiToPaymentMethod(apiMethod as ApiPaymentMethod)
  } catch (error) {
    console.error('Erro ao obter forma de pagamento:', error)
    throw error
  }
}

/**
 * Cria nova forma de pagamento
 */
export const addPaymentMethod = async (
  method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PaymentMethod> => {
  try {
    const dto = mapPaymentMethodToApi(method)
    const response = await httpClient.post<ApiPaymentMethod>('/formas-pagamento', dto)
    const apiMethod = (response as unknown as Record<string, unknown>).data || response
    return mapApiToPaymentMethod(apiMethod as ApiPaymentMethod)
  } catch (error) {
    console.error('Erro ao criar forma de pagamento:', error)
    throw error
  }
}

/**
 * Atualiza forma de pagamento existente
 */
export const updatePaymentMethod = async (
  id: string,
  method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PaymentMethod> => {
  try {
    const dto: UpdatePaymentMethodDto = mapPaymentMethodToApi(method)

    const response = await httpClient.put<ApiPaymentMethod>(`/formas-pagamento/${id}`, dto)
    const apiMethod = (response as unknown as Record<string, unknown>).data || response
    return mapApiToPaymentMethod(apiMethod as ApiPaymentMethod)
  } catch (error) {
    console.error('Erro ao atualizar forma de pagamento:', error)
    throw error
  }
}

export const getPaymentMethodsByAccount = async (
  accountId: string,
  options?: { idEmissor?: number | null; idOperacao?: number | null; natureza?: 'entrada' | 'saida' | null }
): Promise<PaymentMethod[]> => {
  try {
    const queryParams = new URLSearchParams()
    if (options?.idEmissor) {
      queryParams.set('id_emissor', String(options.idEmissor))
    }
    if (options?.idOperacao !== undefined && options.idOperacao !== null) {
      queryParams.set('id_operacao', String(options.idOperacao))
    }
    if (options?.natureza) {
      queryParams.set('natureza', options.natureza)
    }

    const suffix = queryParams.toString() ? `?${queryParams.toString()}` : ''

    const response = await httpClient.get<{data: Array<{
      id: number | string; // ID da relação FormaPgtoContaCaixa (usado para id_forma_pgto_conta_caixa)
      id_forma_pgto: number | null;
      forma_pagamento_nome: string;
      tipo?: string;
      status: boolean;
      operadora?: string;
      limite_credito?: string | number;
      dia_fechamento?: number;
      dia_vencimento?: number;
      id_operacao?: number | null;
      saldo?: string | number;
      is_saldo_admto?: boolean;
    }>}>(`/contas-caixa/${accountId}/formas-pagamento${suffix}`)

    return response.data.map(item => ({
      id: String(item.id), // ID da relação FormaPgtoContaCaixa
      idFormaPgto: item.id_forma_pgto !== null ? String(item.id_forma_pgto) : undefined, // ID real da forma de pagamento
      name: item.forma_pagamento_nome,
      tipo: item.is_saldo_admto ? 'a_vista' : ((item.tipo as any) ?? 'a_vista'),
      isSaldoAdmto: item.is_saldo_admto ?? false,
      saldoAdmtoIdOperacao: item.id_operacao ?? null,
      saldoAdmtoValor: item.saldo !== undefined ? Number(item.saldo) : null,
      permutadoTipo: item.is_saldo_admto ? (item.id_operacao === null ? 1 : 2) : null,
      description: item.is_saldo_admto ? 'Saldo de adiantamento' : '',
      active: item.status,
      operadora: item.operadora ?? null,
      limite_credito: item.limite_credito ? Number(item.limite_credito) : null,
      dia_fechamento: item.dia_fechamento ?? null,
      dia_vencimento: item.dia_vencimento ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  } catch (error) {
    console.error('Erro ao obter formas de pagamento por conta:', error)
    throw error
  }
}

/**
 * Deleta forma de pagamento
 */
export const deletePaymentMethod = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/formas-pagamento/${id}`)
  } catch (error) {
    console.error('Erro ao deletar forma de pagamento:', error)
    throw error
  }
}

/**
 * Busca todas as formas de pagamento das contas caixa para mapeamento nos lançamentos
 */
export const getAllPaymentMethodsContaCaixa = async (): Promise<{ id: string, name: string }[]> => {
  try {
    // Buscar todas as contas caixa primeiro
    const contasCaixaResponse = await httpClient.get<{data: any[]}>('/contas-caixa?limit=')
    const contasCaixa = (contasCaixaResponse as any).data || contasCaixaResponse || []
    
    // Buscar formas de pagamento para cada conta caixa
    const allPaymentMethods: { id: string, name: string }[] = []
    
    for (const conta of contasCaixa) {
      try {
        const response = await httpClient.get<any>(`/contas-caixa/${conta.id_conta_caixa}/formas-pagamento`)
        const methods = (response as any).data || response || []
        
        for (const method of methods) {
          allPaymentMethods.push({
            id: String(method.id), // id_forma_pgto_conta_caixa
            name: method.forma_pagamento_nome || method.nome || 'Sem nome'
          })
        }
      } catch (error) {
        console.warn(`Erro ao buscar formas de pagamento para conta ${conta.id_conta_caixa}:`, error)
      }
    }
    
    return allPaymentMethods
  } catch (error) {
    console.error('Erro ao obter formas de pagamento das contas caixa:', error)
    return []
  }
}
