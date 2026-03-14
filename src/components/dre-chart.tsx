"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface DreChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
}

export function DreChart({ data }: DreChartProps) {
  const lineChartRef = useRef<HTMLCanvasElement | null>(null)
  const barChartRef = useRef<HTMLCanvasElement | null>(null)
  const { theme } = useTheme()

  const isDark = theme === "dark"

  const textColor = isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.7)"
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

  useEffect(() => {
    let lineChart: Chart | null = null
    let barChart: Chart | null = null

    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext("2d")

      if (ctx) {
        lineChart = new Chart(ctx, {
          type: "line",
          data: data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              tooltip: {
                enabled: true,
                mode: "index",
                intersect: false,
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label || ""
                    if (label) {
                      label += ": "
                    }
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(context.parsed.y)
                    }
                    return label
                  },
                },
              },
              legend: {
                position: "top",
                labels: {
                  color: textColor,
                  font: {
                    size: 12,
                  },
                  usePointStyle: true,
                  pointStyle: "circle",
                },
              },
            },
            scales: {
              x: {
                grid: {
                  color: gridColor,
                },
                ticks: {
                  color: textColor,
                },
              },
              y: {
                grid: {
                  color: gridColor,
                },
                ticks: {
                  color: textColor,
                  callback: (value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(value as number),
                },
              },
            },
          },
        })
      }
    }

    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext("2d")

      if (ctx) {
        barChart = new Chart(ctx, {
          type: "bar",
          data: data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              tooltip: {
                enabled: true,
                mode: "index",
                intersect: false,
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label || ""
                    if (label) {
                      label += ": "
                    }
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(context.parsed.y)
                    }
                    return label
                  },
                },
              },
              legend: {
                position: "top",
                labels: {
                  color: textColor,
                  font: {
                    size: 12,
                  },
                  usePointStyle: true,
                  pointStyle: "circle",
                },
              },
            },
            scales: {
              x: {
                grid: {
                  color: gridColor,
                },
                ticks: {
                  color: textColor,
                },
              },
              y: {
                grid: {
                  color: gridColor,
                },
                ticks: {
                  color: textColor,
                  callback: (value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(value as number),
                },
              },
            },
          },
        })
      }
    }

    return () => {
      if (lineChart) {
        lineChart.destroy()
      }
      if (barChart) {
        barChart.destroy()
      }
    }
  }, [data, isDark, textColor, gridColor])

  return (
    <Card className="p-4 border-0 bg-white dark:bg-slate-900">
      <Tabs defaultValue="line" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">Evolução Financeira</h3>
          <TabsList>
            <TabsTrigger value="line">Linha</TabsTrigger>
            <TabsTrigger value="bar">Barras</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="line" className="mt-0">
          <div className="h-[300px]">
            <canvas ref={lineChartRef} />
          </div>
        </TabsContent>

        <TabsContent value="bar" className="mt-0">
          <div className="h-[300px]">
            <canvas ref={barChartRef} />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

