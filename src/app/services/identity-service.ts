import { httpClient } from '@/lib/http-client'

export interface UserItem {
  id: number
  companyId: number | null
  nome: string
  email: string
  role: string
  status: string
  mfaHabilitado: boolean
  ultimoLogin: string | null
  createdAt: string
  companyIds: number[]
  empresaIds: number[]
  unidadeIds: number[]
  profileCodes: string[]
}

interface ListResponse<T> {
  success: boolean
  data: {
    items: T[]
  }
}

interface ItemResponse<T> {
  success: boolean
  data: {
    item: T
  }
}

export async function getUsers(companyId?: number, status?: string): Promise<UserItem[]> {
  const params = new URLSearchParams()
  if (companyId) params.set('companyId', String(companyId))
  if (status) params.set('status', status)
  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await httpClient.get<ListResponse<UserItem>>(`/v1/users${query}`)
  return response.data.items
}

export async function getUserById(id: number): Promise<UserItem> {
  const response = await httpClient.get<ItemResponse<UserItem>>(`/v1/users/${id}`)
  return response.data.item
}

export async function createUser(payload: {
  nome: string
  email: string
  password: string
  companyId?: number
  role?: string
  status?: string
  mfaHabilitado?: boolean
  empresaIds?: number[]
  unidadeIds?: number[]
  profileCodes?: string[]
}): Promise<UserItem> {
  const response = await httpClient.post<ItemResponse<UserItem>>('/v1/users', payload)
  return response.data.item
}

export async function updateUser(id: number, payload: {
  nome: string
  email: string
  password?: string
  companyId?: number
  role?: string
  status?: string
  mfaHabilitado?: boolean
  empresaIds?: number[]
  unidadeIds?: number[]
  profileCodes?: string[]
}): Promise<UserItem> {
  const response = await httpClient.put<ItemResponse<UserItem>>(`/v1/users/${id}`, payload)
  return response.data.item
}

export async function deleteUser(id: number): Promise<void> {
  await httpClient.delete(`/v1/users/${id}`)
}

export async function desbloquearUser(id: number): Promise<UserItem> {
  const response = await httpClient.post<ItemResponse<UserItem>>(`/v1/users/${id}/desbloquear`)
  return response.data.item
}
