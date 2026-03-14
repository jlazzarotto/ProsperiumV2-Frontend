import { Badge } from "@/components/ui/badge"
import type { FaturaStatus } from "@/types/types"
import { cn } from "@/lib/utils"

interface FaturaStatusBadgeProps {
  status: FaturaStatus
  size?: 'default' | 'xs' | 'lg'
  className?: string
}

const CONFIG: Record<FaturaStatus, { label: string; className: string; dot: string }> = {
  aberta:    { label: 'Aberta',     className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',    dot: 'bg-blue-500' },
  fechada:   { label: 'Fechada',    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500' },
  paga:      { label: 'Paga',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500' },
  parcial:   { label: 'Parcial',    className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800', dot: 'bg-yellow-500' },
  em_atraso: { label: 'Em atraso',  className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',         dot: 'bg-red-500' },
}

export function FaturaStatusBadge({ status, size = 'default', className }: FaturaStatusBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG.aberta
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium inline-flex items-center gap-1.5',
        cfg.className,
        size === 'xs' && 'text-[10px] px-1.5 py-0 gap-1',
        size === 'lg' && 'text-sm px-3 py-1',
        className
      )}
    >
      <span className={cn('rounded-full', cfg.dot, size === 'xs' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {cfg.label}
    </Badge>
  )
}
