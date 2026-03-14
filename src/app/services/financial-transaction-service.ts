/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FinancialTransaction, RecurrenceSeries, TransactionFilter, User } from "@/types/types"
import { financialTransactionService } from "@/lib/mock-service"
import { updateAccountBalanceAfterTransaction } from "./cash-account-service"

// Garantir que não existam transações com IDs duplicados
const ensureUniqueTransactions = (transactions: FinancialTransaction[]): FinancialTransaction[] => {
  const uniqueMap = new Map<string, FinancialTransaction>()

  transactions.forEach((transaction) => {
    if (transaction.id) {
      uniqueMap.set(transaction.id, transaction)
    }
  })

  return Array.from(uniqueMap.values())
}

// Atualizar status da transação com suporte a pagamentos parciais
export const updateTransactionStatus = async (
  id: string,
  status: "pendente" | "baixado" | "cancelado",
  paymentDate?: Date,
  paymentValue?: number,
  currentUser?: User,
): Promise<{ transaction: FinancialTransaction; complementaryTransaction?: FinancialTransaction }> => {
  try {
    const originalTransaction = await financialTransactionService.getById(id)

    if (!originalTransaction) {
      throw new Error(`Transação com ID ${id} não encontrada`)
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (status === "baixado" && paymentDate) {
      updateData.paymentDate = paymentDate
    }

    // Verificar se é um pagamento parcial
    let complementaryTransaction: FinancialTransaction | undefined

    if (status === "baixado" && paymentValue !== undefined && paymentValue < originalTransaction.value) {
      // Criar transação complementar com o valor restante
      const remainingValue = originalTransaction.value - paymentValue

      // Atualizar o valor da transação original para o valor pago
      updateData.value = paymentValue
      updateData.originalValue = originalTransaction.value

      // Criar transação complementar
      const complementaryData: Omit<FinancialTransaction, "id"> = {
        ...originalTransaction,
        code: `${(originalTransaction.code ?? "").split("-")[0]}-COMP`,
        description: `Complemento de pagamento parcial: ${originalTransaction.description}`,
        value: remainingValue,
        status: "pendente",
        createdAt: new Date(),
      }

      const complementaryId = await createFinancialTransaction(complementaryData)
      complementaryTransaction = await financialTransactionService.getById(complementaryId) || undefined
    }

    // Atualizar a transação original
    await financialTransactionService.update(id, updateData)

    // Atualizar saldo da conta caixa
    if (originalTransaction.cashAccountId) {
      await updateAccountBalanceAfterTransaction({
        ...originalTransaction,
        ...updateData,
        paymentDate: paymentDate || originalTransaction.paymentDate,
      })
    }

    // Buscar a transação atualizada
    const updatedTransaction = await financialTransactionService.getById(id)

    return {
      transaction: updatedTransaction!,
      complementaryTransaction,
    }
  } catch (error) {
    console.error(`Error updating transaction status with id ${id}:`, error)
    throw error
  }
}

// Calcular saldo total com cache
let cachedTotalBalance: number | null = null
let lastBalanceCalculation = 0
const BALANCE_CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

export const calculateTotalBalance = async (forceRefresh = false): Promise<number> => {
  try {
    const now = Date.now()

    // Usar cache se disponível e não expirado
    if (!forceRefresh && cachedTotalBalance !== null && now - lastBalanceCalculation < BALANCE_CACHE_DURATION) {
      return cachedTotalBalance
    }

    const transactions = await getAllFinancialTransactions()

    const balance = transactions.reduce((total, transaction) => {
      if (transaction.status === "baixado" || transaction.status === "pendente") {
        if (transaction.type === "entrada") {
          return total + transaction.value
        } else {
          return total - transaction.value
        }
      }
      return total
    }, 0)

    // Atualizar cache
    cachedTotalBalance = balance
    lastBalanceCalculation = now

    return balance
  } catch (error) {
    console.error("Error calculating total balance:", error)
    throw error
  }
}

// Invalidar cache de saldo
export const invalidateBalanceCache = () => {
  cachedTotalBalance = null
  lastBalanceCalculation = 0
}

// Criar transação financeira com validações
export const createFinancialTransaction = async (transaction: Omit<FinancialTransaction, "id">): Promise<string> => {
  try {
    // Gerar código automático se não for fornecido
    if (!transaction.code) {
      const timestamp = Date.now()
      transaction.code = `LANC-${timestamp}`
    }

    if (!transaction.value || transaction.value <= 0) {
      throw new Error("O valor da transação deve ser maior que zero")
    }

    if (!transaction.type) {
      throw new Error("O tipo da transação (entrada/saída) é obrigatório")
    }

    if (!transaction.dueDate) {
      throw new Error("A data de vencimento é obrigatória")
    }

    // Remover o campo id se existir
    const { id, ...transactionData } = transaction as any

    const transactionId = await financialTransactionService.add(transactionData)

    // Atualizar saldo da conta caixa
    if (transaction.cashAccountId) {
      await updateAccountBalanceAfterTransaction(
        {
          ...transaction,
          id: transactionId,
        },
        true,
      )
    }

    // Invalidar cache de saldo
    invalidateBalanceCache()

    return transactionId
  } catch (error) {
    console.error("Error creating financial transaction:", error)
    throw error
  }
}

// Obter todas as transações financeiras com otimização
export const getAllFinancialTransactions = async () => {
  try {
    const transactions = await financialTransactionService.getAll()

    // Ordenar por data de vencimento decrescente
    const sortedTransactions = transactions.sort((a, b) => {
      const dateA = a.dueDate || a.date
      const dateB = b.dueDate || b.date
      return dateB.getTime() - dateA.getTime()
    })

    // Garantir transações únicas
    return ensureUniqueTransactions(sortedTransactions)
  } catch (error) {
    console.error("Erro ao obter transações financeiras:", error)
    throw error
  }
}

// Atualizar uma transação financeira com validações
export const updateFinancialTransaction = async (id: string, transactionData: Partial<FinancialTransaction>) => {
  try {
    const oldTransaction = await financialTransactionService.getById(id)

    if (!oldTransaction) {
      throw new Error(`Transação com ID ${id} não encontrada`)
    }

    // Verificar se a transação já está paga
    if (oldTransaction.status === "baixado" && !transactionData.status) {
      throw new Error("Não é possível editar uma transação já paga")
    }

    // Validar campos
    if (transactionData.value !== undefined && transactionData.value <= 0) {
      throw new Error("O valor da transação deve ser maior que zero")
    }

    await financialTransactionService.update(id, transactionData)

    // Atualizar saldo da conta caixa se necessário
    if (
      oldTransaction.cashAccountId ||
      (transactionData.cashAccountId && transactionData.cashAccountId !== oldTransaction.cashAccountId)
    ) {
      const updatedTransaction = {
        ...oldTransaction,
        ...transactionData,
      }

      await updateAccountBalanceAfterTransaction(updatedTransaction, false, oldTransaction)
    }

    // Invalidar cache de saldo
    invalidateBalanceCache()

    return { id, ...transactionData }
  } catch (error) {
    console.error(`Erro ao atualizar transação com ID ${id}:`, error)
    throw error
  }
}

// Excluir uma transação financeira com validações
export const deleteFinancialTransaction = async (id: string) => {
  try {
    const transaction = await financialTransactionService.getById(id)

    if (!transaction) {
      throw new Error(`Transação com ID ${id} não encontrada`)
    }

    // Verificar se a transação já está paga
    if (transaction.status === "baixado") {
      throw new Error("Não é possível excluir uma transação já paga")
    }

    // Atualizar saldo da conta caixa
    if (transaction.cashAccountId) {
      // Criar uma versão "cancelada" da transação para atualizar o saldo
      const canceledTransaction: FinancialTransaction = {
        ...transaction,
        status: "cancelado",
      }

      await updateAccountBalanceAfterTransaction(canceledTransaction, false, transaction)
    }

    await financialTransactionService.delete(id)

    invalidateBalanceCache()

    return true
  } catch (error) {
    console.error(`Erro ao excluir transação com ID ${id}:`, error)
    throw error
  }
}

// Criar transações recorrentes com melhorias
export const createRecurringTransactions = async (
  baseTransaction: Omit<FinancialTransaction, "id">,
  dates: Date[],
  installmentNumbers: number[],
  totalInstallments: number,
): Promise<string[]> => {
  try {
    const transactionIds: string[] = []

    // Remover o campo id se existir
    const { id, ...transactionData } = baseTransaction as any

    for (let i = 0; i < dates.length; i++) {
      const installmentNumber = installmentNumbers[i]

      const transaction: Omit<FinancialTransaction, "id"> = {
        ...transactionData,
        dueDate: dates[i],
        description: `${baseTransaction.description} (Parcela ${installmentNumber}/${totalInstallments})`,
        code: `${baseTransaction.code?.split("-")[0]}-${installmentNumber}/${totalInstallments}`,
      }

      const id = await createFinancialTransaction(transaction)
      transactionIds.push(id)
    }

    return transactionIds
  } catch (error) {
    console.error("Error creating recurring transactions:", error)
    throw error
  }
}

// Buscar transações relacionadas (recorrências)
export const getRelatedRecurringTransactions = async (baseCode: string): Promise<FinancialTransaction[]> => {
  try {
    const allTransactions = await financialTransactionService.getAll()

    // Filtrar apenas as transações que são realmente parte da mesma recorrência
    const relatedTransactions = allTransactions.filter((transaction) => {
      const parts = transaction.code?.split("-") || []
      return parts.length > 1 && parts[0] === baseCode && parts[1].includes("/")
    })

    return relatedTransactions.sort((a, b) => (a.code || "").localeCompare(b.code || ""))
  } catch (error) {
    console.error("Error fetching related recurring transactions:", error)
    return []
  }
}

// Obter resumo de transações por período
export const getTransactionsSummaryByPeriod = async (
  startDate: Date,
  endDate: Date,
  businessUnitId?: string,
): Promise<{
  totalIncome: number
  totalExpense: number
  balance: number
  pendingIncome: number
  pendingExpense: number
  paidIncome: number
  paidExpense: number
}> => {
  try {
    let transactions = await financialTransactionService.getAll()

    // Filtrar por data
    transactions = transactions.filter(t => {
      const dueDate = t.dueDate
      return dueDate >= startDate && dueDate <= endDate
    })

    // Filtrar por unidade de negócio se fornecido
    if (businessUnitId) {
      transactions = transactions.filter(t => t.businessUnitId === businessUnitId)
    }

    // Calcular totais
    let totalIncome = 0
    let totalExpense = 0
    let pendingIncome = 0
    let pendingExpense = 0
    let paidIncome = 0
    let paidExpense = 0

    transactions.forEach((transaction) => {
      if (transaction.status === "cancelado") return

      if (transaction.type === "entrada") {
        totalIncome += transaction.value

        if (transaction.status === "pendente") {
          pendingIncome += transaction.value
        } else if (transaction.status === "baixado") {
          paidIncome += transaction.value
        }
      } else {
        totalExpense += transaction.value

        if (transaction.status === "pendente") {
          pendingExpense += transaction.value
        } else if (transaction.status === "baixado") {
          paidExpense += transaction.value
        }
      }
    })

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      pendingIncome,
      pendingExpense,
      paidIncome,
      paidExpense,
    }
  } catch (error) {
    console.error("Erro ao obter resumo de transações por período:", error)
    throw error
  }
}

