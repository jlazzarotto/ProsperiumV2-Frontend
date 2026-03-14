import { httpClient } from "@/lib/http-client"
import type { ApiCostCenterNode } from "@/types/api"
import type { CostCenterNode } from "@/types/types"

export interface CostCenterPayload {
  id_empresa: number
  code: string
  name: string
  description?: string | null
  parent_id?: number | null
  is_active?: boolean
}

const mapNode = (node: ApiCostCenterNode): CostCenterNode => ({
  id_cost_center: node.id_cost_center,
  id_empresa: node.id_empresa,
  code: node.code,
  name: node.name,
  description: node.description ?? null,
  parent_id: node.parent_id ?? null,
  is_active: Boolean(node.is_active),
  is_analytic: Boolean(node.is_analytic),
  path: node.path,
  children: Array.isArray(node.children) ? node.children.map(mapNode) : [],
})

export const getCostCenters = async (idEmpresa?: number, onlyActive = false): Promise<CostCenterNode[]> => {
  const params = new URLSearchParams()
  if (idEmpresa) params.set("id_empresa", String(idEmpresa))
  if (onlyActive) params.set("ativos", "1")

  const query = params.toString()
  const response = await httpClient.get<{ data: ApiCostCenterNode[] }>(`/centros-custo${query ? `?${query}` : ""}`)
  return Array.isArray(response.data) ? response.data.map(mapNode) : []
}

export const createCostCenter = async (payload: CostCenterPayload): Promise<void> => {
  await httpClient.post("/centros-custo", payload)
}

export const updateCostCenter = async (id: number, payload: Partial<CostCenterPayload>): Promise<void> => {
  await httpClient.put(`/centros-custo/${id}`, payload)
}

export const deleteCostCenter = async (id: number): Promise<void> => {
  await httpClient.delete(`/centros-custo/${id}`)
}
