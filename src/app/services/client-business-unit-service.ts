import type { ClientBusinessUnit } from "@/types/types"
import { clientBusinessUnitService } from "@/lib/mock-service"
import { getAllBusinessUnits } from "@/app/services/business-unit-api-service"

export async function createClientBusinessUnit(data: Partial<ClientBusinessUnit>): Promise<ClientBusinessUnit> {
  try {
    const id = await clientBusinessUnitService.add(data as Omit<ClientBusinessUnit, "id">)

    return {
      id,
      ...data,
    } as ClientBusinessUnit
  } catch (error) {
    console.error("Error creating client business unit:", error)
    throw error
  }
}

export async function updateClientBusinessUnit(
  id: string,
  data: Partial<ClientBusinessUnit>,
): Promise<ClientBusinessUnit> {
  try {
    await clientBusinessUnitService.update(id, data)

    return {
      id,
      ...data,
    } as ClientBusinessUnit
  } catch (error) {
    console.error("Error updating client business unit:", error)
    throw error
  }
}

export async function deleteClientBusinessUnit(id: string): Promise<void> {
  try {
    await clientBusinessUnitService.delete(id)
  } catch (error) {
    console.error("Error deleting client business unit:", error)
    throw error
  }
}

export async function getClientBusinessUnits(_personId: string): Promise<ClientBusinessUnit[]> {
  try {
    // No novo modelo, pessoas não têm unidades de negócio vinculadas (junction table removida)
    return []
  } catch (error) {
    console.error("Error getting client business units:", error)
    throw error
  }
}

export async function getClientBusinessUnitById(id: string): Promise<ClientBusinessUnit | null> {
  try {
    return await clientBusinessUnitService.getById(id)
  } catch (error) {
    console.error("Error getting client business unit by ID:", error)
    throw error
  }
}
