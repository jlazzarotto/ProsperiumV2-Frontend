"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TransactionType } from "@/types/types"
import { Tag } from "lucide-react"

interface TransactionTypeSelectorProps {
  value: string
  onChange: (value: string) => void
  transactionTypes: TransactionType[]
  selectedNature: "entrada" | "saida" | "todos"
}

export function TransactionTypeSelector({
  value,
  onChange,
  transactionTypes,
  selectedNature,
}: TransactionTypeSelectorProps) {
  // Filter transaction types based on selected nature - exactly like in the form
  const filteredTypes =
    selectedNature === "todos" ? transactionTypes : transactionTypes.filter((type) => type.type === selectedNature)

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Tipo de Lançamento
      </Label>

      {filteredTypes.length === 0 ? (
        <div className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-md border border-slate-200">
          Nenhum tipo de lançamento disponível para a natureza selecionada.
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Todos os tipos</SelectItem>
            {filteredTypes.map((type) => (
              <SelectItem key={type.id} value={type.id || "no_id"}>
                {type.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <p className="text-xs text-muted-foreground">
        {selectedNature !== "todos"
          ? `Mostrando apenas tipos de lançamento para ${selectedNature === "entrada" ? "entradas" : "saídas"}`
          : "Mostrando todos os tipos de lançamento"}
      </p>
    </div>
  )
}
