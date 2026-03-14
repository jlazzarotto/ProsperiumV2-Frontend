import type { CashAccount, FinancialTransaction } from "@/types/types"
import { cashAccountService } from "@/lib/mock-service"
import { getAllFinancialTransactions } from "./financial-transaction-service"

// Calcular saldos atuais das contas com base nas transações
export const calculateAccountBalances = async (accounts: CashAccount[]): Promise<CashAccount[]> => {
  try {
    // Buscar todas as transações
    const transactions = await getAllFinancialTransactions()

    // Calcular saldos para cada conta
    return accounts.map((account) => {
      // Converter o valor inicial da string para número
      const initialValue = Number.parseFloat(account.value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0

      // Filtrar transações desta conta (excluindo canceladas)
      const accountTransactions = transactions.filter((t) => t.cashAccountId === account.id && t.status !== "cancelado")

      // Calcular entradas e saídas
      const income = accountTransactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.value, 0)

      const expense = accountTransactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.value, 0)

      // Calcular saldo atual
      const currentBalance = initialValue + income - expense

      return {
        ...account,
        income,
        expense,
        currentBalance,
      }
    })
  } catch (error) {
    console.error("Erro ao calcular saldos das contas:", error)
    throw error
  }
}

// Adicionar uma nova conta caixa
export const addCashAccount = async (accountData: Omit<CashAccount, "id" | "createdAt" | "updatedAt">) => {
  try {
    if (!accountData.code) {
      const timestamp = Date.now()
      accountData.code = `CASH-${timestamp}`
    }

    const id = await cashAccountService.add({
      ...accountData,
      income: 0,
      expense: 0,
      currentBalance: Number.parseFloat(accountData.value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0,
    })

    return { id, ...accountData }
  } catch (error) {
    console.error("Erro ao adicionar conta caixa:", error)
    throw error
  }
}

// Obter todas as contas caixa com saldos atualizados
export const getAllCashAccounts = async () => {
  try {
    const accounts = await cashAccountService.getAll()
    const sortedAccounts = accounts.sort((a, b) => a.account.localeCompare(b.account))

    // Calcular saldos atuais
    return calculateAccountBalances(sortedAccounts)
  } catch (error) {
    console.error("Erro ao obter contas caixa:", error)
    throw error
  }
}

// Obter contas por unidade de negócio com saldos atualizados
export const getCashAccountsByBusinessUnit = async (businessUnitId: string) => {
  try {
    const accounts = await cashAccountService.getByField("businessUnitId", businessUnitId)
    const sortedAccounts = accounts.sort((a, b) => a.account.localeCompare(b.account))

    // Calcular saldos atuais
    return calculateAccountBalances(sortedAccounts)
  } catch (error) {
    console.error(`Erro ao obter contas da unidade ${businessUnitId}:`, error)
    throw error
  }
}

// Obter uma conta caixa pelo ID com saldo atualizado
export const getCashAccountById = async (id: string) => {
  try {
    const account = await cashAccountService.getById(id)

    if (account) {
      // Calcular saldo atual
      const accountsWithBalances = await calculateAccountBalances([account])
      return accountsWithBalances[0]
    }

    return null
  } catch (error) {
    console.error(`Erro ao obter conta caixa com ID ${id}:`, error)
    throw error
  }
}

// Atualizar uma conta caixa
export const updateCashAccount = async (id: string, accountData: Partial<CashAccount>) => {
  try {
    // Se o valor inicial (value) foi atualizado, recalcular o saldo atual
    let updateData = { ...accountData }

    if (accountData.value) {
      // Buscar a conta atual para obter income e expense
      const currentAccount = await getCashAccountById(id)
      if (currentAccount) {
        const initialValue = Number.parseFloat(accountData.value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0
        const currentBalance = initialValue + (currentAccount.income || 0) - (currentAccount.expense || 0)

        updateData = {
          ...updateData,
          currentBalance,
        }
      }
    }

    await cashAccountService.update(id, updateData)

    return { id, ...accountData }
  } catch (error) {
    console.error(`Erro ao atualizar conta caixa com ID ${id}:`, error)
    throw error
  }
}

// Excluir uma conta caixa
export const deleteCashAccount = async (id: string) => {
  try {
    await cashAccountService.delete(id)
    return true
  } catch (error) {
    console.error(`Erro ao excluir conta caixa com ID ${id}:`, error)
    throw error
  }
}

// Pesquisar contas caixa com saldos atualizados
export const searchCashAccounts = async (searchTerm: string) => {
  try {
    const accounts = await getAllCashAccounts()

    const lowerSearchTerm = searchTerm.toLowerCase()

    return accounts.filter(
      (account) =>
        account.account.toLowerCase().includes(lowerSearchTerm) ||
        account.code.toLowerCase().includes(lowerSearchTerm) ||
        account.value.toLowerCase().includes(lowerSearchTerm),
    )
  } catch (error) {
    console.error("Erro ao pesquisar contas caixa:", error)
    throw error
  }
}

// Atualizar saldos após uma transação
export const updateAccountBalanceAfterTransaction = async (
  transaction: FinancialTransaction,
  isNew = true,
  oldTransaction?: FinancialTransaction,
) => {
  try {
    if (!transaction.cashAccountId) return

    const account = await getCashAccountById(transaction.cashAccountId)
    if (!account) return

    let incomeChange = 0
    let expenseChange = 0

    // Se for uma nova transação ou atualização de status
    if (isNew || !oldTransaction) {
      // Ignorar transações canceladas
      if (transaction.status === "cancelado") return

      // Adicionar ao income ou expense
      if (transaction.type === "entrada") {
        incomeChange = transaction.value
      } else {
        expenseChange = transaction.value
      }
    }
    // Se for uma atualização de transação existente
    else {
      // Remover valores antigos (se não estiver cancelada)
      if (oldTransaction.status !== "cancelado") {
        if (oldTransaction.type === "entrada") {
          incomeChange -= oldTransaction.value
        } else {
          expenseChange -= oldTransaction.value
        }
      }

      // Adicionar novos valores (se não estiver cancelada)
      if (transaction.status !== "cancelado") {
        if (transaction.type === "entrada") {
          incomeChange += transaction.value
        } else {
          expenseChange += transaction.value
        }
      }
    }

    // Atualizar saldos da conta
    const newIncome = (account.income || 0) + incomeChange
    const newExpense = (account.expense || 0) + expenseChange
    const initialValue = Number.parseFloat(account.value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0
    const newBalance = initialValue + newIncome - newExpense

    // Salvar atualizações
    await cashAccountService.update(account.id!, {
      income: newIncome,
      expense: newExpense,
      currentBalance: newBalance,
    })

    return {
      ...account,
      income: newIncome,
      expense: newExpense,
      currentBalance: newBalance,
    }
  } catch (error) {
    console.error("Erro ao atualizar saldo da conta após transação:", error)
    throw error
  }
}
