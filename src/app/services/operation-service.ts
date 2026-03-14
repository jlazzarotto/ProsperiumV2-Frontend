/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from '@/lib/http-client'
import { GlobalToastHttpClient } from '@/lib/global-toast'
import type { ApiOperation, ApiOperationListResponse } from '@/types/api'
import type { Operation } from '@/types/types'

/**
 * Mapeia dados da API para o formato interno da aplicação
 */
const mapApiToOperation = (apiOperation: ApiOperation): Operation => {
  return {
    id: String(apiOperation.id_operacao),
    code: String(apiOperation.id_operacao),
    operationLabel: apiOperation.operacao_label || undefined,
    description: apiOperation.descricao,
    shipId: String(apiOperation.id_navio),
    shipName: apiOperation.navio_nome || '',
    voyage: apiOperation.viagem,
    businessUnitId: String(apiOperation.id_un_negocio),
    clientId: String(apiOperation.id_cliente),
    clientBusinessUnitId: "",
    portId: String(apiOperation.id_porto),
    startDate: new Date(apiOperation.dt_inicio),
    endDate: apiOperation.dt_final ? new Date(apiOperation.dt_final) : null,
    tons: typeof apiOperation.tons === 'string' ? parseFloat(apiOperation.tons) : apiOperation.tons,
    status: apiOperation.status,
    // Campos que serão preenchidos posteriormente com dados relacionados
    portName: '',
    clientName: '',
    businessUnitName: '',
    // LÓGICA CORRETA: encerrada é diferente de dt_final
    billed: false,
    billedAt: null,
    closedAt: apiOperation.encerrada ? new Date(apiOperation.encerrada) : null, // Data real de encerramento
    createdAt: apiOperation.created_at ? new Date(apiOperation.created_at) : undefined,
    updatedAt: apiOperation.updated_at ? new Date(apiOperation.updated_at) : undefined,
  }
}

/**
 * Mapeia dados internos para o formato da API
 */
const mapOperationToApi = (operation: Partial<Operation>): any => {
  const apiData: any = {}

  if (operation.description !== undefined) apiData.descricao = operation.description
  if (operation.shipId !== undefined) apiData.id_navio = Number(operation.shipId)
  if (operation.voyage !== undefined) apiData.viagem = operation.voyage
  if (operation.businessUnitId !== undefined) apiData.id_un_negocio = Number(operation.businessUnitId)
  if (operation.clientId !== undefined) apiData.id_cliente = Number(operation.clientId)
  if (operation.clientBusinessUnitId !== undefined) apiData.id_negocio_cliente = Number(operation.clientBusinessUnitId)
  if (operation.portId !== undefined) apiData.id_porto = Number(operation.portId)
  if (operation.startDate !== undefined && operation.startDate !== null) {
    const date = operation.startDate instanceof Date ? operation.startDate : new Date(operation.startDate)
    const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0')
    apiData.dt_inicio = `${y}-${m}-${d} 00:00:00`
  }
  if (operation.endDate !== undefined && operation.endDate !== null) {
    const date = operation.endDate instanceof Date ? operation.endDate : new Date(operation.endDate)
    const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0')
    apiData.dt_final = `${y}-${m}-${d} 00:00:00`
  }
  if (operation.tons !== undefined) apiData.tons = operation.tons
  // Garantir que status seja sempre um integer (1 para ativo, 0 para inativo)
  if (operation.status !== undefined) {
    apiData.status = operation.status === true || operation.status === 1 ? 1 : 0
  }

  return apiData
}

/**
 * Busca todas as operações
 */
export const getAllOperations = async (): Promise<Operation[]> => {
  try {
    const response = await httpClient.get<ApiOperationListResponse>('/operacoes')

    // A resposta pode vir como { data: [...] } ou diretamente como [...]
    const data = (response as any).data || response

    if (Array.isArray(data)) {
      return data.map(mapApiToOperation)
    }

    // Se a resposta vier no formato { data: [...], pagination: {...} }
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(mapApiToOperation)
    }

    console.error('Formato inesperado da resposta:', data)
    return []
  } catch (error: any) {
    console.error('Erro ao obter operações:', error)
    
    // Log do erro para debug
    if (error?.response?.data) {
      console.error('Erro da API:', error.response.data)
    }
    
    throw error
  }
}

/**
 * Busca operação por ID
 */
export const getOperationById = async (id: string): Promise<Operation | null> => {
  try {
    const response = await httpClient.get<ApiOperation>(`/operacoes/${id}`)
    const apiOperation = (response as any).data || response
    return mapApiToOperation(apiOperation)
  } catch (error) {
    console.error('Erro ao obter operação:', error)
    throw error
  }
}

/**
 * Cria uma nova operação
 */
export const createOperation = async (operationData: Omit<Operation, 'id' | 'code'>): Promise<Operation> => {
  try {
    // Validar campos obrigatórios
    if (!operationData.voyage) {
      throw new Error('O campo Viagem é obrigatório')
    }
    if (!operationData.shipId) {
      throw new Error('É necessário selecionar um Navio')
    }
    if (!operationData.portId) {
      throw new Error('É necessário selecionar um Porto')
    }
    if (!operationData.clientId) {
      throw new Error('É necessário selecionar um Cliente')
    }
    if (!operationData.businessUnitId) {
      throw new Error('É necessário selecionar uma Unidade de Negócio')
    }

    const apiData = mapOperationToApi(operationData)

    const response = await httpClient.post<ApiOperation>('/operacoes', apiData)
    const apiOperation = (response as any).data || response
    return mapApiToOperation(apiOperation)
  } catch (error) {
    console.error('Erro ao criar operação:', error)
    throw error
  }
}

