"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FilterCompetenceProps {
  value: string
  onChange: (value: string) => void
}

export function FilterCompetence({ value, onChange }: FilterCompetenceProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '') // Remove caracteres não numéricos
    if (inputValue.length <= 6) { // Máximo 6 dígitos (YYYYMM)
      onChange(inputValue)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="competencia">Competência</Label>
      <Input
        id="competencia"
        placeholder="202512"
        value={value}
        onChange={handleInputChange}
        maxLength={6}
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">
        Digite no formato AAAAMM (ex: 202512 para Dezembro/2025)
      </p>
    </div>
  )
}
