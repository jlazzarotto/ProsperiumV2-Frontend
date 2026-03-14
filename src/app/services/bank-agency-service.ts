import { httpClient } from "@/lib/http-client"
import type { ApiBankAgency, ApiBankAgencyListResponse, CreateBankAgencyDto, UpdateBankAgencyDto } from "@/types/api"
import type { BankAgency } from "@/types/types"
import { unmaskBankAgencyNumber } from "@/lib/masks"
import { fetchBanksFromAPI } from "./bank-service"

/**
 * Converte dados da API para o formato interno da aplicação
 */
const mapApiToBankAgency = (apiAgency: ApiBankAgency): BankAgency => {
  return {
    id: String(apiAgency.id_agencia_bancaria),
    code: String(apiAgency.id_agencia_bancaria),
    agencyName: apiAgency.nome,
    agencyNumber: apiAgency.nr,
    bankCode: apiAgency.id_banco ? String(apiAgency.id_banco) : "",
    bankName: "",
    createdAt: new Date(apiAgency.created_at),
    updatedAt: new Date(apiAgency.updated_at),
  }
}

const resolveApiBankAgency = (
  response: ApiBankAgency | { data?: ApiBankAgency } | null | undefined,
): ApiBankAgency | null => {
  if (!response) return null

  const candidate = ((response as { data?: ApiBankAgency }).data ?? response) as ApiBankAgency

  if (!candidate || typeof candidate.id_agencia_bancaria === "undefined") {
    return null
  }

  return candidate
}

/**
 * Converte dados internos para o formato da API
 */
const mapBankAgencyToApi = (agency: Omit<BankAgency, "id" | "createdAt" | "updatedAt">): CreateBankAgencyDto => {
  const bankId = Number(agency.bankCode)
  if (!bankId || isNaN(bankId)) {
    throw new Error(`ID do banco inválido: ${agency.bankCode}`)
  }

  return {
    id_banco: bankId,
    nome: agency.agencyName,
    nr: unmaskBankAgencyNumber(agency.agencyNumber),
    status: true,
  }
}

/**
 * Busca todas as agências bancárias com paginação e nomes dos bancos
 */
export const getAllBankAgencies = async (
  page: number = 1,
  perPage?: number,
  search?: string
): Promise<BankAgency[]> => {
  try {
    // Se perPage não for passado, usa limit= (sem valor) para puxar todos
    let url = perPage ? `/agencias-bancarias?page=${page}&per_page=${perPage}` : `/agencias-bancarias?limit=`

    // Adicionar parâmetro de busca se fornecido
    if (search && search.trim()) {
      url += `${url.includes('?') ? '&' : '?'}search=${encodeURIComponent(search.trim())}`
    }

    const response = await httpClient.get<ApiBankAgencyListResponse>(url)

    // Buscar bancos para preencher os nomes
    const banks = await fetchBanksFromAPI()
    const bankMap = new Map(banks.map(bank => [bank.id, bank.name]))

    // Mapear agências e preencher nomes
    return response.data.map(apiAgency => {
      const agency = mapApiToBankAgency(apiAgency)
      agency.bankName = apiAgency.id_banco ? (bankMap.get(String(apiAgency.id_banco)) || "Banco não encontrado") : ""
      return agency
    })
  } catch (error) {
    console.error("Erro ao obter agências bancárias:", error)
    throw error
  }
}

/**
 * Busca agência bancária por ID
 */
export const getBankAgencyById = async (id: string): Promise<BankAgency | null> => {
  try {
    if (!id || id === "undefined" || id === "null") {
      return null
    }

    const response = await httpClient.get<ApiBankAgency | { data?: ApiBankAgency }>(`/agencias-bancarias/${id}`)
    const apiAgency = resolveApiBankAgency(response)
    if (!apiAgency) {
      return null
    }

    return mapApiToBankAgency(apiAgency)
  } catch (error) {
    console.error("Erro ao obter agência:", error)
    throw error
  }
}

/**
 * Adiciona uma nova agência bancária
 */
export const addBankAgency = async (agency: Omit<BankAgency, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const dto = mapBankAgencyToApi(agency)
    console.log('[addBankAgency] Enviando:', dto)
    const response = await httpClient.post<ApiBankAgency>("/agencias-bancarias", dto)
    console.log('[addBankAgency] Resposta recebida:', response)

    // A API pode retornar diretamente o objeto ou dentro de { data }
    const agencyData = (response as unknown as Record<string, unknown>).data || response
    return String((agencyData as ApiBankAgency).id_agencia_bancaria)
  } catch (error) {
    console.error("Erro ao adicionar agência bancária:", error)
    // Melhor tratamento de erro
    if (error instanceof Error) {
      // Verificar se é erro de duplicação
      if (error.message.includes('Nome já existe')) {
        throw new Error('Já existe uma agência com este nome. Escolha um nome diferente.')
      }
      if (error.message.includes('Número já existe')) {
        throw new Error('Já existe uma agência com este número. Escolha um número diferente.')
      }
      if (error.message.includes('Código bancário já cadastrado')) {
        throw new Error('Este código bancário já está em uso.')
      }
    }
    throw error
  }
}

/**
 * Atualiza uma agência bancária existente
 */
export const updateBankAgency = async (
  id: string,
  agency: Partial<Omit<BankAgency, "id" | "createdAt" | "updatedAt">>
): Promise<void> => {
  try {
    const dto: UpdateBankAgencyDto = {}

    if (agency.bankCode) {
      dto.id_banco = Number(agency.bankCode)
    }
    if (agency.agencyName) dto.nome = agency.agencyName
    if (agency.agencyNumber) dto.nr = unmaskBankAgencyNumber(agency.agencyNumber)

    await httpClient.put(`/agencias-bancarias/${id}`, dto)
  } catch (error) {
    console.error("Erro ao atualizar agência:", error)
    throw error
  }
}

/**
 * Exclui uma agência bancária
 */
export const deleteBankAgency = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/agencias-bancarias/${id}`)
  } catch (error) {
    console.error("Erro ao excluir agência:", error)
    throw error
  }
}

/**
 * Busca agências por termo de pesquisa (filtro local)
 */
export const searchBankAgencies = async (searchTerm: string): Promise<BankAgency[]> => {
  try {
    const allAgencies = await getAllBankAgencies()
    const lowerSearch = searchTerm.toLowerCase()

    return allAgencies.filter(
      (agency) =>
        agency.agencyName?.toLowerCase().includes(lowerSearch) ||
        agency.agencyNumber?.toLowerCase().includes(lowerSearch) ||
        agency.bankName?.toLowerCase().includes(lowerSearch) ||
        agency.code?.toLowerCase().includes(lowerSearch)
    )
  } catch (error) {
    console.error("Erro ao pesquisar agências:", error)
    throw error
  }
}

export const getBankAgenciesByBusinessUnit = async (_businessUnitId: string): Promise<BankAgency[]> => {
  return getAllBankAgencies()
}
