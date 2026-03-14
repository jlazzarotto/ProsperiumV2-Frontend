/**
 * Serviço para consumir a API interna de localização (Estados e Municípios)
 * Usa a própria API Symfony para buscar estados e cidades
 */

import { httpClient } from '@/lib/http-client'

// Interfaces compatíveis com a estrutura existente
export interface Estado {
  id: number
  sigla: string
  nome: string
}

export interface Municipio {
  id: number
  nome: string
  siglaUF: string
  idUF: number
  capital: boolean
}

export interface EstadosListResponse {
  data: Estado[]
}

export interface MunicipiosListResponse {
  data: Municipio[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

// Estados fixos do Brasil (compatível com a estrutura esperada)
const estadosFixos: Estado[] = [
  { id: 12, sigla: 'AC', nome: 'Acre' },
  { id: 27, sigla: 'AL', nome: 'Alagoas' },
  { id: 16, sigla: 'AP', nome: 'Amapá' },
  { id: 13, sigla: 'AM', nome: 'Amazonas' },
  { id: 29, sigla: 'BA', nome: 'Bahia' },
  { id: 23, sigla: 'CE', nome: 'Ceará' },
  { id: 53, sigla: 'DF', nome: 'Distrito Federal' },
  { id: 32, sigla: 'ES', nome: 'Espírito Santo' },
  { id: 52, sigla: 'GO', nome: 'Goiás' },
  { id: 21, sigla: 'MA', nome: 'Maranhão' },
  { id: 51, sigla: 'MT', nome: 'Mato Grosso' },
  { id: 50, sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { id: 31, sigla: 'MG', nome: 'Minas Gerais' },
  { id: 15, sigla: 'PA', nome: 'Pará' },
  { id: 25, sigla: 'PB', nome: 'Paraíba' },
  { id: 41, sigla: 'PR', nome: 'Paraná' },
  { id: 26, sigla: 'PE', nome: 'Pernambuco' },
  { id: 22, sigla: 'PI', nome: 'Piauí' },
  { id: 33, sigla: 'RJ', nome: 'Rio de Janeiro' },
  { id: 24, sigla: 'RN', nome: 'Rio Grande do Norte' },
  { id: 43, sigla: 'RS', nome: 'Rio Grande do Sul' },
  { id: 11, sigla: 'RO', nome: 'Rondônia' },
  { id: 14, sigla: 'RR', nome: 'Roraima' },
  { id: 42, sigla: 'SC', nome: 'Santa Catarina' },
  { id: 35, sigla: 'SP', nome: 'São Paulo' },
  { id: 28, sigla: 'SE', nome: 'Sergipe' },
  { id: 17, sigla: 'TO', nome: 'Tocantins' }
].sort((a, b) => a.nome.localeCompare(b.nome))

/**
 * Busca todos os estados (UF) do Brasil
 * Retorna lista fixa ordenada por nome
 */
export const fetchEstados = async (): Promise<Estado[]> => {
  return estadosFixos
}

/**
 * Busca estado específico por ID
 */
export const fetchEstadoById = async (id: number): Promise<Estado | null> => {
  return estadosFixos.find(e => e.id === id) || null
}

/**
 * Busca estado por sigla (ex: "RO", "SP")
 */
export const fetchEstadoBySigla = async (sigla: string): Promise<Estado | null> => {
  return estadosFixos.find(e => e.sigla.toUpperCase() === sigla.toUpperCase()) || null
}

/**
 * Busca municípios por ID da UF usando a API interna
 * GET /api/municipios?id_uf=ID
 */
export const fetchMunicipiosByIdUF = async (idUF: number, search?: string): Promise<Municipio[]> => {
  try {
    let url = `/municipios?id_uf=${idUF}&limit=1000`
    
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`
    }

    const response = await httpClient.get<MunicipiosListResponse>(url)
    const municipios = response.data || []

    return municipios.sort((a, b) => a.nome.localeCompare(b.nome))
  } catch (error) {
    console.error('Erro ao buscar municípios por ID da UF:', error)
    return []
  }
}

/**
 * Busca municípios por sigla da UF
 */
export const fetchMunicipiosByUF = async (uf: string, search?: string): Promise<Municipio[]> => {
  const estado = await fetchEstadoBySigla(uf)
  if (!estado) {
    console.warn('Estado não encontrado para UF:', uf)
    return []
  }
  
  return fetchMunicipiosByIdUF(estado.id, search)
}

/**
 * Busca município específico por ID usando a API interna
 * GET /api/municipios/{id}
 */
export const fetchMunicipioById = async (id: number): Promise<Municipio | null> => {
  try {
    if (!id || id <= 0) {
      console.warn('ID de município inválido:', id)
      return null
    }

    const response = await httpClient.get<Municipio>(`/municipios/${id}`)
    return response
  } catch (error) {
    console.error('Erro ao buscar município:', error)
    return null
  }
}

/**
 * Busca município por nome e UF
 */
export const fetchMunicipioByNomeEUF = async (nome: string, uf: string): Promise<Municipio | null> => {
  try {
    const municipios = await fetchMunicipiosByUF(uf, nome)
    return municipios.find(m => m.nome.toLowerCase() === nome.toLowerCase()) || null
  } catch (error) {
    console.error('Erro ao buscar município por nome e UF:', error)
    return null
  }
}