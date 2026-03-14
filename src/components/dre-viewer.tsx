/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { useDreStore } from "@/lib/dre-store"
import { calculateDreValues } from "@/lib/dre-calculator"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { DreChart } from "@/components/dre-chart"
import { DreConfigWizard } from "@/components/dre-config-wizard"
import {
  ArrowLeft,
  Printer,
  Download,
  Edit,
  BarChart2,
  ChevronDown,
  Loader2,
  FileText,
  Building,
  Calendar,
} from "lucide-react"

interface DreViewerProps {
  dreId: string
  onBack: () => void
}

export function DreViewer({ dreId, onBack }: DreViewerProps) {
  const { getDreById } = useDreStore()
  const dre = getDreById(dreId)
  const [calculatedData, setCalculatedData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"table" | "chart">("table")
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showEditWizard, setShowEditWizard] = useState(false)

  useEffect(() => {
    if (dre?.data) {
      setLoading(true)
      setTimeout(() => {
        const calculated = calculateDreValues(dre.data)
        setCalculatedData(calculated)
        setLoading(false)
      }, 500)
    }
  }, [dre])

  if (!dre) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">DRE não encontrado</h2>
          <p className="text-muted-foreground mb-6">O DRE solicitado não existe ou foi removido.</p>
          <Button onClick={onBack}>Voltar para a lista</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium">Carregando dados do DRE...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!calculatedData) {
    return (
      <div className="w-full">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{dre.name}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-6 mb-4">
            <BarChart2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Dados inválidos</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Não foi possível calcular os valores do DRE. Verifique a estrutura e os dados.
          </p>
          <Button onClick={() => setShowEditWizard(true)} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="mr-2 h-4 w-4" />
            Editar DRE
          </Button>
        </div>
      </div>
    )
  }

  // Get all available months from the data
  const months = Object.keys(calculatedData.periods).sort()

  // Calculate totals for each row
  const totals: Record<string, number> = {}
  const averages: Record<string, number> = {}

  Object.entries(calculatedData.data).forEach(([key, group]: [string, any]) => {
    if (typeof group === "object" && group !== null) {
      if (group.multi === "1") {
        // For multi groups, calculate totals for each subitem
        Object.entries(group).forEach(([subKey, subValue]: [string, any]) => {
          if (typeof subValue === "object" && subValue !== null && subKey !== "multi" && subKey !== "title_group") {
            let total = 0
            let count = 0

            months.forEach((month) => {
              if (subValue[month] !== null && subValue[month] !== undefined) {
                total += Number.parseFloat(subValue[month] || 0)
                count++
              }
            })

            totals[`${key}_${subKey}`] = total
            averages[`${key}_${subKey}`] = count > 0 ? total / count : 0
          }
        })

        // Calculate group total
        let groupTotal = 0
        months.forEach((month) => {
          if (calculatedData.groupTotals[key] && calculatedData.groupTotals[key][month] !== null) {
            groupTotal += Number.parseFloat(calculatedData.groupTotals[key][month] || 0)
          }
        })

        totals[key] = groupTotal
        averages[key] = months.length > 0 ? groupTotal / months.length : 0
      } else {
        // For single items
        let total = 0
        let count = 0

        months.forEach((month) => {
          if (calculatedData.data[key][month] !== null && calculatedData.data[key][month] !== undefined) {
            total += Number.parseFloat(calculatedData.data[key][month] || 0)
            count++
          }
        })

        totals[key] = total
        averages[key] = count > 0 ? total / count : 0
      }
    }
  })

  // Prepare chart data
  const chartData: {
      labels: string[];
      datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string }[];
    } = {
      labels: months.map((month) => {
        // Format month from YYYYMM to MM/YYYY
        return `${month.substring(4)}/${month.substring(0, 4)}`
      }),
      datasets: [],
    }

  // Add datasets for key metrics
  if (calculatedData.data.rec_oper) {
    chartData.datasets.push({
      label: "Receita Bruta",
      data: months.map((month) => calculatedData.groupTotals.rec_oper?.[month] || 0),
      borderColor: "rgba(59, 130, 246, 0.8)",
      backgroundColor: "rgba(59, 130, 246, 0.2)",
    })
  }

  if (calculatedData.data.desp_oper) {
    chartData.datasets.push({
      label: "Despesas Operacionais",
      data: months.map((month) => calculatedData.groupTotals.desp_oper?.[month] || 0),
      borderColor: "rgba(239, 68, 68, 0.8)",
      backgroundColor: "rgba(239, 68, 68, 0.2)",
    })
  }

  if (calculatedData.data.lucro_liq) {
    chartData.datasets.push({
      label: "Lucro Líquido",
      data: months.map((month) => calculatedData.data.lucro_liq[month] || 0),
      borderColor: "rgba(16, 185, 129, 0.8)",
      backgroundColor: "rgba(16, 185, 129, 0.2)",
    })
  }

  // Function to get row background color based on key
  const getRowColor = (key: string) => {
    if (key === "rec_oper" || key === "rec_liq" || key === "rec_fin")
      return "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
    if (key === "lucro_bruto" || key === "res_oper" || key === "res_antes_ir" || key === "lucro_liq")
      return "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
    if (key === "desp_oper" || key === "cpr" || key === "deducoes" || key === "ir_cs")
      return "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
    return "hover:bg-slate-100 dark:hover:bg-slate-800"
  }

  // Function to get badge color based on value
  const getBadgeColor = (value: number) => {
    if (value === 0) return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
    if (value < 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
  }

  // Format month for display
  const formatMonthDisplay = (month: string) => {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]

    const monthNum = Number.parseInt(month.substring(4)) - 1
    const year = month.substring(0, 4)

    return `${monthNames[monthNum]}/${year}`
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{dre.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
              <div className="flex items-center">
                <Building className="h-3.5 w-3.5 mr-1" />
                <span>{dre.company}</span>
              </div>
              <div className="flex items-center">
                <FileText className="h-3.5 w-3.5 mr-1" />
                <span>{dre.cnpj}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>{dre.period}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700" onClick={() => setShowEditWizard(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "table" | "chart")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="table">Tabela</TabsTrigger>
            <TabsTrigger value="chart">Gráfico</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="table" className="mt-0">
          <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-lg shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300">Descrição</th>
                  {months.map((month) => (
                    <th key={month} className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {formatMonthDisplay(month)}
                    </th>
                  ))}
                  <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">Total R$</th>
                  <th className="text-right p-4 font-semibold text-slate-700 dark:text-slate-300">
                    Média ({months.length})
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(calculatedData.data).map(([key, group]: [string, any]) => {
                  if (typeof group === "object" && group !== null) {
                    const rows = []

                    // Add group header
                    rows.push(
                      <tr
                        key={key}
                        className={`font-medium transition-colors ${getRowColor(key)} cursor-pointer`}
                        onClick={() => setSelectedGroup(selectedGroup === key ? null : key)}
                      >
                        <td className="p-4 font-semibold">
                          <div className="flex items-center">
                            <ChevronDown
                              className={`h-4 w-4 mr-2 transition-transform ${selectedGroup === key ? "rotate-180" : ""}`}
                            />
                            {group.title_group}
                          </div>
                        </td>
                        {months.map((month) => {
                          const value =
                            group.multi === "1"
                              ? calculatedData.groupTotals[key] && calculatedData.groupTotals[key][month] !== null
                                ? calculatedData.groupTotals[key][month]
                                : null
                              : group[month] !== null
                                ? group[month]
                                : null

                          return (
                            <td key={month} className="p-4 text-right">
                              {value !== null ? (
                                <Badge
                                  variant="outline"
                                  className={`font-mono ${getBadgeColor(Number.parseFloat(value))}`}
                                >
                                  {formatCurrency(value)}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </td>
                          )
                        })}
                        <td className="p-4 text-right">
                          <Badge variant="outline" className={`font-mono ${getBadgeColor(totals[key])}`}>
                            {formatCurrency(totals[key])}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Badge variant="outline" className={`font-mono ${getBadgeColor(averages[key])}`}>
                            {formatCurrency(averages[key])}
                          </Badge>
                        </td>
                      </tr>,
                    )

                    // Add subitems for multi groups if expanded
                    if (group.multi === "1" && selectedGroup === key) {
                      Object.entries(group).forEach(([subKey, subValue]: [string, any]) => {
                        if (
                          typeof subValue === "object" &&
                          subValue !== null &&
                          subKey !== "multi" &&
                          subKey !== "title_group"
                        ) {
                          rows.push(
                            <tr
                              key={`${key}_${subKey}`}
                              className="text-sm bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
                            >
                              <td className="p-4 pl-10">{subKey}</td>
                              {months.map((month) => {
                                const value = subValue[month] !== null ? subValue[month] : null

                                return (
                                  <td key={month} className="p-4 text-right">
                                    {value !== null ? formatCurrency(value) : "-"}
                                  </td>
                                )
                              })}
                              <td className="p-4 text-right">{formatCurrency(totals[`${key}_${subKey}`])}</td>
                              <td className="p-4 text-right">{formatCurrency(averages[`${key}_${subKey}`])}</td>
                            </tr>,
                          )
                        }
                      })
                    }

                    return rows
                  }
                  return null
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="chart" className="mt-0">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm">
            <DreChart data={chartData} />
          </div>
        </TabsContent>
      </Tabs>

      {showEditWizard && (
        <DreConfigWizard
          open={showEditWizard}
          onOpenChange={setShowEditWizard}
          dreId={dreId}
          onComplete={() => {
            setShowEditWizard(false)
          } } buttonText={""} buttonVariant={""}        />
      )}
    </div>
  )
}

