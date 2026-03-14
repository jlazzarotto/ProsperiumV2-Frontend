"use client"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ date, setDate, placeholder = "Selecione uma data", className = "" }: DatePickerProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Criar data com meio-dia para evitar problemas de timezone
      const selectedDate = new Date(e.target.value + "T12:00:00")
      setDate(selectedDate)
    } else {
      setDate(undefined)
    }
  }

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return ""
    // Formatar como YYYY-MM-DD para o input date
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return (
    <Input
      type="date"
      value={formatDateForInput(date)}
      onChange={handleDateChange}
      placeholder={placeholder}
      className={className}
    />
  )
}

