import { httpClient } from '@/lib/http-client'
import type {
  ApiFaturaCartao,
  ApiFaturaListResponse,
  ApiItemFatura,
  ApiCompraCartaoResult,
  ApiPagarFaturaResult,
} from '@/types/api'
import type {
  FaturaCartao,
  FaturaFilter,
  ItemFatura,
  CompraCartaoPayload,
  PagarFaturaPayload,
  FecharFaturaPayload,
  ImportResult,
} from '@/types/types'

const mapApiToFatura = (api: ApiFaturaCartao): FaturaCartao => ({
  id_fatura:         api.id_fatura,
  id_cartao:         api.id_cartao,
  cartao_apelido:    api.cartao_apelido ?? undefined,
  cartao_operadora:  api.cartao_operadora ?? undefined,
  competencia:       api.competencia,
  dt_fechamento:     api.dt_fechamento,
  dt_vencimento:     api.dt_vencimento,
  valor_total:       api.valor_total,
  valor_pago:        api.valor_pago,
  saldo_restante:    api.saldo_restante,
  status:            api.status as FaturaCartao['status'],
  id_lcto_pagamento: api.id_lcto_pagamento,
  id_un_negocio:     api.id_un_negocio,
  itens:             api.itens?.map(mapApiToItem),
  created_at:        api.created_at,
  updated_at:        api.updated_at,
})

const mapApiToItem = (api: ApiItemFatura): ItemFatura => ({
  id_item_fatura:  api.id_item_fatura,
  id_fatura:       api.id_fatura,
  id_lcto:         api.id_lcto,
  id_lcto_passivo: api.id_lcto_passivo,
  parcela_num:     api.parcela_num,
  parcela_total:   api.parcela_total,
  valor:           api.valor,
  status:          api.status as ItemFatura['status'],
  dt_conciliacao:  api.dt_conciliacao,
  descricao:       api.descricao ?? undefined,
  data_compra:     api.data_compra ?? undefined,
  numero_documento: api.numero_documento ?? undefined,
  created_at:      api.created_at,
})

export const getAllFaturas = async (filters?: FaturaFilter): Promise<FaturaCartao[]> => {
  try {
    const params = new URLSearchParams()
    if (filters?.page)         params.append('page', String(filters.page))
    if (filters?.limit)        params.append('limit', String(filters.limit))
    if (filters?.id_cartao)    params.append('id_cartao', String(filters.id_cartao))
    if (filters?.status)       params.append('status', filters.status)
    if (filters?.competencia)  params.append('competencia', String(filters.competencia))
    if (filters?.id_un_negocio) params.append('id_un_negocio', String(filters.id_un_negocio))

    const qs = params.toString()
    const response = await httpClient.get<ApiFaturaListResponse>(`/faturas-cartao${qs ? `?${qs}` : ''}`)
    return response.data.map(mapApiToFatura)
  } catch (error) {
    console.error('Erro ao obter faturas:', error)
    throw error
  }
}

export const getFaturaById = async (id: number): Promise<FaturaCartao> => {
  try {
    const response = await httpClient.get<ApiFaturaCartao>(`/faturas-cartao/${id}`)
    return mapApiToFatura(response)
  } catch (error) {
    console.error(`Erro ao obter fatura ${id}:`, error)
    throw error
  }
}

export const getItensFatura = async (idFatura: number): Promise<ItemFatura[]> => {
  try {
    const response = await httpClient.get<ApiItemFatura[]>(`/faturas-cartao/${idFatura}/itens`)
    return response.map(mapApiToItem)
  } catch (error) {
    console.error(`Erro ao obter itens da fatura ${idFatura}:`, error)
    throw error
  }
}

export const fecharFatura = async (payload: FecharFaturaPayload): Promise<{ id_fatura: number; valor_total: string; status: string }> => {
  try {
    const response = await httpClient.post<{ id_fatura: number; valor_total: string; status: string; message: string }>('/faturas-cartao/fechar', payload)
    return response
  } catch (error) {
    console.error('Erro ao fechar fatura:', error)
    throw error
  }
}

export const pagarFatura = async (idFatura: number, payload: PagarFaturaPayload): Promise<ApiPagarFaturaResult> => {
  try {
    const response = await httpClient.post<ApiPagarFaturaResult>(`/faturas-cartao/${idFatura}/pagar`, payload)
    return response
  } catch (error) {
    console.error(`Erro ao pagar fatura ${idFatura}:`, error)
    throw error
  }
}

export const estornarItem = async (idItem: number): Promise<{ tipo: string; mensagem: string }> => {
  try {
    const response = await httpClient.post<{ tipo: string; mensagem: string; message: string }>(`/faturas-cartao/itens/${idItem}/estornar`, {})
    return response
  } catch (error) {
    console.error(`Erro ao estornar item ${idItem}:`, error)
    throw error
  }
}

export const importarExtrato = async (idFatura: number, file: File): Promise<ImportResult> => {
  try {
    const formData = new FormData()
    formData.append('arquivo', file)
    const response = await httpClient.post<ImportResult>(`/faturas-cartao/${idFatura}/importar-extrato`, formData)
    return response
  } catch (error) {
    console.error(`Erro ao importar extrato da fatura ${idFatura}:`, error)
    throw error
  }
}

export const registrarCompraCartao = async (payload: CompraCartaoPayload): Promise<ApiCompraCartaoResult> => {
  try {
    const response = await httpClient.post<ApiCompraCartaoResult>('/compras-cartao', payload)
    return response
  } catch (error) {
    console.error('Erro ao registrar compra no cartão:', error)
    throw error
  }
}

/** Formata competência YYYYMM para exibição "MM/YYYY" */
export const formatCompetencia = (competencia: number): string => {
  const str = String(competencia)
  return `${str.slice(4, 6)}/${str.slice(0, 4)}`
}
