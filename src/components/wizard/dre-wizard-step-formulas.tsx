/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calculator, Plus, Trash2, Info, Check, InfoIcon as InfoCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DreWizardStepFormulasProps {
  data: any
  updateData: (data: any) => void
}

export function DreWizardStepFormulas({ data, updateData }: DreWizardStepFormulasProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [formula, setFormula] = useState("")
  const [operation, setOperation] = useState<string>("soma")
  const [selectedField, setSelectedField] = useState<string>("")

  // Get all groups that can be used in formulas
  const availableGroups = Object.entries(data).map(([key, group]: [string, any]) => ({
    id: key,
    title: group.title_group,
  }))

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroup(groupId)
    setFormula(data[groupId].formula || "")
  }

  const handleSaveFormula = () => {
    if (!selectedGroup) return

    const newData = { ...data }
    newData[selectedGroup].formula = formula

    updateData(newData)
  }

  const handleAddToFormula = () => {
    if (!selectedField) return

    let newFormula = formula

    if (newFormula) {
      newFormula += `;${selectedField}`
    } else {
      newFormula = `(${operation});${selectedField}`
    }

    setFormula(newFormula)
  }

  const handleAddOperation = () => {
    if (!formula) return

    const newFormula = `${formula};(${operation})`
    setFormula(newFormula)
  }

  const handleClearFormula = () => {
    setFormula("")
  }

  const isFormulaGroup = (groupId: string) => {
    return data[groupId].formula && data[groupId].formula.length > 0
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fórmulas de Cálculo</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Info className="h-4 w-4 mr-2" />
                Ajuda
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-md p-4">
              <h4 className="font-semibold mb-2">Como criar fórmulas</h4>
              <p className="text-sm mb-2">
                As fórmulas permitem calcular valores automaticamente com base em outros grupos.
              </p>
              <p className="text-sm mb-2">
                Formato: <code>(operação);grupo1;grupo2;...</code>
              </p>
              <p className="text-sm">
                Exemplo: <code>(soma);receitas;(subtracao);despesas</code>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <InfoCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-400">Dica de uso</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-500">
          Crie fórmulas para calcular automaticamente valores como &quot;Resultado Operacional&quot; ou &quot;Lucro Líquido&quot; com base
          em outros grupos do DRE.
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
                    <div
                      key={groupId}
                      className={cn(
                        "p-3 rounded-md cursor-pointer transition-colors",
                        selectedGroup === groupId ? "bg-blue-600 text-white" : "bg-card hover:bg-muted",
                      )}
                      onClick={() => handleSelectGroup(groupId)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{group.title_group}</p>
                          {isFormulaGroup(groupId) && (
                            <p className="text-xs opacity-80 mt-1">
                              <code
                                className={cn(
                                  "p-1 rounded",
                                  selectedGroup === groupId
                                    ? "bg-blue-500 dark:bg-blue-700"
                                    : "bg-slate-100 dark:bg-slate-800",
                                )}
                              >
                                {group.formula}
                              </code>
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={isFormulaGroup(groupId) ? "default" : "outline"}
                          className={cn(
                            "text-xs",
                            selectedGroup === groupId && !isFormulaGroup(groupId) && "bg-white text-blue-600",
                          )}
                        >
                          {isFormulaGroup(groupId) ? (
                            <span className="flex items-center">
                              <Calculator className="h-3 w-3 mr-1" />
                              Fórmula
                            </span>
                          ) : (
                            "Sem fórmula"
                          )}
                        </Badge>
                      </div>
                    </div>
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
          {selectedGroup ? (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>{data[selectedGroup].title_group}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="formula">Fórmula de Cálculo</Label>
                    <Button variant="ghost" size="sm" onClick={handleClearFormula} disabled={!formula}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="formula"
                      value={formula}
                      onChange={(e) => setFormula(e.target.value)}
                      placeholder="Ex: (soma);rec_oper;(subtracao);impostos"
                      className="font-mono"
                    />
                    <Button onClick={handleSaveFormula} className="bg-blue-600 hover:bg-blue-700">
                      <Check className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Formato: (operação);campo1;campo2;...</p>
                </div>

                <div className="border rounded-md p-4 space-y-4 border-slate-200 dark:border-slate-800">
                  <h4 className="font-medium">Construtor de Fórmula</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Operação</Label>
                      <Select value={operation} onValueChange={setOperation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soma">Soma (+)</SelectItem>
                          <SelectItem value="subtracao">Subtração (-)</SelectItem>
                          <SelectItem value="multiplicacao">Multiplicação (×)</SelectItem>
                          <SelectItem value="divisao">Divisão (÷)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Campo</Label>
                      <Select value={selectedField} onValueChange={setSelectedField}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleAddOperation} disabled={!formula} className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Operação
                    </Button>
                    <Button
                      onClick={handleAddToFormula}
                      disabled={!selectedField}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Campo
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Prévia da Fórmula</h4>
                  {formula ? (
                    <div className="space-y-2">
                      <code className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-sm block">{formula}</code>
                      <p className="text-sm text-muted-foreground">
                        Esta fórmula calculará valores automaticamente com base nos grupos selecionados.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma fórmula definida. Use o construtor acima para criar uma fórmula.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4 mb-4">
                <Calculator className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Configurar Fórmulas</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione um grupo da lista para configurar sua fórmula de cálculo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

