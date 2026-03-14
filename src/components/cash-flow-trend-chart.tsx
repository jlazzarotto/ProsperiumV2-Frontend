"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import type { AccountsReceivable, AccountsPayable } from "@/types/types"
import { formatCurrency } from "@/utils/format"

Chart.register(...registerables)

interface CashFlowTrendChartProps {
  receivables: AccountsReceivable[]
  payables: AccountsPayable[]
  days?: number
}

export function CashFlowTrendChart({ receivables, payables, days = 30 }: CashFlowTrendChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Gerar datas para os próximos dias
    const nextDays = [...Array(days)].map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i)
      return date.toISOString().split("T")[0]
    })

    // Inicializar dados
    const receivableByDay: Record<string, number> = {}
    const payableByDay: Record<string, number> = {}
    const balanceByDay: Record<string, number> = {}

    nextDays.forEach((day) => {
      receivableByDay[day] = 0
      payableByDay[day] = 0
    })

    // Processar contas a receber
    receivables.forEach((item) => {
      const dueDate = item.dueDate instanceof Date ? item.dueDate : new Date(item.dueDate)
      const dateKey = dueDate.toISOString().split("T")[0]

      if (nextDays.includes(dateKey) && !item.paid) {
        const amount =
          typeof item.amount === "string"
            ? Number.parseFloat(item.amount.replace(/[^\d,.-]/g, "").replace(",", "."))
            : item.amount || 0

        receivableByDay[dateKey] = (receivableByDay[dateKey] || 0) + amount
      }
    })

    // Processar contas a pagar
    payables.forEach((item) => {
      const dueDate = item.dueDate instanceof Date ? item.dueDate : new Date(item.dueDate)
      const dateKey = dueDate.toISOString().split("T")[0]

      if (nextDays.includes(dateKey) && !item.paid) {
        const amount =
          typeof item.amount === "string"
            ? Number.parseFloat(item.amount.replace(/[^\d,.-]/g, "").replace(",", "."))
            : item.amount || 0

        payableByDay[dateKey] = (payableByDay[dateKey] || 0) + amount
      }
    })

    // Calcular saldo acumulado
    let runningBalance = 0
    nextDays.forEach((day) => {
      runningBalance += receivableByDay[day] - payableByDay[day]
      balanceByDay[day] = runningBalance
    })

    // Formatar datas para exibição
    const labels = nextDays.map((day) => {
      const date = new Date(day)
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    })

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Criar novo gráfico
    const ctx = chartRef.current.getContext("2d")
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Saldo Projetado",
              data: Object.values(balanceByDay),
              borderColor: "rgba(99, 102, 241, 1)",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
            },
            {
              label: "A Receber",
              data: Object.values(receivableByDay),
              borderColor: "rgba(16, 185, 129, 1)",
              backgroundColor: "transparent",
              borderWidth: 2,
              borderDash: [5, 5],
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "rgba(16, 185, 129, 1)",
            },
            {
              label: "A Pagar",
              data: Object.values(payableByDay),
              borderColor: "rgba(239, 68, 68, 1)",
              backgroundColor: "transparent",
              borderWidth: 2,
              borderDash: [5, 5],
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: "rgba(239, 68, 68, 1)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                usePointStyle: true,
                boxWidth: 6,
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  let label = context.dataset.label || ""
                  if (label) {
                    label += ": "
                  }
                  if (context.parsed.y !== null) {
                    label += formatCurrency(context.parsed.y)
                  }
                  return label
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              ticks: {
                callback: (value) => formatCurrency(Number(value)),
              },
            },
          },
        },
      })
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [receivables, payables, days])

  return <canvas ref={chartRef} />
}

