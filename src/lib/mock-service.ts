import type {
  Person,
  RegistrationType
} from "@/types/types"

import {
  mockUsers,
  mockBusinessUnits,
  mockPeople,
  mockPorts,
  mockShips,
  mockOperations,
  mockAccountingAccounts,
  mockTransactionTypes,
  mockCashAccounts,
  mockBankAgencies,
  mockPaymentMethods,
  mockTransfers,
  mockFinancialTransactions,
  mockClientBusinessUnits,
  generateId,
  generateTimestamp
} from "./mock-data"

// In-memory storage
const users = [...mockUsers]
const businessUnits = [...mockBusinessUnits]
const people = [...mockPeople]
const ports = [...mockPorts]
const ships = [...mockShips]
const operations = [...mockOperations]
const accountingAccounts = [...mockAccountingAccounts]
const transactionTypes = [...mockTransactionTypes]
const cashAccounts = [...mockCashAccounts]
const bankAgencies = [...mockBankAgencies]
const paymentMethods = [...mockPaymentMethods]
const transfers = [...mockTransfers]
const financialTransactions = [...mockFinancialTransactions]
const clientBusinessUnits = [...mockClientBusinessUnits]
const personBusinessUnits: { id?: string }[] = []

// Simulate async operations
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Mock authentication state
let currentUser: Record<string, unknown> | null = null
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let isAuthenticated = false

// Generic CRUD operations
export class MockService<T extends { id?: string }> {
  private data: T[]
  private collectionName: string

  constructor(data: T[], collectionName: string) {
    this.data = data
    this.collectionName = collectionName
  }

  async getAll(): Promise<T[]> {
    await delay()
    return [...this.data].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const dateA = (a.createdAt as Date) || new Date()
      const dateB = (b.createdAt as Date) || new Date()
      return dateB.getTime() - dateA.getTime()
    })
  }

  async getById(id: string): Promise<T | null> {
    await delay()
    return this.data.find(item => item.id === id) || null
  }

  async add(item: Omit<T, "id">): Promise<string> {
    await delay()
    const id = generateId()
    const newItem = {
      ...item,
      id,
      createdAt: generateTimestamp(),
      updatedAt: generateTimestamp()
    } as unknown as T
    this.data.push(newItem)
    console.log(`Added item to ${this.collectionName}:`, newItem)
    return id
  }

  async update(id: string, updates: Partial<T>): Promise<void> {
    await delay()
    const index = this.data.findIndex(item => item.id === id)
    if (index !== -1) {
      this.data[index] = {
        ...this.data[index],
        ...updates,
        updatedAt: generateTimestamp()
      }
      console.log(`Updated item in ${this.collectionName}:`, this.data[index])
    } else {
      throw new Error(`Item with id ${id} not found in ${this.collectionName}`)
    }
  }

  async delete(id: string): Promise<void> {
    await delay()
    const index = this.data.findIndex(item => item.id === id)
    if (index !== -1) {
      this.data.splice(index, 1)
      console.log(`Deleted item from ${this.collectionName} with id:`, id)
    } else {
      throw new Error(`Item with id ${id} not found in ${this.collectionName}`)
    }
  }

  async search(searchTerm: string, fields: string[] = ["name"]): Promise<T[]> {
    await delay()
    const term = searchTerm.toLowerCase()
    return this.data.filter(item =>
      fields.some(field => {
        const value = (item as Record<string, unknown>)[field]
        return value && value.toString().toLowerCase().includes(term)
      })
    )
  }

  async getByField(field: string, value: unknown): Promise<T[]> {
    await delay()
    return this.data.filter(item => (item as Record<string, unknown>)[field] === value)
  }
}

