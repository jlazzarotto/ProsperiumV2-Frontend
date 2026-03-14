/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Download, AlertCircle, ChevronDown, InfoIcon as InfoCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { calculateDreValues } from "@/lib/dre-calculator"
import { formatCurrency } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DreWizardStepReviewProps {
  data: any
}

export function DreWizardStepReview({ data }: DreWizardStepReviewProps) {
  const [calculatedData, setCalculatedData] = useState<any>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const calculated = calculateDreValues(data)
      setCalculatedData(calculated)

      // Validate data
      const validationErrors: string[] = []

      // Check for empty groups
      Object.entries(data).forEach(([, group]: [string, any]) => {
        if (group.multi === "1") {
          const items = Object.keys(group).filter((k) => k !== "multi" && k !== "title_group")
          if (items.length === 0) {
            validationErrors.push(`O grupo "${group.title_group}" não possui itens.`)
          }
        }
      })

      // Check for formula errors
      Object.entries(data).forEach(([, group]: [string, any]) => {
        if (group.formula) {
          const parts = group.formula.split(";")
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            if (!part.startsWith("(") && !part.endsWith(")") && !data[part]) {
              validationErrors.push(
                `A fórmula do grupo "${group.title_group}" referencia um grupo inexistente: "${part}".`,
              )
            }
          }
        }
      })

      setErrors(validationErrors)
    } catch {
      setErrors(["Erro ao calcular os valores do DRE. Verifique as fórmulas e os dados."])
    }
  }, [data])

  const handleExportJson = () => {
    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `dre-config-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupId]: !expandedGroups[groupId],
    })
  }

  if (!calculatedData) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Get all available months from the data
  const months = Object.keys(calculatedData.periods).sort()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Revisão do DRE</h3>
        <Button
          variant="outline"
          onClick={handleExportJson}
          className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar Configuração
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <InfoCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-400">Revisão final</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-500">
          Verifique se todos os grupos e valores estão corretos antes de finalizar a configuração do DRE.
        </AlertDescription>
      </Alert>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Estrutura do DRE</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries(data).map(([groupId, group]: [string, any]) => (
                <AccordionItem key={groupId} value={groupId}>
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <span>{group.title_group}</span>
                      <div className="flex ml-3 gap-1">
                        {group.multi === "1" && (
                          <Badge variant="outline" className="text-xs">
                            Múltiplos itens
                          </Badge>
                        )}
                        {group.formula && (
                          <Badge variant="default" className="text-xs bg-blue-600">
                            Fórmula
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {group.formula ? (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                        <p className="text-sm font-medium mb-1">Fórmula:</p>
                        <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-sm block">
                          {group.formula}
                        </code>
                      </div>
                    ) : group.multi === "1" ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium mb-1">Itens:</p>
                        <ul className="space-y-1">
                          {Object.entries(group).map(([key, value]: [string, any]) => {
                            if (key !== "multi" && key !== "title_group" && typeof value === "object") {
                              return (
                                <li key={key} className="flex items-center">
                                  <Check className="h-4 w-4 text-green-500 mr-2" />
                                  {key}
                                </li>
                              )
                            }
                            return null
                          })}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Item único sem fórmula.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Prévia dos Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {Object.entries(calculatedData.data).map(([key, group]: [string, any]) => {
                  if (typeof group === "object" && group !== null) {
                    return (
                      <div
                        key={key}
                        className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800"
                      >
                        <div
                          className="p-3 bg-slate-50 dark:bg-slate-900/50 font-medium flex justify-between items-center cursor-pointer"
                          onClick={() => toggleGroup(key)}
                        >
                          <span>{group.title_group}</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${expandedGroups[key] ? "rotate-180" : ""}`}
                          />
                        </div>

                        <AnimatePresence>
                          {expandedGroups[key] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="p-3">
                                {group.multi === "1" ? (
                                  <div className="space-y-3">
                                    {Object.entries(group).map(([subKey, subValue]: [string, any]) => {
                                      if (
                                        subKey !== "multi" &&
                                        subKey !== "title_group" &&
                                        typeof subValue === "object"
                                      ) {
                                        return (
                                          <div
                                            key={subKey}
                                            className="pl-4 border-l-2 border-slate-200 dark:border-slate-700"
                                          >
                                            <p className="text-sm font-medium mb-1">{subKey}</p>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                              {months.slice(0, 3).map((month) => (
                                                <div key={month} className="flex justify-between">
                                                  <span className="text-muted-foreground">
                                                    {month.substring(4)}/{month.substring(2, 4)}:
                                                  </span>
                                                  <span>
                                                    {subValue[month] !== null ? formatCurrency(subValue[month]) : "-"}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )
                                      }
                                      return null
                                    })}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    {months.slice(0, 3).map((month) => (
                                      <div key={month} className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          {month.substring(4)}/{month.substring(2, 4)}:
                                        </span>
                                        <span>
                                          {calculatedData.data[key][month] !== null
                                            ? formatCurrency(calculatedData.data[key][month])
                                            : "-"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start">
          <div className="rounded-full bg-green-100 dark:bg-green-800 p-2 mr-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-400">Tudo pronto!</h3>
            <p className="text-green-700 dark:text-green-500 text-sm mt-1">
              Sua configuração do DRE está pronta para ser salva. Clique em &quot;Finalizar&quot; para aplicar as alterações.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

