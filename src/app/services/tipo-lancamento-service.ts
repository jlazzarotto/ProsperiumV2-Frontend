import { httpClient } from '@/lib/http-client';
import type {
  ApiTipoLancamento,
  ApiTipoLancamentoListResponse,
  CreateTipoLancamentoDto,
  UpdateTipoLancamentoDto,
} from '@/types/api';

export interface TipoLancamento {
  id: number
  nome: string
  natureza: 1 | 2 // 1=Entrada, 2=Saída
  idContaContabil: number | null
  idContraPartida: number | null
  marcador: string | null
  nivel: number | null
  idPlanoConta: number
  idOperador: number
  descricao: string | null
  status: boolean
  createdAt: string
  updatedAt: string
}

export interface TipoLancamentoPagination {
  page: number
  limit: number | null
  total: number
}

export interface TipoLancamentoListResult {
  data: TipoLancamento[]
  pagination: TipoLancamentoPagination
}

const mapApi = (t: ApiTipoLancamento): TipoLancamento => ({
  id: t.id_tp_lcto,
  nome: t.nome,
  natureza: t.natureza as 1 | 2,
  idContaContabil: t.id_conta_contabil,
  idContraPartida: t.id_contra_partida,
  marcador: t.marcador,
  nivel: t.nivel,
  idPlanoConta: t.id_plano_conta,
  idOperador: t.id_operador,
  descricao: t.descricao,
  status: t.status,
  createdAt: t.created_at,
  updatedAt: t.updated_at,
})

export const getTiposLancamento = async (
  page = 1,
  limit: number | null = 10,
  search = ''
): Promise<TipoLancamentoListResult> => {
  const params: Record<string, string | number> = { page }
  if (limit !== null) params.limit = limit
  if (search) params.search = search

  const response = await httpClient.get<ApiTipoLancamentoListResponse>('/tipos-lancamento', { params })
  const res = response as unknown as ApiTipoLancamentoListResponse
  return {
    data: res.data.map(mapApi),
    pagination: {
      page: res.pagination.current_page ?? page,
      limit: res.pagination.per_page ?? limit,
      total: res.pagination.total,
    },
  }
}

export const getTipoLancamentoById = async (id: number): Promise<TipoLancamento> => {
  const response = await httpClient.get<ApiTipoLancamento>(`/tipos-lancamento/${id}`)
  return mapApi(response as unknown as ApiTipoLancamento)
}

export const createTipoLancamento = async (dto: CreateTipoLancamentoDto): Promise<{ id: number }> => {
  const response = await httpClient.post<{ message: string; id: number }>('/tipos-lancamento', dto)
  return response as unknown as { id: number }
}

export const updateTipoLancamento = async (id: number, dto: UpdateTipoLancamentoDto): Promise<void> => {
  await httpClient.put(`/tipos-lancamento/${id}`, dto)
}

export const deleteTipoLancamento = async (id: number): Promise<void> => {
  await httpClient.delete(`/tipos-lancamento/${id}`)
}

export const getTiposLancamentoAtivos = async (): Promise<TipoLancamento[]> => {
  const response = await httpClient.get<{ data: ApiTipoLancamento[] }>('/tipos-lancamento/ativos')
  const res = response as unknown as { data: ApiTipoLancamento[] }
  return res.data.map(mapApi)
}
