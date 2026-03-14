import * as businessUnitApiService from "./business-unit-api-service"
import type { BusinessUnit } from "@/types/types"

// Obter todas as unidades de negócio
export const getAllBusinessUnits = async (): Promise<BusinessUnit[]> => {
  try {
    return await businessUnitApiService.getAllBusinessUnits()
  } catch (error) {
    console.error("Error fetching business units:", error)
    throw error
  }
}

// Obter unidades de negócio ativas
export const getActiveBusinessUnits = async (): Promise<BusinessUnit[]> => {
  try {
    const units = await businessUnitApiService.getAllBusinessUnits()
    return units.filter(unit => (unit as unknown as Record<string, unknown>).isActive !== false)
  } catch (error) {
    console.error("Error fetching active business units:", error)
    throw error
  }
}


// Obter uma unidade de negócio pelo ID
export const getBusinessUnitById = async (id: string): Promise<BusinessUnit | null> => {
  try {
    return await businessUnitApiService.getBusinessUnitById(id)
  } catch (error) {
    console.error(`Error fetching business unit with id ${id}:`, error)
    throw error
  }
}

// Adicionar uma unidade de negócio
export const addBusinessUnit = async (businessUnit: Omit<BusinessUnit, "id">): Promise<string> => {
  try {
    return await businessUnitApiService.addBusinessUnit(businessUnit)
  } catch (error) {
    console.error("Error adding business unit:", error)
    throw error
  }
}

// Atualizar uma unidade de negócio
export const updateBusinessUnit = async (id: string, businessUnit: Partial<BusinessUnit>): Promise<void> => {
  try {
    await businessUnitApiService.updateBusinessUnit(id, businessUnit)
  } catch (error) {
    console.error(`Error updating business unit with id ${id}:`, error)
    throw error
  }
}

// Excluir uma unidade de negócio (soft delete)
export const deleteBusinessUnit = async (id: string): Promise<void> => {
  try {
    await businessUnitApiService.deleteBusinessUnit(id)
  } catch (error) {
    console.error(`Error deleting business unit with id ${id}:`, error)
    throw error
  }
}

// Pesquisar unidades de negócio
export const searchBusinessUnits = async (searchTerm: string): Promise<BusinessUnit[]> => {
  try {
    const allUnits = await businessUnitApiService.getAllBusinessUnits()
    return allUnits.filter(unit => 
      unit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error(`Error searching business units with term ${searchTerm}:`, error)
    throw error
  }
}

// Criar uma unidade de negócio (alias para addBusinessUnit para compatibilidade)
export const createBusinessUnit = async (unit: BusinessUnit): Promise<BusinessUnit> => {
  try {
    const id = await addBusinessUnit(unit)
    return {
      id,
      ...unit,
    }
  } catch (error) {
    console.error("Error creating business unit:", error)
    throw error
  }
}

