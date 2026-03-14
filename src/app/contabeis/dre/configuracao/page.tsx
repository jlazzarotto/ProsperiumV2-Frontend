"use client"

import React, { useState, useEffect, useMemo } from "react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Settings,
  Save,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Equal,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { dreService, type DreConfig, type CreateDreConfigDto } from "@/app/services/dre-service"
import { getTiposLancamento } from "@/app/services/lancamento-service"
import type { ApiTransactionType } from "@/types/api"
import customToast from "@/components/ui/custom-toast"
import Link from "next/link"

// Estrutura fixa do DRE padrão brasileiro
interface DreSection {
  grupo: number
  label: string
  tipo: "editavel" | "calculado"
  indicador: "+" | "-" | "=" | "+/-"
  naturezaFiltro: (1 | 2)[] // quais naturezas de tp_lctos aceitar
  ordem: number
  nome: string // nome para fórmulas
  formula?: string
}

const DRE_STRUCTURE: DreSection[] = [
  { grupo: 1, label: "RECEITA OPERACIONAL BRUTA", tipo: "editavel", indicador: "+", naturezaFiltro: [1], ordem: 1, nome: "rec_oper" },
  { grupo: 2, label: "DEDUÇÕES DA RECEITA BRUTA", tipo: "editavel", indicador: "-", naturezaFiltro: [2], ordem: 2, nome: "impostos" },
  { grupo: 11, label: "ABATIMENTOS E DEDUÇÕES", tipo: "editavel", indicador: "-", naturezaFiltro: [2], ordem: 3, nome: "abatimentos" },
  { grupo: 0, label: "RECEITA OPERACIONAL LÍQUIDA", tipo: "calculado", indicador: "=", naturezaFiltro: [], ordem: 4, nome: "rec_liquida", formula: "(subtracao);rec_oper;impostos;abatimentos;" },
  { grupo: 3, label: "CUSTOS DOS SERVIÇOS PRESTADOS / VENDAS", tipo: "editavel", indicador: "-", naturezaFiltro: [2], ordem: 5, nome: "custos" },
  { grupo: 0, label: "RESULTADO OPERACIONAL BRUTO", tipo: "calculado", indicador: "=", naturezaFiltro: [], ordem: 6, nome: "resultado_bruto", formula: "(subtracao);rec_liquida;custos;" },
  { grupo: 4, label: "DESPESAS OPERACIONAIS", tipo: "editavel", indicador: "-", naturezaFiltro: [2], ordem: 7, nome: "despesas" },
  { grupo: 5, label: "RECEITAS E DESPESAS FINANCEIRAS", tipo: "editavel", indicador: "+/-", naturezaFiltro: [1, 2], ordem: 9, nome: "desp_rec_fin" },
  { grupo: 6, label: "OUTRAS RECEITAS NÃO OPERACIONAIS", tipo: "editavel", indicador: "+", naturezaFiltro: [1], ordem: 10, nome: "outras_receitas" },
  { grupo: 7, label: "INVESTIMENTO / IMOBILIZADO", tipo: "editavel", indicador: "-", naturezaFiltro: [2], ordem: 11, nome: "investimento" },
  { grupo: 0, label: "RESULTADO OPERACIONAL ANTES DO IR E CSLL", tipo: "calculado", indicador: "=", naturezaFiltro: [], ordem: 12, nome: "resultado_antes_ir", formula: "(subtracao);resultado_bruto;despesas;desp_rec_fin;investimento;" },
  { grupo: 8, label: "PROVISÃO PARA IR E CSLL", tipo: "editavel", indicador: "-", naturezaFiltro: [2], ordem: 13, nome: "ir_csll" },
  { grupo: 0, label: "LUCRO LÍQUIDO ANTES DAS PARTICIPAÇÕES", tipo: "calculado", indicador: "=", naturezaFiltro: [], ordem: 14, nome: "lucro_antes_part", formula: "(subtracao);resultado_antes_ir;ir_csll;" },
  { grupo: 9, label: "DISTRIBUIÇÃO DE LUCROS / PRÓ-LABORE", tipo: "editavel", indicador: "-", naturezaFiltro: [2], ordem: 15, nome: "distribuicao" },
  { grupo: 0, label: "RESULTADO LÍQUIDO DO EXERCÍCIO", tipo: "calculado", indicador: "=", naturezaFiltro: [], ordem: 16, nome: "resultado_liquido", formula: "(subtracao);lucro_antes_part;distribuicao;" },
]

// Item associado a um grupo (tipo de lançamento selecionado)
interface AssociatedItem {
  id_conta_contabil: string
  nome: string
  natureza: "entrada" | "saida"
  existingId?: number // ID do registro no DRE_config (se já existente)
}

// Estado por grupo
interface GroupState {
  items: AssociatedItem[]
  expanded: boolean
}

