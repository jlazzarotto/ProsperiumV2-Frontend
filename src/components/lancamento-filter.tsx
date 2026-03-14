"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { DatePickerInput } from "@/components/date-picker-input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getActiveCashAccounts } from "@/app/services/cash-account-api-service"
import { getTiposLancamento } from "@/app/services/lancamento-service"
import type { LancamentoFilter, CashAccount, Person, BusinessUnit } from "@/types/types"
import type { ApiTransactionType } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { TripleSelector } from "@/components/ui/triple-selector"
import type { Tipo8BusinessUnit, Cliente } from "@/services/business-unit-service"

interface LancamentoFiltersProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilter: (filter: LancamentoFilter) => Promise<void>
  initialFilter: LancamentoFilter
  isDefaultFilter?: boolean // Indica se os filtros são os padrão iniciais (não aplicados pelo usuário)
}

export function LancamentoFilters({ open, onOpenChange, onFilter, initialFilter, isDefaultFilter = false }: LancamentoFiltersProps) {
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [tiposLancamento, setTiposLancamento] = useState<ApiTransactionType[]>([])
  
  // Estados para controlar as datas
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  
  // Estados para manter os valores do TripleSelector sincronizados
  const [tripleSelectorBusinessUnit, setTripleSelectorBusinessUnit] = useState("")
  const [tripleSelectorPerson, setTripleSelectorPerson] = useState("")
  const [tripleSelectorUnit, setTripleSelectorUnit] = useState("")

  const [filter, setFilter] = useState<LancamentoFilter>({
    page: 1,
    // Não definir limit - será adicionado como limit= pelo serviço
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadTiposLancamento(filter.natureza)
  }, [filter.natureza])

  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter)
      // Sincronizar com os estados do TripleSelector
      setTripleSelectorPerson(initialFilter.id_pessoa?.toString() || "")
      setTripleSelectorBusinessUnit(initialFilter.id_empresa?.toString() || "")
      setTripleSelectorUnit(initialFilter.id_un_negocio?.toString() || "")
    }
  }, [initialFilter])

  const loadData = async () => {
    try {
      const [accountsData, tiposData] = await Promise.all([
        getActiveCashAccounts(),
        getTiposLancamento(filter.natureza),
      ])

      setCashAccounts(accountsData)
      setTiposLancamento(tiposData)
    } catch (error) {
      console.error("Error loading filter data:", error)
    }
  }

  const loadTiposLancamento = async (natureza?: 'entrada' | 'saida') => {
    try {
      const tiposData = await getTiposLancamento(natureza)
      setTiposLancamento(tiposData)
    } catch (error) {
      console.error("Error loading tipos de lançamento:", error)
    }
  }

  useEffect(() => {
    if (!filter.id_tp_lcto) {
      return
    }

    const tipoSelecionado = tiposLancamento.find((tipo) => tipo.id_tp_lcto === filter.id_tp_lcto)
    if (tipoSelecionado) {
      return
    }

    setFilter((prev) => {
      if (!prev.id_tp_lcto) {
        return prev
      }

      const newFilter = { ...prev }
      delete newFilter.id_tp_lcto
      return newFilter
    })
  }, [filter.id_tp_lcto, tiposLancamento])

  const handleSelectChange = (field: keyof LancamentoFilter, value: string | undefined) => {
    setFilter((prev) => {
      const newFilter = { ...prev }

      if (!value || value === "todos") {
        // Remove o campo se "todos" foi selecionado
        delete newFilter[field]
      } else {
        // Define o valor numérico para os IDs
        if (
          field === 'id_tp_lcto' ||
          field === 'id_conta_contabil' ||
          field === 'id_conta_caixa' ||
          field === 'id_pessoa' ||
          field === 'id_empresa' ||
          field === 'id_un_negocio' ||
          field === 'competencia'
        ) {
          newFilter[field] = Number(value)
        } else {
          newFilter[field] = value as never
        }
      }

      return newFilter
    })
  }


  const handleDateChange = (field: 'data_inicio' | 'data_fim' | 'data_vencimento_inicio' | 'data_vencimento_fim' | 'data_pagamento_inicio' | 'data_pagamento_fim', date: Date | undefined) => {
    setFilter((prev) => {
      const newFilter = { ...prev }
      const tipoData = prev.tipoData || 'data_emissao'

      if (!date) {
        delete newFilter[field]
        // Limpar campos relacionados ao tipo atual
        if (tipoData === 'data_emissao') {
          if (field === 'data_inicio') delete newFilter.data_inicio
          if (field === 'data_fim') delete newFilter.data_fim
        } else if (tipoData === 'data_vencimento') {
          if (field === 'data_inicio') delete newFilter.data_vencimento_inicio
          if (field === 'data_fim') delete newFilter.data_vencimento_fim
        } else if (tipoData === 'data_pagamento') {
          if (field === 'data_inicio') delete newFilter.data_pagamento_inicio
          if (field === 'data_fim') delete newFilter.data_pagamento_fim
        }
      } else {
        // Criar data local para evitar problemas de timezone
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dateString = format(localDate, 'yyyy-MM-dd')

        // Mapear para o campo correto baseado no tipo de data
        if (tipoData === 'data_emissao') {
          if (field === 'data_inicio') newFilter.data_inicio = dateString
          if (field === 'data_fim') newFilter.data_fim = dateString
        } else if (tipoData === 'data_vencimento') {
          if (field === 'data_inicio') newFilter.data_vencimento_inicio = dateString
          if (field === 'data_fim') newFilter.data_vencimento_fim = dateString
        } else if (tipoData === 'data_pagamento') {
          if (field === 'data_inicio') newFilter.data_pagamento_inicio = dateString
          if (field === 'data_fim') newFilter.data_pagamento_fim = dateString
        }
      }

      return newFilter
    })
  }

  const handleApplyFilter = () => {
    onFilter(filter)
    onOpenChange(false)
  }

  const handleClearFilter = () => {
    // Limpar estados do TripleSelector
    setTripleSelectorBusinessUnit("")
    setTripleSelectorPerson("")
    setTripleSelectorUnit("")

    const clearedFilter: LancamentoFilter = {
      page: 1,
      // Não definir limit - será adicionado como limit= pelo serviço
    }
    setFilter(clearedFilter)
    onFilter(clearedFilter)
    onOpenChange(false)
  }

  const hasPeriodoFiltro =
    Boolean(filter.data_inicio) ||
    Boolean(filter.data_fim) ||
    Boolean(filter.data_vencimento_inicio) ||
    Boolean(filter.data_vencimento_fim) ||
    Boolean(filter.data_pagamento_inicio) ||
    Boolean(filter.data_pagamento_fim)

  const handleClearPeriodo = () => {
    setFilter((prev) => {
      const newFilter = { ...prev }
      delete newFilter.data_inicio
      delete newFilter.data_fim
      delete newFilter.data_vencimento_inicio
      delete newFilter.data_vencimento_fim
      delete newFilter.data_pagamento_inicio
      delete newFilter.data_pagamento_fim
      return newFilter
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filter.id_tp_lcto) count++
    if (filter.id_conta_contabil) count++
    if (filter.id_conta_caixa) count++
    if (filter.id_pessoa) count++
    if (filter.id_empresa) count++
    if (filter.id_un_negocio) count++
    if (filter.status) count++
    if (filter.natureza) count++
    if (filter.competencia) count++
    if (filter.data_inicio || filter.data_fim || filter.data_vencimento_inicio || filter.data_vencimento_fim || filter.data_pagamento_inicio || filter.data_pagamento_fim) count++
    if (filter.valor_min || filter.valor_max || filter.valor_reajustado_min || filter.valor_reajustado_max) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()
  const tipoLancamentoOptions = Array.from(
    tiposLancamento.reduce((acc, tipo) => {
      const key = String(tipo.id_tp_lcto)
      if (!acc.has(key)) {
        acc.set(key, {
          value: String(tipo.id_tp_lcto),
          label: `${tipo.natureza === 1 ? '(+)' : '(-)'} ${tipo.nome}`,
          description: tipo.natureza === 1 ? "Entrada" : "Saída",
        })
      }
      return acc
    }, new Map<string, { value: string; label: string; description: string }>()).values()
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 relative">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && !isDefaultFilter && (
            <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto bg-white dark:bg-slate-900">
        <SheetHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            <Filter className="h-4 w-4 text-blue-600" />
            Filtros de Lançamentos
          </SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-5">
          {/* Período */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
              Período
            </h3>
            <div className="space-y-3">
              {/* Seletor do tipo de data */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 text-xs font-medium">Filtrar por:</Label>
                <Select
                  value={filter.tipoData || "data_emissao"}
                  onValueChange={(value) => {
                    handleSelectChange("tipoData", value)
                    // Auto-selecionar "Baixados" quando escolher "Data de pagamento"
                    if (value === "data_pagamento") {
                      handleSelectChange("status", "baixado")
                    }
                  }}
                >
                  <SelectTrigger className="border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data_emissao">Data de emissão</SelectItem>
                    <SelectItem value="data_vencimento">Data de vencimento</SelectItem>
                    <SelectItem value="data_pagamento">Data de pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos de data */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-slate-600 dark:text-slate-400 font-medium">De:</Label>
                  <DatePickerInput
                    date={(() => {
                      const tipoData = filter.tipoData || 'data_emissao'
                      let dateValue
                      if (tipoData === 'data_emissao') {
                        dateValue = filter.data_inicio
                      } else if (tipoData === 'data_vencimento') {
                        dateValue = filter.data_vencimento_inicio
                      } else if (tipoData === 'data_pagamento') {
                        dateValue = filter.data_pagamento_inicio
                      }
                      return dateValue ? new Date(dateValue + "T12:00:00") : undefined
                    })()}
                    setDate={(date) => {
                      if (date) {
                        const dateString = format(date, 'yyyy-MM-dd')
                        handleDateChange("data_inicio", new Date(dateString + "T12:00:00"))
                      } else {
                        handleDateChange("data_inicio", undefined)
                      }
                    }}
                    placeholder="Selecionar data inicial"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600 dark:text-slate-400 font-medium">Até:</Label>
                  <DatePickerInput
                    date={(() => {
                      const tipoData = filter.tipoData || 'data_emissao'
                      let dateValue
                      if (tipoData === 'data_emissao') {
                        dateValue = filter.data_fim
                      } else if (tipoData === 'data_vencimento') {
                        dateValue = filter.data_vencimento_fim
                      } else if (tipoData === 'data_pagamento') {
                        dateValue = filter.data_pagamento_fim
                      }
                      return dateValue ? new Date(dateValue + "T12:00:00") : undefined
                    })()}
                    setDate={(date) => {
                      if (date) {
                        const dateString = format(date, 'yyyy-MM-dd')
                        handleDateChange("data_fim", new Date(dateString + "T12:00:00"))
                      } else {
                        handleDateChange("data_fim", undefined)
                      }
                    }}
                    placeholder="Selecionar data final"
                  />
                </div>
              </div>
              {hasPeriodoFiltro && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearPeriodo}
                  className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar período
                </Button>
              )}
            </div>
          </div>

          {/* Card de Status e Natureza */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status e Natureza
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 text-xs font-medium">Status:</Label>
                <div className="flex gap-2">
                  <Select
                    value={filter.status || "todos"}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Em aberto</SelectItem>
                      <SelectItem value="baixado">Baixados</SelectItem>
                    </SelectContent>
                  </Select>
                  {filter.status && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSelectChange("status", undefined)}
                      title="Limpar seleção"
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 text-xs font-medium">Natureza:</Label>
                <div className="flex gap-2">
                  <Select
                    value={filter.natureza || "todos"}
                    onValueChange={(value) => handleSelectChange("natureza", value)}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                  {filter.natureza && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSelectChange("natureza", undefined)}
                      title="Limpar seleção"
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card de Classificações */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Classificações
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 text-xs font-medium">Tipo de Lançamento:</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      value={filter.id_tp_lcto?.toString() || ""}
                      onValueChange={(value) => handleSelectChange("id_tp_lcto", value || "todos")}
                      placeholder="Todos os tipos"
                      searchPlaceholder="Pesquisar tipo..."
                      emptyMessage="Nenhum tipo encontrado"
                      options={tipoLancamentoOptions}
                    />
                  </div>
                  {filter.id_tp_lcto && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSelectChange("id_tp_lcto", undefined)}
                      title="Limpar seleção"
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300 text-xs font-medium">Conta Caixa:</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      value={filter.id_conta_caixa?.toString() || ""}
                      onValueChange={(value) => handleSelectChange("id_conta_caixa", value || "todos")}
                      placeholder="Todas as contas"
                      searchPlaceholder="Pesquisar conta..."
                      emptyMessage="Nenhuma conta encontrada"
                      options={cashAccounts.map((account) => ({
                        value: String(account.id),
                        label: account.account,
                      }))}
                    />
                  </div>
                  {filter.id_conta_caixa && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSelectChange("id_conta_caixa", undefined)}
                      title="Limpar seleção"
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card de Relacionamentos - TripleSelector */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Unidade de Negócio, Devedor/Credor e Unidade
            </h3>
            <div className="space-y-3">
              <TripleSelector
                selectedBusinessUnitId={tripleSelectorBusinessUnit}
                selectedPersonId={tripleSelectorPerson}
                selectedUnitId={tripleSelectorUnit}
                vertical={true} // Layout vertical para filtros
                onBusinessUnitChange={(businessUnitId: string, businessUnit: Tipo8BusinessUnit | null) => {
                  setTripleSelectorBusinessUnit(businessUnitId)
                  setTripleSelectorPerson("")
                  setTripleSelectorUnit("")

                  if (businessUnitId) {
                    setFilter((prev) => ({
                      ...prev,
                      id_empresa: parseInt(businessUnitId),
                      id_un_negocio: undefined,
                      id_pessoa: undefined,
                    }))
                  } else {
                    setFilter((prev) => {
                      const newFilter = { ...prev }
                      delete newFilter.id_empresa
                      delete newFilter.id_un_negocio
                      delete newFilter.id_pessoa
                      return newFilter
                    })
                  }
                }}
                onPersonChange={(personId: string, person: Cliente | null) => {
                  setTripleSelectorPerson(personId)
                  setTripleSelectorUnit("")

                  if (personId) {
                    setFilter((prev) => ({ ...prev, id_pessoa: parseInt(personId) }))
                  } else {
                    setFilter((prev) => {
                      const newFilter = { ...prev }
                      delete newFilter.id_pessoa
                      return newFilter
                    })
                  }
                }}
                onUnitChange={(unitId: string, unit: BusinessUnit | null) => {
                  setTripleSelectorUnit(unitId)
                  if (unitId) {
                    setFilter((prev) => ({ ...prev, id_un_negocio: parseInt(unitId) }))
                  } else {
                    setFilter((prev) => {
                      const newFilter = { ...prev }
                      delete newFilter.id_un_negocio
                      return newFilter
                    })
                  }
                }}
                required={false}
                personLabel="Devedor/Credor"
                label="Filtrar por:"
                showFullInfo={false}
                disabled={false}
                allowReverseLoading={true}
              />
              
              {/* Botão para limpar seleções */}
              {(filter.id_pessoa || filter.id_empresa || filter.id_un_negocio) && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Limpar estados do TripleSelector
                      setTripleSelectorBusinessUnit("")
                      setTripleSelectorPerson("")
                      setTripleSelectorUnit("")
                      
                      // Limpar filtros
                      setFilter(prev => {
                        const newFilter = { ...prev }
                        delete newFilter.id_pessoa
                        delete newFilter.id_empresa
                        delete newFilter.id_un_negocio
                        return newFilter
                      })
                    }}
                    className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros de Relacionamento
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Card de Competência */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Competência
            </h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="202512"
                  value={filter.competencia?.toString() || ""}
                  onChange={(e) => {
                    const inputValue = e.target.value.replace(/\D/g, '') // Remove caracteres não numéricos
                    if (inputValue.length <= 6) { // Máximo 6 dígitos (YYYYMM)
                      handleSelectChange("competencia", inputValue || undefined)
                    }
                  }}
                  maxLength={6}
                  className="border-slate-200 dark:border-slate-700"
                />
                {filter.competencia && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSelectChange("competencia", undefined)}
                    title="Limpar seleção"
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Digite no formato AAAAMM (ex: 202512 para Dezembro/2025)
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={handleClearFilter}
              className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4 mr-1.5" />
              Limpar
            </Button>
            <Button
              onClick={handleApplyFilter}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
