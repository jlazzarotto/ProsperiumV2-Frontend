import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatCurrency } from "@/utils/format"
import { CreditCard, TrendingUp, TrendingDown, BanknoteIcon as Bank } from "lucide-react"
import type { CashAccount } from "@/types/types"

interface AccountCardProps {
  account: CashAccount
}

export function AccountCard({ account }: AccountCardProps) {
  // Se showInDashboard não for true, não renderize o componente
  if (account.showInDashboard !== true) {
    return null
  }

  // Converter o valor da string para número
  const balance = Number.parseFloat(account.value.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0

  // Determinar a cor com base no saldo
  const getBalanceColor = () => {
    if (balance > 0) return "text-emerald-600 dark:text-emerald-400"
    if (balance < 0) return "text-red-600 dark:text-red-400"
    return "text-slate-600 dark:text-slate-400"
  }

  // Determinar o ícone com base no saldo
  const BalanceIcon = balance > 0 ? TrendingUp : balance < 0 ? TrendingDown : CreditCard

  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md group">
      <CardHeader className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 dark:text-white">{account.account}</h3>
          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Bank className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Código: {account.code}</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Saldo atual</p>
            <div className="flex items-center gap-1.5">
              <BalanceIcon className={`h-4 w-4 ${getBalanceColor()}`} />
              <p className={`text-xl font-bold ${getBalanceColor()}`}>{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

