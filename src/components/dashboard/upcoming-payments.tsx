/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import type { FinancialTransaction } from "@/types/types"

interface UpcomingPaymentsProps {
  loading: boolean
  transactions: FinancialTransaction[]
}

function isValidDate(dateValue: any): boolean {
  if (!dateValue) return false
  const date = new Date(dateValue)
  return !isNaN(date.getTime())
}

export function UpcomingPayments({ loading, transactions }: UpcomingPaymentsProps) {
  // Ordenar por data de vencimento (mais próximos primeiro)
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Pagamentos Próximos</h3>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : sortedTransactions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">Nenhum pagamento pendente</div>
      ) : (
        <div className="space-y-4">
          {sortedTransactions.map((transaction) => {
            const daysUntilDue = transaction.dueDate ? differenceInDays(new Date(transaction.dueDate), new Date()) : 0

            const isOverdue = daysUntilDue < 0
            const isToday = daysUntilDue === 0
            const isSoon = daysUntilDue > 0 && daysUntilDue <= 3

            return (
              <div
                key={transaction.id}
                className={`p-4 rounded-lg border ${
                  isOverdue
                    ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                    : isToday
                      ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      {isOverdue ? (
                        <AlertCircle className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                      ) : (
                        <Clock className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                      )}
                      <h4 className="font-medium">{transaction.description}</h4>
                    </div>

                    <div className="mt-1 text-sm">
                      {transaction.dueDate && (
                        <span
                          className={`${
                            isOverdue
                              ? "text-red-600 dark:text-red-400"
                              : isToday
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          Vencimento:{" "}
                          {transaction.dueDate && isValidDate(transaction.dueDate)
                            ? format(new Date(transaction.dueDate), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {transaction.cashAccountName}
                      {transaction.clientName && ` • ${transaction.clientName}`}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-red-600 dark:text-red-400">{formatCurrency(transaction.value)}</div>

                    <Badge
                      className={`mt-1 ${
                        isOverdue
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : isToday
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                    >
                      {isOverdue
                        ? `Atrasado ${Math.abs(daysUntilDue)} dias`
                        : isToday
                          ? "Vence hoje"
                          : `Vence em ${daysUntilDue} dias`}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
