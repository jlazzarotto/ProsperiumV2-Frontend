/**
 * Serviço para consumir a API de localização (Estados e Municípios)
 * Base URL: http://162.240.179.173:8000
 */

import { httpClient } from '@/lib/http-client'

// Interfaces para os tipos de retorno da API
export interface Estado {
  id: number
  sigla: string
  nome: string
  macrorregiao: string
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
}

// Cache para otimizar requisições repetidas
let estadosCache: Estado[] | null = null
const municipiosCache = new Map<string, Municipio[]>()

/**
 * Busca todos os estados (UF) do Brasil
 * GET /api/estados
 */
export const fetchEstados = async (search?: string): Promise<Estado[]> => {
  try {
    // Se não há busca e temos cache, retornar do cache
    if (!search && estadosCache && estadosCache.length > 0) {
      return estadosCache
    }

    let url = '/estados'

    if (search && search.trim()) {
      url += `?search=${encodeURIComponent(search.trim())}`
    }

    const response = await httpClient.get<EstadosListResponse>(url)
    const estados = response.data || []

    // Ordenar por nome
    const estadosOrdenados = estados.sort((a, b) => a.nome.localeCompare(b.nome))

    // Armazenar no cache se não houver busca
    if (!search) {
      estadosCache = estadosOrdenados
    }

    return estadosOrdenados
  } catch (error) {
    console.error('Erro ao buscar estados:', error)
    throw new Error('Não foi possível carregar os estados')
  }
}

/**
 * Busca estado específico por ID
 * GET /api/estados/{id}
 */
export const fetchEstadoById = async (id: number): Promise<Estado | null> => {
  try {
    const response = await httpClient.get<Estado>(`/estados/${id}`)
    return response
  } catch (error) {
    console.error('Erro ao buscar estado:', error)
    return null
  }
}

/**
 * Busca estado por sigla (ex: "RO", "SP")
 */
export const fetchEstadoBySigla = async (sigla: string): Promise<Estado | null> => {
  try {
    const estados = await fetchEstados()
    return estados.find(e => e.sigla.toUpperCase() === sigla.toUpperCase()) || null
  } catch (error) {
    console.error('Erro ao buscar estado por sigla:', error)
    return null
  }
}

/**
 * Busca todos os municípios
 * GET /api/municipios?uf=PA
 */
export const fetchMunicipios = async (params?: {
  uf?: string
  search?: string
}): Promise<Municipio[]> => {
  try {
    const queryParams = new URLSearchParams()

    // Filtros - usar apenas 'uf' conforme a API espera
    if (params?.uf) queryParams.append('uf', params.uf.toUpperCase())
    if (params?.search && params.search.trim()) {
      queryParams.append('search', params.search.trim())
    }
    
    // SEMPRE buscar TODOS os municípios sem paginação
    queryParams.append('limit', '')
    

    const url = `/municipios${queryParams.toString() ? '?' + queryParams.toString() : ''}`

    // Verificar cache se não houver busca
    const cacheKey = url
    if (!params?.search && municipiosCache.has(cacheKey)) {
      return municipiosCache.get(cacheKey)!
    }

    const response = await httpClient.get<MunicipiosListResponse>(url)
    const municipios = response.data || []

    // Ordenar por nome
    const municipiosOrdenados = municipios.sort((a, b) => a.nome.localeCompare(b.nome))

    // Armazenar no cache se não houver busca
    if (!params?.search) {
      municipiosCache.set(cacheKey, municipiosOrdenados)
    }

    return municipiosOrdenados
  } catch (error) {
    console.error('Erro ao buscar municípios:', error)
    throw new Error('Não foi possível carregar os municípios')
  }
}

/**
 * Busca municípios por UF (sigla)
 * GET /api/municipios?uf=RO
 */
export const fetchMunicipiosByUF = async (uf: string, search?: string): Promise<Municipio[]> => {
  return fetchMunicipios({ uf, search })
}

/**
 * Busca municípios por ID da UF
 * Converte o ID para sigla e busca pela UF
 */
export const fetchMunicipiosByIdUF = async (idUF: number, search?: string): Promise<Municipio[]> => {
  try {
    // Primeiro buscar o estado pelo ID para pegar a sigla
    const estado = await fetchEstadoById(idUF)
    if (!estado) {
      console.warn('Estado não encontrado para ID:', idUF)
      return []
    }

    // Buscar municípios pela sigla da UF
    return fetchMunicipiosByUF(estado.sigla, search)
  } catch (error) {
    console.error('Erro ao buscar municípios por ID da UF:', error)
    return []
  }
}

/**
 * Busca município específico por ID
 * GET /api/municipios/{id}
 */
export const fetchMunicipioById = async (id: number): Promise<Municipio | null> => {
  try {
    // Validar se o ID é válido
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

/**
 * Limpa o cache de estados e municípios
 */
export const clearLocationCache = () => {
  estadosCache = null
  municipiosCache.clear()
}
