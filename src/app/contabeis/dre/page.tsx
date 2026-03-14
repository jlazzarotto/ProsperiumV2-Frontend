"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Loader2,
  FileBarChart,
  Download,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Settings,
  Minus,
  Plus,
  Equal,
} from "lucide-react"
import { PersonBusinessUnitSelector } from "@/components/ui/person-business-unit-selector"
import { dreService, type DreRelatorio, type DreItem } from "@/app/services/dre-service"
import { formatCurrency } from "@/lib/utils"
import customToast from "@/components/ui/custom-toast"
import type { BusinessUnit, Person } from "@/types/types"
import Link from "next/link"

export default function DrePage() {
  const [loading, setLoading] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState("")
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState("")
  const [compInicio, setCompInicio] = useState("")
  const [compFim, setCompFim] = useState("")
  const [dreData, setDreData] = useState<DreRelatorio | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    handleGenerateReport()
  }, [])

  const handlePersonChange = (personId: string, person: Person | null) => {
    setSelectedPersonId(personId)
    setSelectedBusinessUnitId("")
  }

  const handleBusinessUnitChange = (businessUnitId: string, businessUnit: BusinessUnit | null) => {
    setSelectedBusinessUnitId(businessUnitId)
  }

  const handleGenerateReport = async () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0")
    const inicio = compInicio || `${currentYear}01`
    const fim = compFim || `${currentYear}${currentMonth}`

    setLoading(true)
    try {
      const data = await dreService.getRelatorio(
        inicio,
        fim,
        selectedPersonId || undefined,
        selectedBusinessUnitId || undefined
      )
      setDreData(data)
      customToast.success("Relatório DRE gerado com sucesso!")
    } catch (error) {
      customToast.error("Erro ao gerar relatório DRE")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Identificar quais linhas são grupos (podem ser colapsados)
  const groupIndices = useMemo(() => {
    if (!dreData?.linhas) return new Map<number, number[]>()
    const map = new Map<number, number[]>()
    const linhas = dreData.linhas

    for (let i = 0; i < linhas.length; i++) {
      const item = linhas[i] as any
      if (item.tipo === "grupo") {
        const children: number[] = []
        // Coletar todos os detalhes que seguem este grupo
        for (let j = i + 1; j < linhas.length; j++) {
          const next = linhas[j] as any
          if (next.tipo === "detalhe") {
            children.push(j)
          } else {
            break
          }
        }
        if (children.length > 0) {
          map.set(i, children)
        }
      }
    }
    return map
  }, [dreData])

  const toggleGroup = useCallback((groupIndex: number) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      const key = String(groupIndex)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setCollapsedGroups(new Set())
  }, [])

  const collapseAll = useCallback(() => {
    const allGroups = new Set<string>()
    groupIndices.forEach((_, key) => allGroups.add(String(key)))
    setCollapsedGroups(allGroups)
  }, [groupIndices])

  // Verificar se uma linha está oculta (é detalhe de grupo colapsado)
  const isHidden = useCallback((index: number) => {
    for (const [groupIdx, children] of groupIndices) {
      if (children.includes(index) && collapsedGroups.has(String(groupIdx))) {
        return true
      }
    }
    return false
  }, [groupIndices, collapsedGroups])

  // Verificar se um grupo está colapsado
  const isGroupCollapsed = useCallback((index: number) => {
    return collapsedGroups.has(String(index))
  }, [collapsedGroups])

  // Verificar se uma linha é um grupo com filhos
  const hasChildren = useCallback((index: number) => {
    return groupIndices.has(index)
  }, [groupIndices])

  const getColunas = () => {
    if (!dreData || !dreData.linhas || dreData.linhas.length === 0) return []
    const primeiroItem = dreData.linhas[0]
    const todasChaves = Object.keys(primeiroItem.valores)
    const periodos = todasChaves.filter(chave => chave.includes("/"))
    const especiais = todasChaves.filter(chave => !chave.includes("/"))
    return [...periodos.sort(), ...especiais]
  }

  // Estilo da linha baseado no tipo
  const getRowStyle = (item: DreItem, index: number) => {
    const tipo = (item as any).tipo
    const isFormula = item.formula !== null && item.formula !== undefined

    // Linha calculada (=) - destaque forte
    if (isFormula || item.descricao.startsWith("=") || item.descricao.includes("(=)")) {
      return "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-t-2 border-blue-300 dark:border-blue-700"
    }

    // Grupo (linha principal) - destaque médio
    if (tipo === "grupo") {
      return "bg-slate-50 dark:bg-slate-800/70 font-semibold"
    }

    // Detalhe - mais discreto
    if (tipo === "detalhe") {
      return index % 2 === 0
        ? "bg-white dark:bg-slate-900"
        : "bg-slate-50/30 dark:bg-slate-800/20"
    }

    return index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/50"
  }

  // Ícone indicador para a descrição
  const getIndicadorIcon = (item: DreItem) => {
    const desc = item.descricao
    const isFormula = item.formula !== null && item.formula !== undefined

    if (isFormula || desc.startsWith("=") || desc.includes("(=)")) {
      return <Equal className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
    }
    if (desc.includes("(-)") || desc.startsWith("(-)")) {
      return <Minus className="h-3.5 w-3.5 text-red-500 dark:text-red-400 flex-shrink-0" />
    }
    if (desc.includes("(+)") || desc.startsWith("(+)")) {
      return <Plus className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
    }
    return null
  }

  return (
    <div className="min-h-screen">
      <MainHeader />
      <div className="w-full py-4 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <FileBarChart className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-normal text-blue-600 dark:text-blue-400">
                  DRE - Demonstrativo de Resultado do Exercício
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Relatório matricial por período
                </p>
              </div>
            </div>
            <Link href="/contabeis/dre/configuracao">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurar DRE
              </Button>
            </Link>
          </div>

          {/* Filtros */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <div>
              <PersonBusinessUnitSelector
                selectedPersonId={selectedPersonId}
                selectedBusinessUnitId={selectedBusinessUnitId}
                onPersonChange={handlePersonChange}
                onBusinessUnitChange={handleBusinessUnitChange}
                label="Filtros Opcionais - Pessoa e Unidade de Negócio"
                required={false}
                showFullInfo={false}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Deixe vazio para consolidar TODAS as pessoas e unidades de negócio
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-slate-600 dark:text-slate-400">Competência Início</Label>
                <Input
                  type="month"
                  value={compInicio ? `${compInicio.substring(0, 4)}-${compInicio.substring(4, 6)}` : ""}
                  onChange={(e) => {
                    const val = e.target.value
                    setCompInicio(val ? val.replace("-", "") : "")
                  }}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Se vazio, usa janeiro do ano atual</p>
              </div>

              <div>
                <Label className="text-sm text-slate-600 dark:text-slate-400">Competência Fim</Label>
                <Input
                  type="month"
                  value={compFim ? `${compFim.substring(0, 4)}-${compFim.substring(4, 6)}` : ""}
                  onChange={(e) => {
                    const val = e.target.value
                    setCompFim(val ? val.replace("-", "") : "")
                  }}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Se vazio, usa competência atual</p>
              </div>

              <div>
                <Label className="text-sm invisible">ㅤ</Label>
                <Button onClick={handleGenerateReport} disabled={loading} className="w-full bg-blue-600 text-white hover:bg-blue-700 h-10 mt-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileBarChart className="h-4 w-4 mr-2" />
                      Gerar DRE Consolidado
                    </>
                  )}
                </Button>
                <p className="text-xs invisible mt-1">ㅤ</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-300">
                <strong>Dica:</strong> Deixe os filtros de competência vazios para gerar de janeiro até a competência atual. Pessoa e unidade são opcionais.
              </p>
            </div>
          </div>

          {/* Tabela DRE Matricial */}
          {dreData && Array.isArray(dreData.linhas) && dreData.linhas.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">DRE Matricial - {dreData.periodo}</h2>
                  <p className="text-sm text-muted-foreground">
                    Todas as unidades consolidadas por período
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {groupIndices.size > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5 text-xs">
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                        Expandir Tudo
                      </Button>
                      <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5 text-xs">
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                        Colapsar Tudo
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-600">
                        <TableHead className="w-[350px] sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-600 p-3 text-left">
                          Descrição Contábil
                        </TableHead>
                        {getColunas().map((coluna) => (
                          <TableHead
                            key={coluna}
                            className="text-center min-w-[120px] font-bold text-slate-900 dark:text-slate-100 p-3 border-r border-slate-200 dark:border-slate-700"
                          >
                            {coluna === "Total" ? (
                              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded text-xs font-semibold">
                                TOTAL
                              </span>
                            ) : coluna === "Média" ? (
                              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded text-xs font-semibold">
                                MÉDIA
                              </span>
                            ) : (
                              <span className="text-sm">{coluna}</span>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dreData.linhas.map((item, index) => {
                        // Pular linhas ocultas (detalhes de grupos colapsados)
                        if (isHidden(index)) return null

                        const isGroup = hasChildren(index)
                        const isCollapsed = isGroupCollapsed(index)
                        const tipo = (item as any).tipo
                        const isFormula = item.formula !== null && item.formula !== undefined
                        const childCount = groupIndices.get(index)?.length || 0

                        return (
                          <TableRow
                            key={`${item.id}-${index}`}
                            className={`${getRowStyle(item, index)} border-b border-slate-100 dark:border-slate-800 transition-colors ${
                              isGroup ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
                            onClick={() => isGroup && toggleGroup(index)}
                          >
                            {/* Coluna descrição */}
                            <TableCell className="sticky left-0 z-10 bg-inherit border-r border-slate-200 dark:border-slate-700 p-3">
                              <div className={`flex items-center gap-2 ${tipo === "detalhe" ? "pl-8" : ""}`}>
                                {/* Ícone expand/collapse para grupos */}
                                {isGroup && (
                                  <button className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                    {isCollapsed ? (
                                      <ChevronRight className="h-4 w-4 text-slate-500" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-slate-500" />
                                    )}
                                  </button>
                                )}

                                {/* Indicador (+/-/=) */}
                                {getIndicadorIcon(item)}

                                {/* Indentação para detalhes */}
                                {tipo === "detalhe" && (
                                  <span className="text-slate-300 dark:text-slate-600">└</span>
                                )}

                                {/* Texto da descrição */}
                                <span
                                  className={`text-sm ${
                                    isFormula
                                      ? "font-bold text-blue-800 dark:text-blue-200"
                                      : tipo === "grupo"
                                      ? "font-semibold text-slate-800 dark:text-slate-200"
                                      : tipo === "detalhe"
                                      ? "text-slate-500 dark:text-slate-400"
                                      : "text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {(item as any).codigo
                                    ? `${(item as any).codigo} - ${item.descricao}`
                                    : item.descricao}
                                </span>

                                {/* Badge com contagem de filhos */}
                                {isGroup && isCollapsed && childCount > 0 && (
                                  <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full ml-1">
                                    {childCount}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Colunas de valores */}
                            {getColunas().map((coluna) => {
                              const valor = item.valores[coluna] || 0
                              const isTotal = coluna === "Total"
                              const isMedia = coluna === "Média"
                              const isSpecial = isTotal || isMedia

                              return (
                                <TableCell
                                  key={coluna}
                                  className={`text-right p-3 text-sm font-mono border-r border-slate-100 dark:border-slate-800 ${
                                    isTotal
                                      ? "bg-emerald-50/50 dark:bg-emerald-950/10"
                                      : isMedia
                                      ? "bg-purple-50/50 dark:bg-purple-950/10"
                                      : ""
                                  } ${isFormula ? "font-bold" : ""}`}
                                >
                                  {Math.abs(valor) < 0.01 ? (
                                    <span className="text-slate-300 dark:text-slate-600">-</span>
                                  ) : (
                                    <span
                                      className={`${
                                        valor < 0
                                          ? "text-red-600 dark:text-red-400"
                                          : valor > 0
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-slate-400"
                                      } ${isSpecial ? "font-semibold" : ""} ${
                                        isFormula ? "font-bold" : ""
                                      }`}
                                    >
                                      {formatCurrency(valor)}
                                    </span>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer stats */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{dreData.linhas.length} Linhas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>
                      {getColunas().filter((c) => c.includes("/")).length} Períodos mensais
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{dreData.unidades?.length || "Todas"} Unidades de negócio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Período: {dreData.periodo}</span>
                  </div>
                  {groupIndices.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      <span>{groupIndices.size} Grupos colapsáveis</span>
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Processando DRE...</p>
              </CardContent>
            </Card>
          )}

          {/* Estado quando tem dados mas não renderiza */}
          {!loading && dreData && (!dreData.linhas || !Array.isArray(dreData.linhas) || dreData.linhas.length === 0) && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-red-600">Erro: Dados recebidos mas estrutura inválida</p>
                <pre className="text-xs mt-2 text-left bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(dreData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Mensagem quando não há dados */}
          {!loading && !dreData && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Clique em &quot;Gerar DRE Consolidado&quot; para carregar os dados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
