"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { getAllCashAccounts } from "@/app/services/cash-account-service"
import { Loader2, RefreshCw, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CashAccount } from "@/types/types"
import { formatCurrency } from "@/lib/utils"
import { getAllFinancialTransactions } from "@/app/services/financial-transaction-service"

interface AccountBalanceCardProps {
  selectedAccountId?: string
}

// Estendendo o tipo CashAccount para incluir as propriedades calculadas
interface AccountWithBalance extends CashAccount {
  balance: number
  initialValue: number
  income: number
  expense: number
}

export function AccountBalanceCard({ selectedAccountId }: AccountBalanceCardProps) {
  const [loading, setLoading] = useState(true)
  const [totalBalance, setTotalBalance] = useState(0)
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Função para carregar os saldos
  const loadBalances = async () => {
    setLoading(true)
    try {
      // Carregar contas e transações
      const [cashAccounts, allTransactions] = await Promise.all([getAllCashAccounts(), getAllFinancialTransactions()])

      // Calcular saldos com base nas transações
      const accountsWithBalance = cashAccounts.map((account) => {
        // Converter o valor inicial da string para número
        const initialValue = Number.parseFloat(account.value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0

        // Filtrar transações desta conta
        const accountTransactions = allTransactions.filter(
          (t) => t.cashAccountId === account.id && t.status !== "cancelado",
        )

        // Calcular entradas e saídas
        const income = accountTransactions.filter((t) => t.type === "entrada").reduce((sum, t) => sum + t.value, 0)

        const expense = accountTransactions.filter((t) => t.type === "saida").reduce((sum, t) => sum + t.value, 0)

        // Saldo final = valor inicial + entradas - saídas
        const balance = initialValue + income - expense

        return {
          ...account,
          balance,
          initialValue,
          income,
          expense,
        } as AccountWithBalance
      })

      // Calcular o saldo total somando todos os saldos das contas
      const total = accountsWithBalance.reduce((sum, account) => sum + account.balance, 0)

      setTotalBalance(total)
      setAccounts(accountsWithBalance)
    } catch (error) {
      console.error("Error loading balances:", error)
    } finally {
      setLoading(false)
    }
  }

  // Configurar atualização automática ao montar o componente
  useEffect(() => {
    // Carregar saldos imediatamente
    loadBalances()

    // Configurar intervalo de atualização (a cada 30 segundos)
    const interval = setInterval(() => {
      loadBalances()
    }, 30000)

    setRefreshInterval(interval)

    // Limpar intervalo ao desmontar o componente
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [])

  // Atualizar quando o selectedAccountId mudar
  useEffect(() => {
    loadBalances()
  }, [selectedAccountId])

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600 dark:text-green-400"
    if (balance < 0) return "text-red-600 dark:text-red-400"
    return "text-slate-600 dark:text-slate-400"
  }

  // Encontrar a conta selecionada
  const selectedAccount = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) : undefined

  // Modificar a renderização para mostrar mais detalhes
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Saldo total atualizado</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={loadBalances} className="h-8 w-8">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-slate-600 dark:text-slate-400">Carregando saldos...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 dark:text-slate-400">Saldo consolidado:</span>
              <span className={`text-xl font-bold ${getBalanceColor(totalBalance)}`}>
                {formatCurrency(totalBalance)}
              </span>
            </div>

            {selectedAccountId && selectedAccount && (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    {selectedAccount.account || "Conta selecionada"}:
                  </span>
                  <span className={`text-lg font-bold ${getBalanceColor(selectedAccount.balance)}`}>
                    {formatCurrency(selectedAccount.balance)}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-2">
              <Button
                variant="link"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0 h-auto text-blue-600 dark:text-blue-400"
              >
                {isExpanded ? "Ocultar detalhes" : "Ver detalhes por conta"}
              </Button>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-800 mt-2 pt-2 max-h-60 overflow-y-auto">
                {accounts.map((account) => (
                  <div
                    key={account.id || `account-${Math.random()}`}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{account.account}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-medium ${getBalanceColor(account.balance)}`}>
                        {formatCurrency(account.balance)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {account.income > 0 && `+${formatCurrency(account.income)} `}
                        {account.expense > 0 && `-${formatCurrency(account.expense)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
