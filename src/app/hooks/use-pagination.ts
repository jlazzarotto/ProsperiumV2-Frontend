"use client"

import { useCallback, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

export type SortOrder = "asc" | "desc"

export interface UsePaginationProps {
  defaultItemsPerPage?: number
  defaultSortBy?: string
  defaultSortOrder?: SortOrder
}

export function usePagination({
  defaultItemsPerPage = 10,
  defaultSortBy = "",
  defaultSortOrder = "asc",
}: UsePaginationProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get("page")) || 1
  const itemsPerPage = Number(searchParams.get("perPage")) || defaultItemsPerPage
  const sortBy = searchParams.get("sortBy") || defaultSortBy
  const sortOrder = (searchParams.get("sortOrder") as SortOrder) || defaultSortOrder

  const updateURL = useCallback(
    (params: Record<string, string | number>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newSearchParams.set(key, String(value))
        } else {
          newSearchParams.delete(key)
        }
      })

      router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const setPage = useCallback(
    (page: number) => {
      updateURL({ page })
    },
    [updateURL],
  )

  const setItemsPerPage = useCallback(
    (perPage: number) => {
      updateURL({ page: 1, perPage })
    },
    [updateURL],
  )

  const setSorting = useCallback(
    (field: string) => {
      const newSortOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc"
      updateURL({ sortBy: field, sortOrder: newSortOrder, page: 1 })
    },
    [sortBy, sortOrder, updateURL],
  )

  const paginateData = useCallback(
    <T,>(data: T[]): { paginatedData: T[]; totalPages: number } => {
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedData = data.slice(startIndex, endIndex)
      const totalPages = Math.ceil(data.length / itemsPerPage)

      return { paginatedData, totalPages }
    },
    [currentPage, itemsPerPage],
  )

  const sortData = useCallback(
    <T,>(data: T[], field: string): T[] => {
      if (!field) return data

      return [...data].sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[field]
        const bValue = (b as Record<string, unknown>)[field]

        if (aValue === undefined || aValue === null) return 1
        if (bValue === undefined || bValue === null) return -1

        let comparison = 0
        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue
        } else {
          comparison = String(aValue).localeCompare(String(bValue))
        }

        return sortOrder === "asc" ? comparison : -comparison
      })
    },
    [sortOrder],
  )

  return useMemo(
    () => ({
      currentPage,
      itemsPerPage,
      sortBy,
      sortOrder,
      setPage,
      setItemsPerPage,
      setSorting,
      paginateData,
      sortData,
    }),
    [currentPage, itemsPerPage, sortBy, sortOrder, setPage, setItemsPerPage, setSorting, paginateData, sortData],
  )
}
