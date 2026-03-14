/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, Save, Download, Upload, FileJson } from "lucide-react"
import { useDreStore } from "@/lib/dre-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function DreConfigForm() {
  const { dreData, setDreData } = useDreStore()
  const [localData, setLocalData] = useState<any>(dreData || {})
  const [activeTab, setActiveTab] = useState("structure")
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [jsonInput, setJsonInput] = useState("")
  const [jsonError, setJsonError] = useState("")

  useEffect(() => {
    // Extract all months from the data
    if (dreData) {
      const months = new Set<string>()

      Object.values(dreData).forEach((group: any) => {
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

      setAvailableMonths(Array.from(months).sort())
      setLocalData(dreData)
      setJsonInput(JSON.stringify(dreData, null, 2))
    }
  }, [dreData])

  const handleSave = () => {
    setDreData(localData)
  }

  const handleAddGroup = () => {
    const newGroupId = `group_${Date.now()}`
    setLocalData({
      ...localData,
      [newGroupId]: {
        multi: "0",
        title_group: "Novo Grupo",
      },
    })
  }

  const handleRemoveGroup = (groupId: string) => {
    const newData = { ...localData }
    delete newData[groupId]
    setLocalData(newData)
  }

  const handleUpdateGroup = (groupId: string, field: string, value: any) => {
    setLocalData({
      ...localData,
      [groupId]: {
        ...localData[groupId],
        [field]: value,
      },
    })
  }

  const handleAddSubitem = (groupId: string) => {
    const newSubitemId = `Novo Item ${Date.now()}`
    const newGroup = {
      ...localData[groupId],
      [newSubitemId]: {},
    }

    // Add month values
    availableMonths.forEach((month) => {
      newGroup[newSubitemId][month] = null
    })

    newGroup.multi = "1" // Set as multi when adding subitems

    setLocalData({
      ...localData,
      [groupId]: newGroup,
    })
  }

  const handleRemoveSubitem = (groupId: string, subitemId: string) => {
    const newGroup = { ...localData[groupId] }
    delete newGroup[subitemId]

    // Check if there are any subitems left
    const hasSubitems = Object.keys(newGroup).some(
      (key) => key !== "multi" && key !== "title_group" && typeof newGroup[key] === "object",
    )

    // If no subitems left, set multi to 0
    if (!hasSubitems) {
      newGroup.multi = "0"
    }

    setLocalData({
      ...localData,
      [groupId]: newGroup,
    })
  }

  const handleUpdateSubitem = (groupId: string, subitemId: string, field: string, value: any) => {
    setLocalData({
      ...localData,
      [groupId]: {
        ...localData[groupId],
        [subitemId]: {
          ...localData[groupId][subitemId],
          [field]: value,
        },
      },
    })
  }

  const handleRenameSubitem = (groupId: string, oldSubitemId: string, newSubitemId: string) => {
    if (oldSubitemId === newSubitemId) return

    const newGroup = { ...localData[groupId] }
    newGroup[newSubitemId] = { ...newGroup[oldSubitemId] }
    delete newGroup[oldSubitemId]

    setLocalData({
      ...localData,
      [groupId]: newGroup,
    })
  }

  const handleAddMonth = () => {
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    const newMonth = `${year}${month.toString().padStart(2, "0")}`

    if (availableMonths.includes(newMonth)) return

    const newMonths = [...availableMonths, newMonth].sort()
    setAvailableMonths(newMonths)

    // Add the new month to all items
    const newData = { ...localData }

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

    setLocalData(newData)
  }

  const handleRemoveMonth = (month: string) => {
    const newMonths = availableMonths.filter((m) => m !== month)
    setAvailableMonths(newMonths)

    // Remove the month from all items
    const newData = { ...localData }

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

    setLocalData(newData)
  }

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setLocalData(parsed)
      setJsonError("")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setJsonError("JSON inválido. Verifique o formato e tente novamente.")
    }
  }

  const handleExportJson = () => {
    const dataStr = JSON.stringify(localData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `dre-config-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure">Estrutura</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4 mt-4">
          <div className="flex justify-between">
            <Button onClick={handleAddGroup}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Grupo
            </Button>
            <Button onClick={handleSave} variant="default">
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
              {Object.entries(localData).map(([groupId, group]: [string, any]) => (
                <Card key={groupId}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <Input
                          value={group.title_group || ""}
                          onChange={(e) => handleUpdateGroup(groupId, "title_group", e.target.value)}
                          className="font-semibold text-lg"
                        />
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`multi-${groupId}`}
                            checked={group.multi === "1"}
                            onCheckedChange={(checked) => handleUpdateGroup(groupId, "multi", checked ? "1" : "0")}
                          />
                          <Label htmlFor={`multi-${groupId}`}>Múltiplos itens</Label>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleRemoveGroup(groupId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {group.multi === "1" ? (
                      <div className="space-y-4">
                        <Accordion type="multiple" className="w-full">
                          {Object.entries(group).map(([subKey, subValue]: [string, any]) => {
                            if (subKey !== "multi" && subKey !== "title_group" && typeof subValue === "object") {
                              return (
                                <AccordionItem key={`${groupId}-${subKey}`} value={`${groupId}-${subKey}`}>
                                  <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center justify-between w-full pr-4">
                                      <Input
                                        value={subKey}
                                        onChange={(e) => handleRenameSubitem(groupId, subKey, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full mr-2"
                                      />
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleRemoveSubitem(groupId, subKey)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="pl-4 space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <Label>ID da Conta Contábil</Label>
                                          <Input
                                            value={subValue.id_conta_contabil || ""}
                                            onChange={(e) =>
                                              handleUpdateSubitem(groupId, subKey, "id_conta_contabil", e.target.value)
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              )
                            }
                            return null
                          })}
                        </Accordion>

                        <Button variant="outline" size="sm" onClick={() => handleAddSubitem(groupId)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Item
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Fórmula (opcional)</Label>
                            <Input
                              value={group.formula || ""}
                              onChange={(e) => handleUpdateGroup(groupId, "formula", e.target.value)}
                              placeholder="Ex: (soma);rec_oper;(subtracao);impostos;"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Formato: (operação);campo1;campo2;...</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="data" className="space-y-4 mt-4">
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button onClick={handleAddMonth} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Mês
              </Button>
            </div>
            <Button onClick={handleSave} variant="default">
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-6">
              <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(120px,1fr))] gap-2 items-center">
                <div className="font-medium">Mês</div>
                {availableMonths.map((month) => {
                  // Format month from YYYYMM to MM/YYYY
                  const formattedMonth = `${month.substring(4)}/20${month.substring(2, 4)}`
                  return (
                    <div key={month} className="flex items-center justify-between">
                      <span>{formattedMonth}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMonth(month)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              {Object.entries(localData).map(([groupId, group]: [string, any]) => {
                if (group.formula) return null // Skip formula-based groups in data tab

                return (
                  <Card key={groupId} className="overflow-hidden">
                    <CardHeader className="py-3">
                      <CardTitle>{group.title_group}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {group.multi === "1" ? (
                        <div>
                          {Object.entries(group).map(([subKey, subValue]: [string, any]) => {
                            if (subKey !== "multi" && subKey !== "title_group" && typeof subValue === "object") {
                              return (
                                <div key={`${groupId}-${subKey}`} className="border-t py-2 px-4">
                                  <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(120px,1fr))] gap-2 items-center">
                                    <div className="font-medium">{subKey}</div>
                                    {availableMonths.map((month) => (
                                      <Input
                                        key={month}
                                        type="number"
                                        value={subValue[month] !== null ? subValue[month] : ""}
                                        onChange={(e) =>
                                          handleUpdateSubitem(
                                            groupId,
                                            subKey,
                                            month,
                                            e.target.value === "" ? null : e.target.value,
                                          )
                                        }
                                        className="h-8"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })}
                        </div>
                      ) : (
                        <div className="py-2 px-4">
                          <div className="grid grid-cols-[200px_repeat(auto-fill,minmax(120px,1fr))] gap-2 items-center">
                            <div className="font-medium">Valor</div>
                            {availableMonths.map((month) => (
                              <Input
                                key={month}
                                type="number"
                                value={group[month] !== null ? group[month] : ""}
                                onChange={(e) =>
                                  handleUpdateGroup(groupId, month, e.target.value === "" ? null : e.target.value)
                                }
                                className="h-8"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="json" className="space-y-4 mt-4">
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button onClick={handleImportJson} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar JSON
              </Button>
              <Button onClick={handleExportJson} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar JSON
              </Button>
            </div>
            <Button onClick={handleSave} variant="default">
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="json-input">Configuração JSON</Label>
            <div className="relative">
              <div className="absolute top-2 right-2">
                <FileJson className="h-4 w-4 text-muted-foreground" />
              </div>
              <textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-[50vh] p-4 font-mono text-sm border rounded-md resize-none"
              />
            </div>
            {jsonError && <p className="text-destructive text-sm">{jsonError}</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

