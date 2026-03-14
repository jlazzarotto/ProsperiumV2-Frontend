import { Badge } from "@/components/ui/badge"
import { RepeatIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RecurrenceBadgeProps {
  installmentNumber?: number
  totalInstallments?: number
}

export function RecurrenceBadge({ installmentNumber, totalInstallments }: RecurrenceBadgeProps) {
  if (!installmentNumber || !totalInstallments) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <RepeatIcon className="h-3 w-3" />
            {installmentNumber}/{totalInstallments}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Parcela {installmentNumber} de {totalInstallments}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
