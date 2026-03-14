import { personService, getPeopleByRegistrationType as mockGetPeopleByRegistrationType, searchPeople as mockSearchPeople } from "@/lib/mock-service"
import type { Person, RegistrationType } from "@/types/types"

// Add a new person
export const addPerson = async (person: Omit<Person, "id">): Promise<string> => {
  try {
    const id = await personService.add(person)
    return id
  } catch (error) {
    console.error("Error adding person: ", error)
    throw error
  }
}

// Get all people
export const getAllPeople = async (): Promise<Person[]> => {
  try {
    return await personService.getAll()
  } catch (error) {
    console.error("Error getting people: ", error)
    throw error
  }
}

// Get people by registration type
export const getPeopleByRegistrationType = async (registrationType: RegistrationType): Promise<Person[]> => {
  try {
    return await mockGetPeopleByRegistrationType(registrationType)
  } catch (error) {
    console.error(`Error getting people by registration type ${registrationType}: `, error)
    throw error
  }
}

// Get a person by ID
export const getPersonById = async (id: string): Promise<Person | null> => {
  try {
    return await personService.getById(id)
  } catch (error) {
    console.error("Error getting person: ", error)
    throw error
  }
}

// Update a person
export const updatePerson = async (id: string, person: Partial<Person>): Promise<void> => {
  try {
    await personService.update(id, person)
  } catch (error) {
    console.error("Error updating person: ", error)
    throw error
  }
}

// Delete a person
export const deletePerson = async (id: string): Promise<void> => {
  try {
    await personService.delete(id)
  } catch (error) {
    console.error("Error deleting person: ", error)
    throw error
  }
}

// Search people by name or document ID
export const searchPeople = async (searchTerm: string): Promise<Person[]> => {
  try {
    return await mockSearchPeople(searchTerm)
  } catch (error) {
    console.error("Error searching people: ", error)
    throw error
  }
}

