/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Service temporarily disabled - migrating to mock data
// TODO: Implement with mock-service.ts

// Mock implementations
const db: Record<string, unknown> = {}
const collection = (_db: Record<string, unknown>, _path: string) => ({})
const addDoc = async (_collection: unknown, _data: unknown) => ({ id: "mock-id" })
const updateDoc = async (_doc: unknown, _data: unknown) => {}
const deleteDoc = async (_doc: unknown) => {}
const doc = (_db: Record<string, unknown>, _path: string, _id: string) => ({})
const getDocs = async (_query: unknown) => ({ docs: [] })
const getDoc = async (_doc: unknown) => ({ id: "mock-id", exists: () => false, data: () => ({}) })
const query = (_collection: unknown, ..._args: unknown[]) => ({})
const where = (_field: string, _op: string, _value: unknown) => ({})
const orderBy = (_field: string, _direction?: string) => ({})
const serverTimestamp = () => new Date()

const COLLECTION_NAME = "bankAccounts"

// Converter Firestore data para objeto BankAccount
const convertFromFirestore = (doc: { id: string; data: () => unknown }): Record<string, unknown> => {
  const data = doc.data() as Record<string, unknown>
  return {
    id: doc.id,
    ...data,
    startDate: (data.startDate as { toDate?: () => Date })?.toDate?.(),
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.(),
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.(),
  }
}

// Adicionar nova conta bancária
export const addBankAccount = async (account: Omit<Record<string, unknown>, "id">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...account,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Erro ao adicionar conta bancária:", error)
    throw error
  }
}

// Obter todas as contas bancárias
export const getAllBankAccounts = async (): Promise<any[]> => {
  try {
    const querySnapshot = await getDocs(query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc")))
    return querySnapshot.docs.map(convertFromFirestore)
  } catch (error) {
    console.error("Erro ao obter contas bancárias:", error)
    throw error
  }
}

// Obter contas por unidade de negócio
export const getBankAccountsByBusinessUnit = async (businessUnitId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("businessUnitId", "==", businessUnitId),
      orderBy("account", "asc"),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(convertFromFirestore)
  } catch (error) {
    console.error(`Erro ao obter contas da unidade ${businessUnitId}:`, error)
    throw error
  }
}

// Obter contas por agência bancária
export const getBankAccountsByAgency = async (bankAgencyId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("bankAgencyId", "==", bankAgencyId),
      orderBy("account", "asc"),
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(convertFromFirestore)
  } catch (error) {
    console.error(`Erro ao obter contas da agência ${bankAgencyId}:`, error)
    throw error
  }
}

// Obter conta por ID
export const getBankAccountById = async (id: string): Promise<any | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return convertFromFirestore(docSnap)
    } else {
      return null
    }
  } catch (error) {
    console.error("Erro ao obter conta:", error)
    throw error
  }
}

// Atualizar conta
export const updateBankAccount = async (id: string, account: Partial<any>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...account,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Erro ao atualizar conta:", error)
    throw error
  }
}

// Excluir conta
export const deleteBankAccount = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Erro ao excluir conta:", error)
    throw error
  }
}

// Pesquisar contas
export const searchBankAccounts = async (searchTerm: string): Promise<any[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    const allAccounts = querySnapshot.docs.map(convertFromFirestore)

    return allAccounts.filter(
      (account) =>
        (account.account as string)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.value as string)?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  } catch (error) {
    console.error("Erro ao pesquisar contas:", error)
    throw error
  }
}

// Adicionar método de pagamento à conta
export const addPaymentMethodToAccount = async (accountId: string, paymentMethodId: string): Promise<void> => {
  try {
    const accountRef = doc(db, COLLECTION_NAME, accountId)
    const accountSnap = await getDoc(accountRef)

    if (accountSnap.exists()) {
      const account = convertFromFirestore(accountSnap)
      const paymentMethods = (account.paymentMethods as string[]) || []

      // Adicionar apenas se não existir
      if (!paymentMethods.includes(paymentMethodId)) {
        await updateDoc(accountRef, {
          paymentMethods: [...paymentMethods, paymentMethodId],
          updatedAt: serverTimestamp(),
        })
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar método de pagamento:", error)
    throw error
  }
}

// Remover método de pagamento da conta
export const removePaymentMethodFromAccount = async (accountId: string, paymentMethodId: string): Promise<void> => {
  try {
    const accountRef = doc(db, COLLECTION_NAME, accountId)
    const accountSnap = await getDoc(accountRef)

    if (accountSnap.exists()) {
      const account = convertFromFirestore(accountSnap)
      const paymentMethods = (account.paymentMethods as string[]) || []

      await updateDoc(accountRef, {
        paymentMethods: paymentMethods.filter((id: string) => id !== paymentMethodId),
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error("Erro ao remover método de pagamento:", error)
    throw error
  }
}

