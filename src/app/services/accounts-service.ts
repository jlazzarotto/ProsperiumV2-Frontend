/* eslint-disable @typescript-eslint/no-unused-vars */
// Service temporarily disabled - migrating to mock data
// TODO: Implement with mock-service.ts
import type { AccountsReceivable, AccountsPayable } from "@/types/types"

// Mock implementations
const db: Record<string, unknown> = {}
const collection = (_db: Record<string, unknown>, _path: string) => ({})
const addDoc = async (_collection: unknown, _data: unknown) => ({ id: "mock-id" })
const getDocs = async (_query: unknown) => ({ docs: [] })
const doc = (_db: Record<string, unknown>, _path: string, _id: string) => ({})
const updateDoc = async (_doc: unknown, _data: unknown) => {}
const deleteDoc = async (_doc: unknown) => {}
const query = (_collection: unknown, ..._args: unknown[]) => ({})
const where = (_field: string, _op: string, _value: unknown) => ({})
const serverTimestamp = () => new Date()

const RECEIVABLE_COLLECTION = "accountsReceivable"
const PAYABLE_COLLECTION = "accountsPayable"

// Converter Firestore data para objeto AccountsReceivable
const convertReceivableFromFirestore = (doc: { id: string; data: () => unknown }): AccountsReceivable => {
  const data = doc.data() as Record<string, unknown>
  return {
    id: doc.id,
    ...(data as Partial<AccountsReceivable>),
    dueDate: (data.dueDate as { toDate?: () => Date })?.toDate?.() || new Date(),
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.(),
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.(),
  } as AccountsReceivable
}

// Converter Firestore data para objeto AccountsPayable
const convertPayableFromFirestore = (doc: { id: string; data: () => unknown }): AccountsPayable => {
  const data = doc.data() as Record<string, unknown>
  return {
    id: doc.id,
    ...(data as Partial<AccountsPayable>),
    dueDate: (data.dueDate as { toDate?: () => Date })?.toDate?.() || new Date(),
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.(),
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.(),
  } as AccountsPayable
}

// Adicionar uma nova conta a receber
export const addAccountReceivable = async (accountData: Omit<AccountsReceivable, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, RECEIVABLE_COLLECTION), {
      ...accountData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return { id: docRef.id, ...accountData }
  } catch (error) {
    console.error("Erro ao adicionar conta a receber:", error)
    throw error
  }
}

// Adicionar uma nova conta a pagar
export const addAccountPayable = async (accountData: Omit<AccountsPayable, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, PAYABLE_COLLECTION), {
      ...accountData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return { id: docRef.id, ...accountData }
  } catch (error) {
    console.error("Erro ao adicionar conta a pagar:", error)
    throw error
  }
}

// Obter todas as contas a receber
export const getAllAccountsReceivable = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, RECEIVABLE_COLLECTION))

    return querySnapshot.docs
      .map(convertReceivableFromFirestore)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  } catch (error) {
    console.error("Erro ao obter contas a receber:", error)
    throw error
  }
}

// Obter todas as contas a pagar
export const getAllAccountsPayable = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, PAYABLE_COLLECTION))

    return querySnapshot.docs.map(convertPayableFromFirestore).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  } catch (error) {
    console.error("Erro ao obter contas a pagar:", error)
    throw error
  }
}

// Obter contas a receber por unidade de negócio
export const getAccountsReceivableByBusinessUnit = async (businessUnitId: string) => {
  try {
    const q = query(collection(db, RECEIVABLE_COLLECTION), where("businessUnitId", "==", businessUnitId))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs
      .map(convertReceivableFromFirestore)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  } catch (error) {
    console.error(`Erro ao obter contas a receber da unidade ${businessUnitId}:`, error)
    throw error
  }
}

// Obter contas a pagar por unidade de negócio
export const getAccountsPayableByBusinessUnit = async (businessUnitId: string) => {
  try {
    const q = query(collection(db, PAYABLE_COLLECTION), where("businessUnitId", "==", businessUnitId))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(convertPayableFromFirestore).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  } catch (error) {
    console.error(`Erro ao obter contas a pagar da unidade ${businessUnitId}:`, error)
    throw error
  }
}

// Atualizar uma conta a receber
export const updateAccountReceivable = async (id: string, accountData: Partial<AccountsReceivable>) => {
  try {
    const docRef = doc(db, RECEIVABLE_COLLECTION, id)

    await updateDoc(docRef, {
      ...accountData,
      updatedAt: serverTimestamp(),
    })

    return { id, ...accountData }
  } catch (error) {
    console.error(`Erro ao atualizar conta a receber com ID ${id}:`, error)
    throw error
  }
}

// Atualizar uma conta a pagar
export const updateAccountPayable = async (id: string, accountData: Partial<AccountsPayable>) => {
  try {
    const docRef = doc(db, PAYABLE_COLLECTION, id)

    await updateDoc(docRef, {
      ...accountData,
      updatedAt: serverTimestamp(),
    })

    return { id, ...accountData }
  } catch (error) {
    console.error(`Erro ao atualizar conta a pagar com ID ${id}:`, error)
    throw error
  }
}

// Excluir uma conta a receber
export const deleteAccountReceivable = async (id: string) => {
  try {
    const docRef = doc(db, RECEIVABLE_COLLECTION, id)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error(`Erro ao excluir conta a receber com ID ${id}:`, error)
    throw error
  }
}

// Excluir uma conta a pagar
export const deleteAccountPayable = async (id: string) => {
  try {
    const docRef = doc(db, PAYABLE_COLLECTION, id)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error(`Erro ao excluir conta a pagar com ID ${id}:`, error)
    throw error
  }
}