// Função para reabrir uma transação (cancelar baixa)
export async function reopenTransaction(transactionId: string, reason: string) {
  try {
    await financialTransactionService.update(transactionId, {
      status: "pendente",
      paymentDate: null,
      cancelReason: reason,
      reopenedAt: new Date(),
      lastUpdatedAt: new Date(),
    } as any)

    return true
  } catch (error) {
    console.error("Error reopening transaction:", error)
    throw error
  }
}

// Função para criar um lançamento de juros/multa
export async function createInterestTransaction(interestData: any) {
  try {
    const newTransaction = {
      ...interestData,
      type: "saida", // Juros/multa sempre é saída
      status: "pendente",
      code: `JUROS-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
      date: new Date(),
      dueDate: new Date(),
      competence: generateCompetenceCode(new Date()),
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
    }

    await financialTransactionService.add(newTransaction)
    return true
  } catch (error) {
    console.error("Error creating interest transaction:", error)
    throw error
  }
}

export const getFilteredFinancialTransactions = async (filter: TransactionFilter): Promise<FinancialTransaction[]> => {
  try {
    let transactions = await financialTransactionService.getAll()

    // Important: Use the dateField from the filter to determine which date field to filter on
    const dateFieldToUse = filter.dateField || "dueDate" // Default to dueDate if not specified

    // Add date range conditions based on the selected dateField
    if (filter.startDate) {
      transactions = transactions.filter(t => {
        const dateValue = (t as any)[dateFieldToUse]
        return dateValue >= filter.startDate!
      })
    }

    if (filter.endDate) {
      transactions = transactions.filter(t => {
        const dateValue = (t as any)[dateFieldToUse]
        return dateValue <= filter.endDate!
      })
    }

    // Add other filter conditions
    if (filter.clientId) {
      transactions = transactions.filter(t => t.clientId === filter.clientId)
    }

    if (filter.businessUnitId) {
      transactions = transactions.filter(t => t.businessUnitId === filter.businessUnitId)
    }

    if (filter.cashAccountId) {
      transactions = transactions.filter(t => t.cashAccountId === filter.cashAccountId)
    }

    if (filter.transactionTypeId) {
      transactions = transactions.filter(t => t.transactionTypeId === filter.transactionTypeId)
    }

    if (filter.operationId) {
      transactions = transactions.filter(t => t.operationId === filter.operationId)
    }

    if (filter.recurrenceSeriesId) {
      transactions = transactions.filter(t => (t as any).recurrenceSeriesId === filter.recurrenceSeriesId)
    }

    if (filter.type && filter.type !== "todos") {
      transactions = transactions.filter(t => t.type === filter.type)
    }

    if (filter.status && filter.status !== "todos") {
      transactions = transactions.filter(t => t.status === filter.status)
    }

    // Filter by search term if provided
    if (filter.searchField) {
      const searchTerm = filter.searchField.toLowerCase()
      transactions = transactions.filter(
        (transaction) =>
          (transaction.code?.toLowerCase() ?? "").includes(searchTerm) ||
          transaction.description.toLowerCase().includes(searchTerm) ||
          (transaction.clientName?.toLowerCase() || "").includes(searchTerm) ||
          (transaction.document?.toLowerCase() || "").includes(searchTerm),
      )
    }

    // Filter by competence if specified
    if (filter.competence) {
      transactions = transactions.filter((transaction) => {
        // Check if transaction has competence field
        if ((transaction as any).competence) {
          return (transaction as any).competence === filter.competence
        }

        // If not, calculate competence from dueDate
        const calculatedCompetence = generateCompetenceCode(transaction.dueDate)
        return calculatedCompetence === filter.competence
      })
    }

    // Order by the selected date field
    transactions.sort((a, b) => {
      const dateA = (a as any)[dateFieldToUse]
      const dateB = (b as any)[dateFieldToUse]
      return dateB.getTime() - dateA.getTime()
    })

    return transactions
  } catch (error) {
    console.error("Error fetching filtered financial transactions:", error)
    throw error
  }
}

// Function to get financial transactions with pagination
export const getFinancialTransactionsWithPagination = async (
  pageSize: number,
  startAfterIndex: number,
  filter: TransactionFilter = {},
): Promise<{ transactions: FinancialTransaction[]; lastIndex: number; totalCount: number }> => {
  try {
    const allTransactions = await getFilteredFinancialTransactions(filter)

    const totalCount = allTransactions.length
    const endIndex = startAfterIndex + pageSize
    const transactions = allTransactions.slice(startAfterIndex, endIndex)
    const lastIndex = endIndex < totalCount ? endIndex : totalCount

    return { transactions, lastIndex, totalCount }
  } catch (error) {
    console.error("Error fetching paginated financial transactions:", error)
    throw error
  }
}

function generateCompetenceCode(date: Date): string {
  if (!date) return ""
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0") // Ensure month is 2 digits
  return `${year}${month}`
}

export async function getRecurrenceSeries(): Promise<RecurrenceSeries[]> {
  try {
    // Mock implementation - retornar array vazio ou implementar storage próprio
    return []
  } catch (error) {
    console.error("Error fetching recurrence series:", error)
    return []
  }
}

export const deleteRecurrenceSeries = async (seriesId: string): Promise<void> => {
  try {
    console.log("Excluindo série de recorrência:", seriesId)

    // Buscar todas as transações da série
    const allTransactions = await financialTransactionService.getAll()
    const seriesTransactions = allTransactions.filter(
      t => (t as any).recurrenceSeriesId === seriesId && t.status !== "baixado"
    )

    if (seriesTransactions.length === 0) {
      console.log("Nenhuma transação pendente encontrada para excluir na série:", seriesId)
      return
    }

    console.log(`Encontradas ${seriesTransactions.length} transações para excluir na série ${seriesId}`)

    // Excluir cada transação individualmente
    for (const transaction of seriesTransactions) {
      // Verificar se a transação pode ser excluída
      if (transaction.status === "baixado") {
        console.log(`Transação ${transaction.id} já está paga e não será excluída`)
        continue
      }

      // Atualizar saldo da conta caixa se necessário
      if (transaction.cashAccountId) {
        // Criar uma versão "cancelada" da transação para atualizar o saldo
        const canceledTransaction: FinancialTransaction = {
          ...transaction,
          status: "cancelado",
        }

        await updateAccountBalanceAfterTransaction(canceledTransaction, false, transaction)
      }

      await financialTransactionService.delete(transaction.id!)
      console.log(`Transação ${transaction.id} excluída`)
    }

    console.log(`Série de recorrência ${seriesId} excluída com sucesso`)

    // Invalidar cache de saldo
    invalidateBalanceCache()

    return
  } catch (error) {
    console.error("Erro ao excluir série de recorrência:", error)
    throw new Error("Falha ao excluir série de recorrência")
  }
}