/**
 * Atualiza uma operação
 */
export const updateOperation = async (id: string, operationData: Partial<Operation>): Promise<Operation> => {
  try {
    // Validar campos obrigatórios se estiverem presentes
    if (operationData.voyage === '') {
      throw new Error('O campo Viagem é obrigatório')
    }
    if (operationData.shipId === '') {
      throw new Error('É necessário selecionar um Navio')
    }
    if (operationData.portId === '') {
      throw new Error('É necessário selecionar um Porto')
    }
    if (operationData.clientId === '') {
      throw new Error('É necessário selecionar um Cliente')
    }
    if (operationData.businessUnitId === '') {
      throw new Error('É necessário selecionar uma Unidade de Negócio')
    }

    const apiData = mapOperationToApi(operationData)

    const response = await httpClient.put<ApiOperation>(`/operacoes/${id}`, apiData)
    const apiOperation = (response as any).data || response
    return mapApiToOperation(apiOperation)
  } catch (error) {
    console.error('Erro ao atualizar operação:', error)
    throw error
  }
}

/**
 * Deleta uma operação
 */
export const deleteOperation = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/operacoes/${id}`)
  } catch (error) {
    console.error('Erro ao deletar operação:', error)
    throw error
  }
}

/**
 * Pesquisa operações
 */
export const searchOperations = async (searchTerm: string): Promise<Operation[]> => {
  try {
    const response = await httpClient.get<ApiOperationListResponse>(`/operacoes?search=${encodeURIComponent(searchTerm)}`)
    const data = (response as any).data || response

    if (Array.isArray(data)) {
      return data.map(mapApiToOperation)
    }

    if (data.data && Array.isArray(data.data)) {
      return data.data.map(mapApiToOperation)
    }

    return []
  } catch (error) {
    console.error('Erro ao pesquisar operações:', error)
    throw error
  }
}

/**
 * Encerra uma operação
 */
export const closeOperation = async (id: string, dtEncerramento?: string): Promise<void> => {
  try {
    const body: any = {}

    // Se uma data foi fornecida, adicionar ao body (campo que o backend lê é 'encerrada')
    if (dtEncerramento) {
      body.encerrada = dtEncerramento
    }

    await httpClient.put(`/operacoes/${id}/encerrar`, body)
  } catch (error) {
    console.error('Erro ao encerrar operação:', error)
    throw error
  }
}

/**
 * Finaliza/Fatura uma operação
 */
export const billOperation = async (id: string, dtFinalizacao?: string): Promise<void> => {
  try {
    const body: any = {}

    // Se uma data foi fornecida, adicionar ao body
    if (dtFinalizacao) {
      body.dt_finalizacao = dtFinalizacao
    }

    await httpClient.put(`/operacoes/${id}/finalizar`, body)
  } catch (error) {
    console.error('Erro ao finalizar operação:', error)
    throw error
  }
}

/**
 * Reabre uma operação
 */
export const reopenOperation = async (id: string): Promise<void> => {
  try {
    await httpClient.put(`/operacoes/${id}/reabrir`)
  } catch (error) {
    console.error('Erro ao reabrir operação:', error)
    throw error
  }
}

// ========== VERSÕES COM TOASTERS AUTOMÁTICOS ==========

/**
 * Serviço de operações com toasters automáticos para erros e sucessos
 */
export const operationServiceWithToasts = {
  
  /**
   * Cria uma operação com toast automático
   */
  async create(data: Partial<Operation>) {
    return GlobalToastHttpClient.post('/operacoes', mapOperationToApi(data), {
      customSuccessMessage: 'Operação criada com sucesso!',
      customErrorMessage: 'Erro ao criar operação'
    })
  },

  /**
   * Atualiza uma operação com toast automático
   */
  async update(id: string, data: Partial<Operation>) {
    return GlobalToastHttpClient.put(`/operacoes/${id}`, mapOperationToApi(data), {
      customSuccessMessage: 'Operação atualizada com sucesso!',
      customErrorMessage: 'Erro ao atualizar operação'
    })
  },

  /**
   * Exclui uma operação com toast automático
   */
  async delete(id: string) {
    return GlobalToastHttpClient.delete(`/operacoes/${id}`, {
      customSuccessMessage: 'Operação excluída com sucesso!',
      customErrorMessage: 'Erro ao excluir operação'
    })
  },

  /**
   * Encerra uma operação com toast automático
   */
  async close(id: string, dtEncerramento?: string) {
    const body: any = {}
    if (dtEncerramento) {
      body.encerrada = dtEncerramento
    }

    return GlobalToastHttpClient.put(`/operacoes/${id}/encerrar`, body, {
      customSuccessMessage: 'Operação encerrada com sucesso!',
      customErrorMessage: 'Erro ao encerrar operação'
    })
  },

  /**
   * Reabre uma operação com toast automático
   */
  async reopen(id: string) {
    return GlobalToastHttpClient.put(`/operacoes/${id}/reabrir`, {}, {
      customSuccessMessage: 'Operação reaberta com sucesso!',
      customErrorMessage: 'Erro ao reabrir operação'
    })
  },

  /**
   * Lista operações (sem toast de sucesso, apenas erros)
   */
  async getAll() {
    return GlobalToastHttpClient.get('/operacoes', {
      showSuccess: false, // Não mostrar toast de sucesso para listagem
      showErrors: true,
      customErrorMessage: 'Erro ao carregar operações'
    })
  }
}

/**
 * Hook para usar o serviço de operações com toasters
 */
export function useOperationServiceWithToasts() {
  return operationServiceWithToasts
}
