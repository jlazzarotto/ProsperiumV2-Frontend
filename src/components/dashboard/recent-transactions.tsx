/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency, getStatusColor, getTypeColor } from "@/lib/utils"
import type { FinancialTransaction } from "@/types/types"

interface RecentTransactionsProps {
  loading: boolean
  transactions: FinancialTransaction[]
  showHeader?: boolean
}

function isValidDate(dateValue: any): boolean {
  if (!dateValue) return false
  const date = new Date(dateValue)
  return !isNaN(date.getTime())
}

export function RecentTransactions({ loading, transactions, showHeader = true }: RecentTransactionsProps) {
  return (
    <div>
      {showHeader && <h3 className="text-lg font-semibold mb-4">Transações Recentes</h3>}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">Nenhuma transação encontrada</div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <div
                      className={`p-1 rounded mr-2 ${transaction.type === "entrada" ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}
                    >
                      {transaction.type === "entrada" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <h4 className="font-medium">{transaction.description}</h4>
                  </div>

                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {transaction.transactionTypeName} • {transaction.cashAccountName}
                  </div>

                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {transaction.dueDate && isValidDate(transaction.dueDate)
                      ? format(new Date(transaction.dueDate), "dd/MM/yyyy", { locale: ptBR })
                      : "-"}
                    {transaction.clientName && ` • ${transaction.clientName}`}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold ${getTypeColor(transaction.type)}`}>
                    {transaction.type === "entrada" ? "+" : "-"}
                    {formatCurrency(transaction.value)}
                  </div>

                  <Badge className={`mt-1 ${getStatusColor(transaction.status)}`}>
                    {transaction.status === "pendente" && "Pendente"}
                    {transaction.status === "baixado" && "Baixado"}
                    {transaction.status === "cancelado" && "Cancelado"}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