export default function DreConfigPage() {
  const [contasContabeis, setContasContabeis] = useState<ApiTransactionType[]>([])
  const [groupStates, setGroupStates] = useState<Record<number, GroupState>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Carregar dados ao montar
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [configResponse, contas] = await Promise.all([
        dreService.getConfig(),
        getTiposLancamento()
      ])

      setContasContabeis(contas)

      // Montar estado dos grupos a partir da config existente
      const config = (configResponse as any).data || configResponse
      const states: Record<number, GroupState> = {}

      // Inicializar todos os grupos editáveis
      DRE_STRUCTURE.filter(s => s.tipo === "editavel").forEach(section => {
        states[section.grupo] = { items: [], expanded: true }
      })

      // Preencher com dados existentes
      if (Array.isArray(config)) {
        config.forEach((item: DreConfig) => {
          const grupo = item.grupo
          if (!states[grupo]) {
            states[grupo] = { items: [], expanded: true }
          }

          const matchingConta = contas.find(c => String(c.id_conta_contabil) === String(item.id_conta_contabil))

          states[grupo].items.push({
            id_conta_contabil: String(item.id_conta_contabil),
            nome: item.descricao || matchingConta?.nome || "Item configurado",
            natureza: matchingConta ? (matchingConta.natureza === 1 ? "entrada" : "saida") : "saida",
            existingId: item.id,
          })
        })
      }

      setGroupStates(states)
    } catch (error) {
      customToast.error("Erro ao carregar configuração do DRE")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Adicionar conta contábil a um grupo do DRE
  const addItemToGroup = (grupo: number, contaId: string) => {
    const conta = contasContabeis.find(c => String(c.id_conta_contabil) === contaId)
    if (!conta) return

    // Verificar se já existe no grupo
    const currentItems = groupStates[grupo]?.items || []
    if (currentItems.some(item => item.id_conta_contabil === contaId)) {
      customToast.error("Esta conta contábil já está neste grupo")
      return
    }

    setGroupStates(prev => ({
      ...prev,
      [grupo]: {
        ...prev[grupo],
        expanded: true,
        items: [
          ...(prev[grupo]?.items || []),
          {
            id_conta_contabil: String(conta.id_conta_contabil),
            nome: conta.nome,
            natureza: conta.natureza === 1 ? "entrada" : "saida",
          }
        ]
      }
    }))
  }

  // Remover item de um grupo
  const removeItemFromGroup = (grupo: number, idContaContabil: string) => {
    setGroupStates(prev => ({
      ...prev,
      [grupo]: {
        ...prev[grupo],
        items: prev[grupo].items.filter(item => item.id_conta_contabil !== idContaContabil)
      }
    }))
  }

  // Toggle expand/collapse de um grupo
  const toggleGroup = (grupo: number) => {
    setGroupStates(prev => ({
      ...prev,
      [grupo]: {
        ...prev[grupo],
        expanded: !prev[grupo]?.expanded
      }
    }))
  }

  // Salvar configuração
  const handleSave = async () => {
    setSaving(true)
    try {
      const items: CreateDreConfigDto[] = []

      // Para cada seção editável, gerar os itens de config
      DRE_STRUCTURE.forEach(section => {
        if (section.tipo === "editavel") {
          const groupItems = groupStates[section.grupo]?.items || []

          if (groupItems.length === 0) return

          groupItems.forEach(item => {
            items.push({
              grupo: section.grupo,
              descricao: item.nome,
              ordem: section.ordem,
              id_conta_contabil: item.id_conta_contabil,
              nome: section.nome,
              multi: groupItems.length > 1 ? 1 : 0,
              consolidado: 1,
            })
          })
        } else if (section.tipo === "calculado" && section.formula) {
          // Adicionar linhas calculadas
          items.push({
            grupo: section.grupo || 99, // grupo 0 para calculados
            descricao: section.label,
            ordem: section.ordem,
            nome: section.nome,
            multi: 0,
            consolidado: 1,
            formula: section.formula,
          })
        }
      })

      await dreService.bulkSaveConfig(items)
      customToast.success("Configuração do DRE salva com sucesso!")
      await loadData() // Recarregar para atualizar IDs
    } catch (error) {
      customToast.error("Erro ao salvar configuração do DRE")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  // Filtrar contas contábeis disponíveis para um grupo
  const getAvailableTypes = (section: DreSection) => {
    const currentItems = groupStates[section.grupo]?.items || []
    const usedIds = new Set(currentItems.map(i => i.id_conta_contabil))

    return contasContabeis
      .filter(c => {
        // Filtrar por natureza (1=credora=entrada, 2=devedora=saída)
        if (section.naturezaFiltro.length > 0) {
          if (!section.naturezaFiltro.includes(c.natureza as 1 | 2)) return false
        }
        // Excluir já adicionadas
        if (usedIds.has(String(c.id_conta_contabil))) return false
        return true
      })
      .map(c => ({
        value: String(c.id_conta_contabil),
        label: c.nome,
        description: c.natureza === 1 ? "Credora (Entrada)" : "Devedora (Saída)",
      }))
  }

  // Contar total de itens configurados
  const totalItems = useMemo(() => {
    return Object.values(groupStates).reduce((acc, g) => acc + g.items.length, 0)
  }, [groupStates])

  const getIndicadorIcon = (indicador: string) => {
    switch (indicador) {
      case "+": return <Plus className="h-4 w-4" />
      case "-": return <Minus className="h-4 w-4" />
      case "=": return <Equal className="h-4 w-4" />
      case "+/-": return <TrendingUp className="h-4 w-4" />
      default: return null
    }
  }

  const getIndicadorColor = (indicador: string) => {
    switch (indicador) {
      case "+": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "-": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "=": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "+/-": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      default: return ""
    }
  }

  const getSectionBgColor = (section: DreSection) => {
    if (section.tipo === "calculado") {
      return "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800"
    }
    switch (section.indicador) {
      case "+": return "border-emerald-200 dark:border-emerald-800"
      case "-": return "border-red-200 dark:border-red-800"
      case "+/-": return "border-amber-200 dark:border-amber-800"
      default: return "border-slate-200 dark:border-slate-700"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <MainHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-slate-600 dark:text-slate-400">Carregando configuração do DRE...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <MainHeader />
      <div className="w-full py-4 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Settings className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-normal text-blue-600 dark:text-blue-400">
                  Configuração do DRE
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Associe contas contábeis analíticas a cada grupo do DRE
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {totalItems} itens configurados
              </Badge>
              <Button onClick={handleSave} disabled={saving} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin " />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Configuração
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              <strong>Como configurar:</strong> Expanda cada seção e adicione as contas contábeis analíticas que devem compor aquele grupo do DRE.
              As contas são filtradas automaticamente por natureza (credora=entrada / devedora=saída). As linhas com <strong>=</strong> são calculadas automaticamente.
            </p>
          </div>

          {/* Estrutura do DRE */}
          <div className="space-y-2">
            {DRE_STRUCTURE.map((section, index) => {
              const isEditable = section.tipo === "editavel"
              const groupState = groupStates[section.grupo]
              const items = groupState?.items || []
              const isExpanded = groupState?.expanded ?? true
              const availableTypes = isEditable ? getAvailableTypes(section) : []

              return (
                <Card
                  key={`${section.grupo}-${index}`}
                  className={`transition-all ${getSectionBgColor(section)} ${section.tipo === "calculado" ? "shadow-sm" : "shadow-sm hover:shadow-md"
                    }`}
                >
                  {/* Header da seção */}
                  <div
                    className={`flex items-center justify-between px-4 py-3 ${isEditable ? "cursor-pointer" : ""
                      }`}
                    onClick={() => isEditable && toggleGroup(section.grupo)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Indicador (+/-/=) */}
                      <div className={`flex items-center justify-center h-7 w-7 rounded-md ${getIndicadorColor(section.indicador)}`}>
                        {getIndicadorIcon(section.indicador)}
                      </div>

                      {/* Nome da seção */}
                      <span className={`font-semibold text-sm ${section.tipo === "calculado"
                        ? "text-blue-800 dark:text-blue-200 text-base"
                        : "text-slate-800 dark:text-slate-200"
                        }`}>
                        {section.tipo === "calculado" ? `= ${section.label}` : section.label}
                      </span>

                      {/* Badge com contagem */}
                      {isEditable && items.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {items.length} {items.length === 1 ? "item" : "itens"}
                        </Badge>
                      )}
                    </div>

                    {/* Chevron para expansão */}
                    {isEditable && (
                      <div className="flex items-center gap-2">
                        {section.naturezaFiltro.includes(1) && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs border-0">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Entrada
                          </Badge>
                        )}
                        {section.naturezaFiltro.includes(2) && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs border-0">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Saída
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    )}

                    {/* Label para calculados */}
                    {section.tipo === "calculado" && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs border-0">
                        Automático
                      </Badge>
                    )}
                  </div>

                  {/* Conteúdo expandido */}
                  {isEditable && isExpanded && (
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="space-y-2 mt-1">
                        {/* Lista de itens associados */}
                        {items.length > 0 && (
                          <div className="space-y-1.5">
                            {items.map((item) => (
                              <div
                                key={item.id_conta_contabil}
                                className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${item.natureza === "entrada"
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                                    }`} />
                                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                    {item.nome}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                                    #{item.id_conta_contabil}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeItemFromGroup(section.grupo, item.id_conta_contabil)
                                  }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Dropdown para adicionar */}
                        <div className="mt-2">
                          <SearchableSelect
                            options={availableTypes}
                            placeholder="Adicionar conta contábil..."
                            searchPlaceholder="Buscar conta contábil..."
                            emptyMessage="Nenhuma conta disponível"
                            onValueChange={(value) => {
                              addItemToGroup(section.grupo, value)
                            }}
                            className="w-full"
                          />
                        </div>

                        {items.length === 0 && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">
                            Nenhuma conta contábil associada. Use o dropdown acima para adicionar.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
