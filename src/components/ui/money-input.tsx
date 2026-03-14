"use client"

import React, { forwardRef, useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string | number
  onChange?: (value: string) => void
  onValueChange?: (numericValue: number) => void
  showClearButton?: boolean
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value = "", onChange, onValueChange, showClearButton = true, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("")
    const [isFocused, setIsFocused] = useState(false)
    const internalRef = useRef<HTMLInputElement>(null)
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef

    // Função para formatar valor como moeda brasileira
    const formatMoney = (numericValue: string): string => {
      if (!numericValue) return ""

      // Converter para número com centavos
      const cents = parseInt(numericValue)
      const reais = cents / 100

      // Formatar como moeda brasileira
      return reais.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      })
    }

    // Função para extrair valor numérico da string formatada
    const parseMoneyValue = (formattedValue: string): number => {
      if (!formattedValue) return 0

      // Remover símbolos e converter vírgula em ponto
      const numericString = formattedValue
        .replace(/[R$\s]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")

      return parseFloat(numericString) || 0
    }

    // Função para preparar valor inicial
    const prepareInitialValue = (val: string | number): string => {
      if (!val && val !== 0) return ""

      // Se for string numérica, usar direto
      if (typeof val === "string" && /^\d+(\.\d{1,2})?$/.test(val)) {
        return Math.round(parseFloat(val) * 100).toString()
      }

      // Se for número, converter para centavos
      if (typeof val === "number") {
        return Math.round(val * 100).toString()
      }

      // Tentar extrair números da string
      const numericOnly = String(val).replace(/[^\d,\.]/g, "")
      if (numericOnly.includes(",") || numericOnly.includes(".")) {
        // Se tem vírgula, tratar como formato brasileiro (1.234,56)
        if (numericOnly.includes(",")) {
          const normalized = numericOnly.replace(/\./g, "").replace(",", ".")
          const parsed = parseFloat(normalized)
          return isNaN(parsed) ? "" : Math.round(parsed * 100).toString()
        } else {
          // Se só tem ponto, pode ser formato americano (123.45) ou separador de milhar (1.234)
          const dotCount = (numericOnly.match(/\./g) || []).length
          if (dotCount === 1 && numericOnly.split('.')[1].length <= 2) {
            // Formato americano com decimais (123.45)
            const parsed = parseFloat(numericOnly)
            return isNaN(parsed) ? "" : Math.round(parsed * 100).toString()
          } else {
            // Separador de milhar ou formato inválido, remover pontos
            const normalized = numericOnly.replace(/\./g, "")
            const parsed = parseFloat(normalized)
            return isNaN(parsed) ? "" : parsed.toString()
          }
        }
      }

      return numericOnly
    }

    // Atualizar display quando value prop mudar
    useEffect(() => {
      if (value !== undefined) {
        const prepared = prepareInitialValue(value)
        const formatted = formatMoney(prepared)
        setDisplayValue(formatted)
      }
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Se estiver apagando tudo
      if (!inputValue) {
        setDisplayValue("")
        onChange?.("0")
        onValueChange?.(0)
        return
      }

      // Extrair apenas números
      const numericOnly = inputValue.replace(/[^\d]/g, "")

      if (numericOnly) {
        const formatted = formatMoney(numericOnly)
        setDisplayValue(formatted)

        // Calcular valor numérico para callbacks
        const numericValue = parseMoneyValue(formatted)
        onChange?.(numericValue.toString())
        onValueChange?.(numericValue)

        // Posicionar cursor no final após formatação
        setTimeout(() => {
          if (inputRef.current) {
            const len = formatted.length
            inputRef.current.setSelectionRange(len, len)
          }
        }, 0)
      } else {
        setDisplayValue("")
        onChange?.("0")
        onValueChange?.(0)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir teclas de navegação e controle
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ]

      // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
      if (e.ctrlKey || e.metaKey) {
        return
      }

      // Permitir números
      if (/^\d$/.test(e.key)) {
        return
      }

      // Bloquear outras teclas se não forem permitidas
      if (!allowedKeys.includes(e.key)) {
        e.preventDefault()
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)

      // Selecionar todo o texto ao focar para facilitar substituição
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.select()
        }
      }, 0)

      // Quando foca no campo vazio, mostrar 0,00
      if (!displayValue) {
        setDisplayValue("R$ 0,00")
        onChange?.("0")
        onValueChange?.(0)
      }

      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)

      // Se estiver vazio ou zero após perder foco, limpar
      if (displayValue === "R$ 0,00") {
        setDisplayValue("")
        onChange?.("")
        onValueChange?.(0)
      }

      props.onBlur?.(e)
    }

    const handleClear = () => {
      setDisplayValue("")
      onChange?.("")
      onValueChange?.(0)

      // Focar no input após limpar
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 0)
    }

    const hasValue = displayValue && displayValue !== "" && displayValue !== "R$ 0,00"

    return (
      <div className="relative">
        <Input
          {...props}
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="R$ 0,00"
          className={cn(
            "text-right font-semibold tabular-nums tracking-tight pr-8",
            hasValue && "text-green-700 dark:text-green-400",
            isFocused && "ring-2 ring-blue-500 border-blue-500",
            className
          )}
        />
        {showClearButton && hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            tabIndex={-1}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }
)

MoneyInput.displayName = "MoneyInput"
