"use client"

import { CalendarIcon, Clock, CreditCard } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface FilterDateFieldProps {
  value: string
  onChange: (value: string) => void
}

export function FilterDateField({ value, onChange }: FilterDateFieldProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Filtrar por tipo de data</Label>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-1 gap-3">
        <div className="flex items-center">
          <RadioGroupItem value="dueDate" id="dueDate" className="peer sr-only" />
          <Label
            htmlFor="dueDate"
            className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-blue-50 w-full"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Data de Vencimento</p>
                <p className="text-xs text-muted-foreground">Filtra por data de vencimento do lançamento</p>
              </div>
            </div>
            {value === "dueDate" && (
              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Selecionado</div>
            )}
          </Label>
        </div>

        <div className="flex items-center">
          <RadioGroupItem value="date" id="date" className="peer sr-only" />
          <Label
            htmlFor="date"
            className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-amber-50 w-full"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Data de Emissão</p>
                <p className="text-xs text-muted-foreground">Filtra por data de emissão do documento</p>
              </div>
            </div>
            {value === "date" && (
              <div className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full">Selecionado</div>
            )}
          </Label>
        </div>

        <div className="flex items-center">
          <RadioGroupItem value="paymentDate" id="paymentDate" className="peer sr-only" />
          <Label
            htmlFor="paymentDate"
            className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-green-50 w-full"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Data de Pagamento</p>
                <p className="text-xs text-muted-foreground">Filtra por data de pagamento/baixa</p>
              </div>
            </div>
            {value === "paymentDate" && (
              <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Selecionado</div>
            )}
          </Label>
        </div>
      </RadioGroup>

      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Campo de data selecionado:</strong>{" "}
          {value === "dueDate" ? "Data de Vencimento" : value === "date" ? "Data de Emissão" : "Data de Pagamento"}
        </p>
      </div>
    </div>
  )
}
