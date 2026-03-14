/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from '@/lib/http-client'
import type { Transfer } from '@/types/types'

/**
 * Formato da API para transferências
 */
interface ApiTransfer {
  id_transferencia?: number
  codigo: number
  data: string
  valor: string
  origem: string
  destino: string
  descricao: string
  id_conta_origem: number
  id_conta_destino: number
  id_un_negocio?: number
  id_lancamento_origem?: number
  id_lancamento_destino?: number
  id_operador?: number
  status?: number
  created_at?: string
  updated_at?: string
}

interface ApiTransferListResponse {
  data: ApiTransfer[]
  pagination: {
    page: number
    limit: number | null
    total: number
    pages: number
  }
}

interface ApiTransferMutationResponse {
  success?: boolean
  error?: string
  message?: string
  id_transferencia?: number
}

/**
 * Converte dados da API para o formato interno
 */
const mapApiToTransfer = (apiTransfer: ApiTransfer): Transfer => {
  // Parse da data brasileira (dd/mm/yyyy) para Date
  const [dia, mes, ano] = apiTransfer.data.split('/')
  const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))

  return {
    id: apiTransfer.id_transferencia ? String(apiTransfer.id_transferencia) : String(apiTransfer.codigo),
    code: String(apiTransfer.codigo),
    originAccountId: String(apiTransfer.id_conta_origem),
    destinationAccountId: String(apiTransfer.id_conta_destino),
    value: apiTransfer.valor, // Já vem formatado da API
    description: apiTransfer.descricao,
    date: dataObj,
    transactionTypeId: '',
    businessUnitId: undefined, // Não usar mais unidade de negócio
    createdAt: apiTransfer.created_at ? new Date(apiTransfer.created_at) : new Date(),
    updatedAt: apiTransfer.updated_at ? new Date(apiTransfer.updated_at) : new Date(),
    // Adicionar campos extras para exibição
    origem: apiTransfer.origem,
    destino: apiTransfer.destino,
    // Campos dos lançamentos
    id_lancamento_origem: apiTransfer.id_lancamento_origem ? String(apiTransfer.id_lancamento_origem) : undefined,
    id_lancamento_destino: apiTransfer.id_lancamento_destino ? String(apiTransfer.id_lancamento_destino) : undefined,
  }
}

/**
 * Converte dados internos para o formato da API
 */
