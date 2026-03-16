import { httpClient } from "@/lib/http-client"

export interface ConfigParam {
  id: number
  companyId: number
  name: string
  type: string
  value: string
  description: string
  status: number
  restrict: number
  createdAt: string
  updatedAt: string
}

interface ConfigParamsListResponse {
  success: boolean
  data: {
    data: ConfigParam[]
    types: string[]
  }
}

interface ConfigParamItemResponse {
  success: boolean
  data: {
    item: ConfigParam
  }
}

export async function getConfigParams(companyId: number): Promise<{ data: ConfigParam[]; types: string[] }> {
  const params = new URLSearchParams({ companyId: String(companyId) })
  const response = await httpClient.get<ConfigParamsListResponse>(`/v1/config-params?${params.toString()}`)
  return {
    data: response.data.data,
    types: response.data.types,
  }
}

export async function saveConfigParam(payload: {
  companyId: number
  name: string
  type?: string
  value: string
  description?: string
  original_name?: string
}): Promise<ConfigParam> {
  const response = await httpClient.post<ConfigParamItemResponse>("/v1/config-params", payload)
  return response.data.item
}

export async function updateConfigParamStatus(payload: {
  companyId: number
  name: string
  status: number
}): Promise<ConfigParam> {
  const response = await httpClient.put<ConfigParamItemResponse>("/v1/config-params/status", payload)
  return response.data.item
}

export async function updateConfigParamRestrict(payload: {
  companyId: number
  name: string
  restrict: number
}): Promise<ConfigParam> {
  const response = await httpClient.put<ConfigParamItemResponse>("/v1/config-params/restrict", payload)
  return response.data.item
}
