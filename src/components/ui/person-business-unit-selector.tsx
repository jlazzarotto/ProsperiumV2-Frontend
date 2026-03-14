"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Building, ChevronRight } from "lucide-react"
import { getAllPeople } from "@/app/services/person-api-service"
import { getAllBusinessUnits } from "@/app/services/business-unit-api-service"
import { SearchableSelect } from "@/components/ui/searchable-select"
import type { Person, BusinessUnit } from "@/types/types"

interface PersonBusinessUnitSelectorProps {
  selectedPersonId?: string
  selectedBusinessUnitId?: string
  onPersonChange?: (personId: string, person: Person | null) => void
  onBusinessUnitChange?: (businessUnitId: string, businessUnit: BusinessUnit | null) => void
  disabled?: boolean
  required?: boolean
  label?: string
  showFullInfo?: boolean // Mostra informações detalhadas da pessoa/unidade selecionada
}

export function PersonBusinessUnitSelector({
  selectedPersonId = "",
  selectedBusinessUnitId = "",
  onPersonChange,
  onBusinessUnitChange,
  disabled = false,
  required = false,
  label = "Pessoa e Unidade de Negócio",
  showFullInfo = true,
}: PersonBusinessUnitSelectorProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<BusinessUnit | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Carregar todas as pessoas na inicialização
  useEffect(() => {
    const loadPeople = async () => {
      setLoading(true)
      try {
        const peopleData = await getAllPeople()
        setPeople(peopleData)
        console.log('🔍 Pessoas carregadas:', peopleData.length)
        
        // Se há uma pessoa pré-selecionada, carregá-la
        if (selectedPersonId && peopleData.length > 0) {
          const person = peopleData.find(p => String(p.id) === String(selectedPersonId))
          console.log('🔍 Pessoa selecionada encontrada:', person)
          if (person) {
            setSelectedPerson(person)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar pessoas:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadPeople()
  }, [])

  // Inicializar valores quando os props mudarem (para edição)
  useEffect(() => {
    if (people.length > 0 && selectedPersonId && !isInitialized) {
      const person = people.find(p => String(p.id) === String(selectedPersonId))
      if (person) {
        setSelectedPerson(person)
        setIsInitialized(true)
      }
    }
  }, [selectedPersonId, people, isInitialized])

  // Carregar unidades de negócio quando a pessoa mudar
  useEffect(() => {
    const loadBusinessUnits = async () => {
      if (!selectedPersonId) {
        setBusinessUnits([])
        setSelectedBusinessUnit(null)
        return
      }

      setLoadingUnits(true)
      try {
        const units = await getAllBusinessUnits()
        console.log('🔍 Units carregadas:', units.length)
        setBusinessUnits(units)

        // Se há uma unidade pré-selecionada, carregá-la
        if (selectedBusinessUnitId) {
          const unit = units.find(u => String(u.id) === String(selectedBusinessUnitId))
          console.log('🔍 Unidade selecionada encontrada:', unit)
          if (unit) {
            setSelectedBusinessUnit(unit)
          }
        } else if (units.length === 1) {
          setSelectedBusinessUnit(units[0])
          if (onBusinessUnitChange) {
            onBusinessUnitChange(units[0].id!, units[0])
          }
        }
      } catch (error) {
        console.error('Erro ao carregar unidades de negócio:', error)
      } finally {
        setLoadingUnits(false)
      }
    }

    loadBusinessUnits()
  }, [selectedPersonId, selectedBusinessUnitId, onBusinessUnitChange])

  const handlePersonChange = (personId: string) => {
    console.log('🔍 Pessoa selecionada:', personId)
    const person = people.find(p => p.id === personId) || null
    console.log('🔍 Dados da pessoa encontrada:', person)
    setSelectedPerson(person)
    setSelectedBusinessUnit(null) // Reset unidade quando pessoa muda
    
    if (onPersonChange) {
      onPersonChange(personId, person)
    }
    
    // Reset business unit selection quando pessoa muda
    if (onBusinessUnitChange) {
      onBusinessUnitChange("", null)
    }
  }

  const handleBusinessUnitChange = (businessUnitId: string) => {
    const businessUnit = businessUnits.find(u => u.id === businessUnitId) || null
    setSelectedBusinessUnit(businessUnit)
    
    if (onBusinessUnitChange) {
      onBusinessUnitChange(businessUnitId, businessUnit)
    }
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Users className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seleção de Pessoa */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-600">1. Selecione a Pessoa</Label>
          <SearchableSelect
            value={selectedPersonId}
            onValueChange={handlePersonChange}
            disabled={disabled || loading}
            loading={loading}
            placeholder={loading ? "Carregando pessoas..." : "Selecione uma pessoa"}
            searchPlaceholder="Pesquisar pessoa..."
            emptyMessage="Nenhuma pessoa encontrada"
            options={people.map(person => ({
              value: person.id!,
              label: person.name,
              description: person.email || `ID: ${person.id}`
            }))}
            className={selectedPerson ? "border-blue-300" : ""}
            renderOption={(option) => (
              <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{option.label}</div>
                  <div className="text-xs text-gray-500 truncate">{option.description}</div>
                </div>
                {option.value === selectedPersonId && (
                  <div className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2">✓</div>
                )}
              </div>
            )}
          />
        </div>

        {/* Seleção de Unidade de Negócio */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            2. Selecione a Unidade de Negócio
          </Label>
          <SearchableSelect
            value={selectedBusinessUnitId}
            onValueChange={handleBusinessUnitChange}
            disabled={disabled || !selectedPersonId || loadingUnits || businessUnits.length === 0}
            loading={loadingUnits}
            placeholder={
              !selectedPersonId 
                ? "Selecione uma pessoa primeiro"
                : loadingUnits 
                  ? "Carregando unidades..."
                  : businessUnits.length === 0
                    ? "Pessoa não tem unidades"
                    : "Selecione uma unidade"
            }
            searchPlaceholder="Pesquisar unidade..."
            emptyMessage="Nenhuma unidade encontrada"
            options={businessUnits.map(unit => ({
              value: unit.id!,
              label: `${selectedPerson?.name} - ${unit.name}`,
              description: unit.abbreviation || `ID: ${unit.id}`
            }))}
            className={selectedBusinessUnit ? "border-green-300" : ""}
            renderOption={(option) => (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Building className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{option.label}</div>
                    <div className="text-xs text-gray-500 truncate">{option.description}</div>
                  </div>
                </div>
                {option.value === selectedBusinessUnitId && (
                  <div className="h-4 w-4 text-green-600 flex-shrink-0 ml-2">✓</div>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Informações Detalhadas */}
      {showFullInfo && (selectedPerson || selectedBusinessUnit) && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              Informações da Seleção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedPerson && (
              <div className="flex items-start justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <div className="font-medium text-blue-900">{selectedPerson.name}</div>
                  {selectedPerson.email && (
                    <div className="text-sm text-blue-600">{selectedPerson.email}</div>
                  )}
                </div>
                <Badge className="bg-blue-600 text-white">Pessoa</Badge>
              </div>
            )}

            {selectedBusinessUnit && (
              <div className="flex items-start justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <div className="font-medium text-green-900">
                    {selectedPerson?.name} - {selectedBusinessUnit.name}
                  </div>
                  <div className="text-sm text-green-600">
                    {selectedBusinessUnit.abbreviation && `Abreviação: ${selectedBusinessUnit.abbreviation}`}
                  </div>
                </div>
                <Badge className="bg-green-600 text-white">Unidade</Badge>
              </div>
            )}

            {selectedPerson && selectedBusinessUnit && (
              <div className="flex items-center justify-center p-2 bg-emerald-100 rounded-lg border border-emerald-300">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Unidade de Negócio: {selectedPerson?.name} - {selectedBusinessUnit.name}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estado de erro quando não há unidades */}
      {selectedPerson && !loadingUnits && businessUnits.length === 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Building className="h-4 w-4" />
              <span className="text-sm font-medium">Esta pessoa não está associada a nenhuma unidade de negócio</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Para usar esta pessoa, ela deve primeiro ser vinculada a uma unidade de negócio.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}