const mapTransferToApi = (transfer: Omit<Transfer, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => {
  // Converter valor de "R$ 1.500,00" para "1500.00" 
  let valorNumerico = 0
  if (transfer.value) {
    const cleanValue = transfer.value.toString()
      .replace('R$', '')
      .replace(/\./g, '') // Remove pontos de milhar
      .replace(',', '.') // Substitui vírgula decimal por ponto
      .trim()
    valorNumerico = Number.parseFloat(cleanValue)
  }

  // Formatar data para "YYYY-MM-DD HH:mm:ss"
  const date = transfer.date instanceof Date ? transfer.date : new Date(transfer.date)
  const dataFormatada = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`

  return {
    id_conta_origem: Number(transfer.originAccountId),
    id_conta_destino: Number(transfer.destinationAccountId),
    id_un_negocio: transfer.businessUnitId ? Number(transfer.businessUnitId) : 2,
    valor: valorNumerico.toFixed(2),
    descricao: transfer.description || '',
    data: dataFormatada,
  }
}

/**
 * Busca todas as transferências com paginação
 */
export const getAllTransfers = async (
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<{ data: Transfer[]; pagination: { page: number; perPage: number; total: number } }> => {
  try {
    const params: string[] = []
    if (perPage > 0) {
      params.push(`page=${page}`)
      params.push(`limit=${perPage}`)
    } else {
      // Buscar todos os registros
      params.push('limit=')
    }

    if (search) {
      params.push(`search=${encodeURIComponent(search)}`)
    }

    const url = `/transferencias?${params.join('&')}`
    const response = await httpClient.get<ApiTransferListResponse>(url)

    return {
      data: response.data.map(mapApiToTransfer),
      pagination: {
        page: response.pagination.page,
        perPage: response.pagination.limit || perPage,
        total: response.pagination.total
      }
    }
  } catch (error) {
    console.error('Erro ao obter transferências:', error)
    throw error
  }
}

/**
 * Busca transferência por ID
 */
export const getTransferById = async (id: string): Promise<Transfer | null> => {
  try {
    const response = await httpClient.get<{ data: ApiTransfer }>(`/transferencias/${id}`)
    return mapApiToTransfer(response.data)
  } catch (error) {
    console.error('Erro ao obter transferência:', error)
    throw error
  }
}

/**
 * Cria uma nova transferência
 */
export const addTransfer = async (
  transfer: Omit<Transfer, 'id' | 'code' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const dto = mapTransferToApi(transfer)
    console.log('[addTransfer] Enviando:', dto)
    const response = await httpClient.post<ApiTransferMutationResponse>('/transferencias', dto)
    console.log('[addTransfer] Resposta recebida:', response)

    if (response?.success === false) {
      throw new Error(response.error || response.message || 'Não foi possível gravar a transferência')
    }

    const transferData = (response as any).data || response

    if (!transferData?.id_transferencia) {
      throw new Error(transferData?.error || transferData?.message || 'Não foi possível gravar a transferência')
    }

    return String(transferData.id_transferencia)
  } catch (error) {
    console.error('Erro ao adicionar transferência:', error)
    throw error
  }
}

/**
 * Atualiza uma transferência existente
 */
export const updateTransfer = async (
  id: string,
  transfer: Partial<Omit<Transfer, 'id' | 'code' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    // Converter apenas os campos presentes
    const dto: Partial<Omit<ApiTransfer, 'id_transferencia' | 'created_at' | 'updated_at'>> = {}

    if (transfer.originAccountId) dto.id_conta_origem = Number(transfer.originAccountId)
    if (transfer.destinationAccountId) dto.id_conta_destino = Number(transfer.destinationAccountId)
    if (transfer.businessUnitId) dto.id_un_negocio = Number(transfer.businessUnitId)
    if (transfer.description !== undefined) dto.descricao = transfer.description

    if (transfer.value) {
      const valorNumerico = Number.parseFloat(
        transfer.value
          .replace('R$', '')
          .replace(/\./g, '')
          .replace(',', '.')
          .trim()
      )
      dto.valor = valorNumerico.toFixed(2)
    }

    if (transfer.date) {
      const date = transfer.date instanceof Date ? transfer.date : new Date(transfer.date)
      dto.data = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
    }

    const response = await httpClient.put<ApiTransferMutationResponse>(`/transferencias/${id}`, dto)

    if (response?.success === false) {
      throw new Error(response.error || response.message || 'Não foi possível atualizar a transferência')
    }
  } catch (error) {
    console.error('Erro ao atualizar transferência:', error)
    throw error
  }
}

/**
 * Exclui uma transferência
 */
export const deleteTransfer = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/transferencias/${id}`)
  } catch (error) {
    console.error('Erro ao excluir transferência:', error)
    throw error
  }
}

/**
 * Busca transferências por unidade de negócio
 */
export const getTransfersByBusinessUnit = async (
  businessUnitId: string,
  page: number = 1,
  limit: number = 200
): Promise<Transfer[]> => {
  try {
    const url = `/transferencias?id_un_negocio=${businessUnitId}&page=${page}&limit=${limit}`
    const response = await httpClient.get<ApiTransferListResponse>(url)
    return response.data.map(mapApiToTransfer)
  } catch (error) {
    console.error('Erro ao obter transferências por unidade de negócio:', error)
    throw error
  }
}

/**
 * Busca transferências com filtros
 */
export const searchTransfers = async (
  searchTerm?: string,
  businessUnitId?: string,
  page: number = 1,
  limit: number = 200
): Promise<Transfer[]> => {
  try {
    const params: string[] = []
    params.push(`page=${page}`)
    params.push(`limit=${limit}`)

    if (businessUnitId) {
      params.push(`id_un_negocio=${businessUnitId}`)
    }

    if (searchTerm) {
      params.push(`search=${encodeURIComponent(searchTerm)}`)
    }

    const url = `/transferencias?${params.join('&')}`
    const response = await httpClient.get<ApiTransferListResponse>(url)
    return response.data.map(mapApiToTransfer)
  } catch (error) {
    console.error('Erro ao pesquisar transferências:', error)
    throw error
  }
}
