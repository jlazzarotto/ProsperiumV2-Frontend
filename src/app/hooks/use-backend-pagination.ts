"use client"

import { useState, useEffect } from 'react'
import { getAllLancamentosWithPagination, getTiposLancamento } from '@/app/services/lancamento-service'
import { getAllPeople } from '@/app/services/person-api-service'
import { getAllBusinessUnits } from '@/app/services/business-unit-api-service'
import { getAllCashAccounts } from '@/app/services/cash-account-api-service'
import type { Lancamento, LancamentoListResponse, LancamentoFilter } from '@/types/types'

interface UseBackendPaginationProps {
  pageSize?: number
  initialPage?: number
  filters?: Omit<LancamentoFilter, 'page' | 'limit'>
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

interface UseBackendPaginationReturn {
  data: Lancamento[]
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPrevPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  refresh: () => Promise<void>
  setPageSize: (size: number) => void
  pageSize: number
  // Dados auxiliares para conversão
  tiposMap: Map<string, string>
  pessoasMap: Map<string, string>
  unidadesMap: Map<string, string>
  contasMap: Map<string, string>
}

export function useBackendPagination({
  pageSize: initialPageSize = 25,
  initialPage = 1,
  filters,
  onPageChange,
  onPageSizeChange
}: UseBackendPaginationProps = {}): UseBackendPaginationReturn {
  const [data, setData] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 1
  })

  // Estados para dados auxiliares
  const [tiposMap, setTiposMap] = useState<Map<string, string>>(new Map())
  const [pessoasMap, setPessoasMap] = useState<Map<string, string>>(new Map())
  const [unidadesMap, setUnidadesMap] = useState<Map<string, string>>(new Map())
  const [contasMap, setContasMap] = useState<Map<string, string>>(new Map())

  // Carregar dados auxiliares uma vez
  const loadAuxiliaryData = async () => {
    try {
      const [tiposLancamento, pessoas, unidadesNegocio, contasCaixa] = await Promise.all([
        getTiposLancamento(),
        getAllPeople(),
        getAllBusinessUnits(),
        getAllCashAccounts(),
      ])

      // Criar mapas para lookup rápido
      setTiposMap(new Map(tiposLancamento.map(t => [String(t.id_conta_contabil), t.nome])))
      setPessoasMap(new Map(pessoas.map(p => [String(p.id), p.name])))
      setUnidadesMap(new Map(unidadesNegocio.map(u => [String(u.id), u.name])))
      setContasMap(new Map(contasCaixa.map(c => [String(c.id), c.account])))
      
      console.log('✅ Dados auxiliares carregados')
    } catch (err) {
      console.error('❌ Erro ao carregar dados auxiliares:', err)
    }
  }

  // Função para carregar dados
  const loadData = async (page: number = currentPage, size: number = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      console.log('🔄 Carregando página:', page, 'tamanho:', size)
      
      const response: LancamentoListResponse = await getAllLancamentosWithPagination(
        page, 
        size, 
        filters
      )
      
      setData(response.data || [])
      
      // Atualizar informações de paginação baseado na resposta do backend
      if (response.pagination) {
        const totalFromBackend = response.pagination.total || 0
        const totalPagesCalculated = Math.ceil(totalFromBackend / size)
        
        setPaginationInfo({
          total: totalFromBackend,
          totalPages: totalPagesCalculated
        })
        
        console.log(`📊 Paginação: ${response.data?.length || 0} itens da página ${page}/${totalPagesCalculated} (total: ${totalFromBackend})`)
      }
    } catch (err) {
      console.error('❌ Erro ao carregar lançamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar lançamentos')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados auxiliares na inicialização
  useEffect(() => {
    loadAuxiliaryData()
  }, [])

  // Sincronizar com mudanças na página inicial (da URL)
  useEffect(() => {
    if (initialPage !== currentPage) {
      setCurrentPage(initialPage)
      loadData(initialPage, pageSize)
    }
  }, [initialPage, currentPage, loadData, pageSize])

  // Sincronizar com mudanças no pageSize inicial
  useEffect(() => {
    if (initialPageSize !== pageSize) {
      setPageSize(initialPageSize)
      setCurrentPage(1)
      loadData(1, initialPageSize)
    }
  }, [initialPageSize, pageSize, loadData])

  // Carregar dados quando dependências mudarem
  useEffect(() => {
    // Só resetar para página 1 se não for a primeira carga
    if (currentPage === initialPage) {
      loadData(currentPage, pageSize)
    } else {
      setCurrentPage(1)
      loadData(1, pageSize)
      onPageChange?.(1)
    }
  }, [JSON.stringify(filters), pageSize, currentPage, initialPage, loadData, onPageChange]) // Usar JSON.stringify para comparação profunda

  // Calcular estados de navegação
  const hasNextPage = currentPage < paginationInfo.totalPages
  const hasPrevPage = currentPage > 1

  // Funções de navegação
  const goToPage = (page: number) => {
    if (page >= 1 && page <= paginationInfo.totalPages && page !== currentPage) {
      setCurrentPage(page)
      loadData(page, pageSize)
      onPageChange?.(page)
    }
  }

  const nextPage = () => {
    if (hasNextPage) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      loadData(newPage, pageSize)
      onPageChange?.(newPage)
    }
  }

  const prevPage = () => {
    if (hasPrevPage) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      loadData(newPage, pageSize)
      onPageChange?.(newPage)
    }
  }

  const refresh = async () => {
    // Recarregar dados auxiliares também
    await loadAuxiliaryData()
    await loadData(currentPage, pageSize)
  }

  const handleSetPageSize = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset para primeira página
    loadData(1, size)
    onPageChange?.(1)
    onPageSizeChange?.(size)
  }

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages: paginationInfo.totalPages,
    totalItems: paginationInfo.total,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    setPageSize: handleSetPageSize,
    pageSize,
    // Dados auxiliares para conversão
    tiposMap,
    pessoasMap,
    unidadesMap,
    contasMap
  }
}