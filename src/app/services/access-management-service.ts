import { httpClient } from "@/lib/http-client"

export interface ManagedProfile {
  id: number
  companyId: number | null
  codigo: string
  nome: string
  tipo: "custom" | "system"
  status: "active" | "inactive"
  permissionCodes: string[]
}

export interface ManagedPermission {
  id: number
  modulo: string
  codigo: string
  nome: string
  status: string
}

interface ProfilesListResponse {
  success: boolean
  data: {
    items: ManagedProfile[]
  }
}

interface ProfileItemResponse {
  success: boolean
  data: {
    item: ManagedProfile
  }
}

interface PermissionsListResponse {
  success: boolean
  data: {
    items: ManagedPermission[]
  }
}

export async function listProfiles(companyId?: number): Promise<ManagedProfile[]> {
  const query = companyId ? `?companyId=${companyId}` : ""
  const response = await httpClient.get<ProfilesListResponse>(`/v1/perfis${query}`)
  return response.data.items
}

export async function updateProfile(id: number, payload: {
  nome: string
  permissionCodes: string[]
  tipo?: "custom" | "system"
  status?: "active" | "inactive"
}): Promise<ManagedProfile> {
  const response = await httpClient.put<ProfileItemResponse>(`/v1/perfis/${id}`, payload)
  return response.data.item
}

export async function listPermissions(companyId?: number): Promise<ManagedPermission[]> {
  const query = companyId ? `?companyId=${companyId}` : ""
  const response = await httpClient.get<PermissionsListResponse>(`/v1/permissoes${query}`)
  return response.data.items
}

export async function updateUserProfiles(userId: number, payload: {
  companyId: number
  profileCodes: string[]
}) {
  return httpClient.put(`/v1/users/${userId}/profiles`, payload)
}
