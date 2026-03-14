"use client"

import { ResponsiveLine } from "@nivo/line"
import type { FinancialTransaction } from "@/types/types"

interface TransactionTrendsProps {
  transactions: FinancialTransaction[]
}

export function TransactionTrends({ transactions }: TransactionTrendsProps) {
  // Preparar dados para o gráfico de linha
  const getLineData = () => {
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

    const balanceData = monthLabels.map((month, i) => {
      const income = incomeData[i].y
      const expense = expenseData[i].y

      return {
        x: month,
        y: income - expense,
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
      {
        id: "Saldo",
        color: "hsl(230, 71%, 50%)",
        data: balanceData,
      },
    ]
  }

  return (
    <div className="h-[300px]">
      <ResponsiveLine
        data={getLineData()}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: "auto", max: "auto", stacked: false, reverse: false }}
        yFormat=" >-.2f"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Mês",
          legendOffset: 36,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Valor (R$)",
          legendOffset: -40,
          legendPosition: "middle",
          format: (value) => `R$${value / 1000}k`,
        }}
        pointSize={10}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        legends={[
          {
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: "left-to-right",
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: "circle",
            symbolBorderColor: "rgba(0, 0, 0, .5)",
            effects: [
              {
                on: "hover",
                style: {
                  itemBackground: "rgba(0, 0, 0, .03)",
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
      />
    </div>
  )
}
