import { httpClient } from "@/lib/http-client"
import { GlobalToastHttpClient } from "@/lib/global-toast"
import type { BusinessUnitType8 } from "@/types/types"

/**
 * Interface para os dados de pessoa retornados pela API /pessoas
 */
interface ApiPessoa {
  id_pessoa: number
  nome: string
  apelido: string | null
  abreviatura: string | null
  cnpj_cpf: string | null
  inscricao_estadual_rg: string | null
  inscricao_municipal: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  id_municipio: number | null
  id_tipo_cadastro: number
  status: boolean
  created_at: string
  updated_at: string
}

/**
 * DTO para criar/atualizar empresa (pessoa tipo 8)
 */
interface PessoaEmpresaDto {
  nome?: string
  apelido?: string
  id_tipo_cadastro?: number
  cnpj_cpf?: string | null
  inscricao_estadual_rg?: string | null
  inscricao_municipal?: string | null
  abreviatura?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cep?: string | null
  cidade?: string | null
  uf?: string | null
  id_municipio?: number | null
  status?: boolean
}

/**
 * Mapeia dados da API (pessoa) para BusinessUnitType8
 */
const mapApiToBusinessUnitType8 = (api: ApiPessoa): BusinessUnitType8 => ({
  id: String(api.id_pessoa),
  nome: api.nome || "",
  apelido: api.apelido || "",
  abreviatura: api.abreviatura || undefined,
  cnpj: api.cnpj_cpf || undefined,
  ie: api.inscricao_estadual_rg || undefined,
  im: api.inscricao_municipal || undefined,
  logradouro: api.logradouro || undefined,
  nr: api.numero || undefined,
  complemento: api.complemento || undefined,
  bairro: api.bairro || undefined,
  cep: api.cep ? String(api.cep) : undefined,
  cidade: api.cidade || undefined,
  uf: api.uf || undefined,
  idMunicipio: api.id_municipio || undefined,
  status: api.status,
  createdAt: new Date(api.created_at),
  updatedAt: new Date(api.updated_at),
})

/**
 * Busca todas as empresas (pessoas tipo 8)
 */
export const getAllBusinessUnitsType8 = async (): Promise<BusinessUnitType8[]> => {
  try {
    const response = await httpClient.get<{ data: ApiPessoa[]; pagination: unknown }>(
      "/pessoas?id_tipo_cadastro=8"
    )
    const data = Array.isArray(response) ? response : (response as any)?.data ?? []
    return (data as ApiPessoa[]).map(mapApiToBusinessUnitType8)
  } catch (error) {
    console.error("Erro ao buscar empresas:", error)
    throw error
  }
}

/**
 * Busca empresa por ID (dados completos)
 */
export const getBusinessUnitType8ById = async (id: string): Promise<BusinessUnitType8 | null> => {
  try {
    const response = await httpClient.get<ApiPessoa>(`/pessoas/${id}`)
    return mapApiToBusinessUnitType8(response)
  } catch (error) {
    console.error("Erro ao buscar empresa:", error)
    throw error
  }
}

/**
 * Cria nova empresa (pessoa tipo 8)
 */
export const createBusinessUnitType8 = async (
  data: Omit<BusinessUnitType8, "id" | "createdAt" | "updatedAt" | "pessoaProprietaria">
): Promise<string> => {
  try {
    const dto: PessoaEmpresaDto = {
      nome: data.nome,
      apelido: data.apelido,
      id_tipo_cadastro: 8,
      status: true,
      cnpj_cpf: data.cnpj || null,
      inscricao_estadual_rg: data.ie || null,
      inscricao_municipal: data.im || null,
      abreviatura: data.abreviatura || null,
      logradouro: data.logradouro || null,
      numero: data.nr || null,
      complemento: data.complemento || null,
      bairro: data.bairro || null,
      cep: data.cep ? data.cep.replace(/\D/g, "") : null,
      cidade: data.cidade || null,
      uf: data.uf || null,
      id_municipio: data.idMunicipio || null,
    }

    const response = await httpClient.post<{ id: number; message: string }>("/pessoas", dto)
    return String(response.id)
  } catch (error) {
    console.error("Erro ao criar empresa:", error)
    throw error
  }
}

/**
 * Atualiza empresa existente
 */
