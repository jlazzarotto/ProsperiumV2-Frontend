"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useUrlParamsWatcher } from "@/hooks/use-url-params-watcher"
import type { LancamentoFilter } from "@/types/types"

export interface SortCriteria {
  field: string
  direction: 'asc' | 'desc'
}

function sanitizeDateFilters(filters: LancamentoFilter): LancamentoFilter {
  const sanitized: LancamentoFilter = { ...filters }

  delete sanitized.id_conta_contabil

  if (sanitized.tipoData === 'data_emissao') {
    delete sanitized.data_vencimento_inicio
    delete sanitized.data_vencimento_fim
    delete sanitized.data_pagamento_inicio
    delete sanitized.data_pagamento_fim
  } else if (sanitized.tipoData === 'data_vencimento') {
    delete sanitized.data_inicio
    delete sanitized.data_fim
    delete sanitized.data_pagamento_inicio
    delete sanitized.data_pagamento_fim
  } else if (sanitized.tipoData === 'data_pagamento') {
    delete sanitized.data_inicio
    delete sanitized.data_fim
    delete sanitized.data_vencimento_inicio
    delete sanitized.data_vencimento_fim
  }

  return sanitized
}

function getNextSortCriteria(
  prev: SortCriteria[],
  field: string,
  isMultiSort: boolean,
): SortCriteria[] {
  const existingIndex = prev.findIndex((s) => s.field === field)

  if (existingIndex !== -1) {
    const existing = prev[existingIndex]
    if (existing.direction === 'asc') {
      const next = [...prev]
      next[existingIndex] = { field, direction: 'desc' }
      return next
    }
    return prev.filter((_, i) => i !== existingIndex)
  }

  if (isMultiSort) {
    return [...prev, { field, direction: 'asc' }]
  }

  return [{ field, direction: 'asc' }]
}

function parseFilterFromParams(params: URLSearchParams): LancamentoFilter {
  const filters: LancamentoFilter = {
    page: Number(params.get('page')) || 1,
    limit: params.get('limit') !== null ? Number(params.get('limit')) : 10,
  }

  const search = params.get('search')
  if (search) filters.search = search

  const id_tp_lcto = params.get('id_tp_lcto')
  if (id_tp_lcto) filters.id_tp_lcto = Number(id_tp_lcto)

  const id_conta_caixa = params.get('id_conta_caixa')
  if (id_conta_caixa) filters.id_conta_caixa = Number(id_conta_caixa)

  const id_pessoa = params.get('id_pessoa')
  if (id_pessoa) filters.id_pessoa = Number(id_pessoa)

  const id_empresa = params.get('id_empresa')
  if (id_empresa) filters.id_empresa = Number(id_empresa)

  const id_un_negocio = params.get('id_un_negocio')
  if (id_un_negocio) filters.id_un_negocio = Number(id_un_negocio)

  const status = params.get('status')
  if (status) filters.status = status as 'baixado' | 'pendente'

  const natureza = params.get('natureza')
  if (natureza) {
    if (natureza === 'credito') filters.natureza = 'entrada'
    else if (natureza === 'debito') filters.natureza = 'saida'
    else filters.natureza = natureza as 'entrada' | 'saida'
  }

  const data_inicio = params.get('data_inicio')
  if (data_inicio) filters.data_inicio = data_inicio

  const data_fim = params.get('data_fim')
  if (data_fim) filters.data_fim = data_fim

  const data_vencimento_inicio = params.get('data_vencimento_inicio')
  if (data_vencimento_inicio) filters.data_vencimento_inicio = data_vencimento_inicio

  const data_vencimento_fim = params.get('data_vencimento_fim')
  if (data_vencimento_fim) filters.data_vencimento_fim = data_vencimento_fim

  const data_pagamento_inicio = params.get('data_pagamento_inicio')
  if (data_pagamento_inicio) filters.data_pagamento_inicio = data_pagamento_inicio

  const data_pagamento_fim = params.get('data_pagamento_fim')
  if (data_pagamento_fim) filters.data_pagamento_fim = data_pagamento_fim

  const tipoData = params.get('tipoData')
  if (tipoData) filters.tipoData = tipoData as 'data_emissao' | 'data_vencimento' | 'data_pagamento'

  const competencia = params.get('competencia')
  if (competencia) filters.competencia = Number(competencia)

  const sortBy = params.get('sortBy')
  if (sortBy) filters.sortBy = sortBy

  const sortOrder = params.get('sortOrder')
  if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
    filters.sortOrder = sortOrder as 'asc' | 'desc'
  }

  return sanitizeDateFilters(filters)
}

