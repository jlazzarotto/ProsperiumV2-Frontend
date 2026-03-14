"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import type { AccountsPayable } from "@/types/types"
import { formatCurrency } from "@/utils/format"

Chart.register(...registerables)

interface UpcomingPaymentsChartProps {
  payables: AccountsPayable[]
}

export function UpcomingPaymentsChart({ payables }: UpcomingPaymentsChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || !payables.length) return

    // Filtrar contas a pagar para os próximos 15 dias
    const today = new Date()
    const in15Days = new Date()
    in15Days.setDate(today.getDate() + 15)

    const upcomingPayables = payables.filter((item) => {
      const dueDate = item.dueDate instanceof Date ? item.dueDate : new Date(item.dueDate)
      return dueDate >= today && dueDate <= in15Days && !item.paid
    })

    // Ordenar por data de vencimento
    upcomingPayables.sort((a, b) => {
      const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate)
      const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate)
      return dateA.getTime() - dateB.getTime()
    })

    // Limitar a 10 itens para melhor visualização
    const limitedPayables = upcomingPayables.slice(0, 10)

    // Processar dados para o gráfico
    const labels = limitedPayables.map((item) => {
      const dueDate = item.dueDate instanceof Date ? item.dueDate : new Date(item.dueDate)
      return `${item.description.substring(0, 15)}${item.description.length > 15 ? "..." : ""} (${dueDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })})`
    })

    const values = limitedPayables.map((item) => {
      return typeof item.amount === "string"
        ? Number.parseFloat(item.amount.replace(/[^\d,.-]/g, "").replace(",", "."))
        : item.amount || 0
    })

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Criar novo gráfico
    const ctx = chartRef.current.getContext("2d")
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: "rgba(239, 68, 68, 0.7)",
              borderColor: "rgba(239, 68, 68, 1)",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (context) => formatCurrency(context.parsed.x),
              },
            },
          },
          scales: {
            x: {
              ticks: {
                callback: (value) => formatCurrency(Number(value)),
              },
            },
            y: {
              grid: {
                display: false,
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
  }, [payables])

  return <canvas ref={chartRef} />
}

