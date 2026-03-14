/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2, Calendar, InfoIcon as InfoCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DreWizardStepDataProps {
  data: any
  updateData: (data: any) => void
}

export function DreWizardStepData({ data, updateData }: DreWizardStepDataProps) {
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState("")

  useEffect(() => {
    // Extract all months from the data
    const months = new Set<string>()

    Object.values(data).forEach((group: any) => {
      if (group && typeof group === "object") {
        if (group.multi === "1") {
          Object.entries(group).forEach(([key, value]: [string, any]) => {
            if (typeof value === "object" && value !== null && key !== "multi" && key !== "title_group") {
              Object.keys(value).forEach((month) => {
                if (month.match(/^\d{6}$/)) {
                  months.add(month)
                }
              })
            }
          })
        } else {
          Object.keys(group).forEach((key) => {
            if (key.match(/^\d{6}$/)) {
              months.add(key)
            }
          })
        }
      }
    })

    // Se não houver meses, adicione o mês atual
    if (months.size === 0) {
      const now = new Date()
      const year = now.getFullYear()
      const month = (now.getMonth() + 1).toString().padStart(2, "0")
      months.add(`${year}${month}`)
    }

    setAvailableMonths(Array.from(months).sort())

    // Set first group as selected by default if none is selected
    if (!selectedGroup && Object.keys(data).length > 0) {
      setSelectedGroup(Object.keys(data)[0])
    }
  }, [data, selectedGroup])

  const handleAddMonth = () => {
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    const newMonth = `${year}${month.toString().padStart(2, "0")}`

    if (availableMonths.includes(newMonth)) return

    const newMonths = [...availableMonths, newMonth].sort()
    setAvailableMonths(newMonths)

    // Add the new month to all items
    const newData = { ...data }

    Object.keys(newData).forEach((groupId) => {
      const group = newData[groupId]

      if (group.multi === "1") {
        Object.keys(group).forEach((key) => {
          if (key !== "multi" && key !== "title_group" && typeof group[key] === "object") {
            group[key][newMonth] = null
          }
        })
      } else if (group.multi === "0" && !group.formula) {
        group[newMonth] = null
      }
    })

    updateData(newData)
  }

  const handleRemoveMonth = (month: string) => {
    const newMonths = availableMonths.filter((m) => m !== month)
    setAvailableMonths(newMonths)

    // Remove the month from all items
    const newData = { ...data }

    Object.keys(newData).forEach((groupId) => {
      const group = newData[groupId]

      if (group.multi === "1") {
        Object.keys(group).forEach((key) => {
          if (key !== "multi" && key !== "title_group" && typeof group[key] === "object") {
            delete group[key][month]
          }
        })
      } else if (group.multi === "0") {
        delete group[month]
      }
    })

    updateData(newData)
  }

  const handleAddItem = () => {
    if (!selectedGroup || !newItemName.trim()) return

    const newData = { ...data }
    const group = newData[selectedGroup]

    if (group.multi !== "1") {
      group.multi = "1"
    }

    const newItem: Record<string, any> = {}
    availableMonths.forEach((month) => {
      newItem[month] = null
    })

    group[newItemName] = newItem

    updateData(newData)
    setNewItemName("")
  }

  const handleRemoveItem = (groupId: string, itemId: string) => {
    const newData = { ...data }
    delete newData[groupId][itemId]

    // Check if there are any items left
    const hasItems = Object.keys(newData[groupId]).some(
      (key) => key !== "multi" && key !== "title_group" && typeof newData[groupId][key] === "object",
    )

    // If no items left, set multi to 0
    if (!hasItems) {
      newData[groupId].multi = "0"
    }

    updateData(newData)
  }

  const handleUpdateValue = (groupId: string, itemId: string | null, month: string, value: string) => {
    const newData = { ...data }

    if (itemId) {
      // Update multi-item value
      newData[groupId][itemId][month] = value === "" ? null : value
    } else {
      // Update single item value
      newData[groupId][month] = value === "" ? null : value
    }

    updateData(newData)
  }

  const formatMonth = (month: string) => {
    // Format month from YYYYMM to MM/YYYY
    return `${month.substring(4)}/${month.substring(2, 4)}`
  }

  const handleSelectMonth = (year: string, month: string) => {
    const newMonth = `${year}${month.padStart(2, "0")}`

    if (availableMonths.includes(newMonth)) return

    const newMonths = [...availableMonths, newMonth].sort()
    setAvailableMonths(newMonths)

    // Add the new month to all items
    const newData = { ...data }

    Object.keys(newData).forEach((groupId) => {
      const group = newData[groupId]

      if (group.multi === "1") {
        Object.keys(group).forEach((key) => {
          if (key !== "multi" && key !== "title_group" && typeof group[key] === "object") {
            group[key][newMonth] = null
          }
        })
      } else if (group.multi === "0" && !group.formula) {
        group[newMonth] = null
      }
    })

    updateData(newData)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Dados do DRE</h3>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Adicionar Mês
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Selecione o período</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="year">Ano</Label>
                      <Select onValueChange={(year) => handleSelectMonth(year, "01")}>
                        <SelectTrigger id="year">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="month">Mês</Label>
                      <Select onValueChange={(month) => handleSelectMonth("2025", month)}>
                        <SelectTrigger id="month">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString().padStart(2, "0")}>
                              {new Date(2000, month - 1, 1).toLocaleString("pt-BR", { month: "long" })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <InfoCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-400">Dica de uso</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-500">
          Selecione um grupo à esquerda e adicione os valores para cada mês. Para grupos com múltiplos itens, você pode
          adicionar novos itens conforme necessário.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Grupos</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {Object.entries(data).map(([groupId, group]: [string, any]) => (
                    <motion.div key={groupId} whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                      <div
                        className={cn(
                          "p-3 rounded-md cursor-pointer transition-colors",
                          selectedGroup === groupId ? "bg-blue-600 text-white" : "bg-card hover:bg-muted",
                        )}
                        onClick={() => setSelectedGroup(groupId)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{group.title_group}</p>
                            <p className="text-xs opacity-80">
                              {group.multi === "1"
                                ? `${Object.keys(group).filter((k) => k !== "multi" && k !== "title_group").length} itens`
                                : "Item único"}
                            </p>
                          </div>
                          <Badge variant={group.multi === "1" ? "default" : "outline"} className="text-xs">
                            {group.formula ? "Fórmula" : "Dados"}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {Object.keys(data).length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      <p className="text-muted-foreground">
                        Nenhum grupo criado. Volte ao passo anterior para criar grupos.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {selectedGroup && data[selectedGroup] ? (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{data[selectedGroup].title_group}</CardTitle>
                  {data[selectedGroup].multi === "1" && (
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Nome do novo item"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-48"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddItem}
                        disabled={!newItemName.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {data[selectedGroup].formula ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Este grupo é calculado por fórmula:</p>
                    <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-sm block">
                      {data[selectedGroup].formula}
                    </code>
                    <p className="text-sm text-muted-foreground mt-4">
                      Configure a fórmula na aba &quot;Fórmulas&quot; do assistente.
                    </p>
                  </div>
                ) : data[selectedGroup].multi === "1" ? (
                  <ScrollArea className="h-[400px]">
                    <Tabs defaultValue="table" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="table">Tabela</TabsTrigger>
                        <TabsTrigger value="form">Formulário</TabsTrigger>
                      </TabsList>

                      <TabsContent value="table" className="m-0">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="text-left p-2 border-b">Item</th>
                                {availableMonths.map((month) => (
                                  <th key={month} className="text-right p-2 border-b">
                                    <div className="flex items-center justify-end gap-1">
                                      {formatMonth(month)}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => handleRemoveMonth(month)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(data[selectedGroup]).map(([itemKey, itemValue]: [string, any]) => {
                                if (itemKey !== "multi" && itemKey !== "title_group" && typeof itemValue === "object") {
                                  return (
                                    <tr key={itemKey} className="border-b">
                                      <td className="p-2">
                                        <div className="flex items-center justify-between">
                                          <span>{itemKey}</span>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => handleRemoveItem(selectedGroup, itemKey)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </td>
                                      {availableMonths.map((month) => (
                                        <td key={month} className="p-2">
                                          <Input
                                            type="number"
                                            value={itemValue[month] !== null ? itemValue[month] : ""}
                                            onChange={(e) =>
                                              handleUpdateValue(selectedGroup, itemKey, month, e.target.value)
                                            }
                                            className="text-right h-8"
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  )
                                }
                                return null
                              })}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      <TabsContent value="form" className="m-0">
                        <div className="space-y-6">
                          {Object.entries(data[selectedGroup]).map(([itemKey, itemValue]: [string, any]) => {
                            if (itemKey !== "multi" && itemKey !== "title_group" && typeof itemValue === "object") {
                              return (
                                <Card key={itemKey} className="border-slate-200 dark:border-slate-800">
                                  <CardHeader className="py-3">
                                    <div className="flex justify-between items-center">
                                      <CardTitle className="text-base">{itemKey}</CardTitle>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveItem(selectedGroup, itemKey)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {availableMonths.map((month) => (
                                        <div key={month} className="space-y-2">
                                          <Label>{formatMonth(month)}</Label>
                                          <Input
                                            type="number"
                                            value={itemValue[month] !== null ? itemValue[month] : ""}
                                            onChange={(e) =>
                                              handleUpdateValue(selectedGroup, itemKey, month, e.target.value)
                                            }
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            }
                            return null
                          })}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </ScrollArea>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {availableMonths.map((month) => (
                        <div key={month} className="space-y-2">
                          <Label className="flex justify-between">
                            <span>{formatMonth(month)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleRemoveMonth(month)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </Label>
                          <Input
                            type="number"
                            value={data[selectedGroup][month] !== null ? data[selectedGroup][month] : ""}
                            onChange={(e) => handleUpdateValue(selectedGroup, null, month, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4 mb-4">
                <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Dados do DRE</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione um grupo da lista para inserir ou editar seus valores.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

