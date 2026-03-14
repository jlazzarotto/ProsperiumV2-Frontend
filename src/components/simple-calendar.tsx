"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Keyboard } from "lucide-react"

interface SimpleCalendarProps {
  selectedDate?: Date
  onSelect: (date: Date) => void
  onClose?: () => void
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function SimpleCalendar({ selectedDate, onSelect, onClose }: SimpleCalendarProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(selectedDate?.getMonth() ?? today.getMonth())
  const [currentYear, setCurrentYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear())
  
  // Estados para input manual
  const [manualInput, setManualInput] = useState(() => 
    selectedDate ? selectedDate.toLocaleDateString('pt-BR') : ""
  )
  const [inputError, setInputError] = useState("")

  // Atualizar input quando selectedDate mudar
  useEffect(() => {
    if (selectedDate) {
      setManualInput(selectedDate.toLocaleDateString('pt-BR'))
    } else {
      setManualInput("")
    }
  }, [selectedDate])

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const firstDayWeekday = firstDayOfMonth.getDay() // 0 = domingo, 1 = segunda, etc
  
  const days = []
  
  // Calcular dias do mês anterior (se necessário)
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
  
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    days.push(new Date(prevYear, prevMonth, daysInPrevMonth - i))
  }
  
  // Dias do mês atual
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dayDate = new Date(currentYear, currentMonth, day, 12, 0, 0, 0) // Meio-dia para evitar problemas
    days.push(dayDate)
  }
  
  // Dias do próximo mês (para completar as 6 semanas)
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
  const remainingDays = 42 - days.length
  
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(nextYear, nextMonth, day))
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleDateClick = (date: Date) => {
    // Criar nova data garantindo meio-dia
    const safeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
    console.log('🗓️ Data clicada original:', date.getDate(), '/', date.getMonth() + 1, '/', date.getFullYear())
    console.log('🗓️ Data enviada:', safeDate.getDate(), '/', safeDate.getMonth() + 1, '/', safeDate.getFullYear())
    onSelect(safeDate)
    onClose?.()
  }

  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear()
  }

  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth
  }

  // Funções para input manual
  const parseBrazilianDate = (dateString: string): Date | null => {
    // Remove espaços e normaliza
    const cleaned = dateString.trim()
    
    // Regex para formatos brasileiros: dd/mm/yyyy, dd/mm/yy, dd-mm-yyyy, dd.mm.yyyy
    const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/
    const match = cleaned.match(dateRegex)
    
    if (!match) return null
    
    let [, day, month, year] = match
    
    // Converter ano de 2 dígitos para 4 dígitos
    if (year.length === 2) {
      const currentYear = new Date().getFullYear()
      const century = Math.floor(currentYear / 100) * 100
      year = String(century + parseInt(year))
    }
    
    // Limitar ano a 4 dígitos
    if (year.length > 4) {
      year = year.substring(0, 4)
    }
    
    const dayNum = parseInt(day)
    const monthNum = parseInt(month) - 1 // JavaScript usa mês base 0
    const yearNum = parseInt(year)
    
    // Validações básicas
    if (dayNum < 1 || dayNum > 31) return null
    if (monthNum < 0 || monthNum > 11) return null
    if (yearNum < 1900 || yearNum > 2100) return null
    
    const date = new Date(yearNum, monthNum, dayNum, 12, 0, 0, 0)
    
    // Verificar se a data é válida (ex: 31/02 seria inválida)
    if (date.getDate() !== dayNum || date.getMonth() !== monthNum || date.getFullYear() !== yearNum) {
      return null
    }
    
    return date
  }

  const handleManualInput = (value: string) => {
    setManualInput(value)
    setInputError("")
    
    if (value.length >= 8) {
      const parsedDate = parseBrazilianDate(value)
      if (!parsedDate) {
        setInputError("Data inválida")
      }
    }
  }

  const handleManualSubmit = () => {
    const parsedDate = parseBrazilianDate(manualInput)
    if (parsedDate) {
      onSelect(parsedDate)
      onClose?.()
    } else {
      setInputError("Data inválida. Use o formato dd/mm/aaaa")
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 border rounded-lg shadow-lg w-80">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-0 rounded-t-lg rounded-b-none">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="input" className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Digitar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="p-3 mt-0">
          {/* Header com navegação */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold">
              {MONTHS[currentMonth]} {currentYear}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
                {day}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  h-8 w-8 text-sm rounded-md flex items-center justify-center transition-colors
                  ${!isCurrentMonth(date) 
                    ? "text-gray-400 hover:text-gray-600" 
                    : "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                  ${isSelectedDate(date) 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : ""
                  }
                  ${isToday(date) && !isSelectedDate(date)
                    ? "bg-blue-100 text-blue-600 font-semibold" 
                    : ""
                  }
                `}
              >
                {date.getDate()}
              </button>
            ))}
          </div>

          {/* Footer com botão hoje */}
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateClick(today)}
              className="w-full text-xs"
            >
              Hoje
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="input" className="p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Digite a data:
              </label>
              <Input
                value={manualInput}
                onChange={(e) => handleManualInput(e.target.value)}
                placeholder="dd/mm/aaaa"
                className="text-center"
                onKeyDown={(e) => {
                  // Permitir apenas números e separadores
                  if (!/[\d\/\-\.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                    e.preventDefault()
                  }
                  
                  const value = e.currentTarget.value
                  
                  // Limitar ano a 4 dígitos (formato dd/mm/aaaa)
                  if (value.length >= 10 && !/[Backspace|Delete|ArrowLeft|ArrowRight|Tab|Enter]/.test(e.key)) {
                    e.preventDefault()
                    return
                  }
                  
                  // Auto-inserir separadores
                  if ((value.length === 2 || value.length === 5) && e.key !== 'Backspace' && e.key !== 'Delete') {
                    if (!/[\/\-\.]/.test(e.key)) {
                      const newValue = value + '/'
                      e.currentTarget.value = newValue
                      setManualInput(newValue)
                      e.preventDefault()
                    }
                  }
                  
                  // Enter para confirmar
                  if (e.key === 'Enter') {
                    handleManualSubmit()
                  }
                }}
              />
              {inputError && (
                <p className="text-red-500 text-xs mt-1">{inputError}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                Formatos aceitos: dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleManualSubmit}
              className="flex-1"
              disabled={!manualInput || inputError !== ""}
            >
              Confirmar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setManualInput("")
                setInputError("")
              }}
              className="flex-1"
            >
              Limpar
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}