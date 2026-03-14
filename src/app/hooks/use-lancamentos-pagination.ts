"use client"

import { useState, useEffect, useMemo } from 'react'
import { getAllLancamentosComplete, clearLancamentosCache } from '@/app/services/lancamento-service'
import type { Lancamento, LancamentoListResponse, LancamentoFilter } from '@/types/types'

interface UseLancamentosPaginationProps {
  pageSize?: number
  filters?: LancamentoFilter
}

interface UseLancamentosPaginationReturn {
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
}

export function useLancamentosPagination({
  pageSize: initialPageSize = 25,
  filters
}: UseLancamentosPaginationProps = {}): UseLancamentosPaginationReturn {
  const [allData, setAllData] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Filtrar dados baseado nos filtros
  const filteredData = useMemo(() => {
    if (!filters) return allData

    return allData.filter(lancamento => {
      // Implementar filtros conforme necessário
      if (filters.status && lancamento.status !== filters.status) return false
      // if (filters.pessoa && !lancamento.pessoa?.nome.toLowerCase().includes(filters.pessoa.toLowerCase())) return false
      if (filters.search && !lancamento.descricao?.toLowerCase().includes(filters.search.toLowerCase())) return false
      
      // Filtro por data
      if (filters.data_inicio) {
        const dataLancamento = new Date(lancamento.data_lancamento)
        const dataInicio = new Date(filters.data_inicio)
        if (dataLancamento < dataInicio) return false
      }
      
      if (filters.data_fim) {
        const dataLancamento = new Date(lancamento.data_lancamento)
        const dataFim = new Date(filters.data_fim)
        if (dataLancamento > dataFim) return false
      }

      return true
    })
  }, [allData, filters])

  // Calcular paginação
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageData = filteredData.slice(startIndex, endIndex)

  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  // Carregar dados
  const loadData = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const response: LancamentoListResponse = await getAllLancamentosComplete(forceRefresh)
      setAllData(response.data || [])
      
      // Ajustar página atual se necessário
      const newTotalPages = Math.ceil((response.data?.length || 0) / pageSize)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }
    } catch (err) {
      console.error('Erro ao carregar lançamentos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar lançamentos')
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados na montagem e quando filtros mudam
  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset página quando filtros mudam
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1)
    }
  }, [filters, pageSize, currentPage])

  // Funções de navegação
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const refresh = async () => {
    clearLancamentosCache()
    await loadData(true)
  }

  const handleSetPageSize = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset para primeira página
  }

  return {
    data: currentPageData,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    setPageSize: handleSetPageSize,
    pageSize
  }
}