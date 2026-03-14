import { httpClient } from "@/lib/http-client"

export interface ConfigParam {
  name: string
  type: string
  value: string
  restrict: number
  status: number
  description?: string
}

interface ConfigParamsResponse {
  data: ConfigParam[]
  types?: string[]
}

interface SaveConfigParamPayload {
  name: string
  type: string
  value: string
  description?: string
  original_name?: string
}

interface UpdateConfigParamStatusPayload {
  name: string
  status: number
}

interface UpdateConfigParamRestrictPayload {
  name: string
  restrict: number
}

function normalizeConfigParam(raw: any): ConfigParam {
  return {
    name: String(raw?.name ?? raw?.nome ?? ""),
    type: String(raw?.type ?? raw?.tipo ?? ""),
    value: String(raw?.value ?? raw?.valor ?? ""),
    restrict: Number(raw?.restrict ?? raw?.restrict_value ?? 0),
    status: Number(raw?.status ?? 0),
    description: String(raw?.description ?? raw?.descricao ?? ""),
  }
}

export const getConfigParams = async (): Promise<ConfigParamsResponse> => {
  const response = await httpClient.get<ConfigParamsResponse>("/config-params")
  if (Array.isArray(response)) {
    const data = response.map(normalizeConfigParam)
    return { data, types: [] }
  }

  const rawData = Array.isArray((response as any)?.data) ? (response as any).data : []
  const data = rawData.map(normalizeConfigParam)
  const responseTypes = Array.isArray((response as any)?.types) ? ((response as any).types as string[]) : []

  return {
    data,
    types: Array.from(new Set(responseTypes.map((item) => item.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  }
}

export const saveConfigParam = async (payload: SaveConfigParamPayload): Promise<void> => {
  await httpClient.post("/config-params", payload)
}

export const updateConfigParamStatus = async (payload: UpdateConfigParamStatusPayload): Promise<void> => {
  await httpClient.put("/config-params/status", payload)
}

export const updateConfigParamRestrict = async (payload: UpdateConfigParamRestrictPayload): Promise<void> => {
  await httpClient.put("/config-params/restrict", payload)
}
