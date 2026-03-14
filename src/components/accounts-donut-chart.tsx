"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
import type { CashAccount } from "@/types/types"
import { formatCurrency } from "@/utils/format"

Chart.register(...registerables)

interface AccountsDonutChartProps {
  accounts: CashAccount[]
}

export function AccountsDonutChart({ accounts }: AccountsDonutChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || !accounts.length) return

    // Filtrar contas que devem ser exibidas no dashboard
    const filteredAccounts = accounts.filter((account) => account.showInDashboard === true)

    // Processar dados para o gráfico
    const accountNames = filteredAccounts.map((account) => account.account)
    const accountValues = filteredAccounts.map((account) => {
      return Number.parseFloat(account.value.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
    })

    // Gerar cores para cada conta
    const backgroundColors = [
      "rgba(99, 102, 241, 0.8)",
      "rgba(16, 185, 129, 0.8)",
      "rgba(245, 158, 11, 0.8)",
      "rgba(239, 68, 68, 0.8)",
      "rgba(139, 92, 246, 0.8)",
      "rgba(14, 165, 233, 0.8)",
      "rgba(236, 72, 153, 0.8)",
    ]

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Criar novo gráfico
    const ctx = chartRef.current.getContext("2d")
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: accountNames,
          datasets: [
            {
              data: accountValues,
              backgroundColor: backgroundColors.slice(0, accountValues.length),
              borderColor: "rgba(255, 255, 255, 0.8)",
              borderWidth: 2,
              hoverOffset: 15,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "65%",
          plugins: {
            legend: {
              position: "right",
              labels: {
                usePointStyle: true,
                boxWidth: 8,
                padding: 15,
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || ""
                  const value = context.raw as number
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number
                  const percentage = Math.round((value / total) * 100)
                  return `${label}: ${formatCurrency(value)} (${percentage}%)`
                },
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
  }, [accounts])

  return <canvas ref={chartRef} />
}

