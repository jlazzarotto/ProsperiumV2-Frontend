"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { ResponsiveBar } from "@nivo/bar"
import { ResponsiveCalendar } from "@nivo/calendar"
import { formatCurrency } from "@/lib/utils"
import type { Operation, FinancialTransaction } from "@/types/types"

interface PerformanceMetricsProps {
  loading: boolean
  operations: Operation[]
  transactions: FinancialTransaction[]
}

export function PerformanceMetrics({ loading, operations, transactions }: PerformanceMetricsProps) {
  // Calcular métricas de desempenho
  const totalOperations = operations.length
  const totalTransactions = transactions.length
  const totalIncome = transactions
    .filter((t) => t.type === "entrada" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.value, 0)
  const totalExpense = transactions
    .filter((t) => t.type === "saida" && t.status !== "cancelado")
    .reduce((sum, t) => sum + t.value, 0)
  const profit = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0

  // Dados para o gráfico de barras
  const getBarData = () => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    const now = new Date()
    const currentMonth = now.getMonth()

    // Últimos 6 meses
    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12
      const monthName = months[monthIndex]
      const year = now.getFullYear() - (currentMonth < monthIndex ? 1 : 0)

      const monthIncome = transactions
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

      const monthExpense = transactions
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

      const monthProfit = monthIncome - monthExpense

      return {
        month: monthName,
        Receitas: monthIncome,
        Despesas: monthExpense,
        Lucro: monthProfit,
      }
    })
  }

  // Dados para o calendário de atividade
  const getCalendarData = () => {
    const now = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(now.getFullYear() - 1)

    const data: { day: string; value: number }[] = []

    // Agrupar transações por dia
    transactions.forEach((transaction) => {
      if (!transaction.date) return

      const date = new Date(transaction.date)
      if (date < oneYearAgo) return

      const day = date.toISOString().split("T")[0]
      const existingDay = data.find((d) => d.day === day)

      if (existingDay) {
        existingDay.value += 1
      } else {
        data.push({ day, value: 1 })
      }
    })

    return data
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Desempenho Financeiro</CardTitle>
          <CardDescription>Receitas, despesas e lucro nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <div className="h-[350px]">
              <ResponsiveBar
                data={getBarData()}
                keys={["Receitas", "Despesas", "Lucro"]}
                indexBy="month"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: "linear" }}
                indexScale={{ type: "band", round: true }}
                colors={{ scheme: "nivo" }}
                borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Mês",
                  legendPosition: "middle",
                  legendOffset: 32,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Valor (R$)",
                  legendPosition: "middle",
                  legendOffset: -40,
                  format: (value) => `R$${value / 1000}k`,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                legends={[
                  {
                    dataFrom: "keys",
                    anchor: "bottom-right",
                    direction: "column",
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: "left-to-right",
                    itemOpacity: 0.85,
                    symbolSize: 20,
                  },
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Métricas de Desempenho</CardTitle>
          <CardDescription>Indicadores chave de performance</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Receita Total</div>
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalIncome)}
                  </div>
                </div>
                <Progress value={100} className="h-2 bg-green-100 dark:bg-green-900" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Despesas Totais</div>
                  <div className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense)}</div>
                </div>
                <Progress value={(totalExpense / totalIncome) * 100} className="h-2 bg-red-100 dark:bg-red-900" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Lucro</div>
                  <div
                    className={`text-sm font-bold ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {formatCurrency(profit)}
                  </div>
                </div>
                <Progress
                  value={Math.min(Math.max((profit / totalIncome) * 100, 0), 100)}
                  className={`h-2 ${profit >= 0 ? "bg-blue-100 dark:bg-blue-900" : "bg-amber-100 dark:bg-amber-900"}`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Margem de Lucro</div>
                  <div
                    className={`text-sm font-bold ${profitMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {profitMargin.toFixed(2)}%
                  </div>
                </div>
                <Progress
                  value={Math.min(Math.max(profitMargin, 0), 100)}
                  className={`h-2 ${profitMargin >= 0 ? "bg-purple-100 dark:bg-purple-900" : "bg-amber-100 dark:bg-amber-900"}`}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <div className="text-sm font-medium">Total de Operações</div>
                  <div className="text-sm font-bold">{totalOperations}</div>
                </div>

                <div className="flex justify-between">
                  <div className="text-sm font-medium">Total de Transações</div>
                  <div className="text-sm font-bold">{totalTransactions}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Calendário de Atividade</CardTitle>
          <CardDescription>Transações financeiras ao longo do ano</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="h-[200px]">
              <ResponsiveCalendar
                data={getCalendarData()}
                from={new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1)}
                to={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)}
                emptyColor="#eeeeee"
                colors={["#61cdbb", "#97e3d5", "#e8c1a0", "#f47560"]}
                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                yearSpacing={40}
                monthBorderColor="#ffffff"
                dayBorderWidth={2}
                dayBorderColor="#ffffff"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
