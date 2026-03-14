"use client"

import { useState, useEffect, useCallback } from 'react'
import { getAllLancamentosWithPagination, getTiposLancamento } from '@/app/services/lancamento-service'
import { getAllPeople } from '@/app/services/person-api-service'
import { getAllBusinessUnits } from '@/app/services/business-unit-api-service'
import { getAllCashAccounts } from '@/app/services/cash-account-api-service'
import type { Lancamento, LancamentoListResponse, LancamentoFilter } from '@/types/types'

interface UseSimplePaginationProps {
  page?: number
  limit?: number
  filters?: Omit<LancamentoFilter, 'page' | 'limit'>
}

interface UseSimplePaginationReturn {
  data: Lancamento[]
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  tiposMap: Map<string, string>
  pessoasMap: Map<string, string>
  unidadesMap: Map<string, string>
  contasMap: Map<string, string>
  goToPage: (page: number) => void
  setPageSize: (size: number) => void
  refresh: () => Promise<void>
}

export function useSimplePagination({
  page = 1,
  limit = 10,
  filters
}: UseSimplePaginationProps = {}): UseSimplePaginationReturn {
  const [data, setData] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(page)
  const [pageSize, setPageSizeState] = useState(limit)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Estados para dados auxiliares
  const [tiposMap, setTiposMap] = useState<Map<string, string>>(new Map())
  const [pessoasMap, setPessoasMap] = useState<Map<string, string>>(new Map())
  const [unidadesMap, setUnidadesMap] = useState<Map<string, string>>(new Map())
  const [contasMap, setContasMap] = useState<Map<string, string>>(new Map())

  // Carregar dados auxiliares uma vez
  const loadAuxiliaryData = useCallback(async () => {
    try {
      const [tiposLancamento, pessoas, unidadesNegocio, contasCaixa] = await Promise.all([
        getTiposLancamento(),
        getAllPeople(),
        getAllBusinessUnits(),
        getAllCashAccounts(),
      ])

      setTiposMap(new Map(tiposLancamento.map(t => [String(t.id_conta_contabil), t.nome])))
      setPessoasMap(new Map(pessoas.map(p => [String(p.id), p.name])))
      setUnidadesMap(new Map(unidadesNegocio.map(u => [String(u.id), u.name])))
      setContasMap(new Map(contasCaixa.map(c => [String(c.id), c.account])))
      
      console.log('✅ Dados auxiliares carregados')
    } catch (err) {
      console.error('❌ Erro ao carregar dados auxiliares:', err)
    }
  }, [])

  // Carregar dados de lançamentos
  const loadData = useCallback(async (pageToLoad: number, sizeToLoad: number, filtersToLoad?: LancamentoFilter) => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔄 Carregando página:', pageToLoad, 'tamanho:', sizeToLoad)
      
      const response: LancamentoListResponse = await getAllLancamentosWithPagination(
        pageToLoad,
        sizeToLoad,
        filtersToLoad || {}
      )
      
      setData(response.data || [])
      setCurrentPage(pageToLoad)
      setPageSizeState(sizeToLoad)
      
      if (response.pagination) {
        const total = response.pagination.total || 0
        const calculatedTotalPages = Math.ceil(total / sizeToLoad)
        
        setTotalItems(total)
        setTotalPages(calculatedTotalPages)
        
        console.log(`📊 Paginação: ${response.data?.length || 0} itens da página ${pageToLoad}/${calculatedTotalPages} (total: ${total})`)
      }
    } catch (err) {
      console.error('❌ Erro ao carregar lançamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar lançamentos')
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar dados auxiliares na inicialização
  useEffect(() => {
    loadAuxiliaryData()
  }, [loadAuxiliaryData])

  // Carregar dados quando página, limite ou filtros mudarem
  useEffect(() => {
    loadData(page, limit, filters)
  }, [page, limit, JSON.stringify(filters), loadData])

  // Funções de navegação
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      loadData(newPage, pageSize, filters)
    }
  }, [currentPage, totalPages, pageSize, filters, loadData])

  const setPageSize = useCallback((newSize: number) => {
    loadData(1, newSize, filters)
  }, [filters, loadData])

  const refresh = useCallback(async () => {
    await loadAuxiliaryData()
    await loadData(currentPage, pageSize, filters)
  }, [currentPage, pageSize, filters, loadData, loadAuxiliaryData])

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    tiposMap,
    pessoasMap,
    unidadesMap,
    contasMap,
    goToPage,
    setPageSize,
    refresh
  }
}