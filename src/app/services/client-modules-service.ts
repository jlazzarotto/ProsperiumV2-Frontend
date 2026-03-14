import { httpClient } from "@/lib/http-client"

export interface ClientModule {
  key: string
  label: string
  category: string
  categoryLabel: string
  enabled: boolean
}

interface ClientModulesResponse {
  data: ClientModule[]
}

export const getClientModules = async (): Promise<ClientModule[]> => {
  const response = await httpClient.get<ClientModulesResponse>("/modulos-cliente")
  return Array.isArray((response as ClientModulesResponse).data) ? response.data : []
}

export const updateClientModule = async (payload: { modulo: string; enabled: boolean }): Promise<void> => {
  await httpClient.put("/modulos-cliente", payload)
}