export const updateBusinessUnitType8 = async (
  id: string,
  data: Partial<BusinessUnitType8>
): Promise<void> => {
  try {
    const dto: PessoaEmpresaDto = {}

    if (data.nome !== undefined) {
      dto.nome = data.nome
    }
    if (data.apelido !== undefined) {
      dto.apelido = data.apelido
    }
    if (data.cnpj !== undefined) dto.cnpj_cpf = data.cnpj || null
    if (data.ie !== undefined) dto.inscricao_estadual_rg = data.ie || null
    if (data.im !== undefined) dto.inscricao_municipal = data.im || null
    if (data.abreviatura !== undefined) dto.abreviatura = data.abreviatura || null
    if (data.logradouro !== undefined) dto.logradouro = data.logradouro || null
    if (data.nr !== undefined) dto.numero = data.nr || null
    if (data.complemento !== undefined) dto.complemento = data.complemento || null
    if (data.bairro !== undefined) dto.bairro = data.bairro || null
    if (data.cep !== undefined) dto.cep = data.cep ? data.cep.replace(/\D/g, "") : null
    if (data.cidade !== undefined) dto.cidade = data.cidade || null
    if (data.uf !== undefined) dto.uf = data.uf || null
    if (data.idMunicipio !== undefined) dto.id_municipio = data.idMunicipio || null

    await httpClient.put(`/pessoas/${id}`, dto)
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error)
    throw error
  }
}

/**
 * Exclui empresa
 */
export const deleteBusinessUnitType8 = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/pessoas/${id}`)
  } catch (error) {
    console.error("Erro ao excluir empresa:", error)
    throw error
  }
}

// ========== VERSÃO COM TOASTS AUTOMÁTICOS ==========

export const businessUnitType8ServiceWithToasts = {
  async create(data: Omit<BusinessUnitType8, "id" | "createdAt" | "updatedAt" | "pessoaProprietaria">) {
    const dto: PessoaEmpresaDto = {
      nome: data.nome,
      apelido: data.apelido,
      id_tipo_cadastro: 8,
      status: true,
      cnpj_cpf: data.cnpj || null,
      inscricao_estadual_rg: data.ie || null,
      inscricao_municipal: data.im || null,
      abreviatura: data.abreviatura || null,
      logradouro: data.logradouro || null,
      numero: data.nr || null,
      complemento: data.complemento || null,
      bairro: data.bairro || null,
      cep: data.cep ? data.cep.replace(/\D/g, "") : null,
      cidade: data.cidade || null,
      uf: data.uf || null,
      id_municipio: data.idMunicipio || null,
    }

    return GlobalToastHttpClient.post("/pessoas", dto, {
      customSuccessMessage: "Empresa criada com sucesso!",
      customErrorMessage: "Erro ao criar empresa",
    })
  },

  async update(id: string, data: Partial<BusinessUnitType8>) {
    const dto: PessoaEmpresaDto = {}
    if (data.nome !== undefined) dto.nome = data.nome
    if (data.apelido !== undefined) dto.apelido = data.apelido
    if (data.cnpj !== undefined) dto.cnpj_cpf = data.cnpj || null
    if (data.ie !== undefined) dto.inscricao_estadual_rg = data.ie || null
    if (data.im !== undefined) dto.inscricao_municipal = data.im || null
    if (data.abreviatura !== undefined) dto.abreviatura = data.abreviatura || null
    if (data.logradouro !== undefined) dto.logradouro = data.logradouro || null
    if (data.nr !== undefined) dto.numero = data.nr || null
    if (data.complemento !== undefined) dto.complemento = data.complemento || null
    if (data.bairro !== undefined) dto.bairro = data.bairro || null
    if (data.cep !== undefined) dto.cep = data.cep ? String(data.cep).replace(/\D/g, "") : null
    if (data.cidade !== undefined) dto.cidade = data.cidade || null
    if (data.uf !== undefined) dto.uf = data.uf || null
    if (data.idMunicipio !== undefined) dto.id_municipio = data.idMunicipio || null

    return GlobalToastHttpClient.put(`/pessoas/${id}`, dto, {
      customSuccessMessage: "Empresa atualizada com sucesso!",
      customErrorMessage: "Erro ao atualizar empresa",
    })
  },

  async delete(id: string) {
    return GlobalToastHttpClient.delete(`/pessoas/${id}`, {
      customSuccessMessage: "Empresa excluída com sucesso!",
      customErrorMessage: "Erro ao excluir empresa",
    })
  },
}