// Service instances
export const userService = new MockService(users, "users")
export const businessUnitService = new MockService(businessUnits, "businessUnits")
export const personService = new MockService(people, "people")
export const portService = new MockService(ports, "ports")
export const shipService = new MockService(ships, "ships")
export const operationService = new MockService(operations, "operations")
export const accountingAccountService = new MockService(accountingAccounts, "accountingAccounts")
export const transactionTypeService = new MockService(transactionTypes, "transactionTypes")
export const cashAccountService = new MockService(cashAccounts, "cashAccounts")
export const bankAgencyService = new MockService(bankAgencies, "bankAgencies")
export const paymentMethodService = new MockService(paymentMethods, "paymentMethods")
export const transferService = new MockService(transfers, "transfers")
export const financialTransactionService = new MockService(financialTransactions, "financialTransactions")
export const clientBusinessUnitService = new MockService(clientBusinessUnits, "clientBusinessUnits")
export const personBusinessUnitService = new MockService(personBusinessUnits, "personBusinessUnits")

// Specific service methods for complex queries
export const getPeopleByRegistrationType = async (registrationType: RegistrationType): Promise<Person[]> => {
  await delay()
  return people.filter(person => person.registrationType === registrationType)
}

export const searchPeople = async (searchTerm: string): Promise<Person[]> => {
  await delay()
  const term = searchTerm.toLowerCase()
  return people.filter(person =>
    person.name.toLowerCase().includes(term) ||
    person.documentId.toLowerCase().includes(term)
  )
}

// Mock authentication functions
export const mockAuth = {
  async signInWithEmailAndPassword(email: string, password: string) {
    await delay()

    // Simple mock authentication - in real app, validate credentials
    if (email === "admin@prosperium.com" && password === "123456") {
      currentUser = {
        uid: "user1",
        email: "admin@prosperium.com"
      }
      isAuthenticated = true
      return { user: currentUser }
    } else if (email === "gerente@prosperium.com" && password === "123456") {
      currentUser = {
        uid: "user2",
        email: "gerente@prosperium.com"
      }
      isAuthenticated = true
      return { user: currentUser }
    } else {
      throw new Error("Email ou senha inválidos")
    }
  },

  async createUserWithEmailAndPassword(email: string, password: string) {
    await delay()
    void password // password is available for future use

    // Check if user already exists
    const existingUser = users.find(user => user.email === email)
    if (existingUser) {
      throw new Error("Email já cadastrado")
    }

    const uid = generateId()
    currentUser = {
      uid,
      email
    }
    return { user: currentUser }
  },

  async signOut() {
    await delay()
    currentUser = null
    isAuthenticated = false
  },

  onAuthStateChanged(callback: (user: Record<string, unknown> | null) => void) {
    // Simulate auth state persistence
    setTimeout(() => {
      callback(currentUser)
    }, 100)

    // Return unsubscribe function
    return () => {}
  },

  get currentUser() {
    return currentUser
  }
}

// Mock document operations (similar to Firestore)
export const mockDoc = {
  async get(collection: string, id: string) {
    await delay()

    let data: unknown = null
    let exists = false

    switch (collection) {
      case "users":
        data = users.find(u => u.id === id)
        break
      case "people":
        data = people.find(p => p.id === id)
        break
      case "businessUnits":
        data = businessUnits.find(bu => bu.id === id)
        break
      // Add other collections as needed
    }

    exists = !!data

    return {
      exists: () => exists,
      data: () => data,
      id
    }
  },

  async set(collection: string, id: string, data: Record<string, unknown>, options?: { merge?: boolean }) {
    await delay()

    const timestamp = generateTimestamp()
    const newData = {
      ...data,
      id,
      updatedAt: timestamp,
      ...(options?.merge ? {} : { createdAt: timestamp })
    }

    switch (collection) {
      case "users":
        const userIndex = users.findIndex(u => u.id === id)
        if (userIndex !== -1) {
          users[userIndex] = options?.merge ? { ...users[userIndex], ...newData } : (newData as unknown as typeof users[0])
        } else {
          users.push(newData as unknown as typeof users[0])
        }
        break
      // Add other collections as needed
    }

    console.log(`Set document in ${collection}:`, newData)
  }
}

const mockServices = {
  userService,
  businessUnitService,
  personService,
  portService,
  shipService,
  operationService,
  accountingAccountService,
  transactionTypeService,
  cashAccountService,
  bankAgencyService,
  paymentMethodService,
  transferService,
  financialTransactionService,
  clientBusinessUnitService,
  personBusinessUnitService,
  getPeopleByRegistrationType,
  searchPeople,
  mockAuth,
  mockDoc
}

export default mockServices