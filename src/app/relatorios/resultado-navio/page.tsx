"use client"

import React, { useState, useEffect } from "react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { 
  Loader2, 
  Ship, 
  Filter, 
  Download, 
  Calendar, 
  Search,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { PersonBusinessUnitSelector } from "@/components/ui/person-business-unit-selector"
import { 
  resultadoNavioService, 
  type OperacaoNavio,
  type TotaisNavio,
  type ResultadoNavioParams,
  type DetalhesOperacao
} from "@/app/services/resultado-navio-service"
import { formatCurrency, formatDate } from "@/lib/utils"
import customToast from "@/components/ui/custom-toast"
import type { BusinessUnit, Person } from "@/types/types"

export default function ResultadoNavioPage() {
  const [loading, setLoading] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState("")
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [operacoes, setOperacoes] = useState<OperacaoNavio[]>([])
  const [totais, setTotais] = useState<TotaisNavio | null>(null)
  const [pagination, setPagination] = useState<any>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [detalhesOperacoes, setDetalhesOperacoes] = useState<Record<number, DetalhesOperacao>>({})
  const [loadingDetalhes, setLoadingDetalhes] = useState<Set<number>>(new Set())

  // Carregar dados quando os filtros mudam
  useEffect(() => {
    loadData()
  }, [currentPage, itemsPerPage])

  const handlePersonChange = (personId: string, person: Person | null) => {
    setSelectedPersonId(personId)
    setSelectedBusinessUnitId("") // Reset business unit when person changes
  }

  const handleBusinessUnitChange = (businessUnitId: string, businessUnit: BusinessUnit | null) => {
    setSelectedBusinessUnitId(businessUnitId)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params: ResultadoNavioParams = {
        page: currentPage,
        limit: itemsPerPage
      }

      if (selectedPersonId) params.id_pessoa = parseInt(selectedPersonId)
      if (selectedBusinessUnitId) params.id_unidade_negocio = parseInt(selectedBusinessUnitId)
      if (dataInicio) params.data_inicio = dataInicio
      if (dataFim) params.data_fim = dataFim
      if (search) params.search = search

      const response = await resultadoNavioService.getResultados(params)
      
      console.log('📊 Response resultado-navio na página:', response)
      console.log('📊 Response.data:', response?.data)
      console.log('📊 Response.pagination:', response?.pagination)
      console.log('📊 Response.totais:', response?.totais)
      
      // Backend retorna { data: [], pagination: {}, totais: {}, filtros: {} }
      setOperacoes(response?.data || [])
      setTotais(response?.totais || null)
      setPagination(response?.pagination || null)
    } catch (error) {
      customToast.error("Erro ao carregar dados")
      console.error(error)
      setOperacoes([])
      setTotais(null)
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadData()
  }

  const handleClearFilters = () => {
    setSelectedPersonId("")
    setSelectedBusinessUnitId("")
    setDataInicio("")
    setDataFim("")
    setSearch("")
    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset para primeira página
  }

  const toggleRowExpansion = async (idOperacao: number) => {
    const newExpanded = new Set(expandedRows)
    
    if (expandedRows.has(idOperacao)) {
      newExpanded.delete(idOperacao)
    } else {
      newExpanded.add(idOperacao)
      
      // Carregar detalhes se não existem ainda
      if (!detalhesOperacoes[idOperacao] && !loadingDetalhes.has(idOperacao)) {
        setLoadingDetalhes(prev => new Set([...prev, idOperacao]))
        try {
          const detalhes = await resultadoNavioService.getDetalhes(idOperacao)
          setDetalhesOperacoes(prev => ({ ...prev, [idOperacao]: detalhes }))
        } catch (error) {
          customToast.error("Erro ao carregar detalhes da operação")
          console.error(error)
        } finally {
          setLoadingDetalhes(prev => {
            const newSet = new Set(prev)
            newSet.delete(idOperacao)
            return newSet
          })
        }
      }
    }
    
    setExpandedRows(newExpanded)
  }

  const getResultIcon = (saldo: number) => {
    if (saldo > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (saldo < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getResultColor = (saldo: number) => {
    if (saldo > 0) return "text-green-600 dark:text-green-400"
    if (saldo < 0) return "text-red-600 dark:text-red-400"
    return "text-gray-600 dark:text-gray-400"
  }

  const getMarginBadge = (margin: number) => {
    if (margin >= 20) return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">{margin.toFixed(1)}%</Badge>
    if (margin >= 10) return <Badge variant="secondary">{margin.toFixed(1)}%</Badge>
    if (margin > 0) return <Badge variant="outline">{margin.toFixed(1)}%</Badge>
    return <Badge variant="destructive">{margin.toFixed(1)}%</Badge>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <MainHeader />
      <div className="w-full py-6 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Ship className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Relatório de Resultado por Navio</h1>
              <p className="text-muted-foreground">
                Acompanhe o desempenho financeiro por operação de navio com detalhamento completo de lançamentos
              </p>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <PersonBusinessUnitSelector
                    selectedPersonId={selectedPersonId}
                    selectedBusinessUnitId={selectedBusinessUnitId}
                    onPersonChange={handlePersonChange}
                    onBusinessUnitChange={handleBusinessUnitChange}
                    label="Pessoa e Unidade de Negócio (Opcionais)"
                    required={false}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Buscar</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Navio, viagem, cliente..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button variant="outline" size="icon" onClick={handleSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Pesquisar"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Totais */}
          {totais && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totais.receita_total)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total de Receitas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(totais.custo_total)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total de Custos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(totais.despesa_total)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total de Despesas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className={`text-2xl font-bold ${getResultColor(totais.saldo_total)}`}>
                    {formatCurrency(totais.saldo_total)}
                  </div>
                  <p className="text-sm text-muted-foreground">Resultado Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {totais.tons_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-muted-foreground">Total de Toneladas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-purple-600">
                    {totais.operacoes_count}
                  </div>
                  <p className="text-sm text-muted-foreground">Total de Operações</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabela de Resultados */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Operações por Navio</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Navio</TableHead>
                        <TableHead>Viagem</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Porto</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Toneladas</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">Custos</TableHead>
                        <TableHead className="text-right">Despesa</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                        <TableHead className="text-center">Margem</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operacoes && operacoes.length > 0 ? operacoes.map((operacao) => (
                        <React.Fragment key={operacao.id_operacao}>
                          <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRowExpansion(operacao.id_operacao)}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {expandedRows.has(operacao.id_operacao) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                {operacao.navio}
                              </div>
                            </TableCell>
                            <TableCell>{operacao.viagem}</TableCell>
                            <TableCell>{operacao.cliente}</TableCell>
                            <TableCell>{operacao.porto}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(operacao.dt_inicio)} <br />
                                {formatDate(operacao.dt_final)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {operacao.tons.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(operacao.receita_total)}
                            </TableCell>
                            <TableCell className="text-right text-orange-600">
                              {formatCurrency(operacao.custo_total)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCurrency(operacao.despesa_total)}
                            </TableCell>
                            <TableCell className={`text-right ${getResultColor(operacao.saldo)}`}>
                              <div className="flex items-center justify-end gap-1">
                                {getResultIcon(operacao.saldo)}
                                {formatCurrency(operacao.saldo)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {getMarginBadge(operacao.margem_percentual)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleRowExpansion(operacao.id_operacao)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          
                          {expandedRows.has(operacao.id_operacao) && (
                            <TableRow>
                              <TableCell colSpan={12} className="p-0 bg-muted/20">
                                <div className="p-4">
                                  {loadingDetalhes.has(operacao.id_operacao) ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                      <span className="ml-2">Carregando detalhes...</span>
                                    </div>
                                  ) : detalhesOperacoes[operacao.id_operacao] ? (
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-lg mb-3">Detalhes da Operação</h4>
                                      
                                      {/* Resumo financeiro */}
                                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                                        <Card className="p-3">
                                          <div className="text-sm text-muted-foreground">Receita Total</div>
                                          <div className="text-lg font-semibold text-green-600">
                                            {formatCurrency(detalhesOperacoes[operacao.id_operacao].financeiro.receita_total)}
                                          </div>
                                        </Card>
                                        <Card className="p-3">
                                          <div className="text-sm text-muted-foreground">Custo Total</div>
                                          <div className="text-lg font-semibold text-orange-600">
                                            {formatCurrency(detalhesOperacoes[operacao.id_operacao].financeiro.custo_total)}
                                          </div>
                                        </Card>
                                        <Card className="p-3">
                                          <div className="text-sm text-muted-foreground">Despesa Total</div>
                                          <div className="text-lg font-semibold text-red-600">
                                            {formatCurrency(detalhesOperacoes[operacao.id_operacao].financeiro.despesa_total)}
                                          </div>
                                        </Card>
                                        <Card className="p-3">
                                          <div className="text-sm text-muted-foreground">Resultado</div>
                                          <div className={`text-lg font-semibold ${getResultColor(detalhesOperacoes[operacao.id_operacao].financeiro.resultado)}`}>
                                            {formatCurrency(detalhesOperacoes[operacao.id_operacao].financeiro.resultado)}
                                          </div>
                                        </Card>
                                        <Card className="p-3">
                                          <div className="text-sm text-muted-foreground">Margem</div>
                                          <div className="text-lg font-semibold">
                                            {getMarginBadge(detalhesOperacoes[operacao.id_operacao].financeiro.margem_percentual)}
                                          </div>
                                        </Card>
                                      </div>
                                      
                                      {/* Tabela de lançamentos */}
                                      <div>
                                        <h5 className="font-medium mb-2">Lançamentos</h5>
                                        <div className="rounded-lg border">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Descrição</TableHead>
                                                <TableHead>Conta Contábil</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead>Data</TableHead>
                                                <TableHead className="text-right">Receita</TableHead>
                                                <TableHead className="text-right">Custos</TableHead>
                                                <TableHead className="text-right">Despesa</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {detalhesOperacoes[operacao.id_operacao].lancamentos.map((lancamento) => (
                                                <TableRow key={lancamento.id}>
                                                  <TableCell className="font-medium">{lancamento.descricao}</TableCell>
                                                  <TableCell>
                                                    <div className="text-sm">
                                                      <div>{lancamento.conta_contabil_nome}</div>
                                                      <div className="text-muted-foreground">{lancamento.conta_contabil_codigo}</div>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Badge
                                                      variant={lancamento.tipo_lancamento === 'receita' ? 'default' : 'secondary'}
                                                      className={
                                                        lancamento.tipo_lancamento === 'receita'
                                                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                          : lancamento.tipo_lancamento === 'custo'
                                                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                                                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                                                      }
                                                    >
                                                      {lancamento.tipo_lancamento === 'receita' ? 'Receita' : lancamento.tipo_lancamento === 'custo' ? 'Custo' : 'Despesa'}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell>{formatDate(lancamento.dt_competencia)}</TableCell>
                                                  <TableCell className="text-right text-green-600">
                                                    {lancamento.tipo_lancamento === 'receita' ? formatCurrency(lancamento.valor) : '-'}
                                                  </TableCell>
                                                  <TableCell className="text-right text-orange-600">
                                                    {lancamento.tipo_lancamento === 'custo' ? formatCurrency(lancamento.valor) : '-'}
                                                  </TableCell>
                                                  <TableCell className="text-right text-red-600">
                                                    {lancamento.tipo_lancamento === 'despesa' ? formatCurrency(lancamento.valor) : '-'}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                      Erro ao carregar detalhes
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                            {operacoes && operacoes.length === 0 ? 'Nenhuma operação encontrada' : 'Erro ao carregar dados'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {pagination && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={pagination.current_page}
                        totalPages={pagination.total_pages}
                        totalItems={pagination.total}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}