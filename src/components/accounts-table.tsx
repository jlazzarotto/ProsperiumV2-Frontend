import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/utils/format"
import { CalendarClock, ArrowUpRight, ArrowDownRight } from "lucide-react"
import type { AccountsReceivable, AccountsPayable } from "@/types/types"

interface AccountsTableProps {
  title: string
  type: "receivable" | "payable"
  data: AccountsReceivable[] | AccountsPayable[]
}

export function AccountsTable({ title, type, data }: AccountsTableProps) {
  // Calcular o total
  const total = data.reduce((sum, item) => {
    const amount =
      typeof item.amount === "string"
        ? Number.parseFloat(item.amount.replace(/[^\d,.-]/g, "").replace(",", "."))
        : item.amount
    return sum + (amount || 0)
  }, 0)

  // Determinar a cor com base no tipo
  const colorClass = type === "receivable" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
  const Icon = type === "receivable" ? ArrowUpRight : ArrowDownRight

  // Ordenar por data de vencimento
  const sortedData = [...data].sort((a, b) => {
    const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate)
    const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data.length} {data.length === 1 ? "registro" : "registros"}
          </p>
          <p className={`font-bold ${colorClass}`}>Total: {formatCurrency(total)}</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.slice(0, 5).map((item) => {
                  const amount =
                    typeof item.amount === "string"
                      ? Number.parseFloat(item.amount.replace(/[^\d,.-]/g, "").replace(",", "."))
                      : item.amount

                  const dueDate = item.dueDate instanceof Date ? item.dueDate : new Date(item.dueDate)

                  // Verificar se está vencido
                  const isOverdue = dueDate < new Date() && !item.paid

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {isOverdue && <CalendarClock className="h-4 w-4 text-amber-500" />}
                          <span className={isOverdue ? "text-amber-500 font-medium" : ""}>
                            {dueDate.toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={colorClass}>{formatCurrency(amount || 0)}</span>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

