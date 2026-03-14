import { httpClient } from "@/lib/http-client"
import { GlobalToastHttpClient } from "@/lib/global-toast"

export interface BusinessUnitSummary {
  id: string
  apelido: string
  abreviatura?: string
  status?: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface ApiUnNegocio {
  id_un_negocio: number
  apelido: string
  abreviatura: string | null
  status: boolean
  created_at: string
  updated_at: string
}

const mapApiToBusinessUnitSummary = (api: ApiUnNegocio): BusinessUnitSummary => ({
  id: String(api.id_un_negocio),
  apelido: api.apelido || "",
  abreviatura: api.abreviatura || undefined,
  status: api.status,
  createdAt: new Date(api.created_at),
  updatedAt: new Date(api.updated_at),
})

export const getAllBusinessUnitSummaries = async (): Promise<BusinessUnitSummary[]> => {
  try {
    const response = await httpClient.get<{ data: ApiUnNegocio[] }>("/unidades-negocio")
    const data = Array.isArray(response) ? response : (response as any)?.data ?? []
    return (data as ApiUnNegocio[]).map(mapApiToBusinessUnitSummary)
  } catch (error) {
    console.error("Erro ao buscar unidades:", error)
    throw error
  }
}

export interface BusinessUnitFormData {
  apelido: string
  abreviatura?: string
  descricao?: string
  cep?: string
  logradouro?: string
  nr?: string
  complemento?: string
  bairro?: string
  uf?: string
  cidade?: string
  idMunicipio?: number
}

export const createBusinessUnit = async (data: BusinessUnitFormData): Promise<string> => {
  try {
    const response = await httpClient.post<{ id: number; message: string }>("/unidades-negocio", {
      apelido: data.apelido,
      abreviatura: data.abreviatura || null,
      descricao: data.descricao || null,
      cep: data.cep ? data.cep.replace(/\D/g, "") : null,
      logradouro: data.logradouro || null,
      nr: data.nr || null,
      complemento: data.complemento || null,
      bairro: data.bairro || null,
      cidade: data.cidade || null,
      uf: data.uf || null,
      id_municipio: data.idMunicipio || null,
      status: true,
    })
    return String(response.id)
  } catch (error) {
    console.error("Erro ao criar unidade:", error)
    throw error
  }
}

export const updateBusinessUnitSummary = async (id: string, data: BusinessUnitFormData): Promise<void> => {
  try {
    await httpClient.put(`/unidades-negocio/${id}`, {
      apelido: data.apelido,
      abreviatura: data.abreviatura || null,
      descricao: data.descricao || null,
      cep: data.cep ? data.cep.replace(/\D/g, "") : null,
      logradouro: data.logradouro || null,
      nr: data.nr || null,
      complemento: data.complemento || null,
      bairro: data.bairro || null,
      cidade: data.cidade || null,
      uf: data.uf || null,
      id_municipio: data.idMunicipio || null,
    })
  } catch (error) {
    console.error("Erro ao atualizar unidade:", error)
    throw error
  }
}

export const deleteBusinessUnitSummary = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/unidades-negocio/${id}`)
  } catch (error) {
    console.error("Erro ao excluir unidade:", error)
    throw error
  }
}

export const businessUnitSummaryServiceWithToasts = {
  async create(data: BusinessUnitFormData) {
    return GlobalToastHttpClient.post("/unidades-negocio", {
      apelido: data.apelido,
      abreviatura: data.abreviatura || null,
      descricao: data.descricao || null,
      cep: data.cep ? data.cep.replace(/\D/g, "") : null,
      logradouro: data.logradouro || null,
      nr: data.nr || null,
      complemento: data.complemento || null,
      bairro: data.bairro || null,
      cidade: data.cidade || null,
      uf: data.uf || null,
      id_municipio: data.idMunicipio || null,
      status: true,
    }, {
      customSuccessMessage: "Unidade criada com sucesso!",
      customErrorMessage: "Erro ao criar unidade",
    })
  },

  async update(id: string, data: BusinessUnitFormData) {
    return GlobalToastHttpClient.put(`/unidades-negocio/${id}`, {
      apelido: data.apelido,
      abreviatura: data.abreviatura || null,
      descricao: data.descricao || null,
      cep: data.cep ? data.cep.replace(/\D/g, "") : null,
      logradouro: data.logradouro || null,
      nr: data.nr || null,
      complemento: data.complemento || null,
      bairro: data.bairro || null,
      cidade: data.cidade || null,
      uf: data.uf || null,
      id_municipio: data.idMunicipio || null,
    }, {
      customSuccessMessage: "Unidade atualizada com sucesso!",
      customErrorMessage: "Erro ao atualizar unidade",
    })
  },

  async delete(id: string) {
    return GlobalToastHttpClient.delete(`/unidades-negocio/${id}`, {
      customSuccessMessage: "Unidade excluída com sucesso!",
      customErrorMessage: "Erro ao excluir unidade",
    })
  },
}
