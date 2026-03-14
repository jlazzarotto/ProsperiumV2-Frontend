"use client"

import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerInputProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  placeholder?: string
}

export function DatePickerInput({ date, setDate, placeholder = "Selecione uma data" }: DatePickerInputProps) {
  const [inputValue, setInputValue] = useState(
    date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : ""
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setInputValue(date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "")
  }, [date])

  const handleInputChange = (value: string) => {
    // Remover tudo que não for número
    const numbersOnly = value.replace(/\D/g, '')

    // Aplicar máscara dd/mm/yyyy automaticamente
    let maskedValue = ''
    for (let i = 0; i < numbersOnly.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        maskedValue += '/'
      }
      maskedValue += numbersOnly[i]
    }

    setInputValue(maskedValue)

    // Tentar converter a data digitada
    // Suportar formato dd/mm (5 caracteres) usando ano atual
    if (maskedValue.length === 5) {
      try {
        const currentYear = new Date().getFullYear()
        const fullDate = `${maskedValue}/${currentYear}`
        const parsedDate = parse(fullDate, "dd/MM/yyyy", new Date())
        if (isValid(parsedDate)) {
          const localDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate())
          setDate(localDate)
          // Atualizar input com ano completo
          setInputValue(format(localDate, "dd/MM/yyyy", { locale: ptBR }))
        }
      } catch (error) {
        // Ignorar erro de parsing
      }
    }

    // Formato completo dd/mm/yyyy (10 caracteres)
    if (maskedValue.length === 10) {
      try {
        const parsedDate = parse(maskedValue, "dd/MM/yyyy", new Date())
        if (isValid(parsedDate)) {
          // Garantir que a data seja no timezone local
          const localDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate())
          setDate(localDate)
        }
      } catch (error) {
        // Ignorar erro de parsing
      }
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Garantir que a data seja no timezone local
      const localDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
      setDate(localDate)
      setInputValue(format(localDate, "dd/MM/yyyy", { locale: ptBR }))
    } else {
      setDate(undefined)
      setInputValue("")
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          className="pr-10"
          onKeyDown={(e) => {
            // Enter para confirmar
            if (e.key === 'Enter' && inputValue.length === 10) {
              const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date())
              if (isValid(parsedDate)) {
                const localDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate())
                setDate(localDate)
                setIsOpen(false)
              }
            }
          }}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-accent"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[20.5rem] p-0"
            align="start"
            side="bottom"
            sideOffset={6}
            collisionPadding={12}
          >
            <Calendar 
              mode="single" 
              selected={date} 
              onSelect={handleDateSelect} 
              initialFocus 
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
