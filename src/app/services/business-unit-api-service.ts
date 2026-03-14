/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpClient } from '@/lib/http-client'
import type { ApiBusinessUnit, ApiBusinessUnitListResponse } from '@/types/api'
import type { BusinessUnit } from '@/types/types'

/**
 * Converte dados da API para o formato interno da aplicação
 */
const mapApiToBusinessUnit = (apiUnit: ApiBusinessUnit): BusinessUnit => {
  return {
    id: String(apiUnit.id_un_negocio),
    name: apiUnit.apelido || '',
    code: String(apiUnit.id_un_negocio),
    abbreviation: apiUnit.abreviatura || '',
    description: apiUnit.descricao || '',
    postalCode: apiUnit.cep ? String(apiUnit.cep) : '',
    street: apiUnit.logradouro || '',
    number: apiUnit.nr || '',
    complement: apiUnit.complemento || '',
    neighborhood: apiUnit.bairro || '',
    city: apiUnit.cidade || '',
    state: apiUnit.uf || '',
    createdAt: new Date(apiUnit.created_at),
    updatedAt: new Date(apiUnit.updated_at),
  }
}

/**
 * Busca todas as unidades de negócio com paginação
 */
export const getAllBusinessUnits = async (
  page: number = 1,
  limit?: number
): Promise<BusinessUnit[]> => {
  try {
    const response = await httpClient.get<{ data: any[] }>(`/unidades-negocio`)
    const data = Array.isArray(response) ? response : (response as any)?.data ?? []
    return data.map(mapApiToBusinessUnit)
  } catch (error) {
    console.error('Erro ao obter unidades de negócio:', error)
    throw error
  }
}

/**
 * Busca unidade de negócio por ID
 */
export const getBusinessUnitById = async (id: string): Promise<BusinessUnit | null> => {
  try {
    const response = await httpClient.get<ApiBusinessUnit>(`/unidades-negocio/${id}`)
    // A API pode retornar diretamente o objeto ou dentro de { data }
    const apiUnit = (response as any).data || response
    return mapApiToBusinessUnit(apiUnit)
  } catch (error) {
    console.error('Erro ao obter unidade de negócio:', error)
    throw error
  }
}

/**
 * Cria uma nova unidade de negócio
 */
export const addBusinessUnit = async (unit: Partial<BusinessUnit>): Promise<string> => {
  try {
    const dto: any = {
      apelido: unit.name || '',
      abreviatura: unit.abbreviation || null,
      descricao: unit.description || null,
      logradouro: unit.street || null,
      nr: unit.number || null,
      complemento: unit.complement || null,
      bairro: unit.neighborhood || null,
      cep: unit.postalCode || null,
      cidade: unit.city || null,
      uf: unit.state || null,
      id_municipio: (unit as any).cityId || null,
    }

    const response = await httpClient.post<ApiBusinessUnit>('/unidades-negocio', dto)
    const unitData = (response as any).data || response
    console.log('[addBusinessUnit] Resposta da API:', unitData)
    console.log('[addBusinessUnit] ID retornado:', unitData.id_un_negocio)
    return String(unitData.id_un_negocio)
  } catch (error) {
    console.error('Erro ao criar unidade de negócio:', error)
    throw error
  }
}

/**
 * Atualiza uma unidade de negócio existente
 */
export const updateBusinessUnit = async (
  id: string,
  unit: Partial<BusinessUnit>
): Promise<void> => {
  try {
    const dto: any = {
      apelido: unit.name,
      abreviatura: unit.abbreviation || null,
      descricao: unit.description || null,
      logradouro: unit.street || null,
      nr: unit.number || null,
      complemento: unit.complement || null,
      bairro: unit.neighborhood || null,
      cep: unit.postalCode || null,
      cidade: unit.city || null,
      uf: unit.state || null,
      id_municipio: (unit as any).cityId || null,
    }

    await httpClient.put(`/unidades-negocio/${id}`, dto)
  } catch (error) {
    console.error('Erro ao atualizar unidade de negócio:', error)
    throw error
  }
}

/**
 * Exclui uma unidade de negócio
 */
export const deleteBusinessUnit = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/unidades-negocio/${id}`)
  } catch (error) {
    console.error('Erro ao excluir unidade de negócio:', error)
    throw error
  }
}

/**
 * Busca pessoas de uma unidade de negócio
 * @deprecated Use getPeopleByBusinessUnits do person-api-service para melhor performance
 */
export const getBusinessUnitPeople = async (businessUnitId: string): Promise<any[]> => {
  try {
    const response = await httpClient.get(`/unidades-negocio/${businessUnitId}/pessoas`)
    return (response as any).data || []
  } catch (error) {
    console.error('Erro ao obter pessoas da unidade de negócio:', error)
    throw error
  }
}
