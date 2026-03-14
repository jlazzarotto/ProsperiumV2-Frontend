/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { FinancialTransaction, CashAccount } from "@/types/types"
import { ResponsivePie } from "@nivo/pie"
import { ResponsiveLine } from "@nivo/line"

interface FinancialSummaryProps {
  loading: boolean
  transactions: FinancialTransaction[]
  cashAccounts: CashAccount[]
}

export function FinancialSummary({ loading, transactions, cashAccounts }: FinancialSummaryProps) {
  const [period, setPeriod] = useState("month")
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [balance, setBalance] = useState(0)
  const [pieData, setPieData] = useState<any[]>([])
  const [lineData, setLineData] = useState<any[]>([])

  // Filtrar transações pelo período
  const filterTransactionsByPeriod = (transactions: FinancialTransaction[]) => {
    const now = new Date()
    const startDate = new Date()

    if (period === "week") {
      startDate.setDate(now.getDate() - 7)
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1)
    } else if (period === "year") {
      startDate.setFullYear(now.getFullYear() - 1)
    }

    return transactions.filter((t) => {
      if (!t.date) return false

      const tDate = new Date(t.date)
      return tDate >= startDate && tDate <= now
    })
  }

  // Atualizar cálculos quando as transações ou período mudar
  useEffect(() => {
    if (transactions.length === 0) return

    const filteredTransactions = filterTransactionsByPeriod(transactions)

    // Calcular totais
    const income = filteredTransactions
      .filter((t) => t.type === "entrada" && t.status !== "cancelado")
      .reduce((sum, t) => sum + t.value, 0)

    const expense = filteredTransactions
      .filter((t) => t.type === "saida" && t.status !== "cancelado")
      .reduce((sum, t) => sum + t.value, 0)

    const currentBalance = income - expense

    setTotalIncome(income)
    setTotalExpense(expense)
    setBalance(currentBalance)

    // Dados para o gráfico de pizza
    setPieData([
      {
        id: "Entradas",
        label: "Entradas",
        value: income,
        color: "hsl(143, 71%, 40%)",
      },
      {
        id: "Saídas",
        label: "Saídas",
        value: expense,
        color: "hsl(360, 71%, 50%)",
      },
    ])

    // Dados para o gráfico de linha
    setLineData(getLineData(transactions))
  }, [transactions, period])

  // Dados para o gráfico de linha
  const getLineData = (transactions: FinancialTransaction[]) => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    const now = new Date()
    const currentMonth = now.getMonth()

    // Últimos 6 meses
    const monthLabels = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12
      return months[monthIndex]
    })

    const incomeData = monthLabels.map((month, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12
      const year = now.getFullYear() - (currentMonth < monthIndex ? 1 : 0)

      const monthTotal = transactions
        .filter((t) => {
          if (!t.date) return false
          const tDate = new Date(t.date)
          return (
            tDate.getMonth() === monthIndex &&
            tDate.getFullYear() === year &&
            t.type === "entrada" &&
            t.status !== "cancelado"
          )
        })
        .reduce((sum, t) => sum + t.value, 0)

      return {
        x: month,
        y: monthTotal,
      }
    })

    const expenseData = monthLabels.map((month, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12
      const year = now.getFullYear() - (currentMonth < monthIndex ? 1 : 0)

      const monthTotal = transactions
        .filter((t) => {
          if (!t.date) return false
          const tDate = new Date(t.date)
          return (
            tDate.getMonth() === monthIndex &&
            tDate.getFullYear() === year &&
            t.type === "saida" &&
            t.status !== "cancelado"
          )
        })
        .reduce((sum, t) => sum + t.value, 0)

      return {
        x: month,
        y: monthTotal,
      }
    })

    return [
      {
        id: "Entradas",
        color: "hsl(143, 71%, 40%)",
        data: incomeData,
      },
      {
        id: "Saídas",
        color: "hsl(360, 71%, 50%)",
        data: expenseData,
      },
    ]
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>Visão geral das finanças</CardDescription>
          </div>
          <Tabs defaultValue="month" value={period} onValueChange={setPeriod}>
            <TabsList className="grid grid-cols-3 h-8">
              <TabsTrigger value="week" className="text-xs">
                Semana
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs">
                Mês
              </TabsTrigger>
              <TabsTrigger value="year" className="text-xs">
                Ano
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Entradas</div>
                  <div className="bg-green-100 dark:bg-green-900 p-1 rounded">
                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalIncome)}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Saídas</div>
                  <div className="bg-red-100 dark:bg-red-900 p-1 rounded">
                    <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpense)}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo</div>
                  <div
                    className={`p-1 rounded ${balance >= 0 ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}
                  >
                    {balance >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
                <div
                  className={`mt-2 text-2xl font-bold ${balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {formatCurrency(balance)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[200px]">
                <ResponsivePie
                  data={pieData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: "set2" }}
                  borderWidth={1}
                  borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                  enableArcLinkLabels={false}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                  legends={[]}
                />
              </div>

              <div className="h-[200px]">
                <ResponsiveLine
                  data={lineData}
                  margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
                  xScale={{ type: "point" }}
                  yScale={{ type: "linear", min: "auto", max: "auto", stacked: false, reverse: false }}
                  yFormat=" >-.2f"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    format: (value) => `R${value / 1000}k`,
                  }}
                  pointSize={10}
                  pointColor={{ theme: "background" }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: "serieColor" }}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  legends={[]}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
