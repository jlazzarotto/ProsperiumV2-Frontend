import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "./table"
import { cn } from "@/lib/utils"

interface SortableTableHeadProps {
  field: string
  label: string
  currentSortBy: string
  currentSortOrder: "asc" | "desc"
  onSort: (field: string) => void
  className?: string
}

export function SortableTableHead({
  field,
  label,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = currentSortBy === field

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors",
        isActive && "text-blue-600 font-semibold",
        className,
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {isActive ? (
          currentSortOrder === "asc" ? (
            <ArrowUp className="h-4 w-4 text-blue-600" />
          ) : (
            <ArrowDown className="h-4 w-4 text-blue-600" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
        )}
      </div>
    </TableHead>
  )
}
