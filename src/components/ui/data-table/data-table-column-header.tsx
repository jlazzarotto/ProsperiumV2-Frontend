"use client"

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortCriteria {
  field: string
  direction: 'asc' | 'desc'
}

interface DataTableColumnHeaderProps {
  field: string
  label: string
  sortCriteria: SortCriteria[]
  onSort: (field: string, event?: React.MouseEvent) => void
  className?: string
}

export function DataTableColumnHeader({
  field,
  label,
  sortCriteria,
  onSort,
  className,
}: DataTableColumnHeaderProps) {
  const sortIndex = sortCriteria.findIndex(s => s.field === field)
  const isActive = sortIndex !== -1
  const criteria = isActive ? sortCriteria[sortIndex] : null
  const showPriority = sortCriteria.length > 1

  return (
    <div
      className={cn(
        "flex items-center gap-1 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 -mx-4 -my-2 px-4 py-2",
        className,
      )}
      onClick={(e) => onSort(field, e)}
    >
      <span>{label}</span>
      {!isActive ? (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      ) : (
        <span className="inline-flex items-center gap-0.5">
          {criteria!.direction === 'asc' ? (
            <ArrowUp className="h-4 w-4 text-blue-600" />
          ) : (
            <ArrowDown className="h-4 w-4 text-blue-600" />
          )}
          {showPriority && (
            <span className="text-xs font-bold text-blue-600 bg-blue-100 rounded-full w-4 h-4 flex items-center justify-center">
              {sortIndex + 1}
            </span>
          )}
        </span>
      )}
    </div>
  )
}
