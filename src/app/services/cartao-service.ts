import { httpClient } from '@/lib/http-client'
import type { Cartao } from '@/types/types'

interface ApiCartao {
  id_cartao: number
  apelido: string
  operadora?: string | null
  dia_fechamento?: number | null
  dia_vencimento?: number | null
  limite_credito?: number | null
  id_conta_caixa_pagamento?: number | null
  id_conta_contabil_passivo?: number | null
  id_un_negocio?: number | null
  status: boolean
  id_operador: number
  created_at?: string
  updated_at?: string
}

const mapToCartao = (api: ApiCartao): Cartao => ({
  id_cartao:                 api.id_cartao,
  apelido:                   api.apelido,
  operadora:                 api.operadora ?? '',
  dia_fechamento:            api.dia_fechamento ?? 0,
  dia_vencimento:            api.dia_vencimento ?? 0,
  id_conta_caixa_pagamento:  api.id_conta_caixa_pagamento ?? 0,
  limite_credito:            api.limite_credito ?? 0,
  id_conta_contabil_passivo: api.id_conta_contabil_passivo ?? 0,
  id_un_negocio:             api.id_un_negocio ?? 0,
  status:                    api.status,
  created_at:                api.created_at,
  updated_at:                api.updated_at,
})

export const getAllCartoes = async (filters?: { page?: number; limit?: number; search?: string }): Promise<Cartao[]> => {
  const params = new URLSearchParams()
  if (filters?.page)   params.append('page', String(filters.page))
  if (filters?.limit)  params.append('limit', String(filters.limit))
  if (filters?.search) params.append('search', filters.search)

  const query = params.toString() ? `?${params}` : '?limit='
  const res = await httpClient.get<{ data: ApiCartao[] }>(`/cartoes${query}`)
  return res.data.map(mapToCartao)
}

export const getCartoesAtivos = async (): Promise<Cartao[]> => {
  const res = await httpClient.get<ApiCartao[]>('/cartoes/ativos')
  return res.map(mapToCartao)
}

export const getCartaoById = async (id: number): Promise<Cartao> => {
  const res = await httpClient.get<ApiCartao>(`/cartoes/${id}`)
  return mapToCartao(res)
}

export const createCartao = async (data: Omit<Cartao, 'id_cartao' | 'created_at' | 'updated_at'>): Promise<Cartao> => {
  const res = await httpClient.post<ApiCartao>('/cartoes', {
    apelido:                   data.apelido,
    operadora:                 data.operadora || null,
    dia_fechamento:            data.dia_fechamento || null,
    dia_vencimento:            data.dia_vencimento || null,
    limite_credito:            data.limite_credito || null,
    id_conta_caixa_pagamento:  data.id_conta_caixa_pagamento || null,
    id_conta_contabil_passivo: data.id_conta_contabil_passivo || null,
    id_un_negocio:             data.id_un_negocio || null,
    status:                    data.status,
  })
  return mapToCartao(res)
}

export const updateCartao = async (id: number, data: Partial<Omit<Cartao, 'id_cartao' | 'created_at' | 'updated_at'>>): Promise<Cartao> => {
  const res = await httpClient.put<ApiCartao>(`/cartoes/${id}`, data)
  return mapToCartao(res)
}

export const deleteCartao = async (id: number): Promise<void> => {
  await httpClient.delete(`/cartoes/${id}`)
}