function parseSortCriteriaFromParams(params: URLSearchParams): SortCriteria[] {
  const sortBy = params.get('sortBy')
  const sortOrder = params.get('sortOrder')
  if (!sortBy) return []

  const fields = sortBy.split(',')
  const orders = sortOrder?.split(',') || []
  return fields.map((field, index) => ({
    field,
    direction: (orders[index] === 'desc' || orders[index] === 'asc') ? orders[index] as 'asc' | 'desc' : 'asc'
  }))
}

function applyDefaultFilters(filters: LancamentoFilter): LancamentoFilter {
  const hoje = new Date()
  const data30DiasAtras = new Date(hoje)
  data30DiasAtras.setDate(hoje.getDate() - 30)
  const data30DiasFuturos = new Date(hoje)
  data30DiasFuturos.setDate(hoje.getDate() + 30)

  const formatarData = (date: Date) => {
    const ano = date.getFullYear()
    const mes = String(date.getMonth() + 1).padStart(2, '0')
    const dia = String(date.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  return {
    ...filters,
    data_vencimento_inicio: formatarData(data30DiasAtras),
    data_vencimento_fim: formatarData(data30DiasFuturos),
    tipoData: 'data_vencimento',
  }
}

export function useLancamentoUrlState() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlTemParametros = searchParams.toString().length > 0

  const [currentFilter, setCurrentFilter] = useState<LancamentoFilter>(() => {
    const filters = parseFilterFromParams(searchParams)
    if (!urlTemParametros) {
      return applyDefaultFilters(filters)
    }
    return filters
  })

  const [isDefaultFilter, setIsDefaultFilter] = useState(() => !urlTemParametros)

  const [sortCriteria, setSortCriteria] = useState<SortCriteria[]>(() =>
    parseSortCriteriaFromParams(searchParams)
  )

  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || "")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(() => searchParams.get('search') || "")

  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: Number(searchParams.get('page')) || 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: Number(searchParams.get('limit')) || 10,
  })

  // Refs for fetchTransactions closure
  const currentFilterRef = useRef(currentFilter)
  const paginationInfoRef = useRef(paginationInfo)
  const debouncedSearchTermRef = useRef(debouncedSearchTerm)

  useEffect(() => { currentFilterRef.current = currentFilter }, [currentFilter])
  useEffect(() => { paginationInfoRef.current = paginationInfo }, [paginationInfo])
  useEffect(() => { debouncedSearchTermRef.current = debouncedSearchTerm }, [debouncedSearchTerm])

  const updateURLWithFilters = useCallback((filters: LancamentoFilter) => {
    const sanitizedFilters = sanitizeDateFilters(filters)
    const params = new URLSearchParams()
    params.set('page', String(sanitizedFilters.page || 1))

    Object.entries(sanitizedFilters).forEach(([key, value]) => {
      if (key === 'page') return
      if (key === 'limit') {
        if (value !== undefined && value !== null) params.set('limit', String(value))
        return
      }
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    })

    const queryString = params.toString()
    router.push(`/financeiro/lancamento${queryString ? '?' + queryString : ''}`, { scroll: false })
  }, [router])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)

      const params = new URLSearchParams(window.location.search)
      if (searchTerm && searchTerm.trim()) {
        params.set('search', searchTerm.trim())
        params.set('page', '1')
      } else {
        params.delete('search')
      }

      const queryString = params.toString()
      const newUrl = `/financeiro/lancamento${queryString ? '?' + queryString : ''}`
      router.replace(newUrl, { scroll: false })
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, router])

  const clearSearch = useCallback(() => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
  }, [])

  // Sort handler
  const handleSort = useCallback((
    field: string,
    event: React.MouseEvent | undefined,
    fetchTransactions: (filter?: LancamentoFilter, page?: number) => void,
  ) => {
    const isMultiSort = event?.shiftKey || false

    const newCriteria = getNextSortCriteria(sortCriteria, field, isMultiSort)
    setSortCriteria(newCriteria)

    const sortByStr = newCriteria.map((s) => s.field).join(',')
    const newFilter: LancamentoFilter = sanitizeDateFilters({
      ...currentFilterRef.current,
      sortBy: sortByStr || undefined,
      sortOrder: (newCriteria[0]?.direction || undefined) as 'asc' | 'desc' | undefined,
      page: 1,
    })

    setCurrentFilter(newFilter)
    updateURLWithFilters(newFilter)

    if (newCriteria.length === 0) {
      fetchTransactions(sanitizeDateFilters({ ...newFilter, sortBy: undefined, sortOrder: undefined }), 1)
    } else {
      fetchTransactions(
        {
          ...newFilter,
          sortBy: newCriteria[0].field,
          sortOrder: newCriteria[0].direction,
        },
        1,
      )
    }
  }, [sortCriteria, updateURLWithFilters])

  const handlePageChange = useCallback((
    newPage: number,
    fetchTransactions: (filter?: LancamentoFilter, page?: number) => void,
  ) => {
    const urlEstaVazia = window.location.search === '' || window.location.search === '?'

    let newFilter: LancamentoFilter
    if (urlEstaVazia) {
      newFilter = sanitizeDateFilters({ page: newPage, limit: currentFilterRef.current.limit || 10 })
    } else {
      newFilter = sanitizeDateFilters({ ...currentFilterRef.current, page: newPage })
    }

    setCurrentFilter(newFilter)
    updateURLWithFilters(newFilter)
    fetchTransactions(newFilter, newPage)
  }, [updateURLWithFilters])

  const handlePageSizeChange = useCallback((
    newPageSize: number,
    fetchTransactions: (filter?: LancamentoFilter, page?: number, pageSize?: number) => void,
  ) => {
    const urlEstaVazia = window.location.search === '' || window.location.search === '?'

    let newFilter: LancamentoFilter
    if (urlEstaVazia) {
      newFilter = sanitizeDateFilters({ page: 1, limit: newPageSize })
    } else {
      newFilter = sanitizeDateFilters({ ...currentFilterRef.current, limit: newPageSize, page: 1 })
    }

    setCurrentFilter(newFilter)

    if (newPageSize === -1) {
      setPaginationInfo(prev => ({
        ...prev,
        currentPage: 1,
        totalPages: 1,
        itemsPerPage: -1,
      }))
    }

    updateURLWithFilters(newFilter)
    fetchTransactions(newFilter, 1, newPageSize)
  }, [updateURLWithFilters])

  const handleFilter = useCallback((
    filter: LancamentoFilter,
    fetchTransactions: (filter?: LancamentoFilter, page?: number) => void,
  ) => {
    const filterWithPage = sanitizeDateFilters({ ...filter, page: 1 })
    setIsDefaultFilter(false)
    setCurrentFilter(filterWithPage)
    updateURLWithFilters(filterWithPage)
    fetchTransactions(filterWithPage, 1)
  }, [updateURLWithFilters])

  const clearSortCriteria = useCallback((
    fetchTransactions: (filter?: LancamentoFilter, page?: number) => void,
  ) => {
    setSortCriteria([])
    const newFilter = sanitizeDateFilters({ ...currentFilterRef.current, sortBy: undefined, sortOrder: undefined, page: 1 })
    setCurrentFilter(newFilter)
    updateURLWithFilters(newFilter)
    fetchTransactions(newFilter, 1)
  }, [updateURLWithFilters])

  return {
    currentFilter,
    setCurrentFilter,
    isDefaultFilter,
    setIsDefaultFilter,
    sortCriteria,
    setSortCriteria,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    setDebouncedSearchTerm,
    paginationInfo,
    setPaginationInfo,
    currentFilterRef,
    paginationInfoRef,
    debouncedSearchTermRef,
    updateURLWithFilters,
    clearSearch,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    handleFilter,
    clearSortCriteria,
    // Expose URL watcher setup
    useUrlParamsWatcher,
    searchParams,
  }
}
