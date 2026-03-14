"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTipo8BusinessUnits } from "@/services/business-unit-service"
import type { Tipo8BusinessUnit } from "@/services/business-unit-service"

interface BusinessUnitOnlySelectorProps {
  selectedBusinessUnitId: string
  onBusinessUnitChange: (businessUnitId: string, businessUnit: Tipo8BusinessUnit | null) => void
  disabled?: boolean
  placeholder?: string
}

export function BusinessUnitOnlySelector({
  selectedBusinessUnitId,
  onBusinessUnitChange,
  disabled = false,
  placeholder = "Selecione uma unidade de negócio..."
}: BusinessUnitOnlySelectorProps) {
  const [businessUnits, setBusinessUnits] = useState<Tipo8BusinessUnit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBusinessUnits = async () => {
      try {
        setLoading(true)
        const units = await getTipo8BusinessUnits()
        console.log('🏢 Unidades carregadas:', units)
        setBusinessUnits(units)
      } catch (error) {
        console.error("Erro ao carregar unidades de negócio:", error)
        setBusinessUnits([])
      } finally {
        setLoading(false)
      }
    }

    loadBusinessUnits()
  }, [])

  const handleValueChange = (value: string) => {
    console.log('🎯 Valor selecionado:', value)
    const selectedUnit = businessUnits.find(unit => unit.id_pessoa.toString() === value)
    console.log('🎯 Unidade encontrada:', selectedUnit)
    onBusinessUnitChange(value, selectedUnit || null)
  }

  return (
    <Select 
      value={selectedBusinessUnitId} 
      onValueChange={handleValueChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Carregando unidades..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {businessUnits.map((unit) => (
          <SelectItem
            key={unit.id_pessoa}
            value={unit.id_pessoa.toString()}
          >
            <div className="flex flex-col">
              <span className="font-medium">{unit.apelido}</span>
              <span className="text-sm text-muted-foreground">
                {unit.abreviatura}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}