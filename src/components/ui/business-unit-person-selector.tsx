"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Building2, Users } from "lucide-react"
import { getTipo8BusinessUnits, getClientesVinculadosUnidade } from "@/services/business-unit-service"
import type { Tipo8BusinessUnit, Cliente } from "@/services/business-unit-service"

interface BusinessUnitPersonSelectorProps {
  selectedBusinessUnitId?: string
  selectedPersonId?: string
  onBusinessUnitChange?: (businessUnitId: string, businessUnit: Tipo8BusinessUnit | null) => void
  onPersonChange?: (personId: string, person: Cliente | null) => void
  disabled?: boolean
  required?: boolean
  label?: string
  personLabel?: string
}

export function BusinessUnitPersonSelector({
  selectedBusinessUnitId = "",
  selectedPersonId = "",
  onBusinessUnitChange,
  onPersonChange,
  disabled = false,
  required = false,
  label = "Unidade de Negócio e Devedor/Credor",
  personLabel = "Devedor/Credor",
}: BusinessUnitPersonSelectorProps) {
  const [tipo8BusinessUnits, setTipo8BusinessUnits] = useState<Tipo8BusinessUnit[]>([])
  const [pessoas, setPessoas] = useState<Cliente[]>([])
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<Tipo8BusinessUnit | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPessoas, setLoadingPessoas] = useState(false)

  // Carregar unidades tipo 8
  useEffect(() => {
    const loadTipo8BusinessUnits = async () => {
      setLoading(true)
      try {
        const units = await getTipo8BusinessUnits()
        setTipo8BusinessUnits(units)
        console.log('🏢 Unidades tipo 8 carregadas:', units.length)
        
        // Pré-selecionar unidade se fornecida
        if (selectedBusinessUnitId && units.length > 0 && !selectedBusinessUnit) {
          const preSelected = units.find(unit => unit.id?.toString() === selectedBusinessUnitId)
          if (preSelected) {
            setSelectedBusinessUnit(preSelected)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar unidades tipo 8:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTipo8BusinessUnits()
  }, [])

  // Carregar pessoas vinculadas à unidade de negócio selecionada
  useEffect(() => {
    const loadPessoasVinculadas = async () => {
      if (!selectedBusinessUnit) {
        setPessoas([])
        setSelectedPerson(null)
        return
      }

      setLoadingPessoas(true)
      try {
        const pessoasData = await getClientesVinculadosUnidade(selectedBusinessUnit.id.toString())
        setPessoas(pessoasData)
        console.log('👥 Pessoas vinculadas carregadas:', pessoasData.length)
        
        // Pré-selecionar pessoa se fornecida
        if (selectedPersonId && pessoasData.length > 0 && !selectedPerson) {
          const preSelected = pessoasData.find(pessoa => pessoa.id?.toString() === selectedPersonId)
          if (preSelected) {
            setSelectedPerson(preSelected)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar pessoas vinculadas:', error)
        setPessoas([])
      } finally {
        setLoadingPessoas(false)
      }
    }

    loadPessoasVinculadas()
  }, [selectedBusinessUnit?.id])

  const handleBusinessUnitChange = (value: string) => {
    console.log('🏢 Unidade de negócio selecionada:', value)
    const unit = tipo8BusinessUnits.find(u => u.id?.toString() === value)
    setSelectedBusinessUnit(unit || null)
    
    // Limpar pessoa quando muda unidade de negócio
    setSelectedPerson(null)
    
    if (onBusinessUnitChange) {
      onBusinessUnitChange(value, unit || null)
    }
    if (onPersonChange) {
      onPersonChange("", null)
    }
  }

  const handlePersonChange = (value: string) => {
    console.log('👤 Pessoa selecionada:', value)
    const person = pessoas.find(p => p.id?.toString() === value)
    setSelectedPerson(person || null)
    
    if (onPersonChange) {
      onPersonChange(value, person || null)
    }
  }

  const businessUnitOptions = tipo8BusinessUnits.map(unit => ({
    value: unit.id?.toString() || "",
    label: `${unit.apelido} (${unit.abreviatura})`,
    searchText: `${unit.apelido} ${unit.abreviatura}`,
  }))

  const pessoaOptions = pessoas.map(pessoa => ({
    value: pessoa.id?.toString() || "",
    label: pessoa.nome,
    searchText: pessoa.nome,
  }))

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium text-gray-700 flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Unidade de Negócio Tipo 8 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-3 w-3 text-purple-600" />
            Unidade de Negócio
            {required && <span className="text-red-500">*</span>}
          </Label>
          
          <SearchableSelect
            options={businessUnitOptions}
            value={selectedBusinessUnit?.id?.toString() || ""}
            onValueChange={handleBusinessUnitChange}
            placeholder="Selecione unidade de negócio..."
            disabled={disabled || loading}
            loading={loading}
            emptyMessage="Nenhuma unidade encontrada"
            searchPlaceholder="Buscar unidade..."
          />
        </div>

        {/* 2. Pessoa (Devedor/Credor) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-3 w-3 text-blue-600" />
            {personLabel}
            {required && <span className="text-red-500">*</span>}
          </Label>
          
          <SearchableSelect
            options={pessoaOptions}
            value={selectedPerson?.id?.toString() || ""}
            onValueChange={handlePersonChange}
            placeholder={`Selecione ${personLabel.toLowerCase()}...`}
            disabled={disabled || loadingPessoas || !selectedBusinessUnit}
            loading={loadingPessoas}
            emptyMessage={`Nenhum ${personLabel.toLowerCase()} encontrado`}
            searchPlaceholder={`Buscar ${personLabel.toLowerCase()}...`}
          />
        </div>
      </div>
    </div>
  )
}