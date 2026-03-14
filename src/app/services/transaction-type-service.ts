import { httpClient } from '@/lib/http-client';
import type {
  ApiTipoLancamento,
  CreateTipoLancamentoDto,
  UpdateTipoLancamentoDto,
} from '@/types/api';
import type { TransactionType } from '@/types/types';

interface ApiListResponse {
  data: ApiTipoLancamento[]
  pagination: { current_page: number; per_page: number | null; total: number }
}

const mapApi = (t: ApiTipoLancamento): TransactionType => ({
  id: String(t.id_tp_lcto),
  code: String(t.id_tp_lcto),
  description: t.nome,
  type: t.natureza === 1 ? 'entrada' : 'saida',
  taxRegime: 'todos',
  sourceAccountId: t.id_conta_contabil ? String(t.id_conta_contabil) : '',
  sourceAccountCode: t.id_conta_contabil ? String(t.id_conta_contabil) : '',
  targetAccountId: t.id_contra_partida ? String(t.id_contra_partida) : '',
  targetAccountCode: t.id_contra_partida ? String(t.id_contra_partida) : '',
  isActive: t.status,
  guidelines: t.descricao || '',
})

export const getAllTransactionTypes = async (
  page = 1,
  limit?: number,
  search = ''
): Promise<TransactionType[]> => {
  const params: Record<string, string | number> = { page }
  if (limit !== undefined) params.limit = limit
  if (search) params.search = search

  const response = await httpClient.get<ApiListResponse>('/tipos-lancamento', { params })
  const res = response as unknown as ApiListResponse
  return res.data.map(mapApi)
}

export const getTransactionTypesWithPagination = async (
  page = 1,
  limit = 15,
  search = ''
): Promise<{ data: TransactionType[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
  const params: Record<string, string | number> = { page, limit }
  if (search) params.search = search

  const response = await httpClient.get<ApiListResponse>('/tipos-lancamento', { params })
  const res = response as unknown as ApiListResponse
  return {
    data: res.data.map(mapApi),
    pagination: {
      page: res.pagination.current_page,
      limit: res.pagination.per_page ?? limit,
      total: res.pagination.total,
      totalPages: Math.ceil(res.pagination.total / (res.pagination.per_page ?? limit)),
    },
  }
}

export const createTransactionType = async (data: TransactionType): Promise<void> => {
  const dto: CreateTipoLancamentoDto = {
    nome: data.description,
    natureza: data.type === 'entrada' ? 1 : 2,
    id_conta_contabil: data.sourceAccountId ? Number(data.sourceAccountId) : null,
    id_contra_partida: data.targetAccountId ? Number(data.targetAccountId) : null,
    descricao: data.guidelines || null,
    status: data.isActive,
  }
  await httpClient.post('/tipos-lancamento', dto)
}

export const updateTransactionType = async (id: string, data: TransactionType): Promise<void> => {
  const dto: UpdateTipoLancamentoDto = {
    nome: data.description,
    natureza: data.type === 'entrada' ? 1 : 2,
    id_conta_contabil: data.sourceAccountId ? Number(data.sourceAccountId) : null,
    id_contra_partida: data.targetAccountId ? Number(data.targetAccountId) : null,
    descricao: data.guidelines || null,
    status: data.isActive,
  }
  await httpClient.put(`/tipos-lancamento/${id}`, dto)
}

export const deleteTransactionType = async (id: string): Promise<void> => {
  await httpClient.delete(`/tipos-lancamento/${id}`)
}
