/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Person } from "@/types/types"
import * as personApiService from "./person-api-service"

// Obter todas as pessoas
export const getAllPeople = async (): Promise<Person[]> => {
  try {
    return await personApiService.getAllPeople()
  } catch (error) {
    console.error("Error getting people:", error)
    throw error
  }
}

// Obter pessoas por unidade de negócio
export const getPeopleByBusinessUnit = async (businessUnitId: string): Promise<Person[]> => {
  try {
    return await personApiService.getPeopleByBusinessUnit(businessUnitId)
  } catch (error) {
    console.error("Error getting people by business unit:", error)
    throw error
  }
}

// Obter uma pessoa pelo ID
export const getPersonById = async (id: string): Promise<Person | null> => {
  try {
    return await personApiService.getPersonById(id)
  } catch (error) {
    console.error("Error getting person:", error)
    throw error
  }
}

// Criar uma nova pessoa
export const createPerson = async (person: Person): Promise<Person> => {
  try {
    const personId = await personApiService.addPerson(person)

    const createdPerson = {
      ...person,
      id: personId,
    }

    return createdPerson
  } catch (error) {
    console.error("Error creating person:", error)
    throw error
  }
}

// Atualizar uma pessoa existente
export const updatePerson = async (id: string, person: Partial<Person>): Promise<void> => {
  try {
    await personApiService.updatePerson(id, person)
  } catch (error) {
    console.error("Error updating person:", error)
    throw error
  }
}

// Excluir uma pessoa
export const deletePerson = async (id: string): Promise<void> => {
  try {
    await personApiService.deletePerson(id)
  } catch (error) {
    console.error("Error deleting person:", error)
    throw error
  }
}

// Obter pessoas por tipo de cadastro
export const getPeopleByRegistrationType = async (registrationType: string): Promise<Person[]> => {
  try {
    return await personApiService.getPeopleByRegistrationType(registrationType as any)
  } catch (error) {
    console.error("Error getting people by registration type:", error)
    throw error
  }
}

// Buscar pessoas
export const searchPeople = async (searchTerm: string): Promise<Person[]> => {
  try {
    return await personApiService.searchPeople(searchTerm)
  } catch (error) {
    console.error("Error searching people:", error)
    throw error
  }
}


