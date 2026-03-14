import { httpClient } from '@/lib/http-client'
import type {
  ApiPort,
  ApiPortListResponse,
  CreatePortDto,
  UpdatePortDto
} from '@/types/api'
import type { Port } from '@/types/types'
import { fetchMunicipioById, fetchEstadoById } from './internal-location-service'

/**
 * Busca informações da cidade pelo ID usando a API interna
 */
const getCityInfoById = async (cityId: number): Promise<{ nome: string; uf: string } | null> => {
  try {
    const municipio = await fetchMunicipioById(cityId)
    if (!municipio) return null

    // Buscar a sigla do estado pelo idUF
    const estado = await fetchEstadoById(municipio.idUF)

    return {
      nome: municipio.nome,
      uf: estado?.sigla || ''
    }
  } catch (error) {
    console.error('Erro ao buscar informações da cidade:', error)
    return null
  }
}

/**
 * Converte dados da API para o formato interno da aplicação
 */
const mapApiToPort = async (apiPort: ApiPort): Promise<Port> => {
  // Buscar informações da cidade apenas se o id_municipio existir
  let cityInfo: { nome: string; uf: string } | null = null

  if (apiPort.id_municipio && apiPort.id_municipio > 0) {
    try {
      cityInfo = await getCityInfoById(apiPort.id_municipio)
    } catch (error) {
      console.error(`Erro ao buscar info da cidade ${apiPort.id_municipio}:`, error)
    }
  }

  return {
    id: String(apiPort.id_porto),
    code: String(apiPort.id_porto),
    name: apiPort.nome,
    acronym: apiPort.sigla,
    cityId: apiPort.id_municipio,
    city: cityInfo?.nome || '',
    state: cityInfo?.uf || '',
    status: apiPort.status ?? true,
    createdAt: new Date(apiPort.created_at),
    updatedAt: new Date(apiPort.updated_at),
  }
}

/**
 * Busca todos os portos com suporte a busca
 */
export const getAllPorts = async (
  page: number = 1,
  perPage: number = 10
): Promise<Port[]> => {
  try {
    const url = `/portos?page=${page}&per_page=${perPage}`
    const response = await httpClient.get<ApiPortListResponse>(url)

    // Mapear todos os portos em paralelo
    const ports = await Promise.all(response.data.map(mapApiToPort))
    return ports.sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Erro ao obter portos:', error)
    throw error
  }
}

/**
 * Busca porto por ID
 */
export const getPortById = async (id: string): Promise<Port | null> => {
  try {
    const response = await httpClient.get<ApiPort>(`/portos/${id}`)
    const apiPort = (response as unknown as Record<string, unknown>).data || response
    return await mapApiToPort(apiPort as ApiPort)
  } catch (error) {
    console.error('Erro ao obter porto:', error)
    throw error
  }
}

/**
 * Cria novo porto
 */
export const createPort = async (
  port: Omit<Port, 'id' | 'createdAt' | 'updatedAt' | 'code'>
): Promise<Port> => {
  try {
    const dto: CreatePortDto = {
      nome: port.name,
      sigla: port.acronym,
      id_municipio: port.cityId!,
      status: port.status ?? true,
    }

    const response = await httpClient.post<ApiPort>('/portos', dto)
    const apiPort = (response as unknown as Record<string, unknown>).data || response
    return await mapApiToPort(apiPort as ApiPort)
  } catch (error) {
    console.error('Erro ao criar porto:', error)
    throw error
  }
}

/**
 * Atualiza porto existente
 */
export const updatePort = async (
  id: string,
  port: Partial<Port>
): Promise<Port> => {
  try {
    const dto: UpdatePortDto = {
      nome: port.name,
      sigla: port.acronym,
      id_municipio: port.cityId,
      status: port.status,
    }

    const response = await httpClient.put<ApiPort>(`/portos/${id}`, dto)
    const apiPort = (response as unknown as Record<string, unknown>).data || response
    return await mapApiToPort(apiPort as ApiPort)
  } catch (error) {
    console.error('Erro ao atualizar porto:', error)
    throw error
  }
}

/**
 * Deleta porto
 */
export const deletePort = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/portos/${id}`)
  } catch (error) {
    console.error('Erro ao deletar porto:', error)
    throw error
  }
}

/**
 * Busca portos ativos
 */
export const getActivePorts = async (): Promise<Port[]> => {
  try {
    const allPorts = await getAllPorts()
    return allPorts.filter(port => port.status)
  } catch (error) {
    console.error('Erro ao buscar portos ativos:', error)
    throw error
  }
}

/**
 * Pesquisa portos por termo
 */
export const searchPorts = async (searchTerm: string, page: number = 1, perPage: number = 10): Promise<Port[]> => {
  try {
    const allPorts = await getAllPorts(page, perPage)
    const lowerSearch = searchTerm.toLowerCase()
    return allPorts.filter(port =>
      port.name?.toLowerCase().includes(lowerSearch) ||
      port.city?.toLowerCase().includes(lowerSearch) ||
      port.state?.toLowerCase().includes(lowerSearch) ||
      port.code?.toLowerCase().includes(lowerSearch)
    )
  } catch (error) {
    console.error('Erro ao pesquisar portos:', error)
    throw error
  }
}
