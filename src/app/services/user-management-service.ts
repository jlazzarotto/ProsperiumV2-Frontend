import { httpClient } from '@/lib/http-client'

export interface ManagedUser {
  id: number
  nome: string
  email: string
  role: 'ROLE_ROOT' | 'ROLE_ADMIN'
  status: 'active' | 'inactive'
  companyIds: number[]
  empresaIds: number[]
  unidadeIds: number[]
  profileCodes: string[]
}

interface UsersListResponse {
  success: boolean
  data: {
    items: ManagedUser[]
  }
}

interface UserItemResponse {
  success: boolean
  data: {
    item: ManagedUser
  }
}

export interface CreateManagedUserPayload {
  nome: string
  email: string
  password: string
  role: 'ROLE_ROOT' | 'ROLE_ADMIN'
  companyId?: number | null
  empresaIds?: number[]
  unidadeIds?: number[]
  profileCodes?: string[]
  status?: 'active' | 'inactive'
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const response = await httpClient.get<UsersListResponse>('/v1/users')
  return response.data.items
}

export async function createManagedUser(payload: CreateManagedUserPayload): Promise<ManagedUser> {
  const response = await httpClient.post<UserItemResponse>('/v1/users', payload)
  return response.data.item
}
