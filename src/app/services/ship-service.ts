import { httpClient } from '@/lib/http-client'
import type {
  ApiShip,
  ApiShipListResponse,
  CreateShipDto,
  UpdateShipDto
} from '@/types/api'
import type { Ship } from '@/types/types'

interface ApiCountry {
  id: number
  nome: string
  codigo: string
}

interface Country {
  id: number
  code: string
  name: string
}

// Removido cache - busca direto do banco sempre

/**
 * Converte dados da API para o formato interno da aplicação
 */
const mapApiToShip = (apiShip: ApiShip, countries: Country[]): Ship => {
  const country = countries.find(c => c.id === apiShip.id_pais)

  return {
    id: String(apiShip.id_navio),
    code: String(apiShip.id_navio), // Usando o ID como código
    shipName: apiShip.nome,
    flag: country?.name || 'País Desconhecido',
    status: apiShip.status ?? true,
    createdAt: new Date(apiShip.created_at),
    updatedAt: new Date(apiShip.updated_at),
  }
}

/**
 * Busca países direto do banco - SEM CACHE
 */
export const fetchCountries = async (): Promise<Country[]> => {
  try {
    const response = await httpClient.get<ApiCountry[]>('/municipios/paises')
    return response
      .map((country) => ({
        id: country.id,
        code: country.codigo,
        name: country.nome,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Erro ao buscar países:', error)
    return [
      { id: 1, code: 'BR', name: 'Brasil' },
      { id: 105, code: 'US', name: 'Estados Unidos' }
    ]
  }
}

/**
 * Busca ID do país pelo nome - SEM CACHE
 */
const getCountryIdByName = async (countryName: string): Promise<number> => {
  const countries = await fetchCountries()
  const country = countries.find(c => c.name === countryName)
  return country?.id || 1 // Retorna 1 (Brasil) como padrão
}

/**
 * Busca todos os navios com suporte a busca
 */
export const getAllShips = async (
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<Ship[]> => {
  try {
    const countries = await fetchCountries()

    let url = `/navios?page=${page}&per_page=${perPage}`

    // Adicionar parâmetro de busca se fornecido
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`
    }

    const response = await httpClient.get<ApiShipListResponse>(url)

    return response.data.map((ship) => mapApiToShip(ship, countries))
  } catch (error) {
    console.error('Erro ao obter navios:', error)
    throw error
  }
}

/**
 * Busca navio por ID
 */
export const getShipById = async (id: string): Promise<Ship | null> => {
  try {
    const countries = await fetchCountries()

    const response = await httpClient.get<ApiShip>(`/navios/${id}`)
    const apiShip = (response as unknown as Record<string, unknown>).data || response
    return mapApiToShip(apiShip as ApiShip, countries)
  } catch (error) {
    console.error('Erro ao obter navio:', error)
    throw error
  }
}

/**
 * Cria novo navio
 */
export const addShip = async (
  ship: { shipName: string; flag: string; status: boolean }
): Promise<Ship> => {
  try {
    // Buscar o ID do país pelo nome
    const countryId = await getCountryIdByName(ship.flag)

    const dto: CreateShipDto = {
      nome: ship.shipName,
      id_pais: countryId,
      status: ship.status,
    }

    const response = await httpClient.post<ApiShip>('/navios', dto)
    const apiShip = (response as unknown as Record<string, unknown>).data || response
    const countries = await fetchCountries()
    return mapApiToShip(apiShip as ApiShip, countries)
  } catch (error) {
    console.error('Erro ao criar navio:', error)
    throw error
  }
}

/**
 * Atualiza navio existente
 */
export const updateShip = async (
  id: string,
  ship: { shipName: string; flag: string; status: boolean }
): Promise<Ship> => {
  try {
    // Buscar o ID do país pelo nome
    const countryId = await getCountryIdByName(ship.flag)

    const dto: UpdateShipDto = {
      nome: ship.shipName,
      id_pais: countryId,
      status: ship.status,
    }

    const response = await httpClient.put<ApiShip>(`/navios/${id}`, dto)
    const apiShip = (response as unknown as Record<string, unknown>).data || response
    const countries = await fetchCountries()
    return mapApiToShip(apiShip as ApiShip, countries)
  } catch (error) {
    console.error('Erro ao atualizar navio:', error)
    throw error
  }
}

/**
 * Deleta navio
 */
export const deleteShip = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/navios/${id}`)
  } catch (error) {
    console.error('Erro ao deletar navio:', error)
    throw error
  }
}

/**
 * Busca navios ativos
 */
export const getActiveShips = async (): Promise<Ship[]> => {
  try {
    const allShips = await getAllShips()
    return allShips.filter(ship => ship.status) // Filtrar apenas navios ativos
  } catch (error) {
    console.error('Erro ao buscar navios ativos:', error)
    throw error
  }
}

/**
 * Pesquisa navios por termo
 */
export const searchShips = async (searchTerm: string, page: number = 1, perPage: number = 10): Promise<Ship[]> => {
  try {
    // Usar o parâmetro de busca da API diretamente
    return await getAllShips(page, perPage, searchTerm)
  } catch (error) {
    console.error('Erro ao pesquisar navios:', error)
    throw error
  }
}
