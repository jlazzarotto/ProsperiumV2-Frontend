"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type BankAccount = {
  id: number
  bank: string
  agency: string
  account: string
  balance: number
  icon: string
}

type BankAccountsDrawerProps = {
  isOpen: boolean
  onClose: () => void
  totalBalance: number
  accounts: BankAccount[]
}

export function BankAccountsDrawer({ isOpen, onClose, totalBalance, accounts }: BankAccountsDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full overflow-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Posição das contas bancárias
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-md">
            <div className="text-sm text-gray-500 dark:text-gray-400">Saldo total atualizado</div>
            <div className="text-xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalBalance)}
            </div>
          </div>

          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center p-4 border rounded-md">
                <div className="flex-shrink-0 mr-4">
                  <img
                    src={account.icon || "/placeholder.svg?height=48&width=48"}
                    alt={account.bank}
                    className="w-12 h-12"
                  />
                </div>
                <div className="flex-grow">
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <div>Agência</div>
                    <div>Conta</div>
                    <div className="font-medium text-black dark:text-white">{account.agency}</div>
                    <div className="font-medium text-black dark:text-white">{account.account}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(account.balance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

