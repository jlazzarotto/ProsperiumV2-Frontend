/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Printer, BarChart2, Filter, Download, RefreshCw, ChevronDown, Loader2 } from "lucide-react"
import { calculateDreValues } from "@/lib/dre-calculator"
import { useDreStore } from "@/lib/dre-store"
import { formatCurrency } from "@/lib/utils"
import { motion } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DreChart } from "@/components/dre-chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DreConfigWizard } from "@/components/dre-config-wizard"

export function DreReport() {
  const { dreData } = useDreStore()
  const [calculatedData, setCalculatedData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showChart, setShowChart] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [companyInfo, setCompanyInfo] = useState({
    name: "Empresa Demonstração Ltda",
    cnpj: "12.345.678/0001-90",
    period: "Janeiro a Março de 2024",
  })

  useEffect(() => {
    if (dreData) {
      // Simulate loading for better UX
      setLoading(true)
      setTimeout(() => {
        const calculated = calculateDreValues(dreData)
        setCalculatedData(calculated)
        setLoading(false)
      }, 500)
    }
  }, [dreData])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg font-medium">Carregando dados do DRE...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!calculatedData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-6 mb-4">
                <BarChart2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum dado disponível</h3>
              <p className="text-muted-foreground mb-6">Configure seu DRE para começar a visualizar seus resultados.</p>
              <DreConfigWizard
                buttonText="Configurar DRE Agora"
                buttonVariant="default"
                className="bg-blue-600 hover:bg-blue-700" open={false} onOpenChange={function (open: boolean): void {
                  throw new Error("Function not implemented.")
                } } onComplete={function (dreId?: string): void {
                  throw new Error("Function not implemented.")
                } }              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
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

  const chartData: {
      labels: string[];
      datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string }[];
    } = {
      labels: months.map((month) => {
        return `${month.substring(4)}/${month.substring(0, 4)}`
      }),
      datasets: [],
    }

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
    if (value > 0) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    if (value < 0) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
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
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants}>
        <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
                  <BarChart2 className="h-6 w-6 mr-2" />
                  Demonstrativo de Resultado do Exercício
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  <p>
                    <span className="font-medium">Empresa:</span> {companyInfo.name}
                  </p>
                  <p>
                    <span className="font-medium">CNPJ:</span> {companyInfo.cnpj}
                  </p>
                  <p>
                    <span className="font-medium">Período:</span> {companyInfo.period}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-9 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  variant={showChart ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowChart(!showChart)}
                  className={`h-9 ${showChart ? "bg-blue-600 hover:bg-blue-700" : "bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"}`}
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  {showChart ? "Ocultar Gráfico" : "Mostrar Gráfico"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <span>Excel (.xlsx)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>PDF</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>CSV</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="h-9">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {showChart && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-b border-slate-200 dark:border-slate-800"
              >
                <div className="p-6">
                  <DreChart data={chartData} />
                </div>
              </motion.div>
            )}

            <div className="p-4">
              <ScrollArea className="max-h-[calc(100vh-300px)]">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100 dark:bg-slate-800">
                        <TableHead className="w-[300px] font-semibold">Descrição</TableHead>
                        {months.map((month) => (
                          <TableHead key={month} className="text-right font-semibold">
                            {formatMonthDisplay(month)}
                          </TableHead>
                        ))}
                        <TableHead className="text-right font-semibold">Total R$</TableHead>
                        <TableHead className="text-right font-semibold">Média ({months.length})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(calculatedData.data).map(([key, group]: [string, any]) => {
                        if (typeof group === "object" && group !== null) {
                          const rows = []

                          // Add group header
                          rows.push(
                            <TableRow
                              key={key}
                              className={`font-medium transition-colors ${getRowColor(key)}`}
                              onClick={() => setSelectedGroup(selectedGroup === key ? null : key)}
                            >
                              <TableCell className="font-semibold cursor-pointer">
                                <div className="flex items-center">
                                  <ChevronDown
                                    className={`h-4 w-4 mr-2 transition-transform ${selectedGroup === key ? "rotate-180" : ""}`}
                                  />
                                  {group.title_group}
                                </div>
                              </TableCell>
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
                                  <TableCell key={month} className="text-right">
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
                                  </TableCell>
                                )
                              })}
                              <TableCell className="text-right">
                                <Badge variant="outline" className={`font-mono ${getBadgeColor(totals[key])}`}>
                                  {formatCurrency(totals[key])}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className={`font-mono ${getBadgeColor(averages[key])}`}>
                                  {formatCurrency(averages[key])}
                                </Badge>
                              </TableCell>
                            </TableRow>,
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
                                  <TableRow key={`${key}_${subKey}`} className="text-sm bg-white dark:bg-slate-900">
                                    <TableCell className="pl-10">{subKey}</TableCell>
                                    {months.map((month) => {
                                      const value = subValue[month] !== null ? subValue[month] : null

                                      return (
                                        <TableCell key={month} className="text-right">
                                          {value !== null ? formatCurrency(value) : "-"}
                                        </TableCell>
                                      )
                                    })}
                                    <TableCell className="text-right">
                                      {formatCurrency(totals[`${key}_${subKey}`])}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {formatCurrency(averages[`${key}_${subKey}`])}
                                    </TableCell>
                                  </TableRow>,
                                )
                              }
                            })
                          }

                          return rows
                        }
                        return null
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

