import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  itemsPerPageOptions?: number[]
  showAllOption?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  showAllOption = true,
}: PaginationProps) {
  // Ref para rastrear se a mudança veio do usuário
  const userChangedRef = useRef(false)

  // Estado local para evitar race condition no Select
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage)

  // Sincronizar estado local com a prop APENAS se não foi mudança do usuário
  useEffect(() => {
    if (!userChangedRef.current) {
      setLocalItemsPerPage(itemsPerPage)
    }
    // Reset a flag após um tempo para permitir futuras sincronizações
    const timer = setTimeout(() => {
      userChangedRef.current = false
    }, 1000)
    return () => clearTimeout(timer)
  }, [itemsPerPage])

  // Handler que atualiza o estado local imediatamente e chama o callback
  const handleItemsPerPageChange = (value: string) => {
    const numValue = Number(value)
    userChangedRef.current = true // Marcar que o usuário fez a mudança
    setLocalItemsPerPage(numValue) // Atualiza imediatamente o estado local
    onItemsPerPageChange(numValue) // Chama o callback do pai
  }

  const isShowingAll = localItemsPerPage === -1
  const startItem = isShowingAll ? 1 : (currentPage - 1) * localItemsPerPage + 1
  const endItem = isShowingAll ? totalItems : Math.min(currentPage * localItemsPerPage, totalItems)

  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1 && totalItems <= itemsPerPageOptions[0] && !showAllOption) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 py-3 border-t">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">Itens por página:</span>
        <Select
          value={String(localItemsPerPage)}
          onValueChange={handleItemsPerPageChange}
        >
          <SelectTrigger className="w-[80px] h-8">
            <SelectValue placeholder={isShowingAll ? "Todos" : String(localItemsPerPage)} />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
            {showAllOption && (
              <SelectItem value="-1">Todos</SelectItem>
            )}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {isShowingAll
            ? `${totalItems} itens`
            : `${startItem}–${endItem} de ${totalItems}`
          }
        </span>
      </div>

      {totalPages > 1 && !isShowingAll && (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                )
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 ${currentPage === pageNum
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                  onClick={() => onPageChange(Number(pageNum))}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
