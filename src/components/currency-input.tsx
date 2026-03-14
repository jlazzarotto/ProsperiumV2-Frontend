// Corrigir o componente CurrencyInput para garantir que o valor seja sempre um número válido
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number
  onValueChange: (value: number) => void
  prefix?: string
}

export function CurrencyInput({
  value,
  onValueChange,
  prefix = "R$ ",
  className,
  disabled,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("")

  // Formatar o valor para exibição quando o valor numérico mudar
  useEffect(() => {
    // Garantir que value seja um número válido
    const numericValue = typeof value === "number" && !isNaN(value) ? value : 0

    setDisplayValue(
      numericValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    // Remover o prefixo e todos os caracteres não numéricos, exceto vírgula e ponto
    inputValue = inputValue.replace(prefix, "").replace(/[^\d.,]/g, "")

    // Substituir pontos por nada (para lidar com separadores de milhar)
    // e vírgula por ponto (para converter para formato numérico)
    const cleanedValue = inputValue.replace(/\./g, "").replace(",", ".")
    const numericValue = cleanedValue === "" ? 0 : Number.parseFloat(cleanedValue)

    // Verificar se é um número válido
    if (!isNaN(numericValue)) {
      // Atualizar o valor numérico
      onValueChange(numericValue)

      // Formatar para exibição
      setDisplayValue(
        numericValue.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      )
    }
  }

  return (
    <Input
      {...props}
      value={`${prefix}${displayValue}`}
      onChange={handleChange}
      disabled={disabled}
      className={className}
    />
  )
}
