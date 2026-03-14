"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, ChevronRight } from "lucide-react"
import { getAllPeople } from "@/app/services/person-api-service"
import { getTipo8BusinessUnits, type Tipo8BusinessUnit } from "@/services/business-unit-service"
import { SearchableSelect } from "@/components/ui/searchable-select"
import type { Person, BusinessUnit } from "@/types/types"

interface BusinessUnitClientSelectorProps {
  selectedBusinessUnitId?: string
  selectedPersonId?: string
  onBusinessUnitChange?: (businessUnitId: string, businessUnit: BusinessUnit | null) => void
  onPersonChange?: (personId: string, person: Person | null) => void
  disabled?: boolean
  required?: boolean
  label?: string
  showFullInfo?: boolean
  personLabel?: string // "Cliente", "Devedor/Credor", etc.
}

export function BusinessUnitClientSelector({
  selectedBusinessUnitId = "",
  selectedPersonId = "",
  onBusinessUnitChange,
  onPersonChange,
  disabled = false,
  required = false,
  label = "Unidade de Negócio e Cliente",
  showFullInfo = true,
  personLabel = "Cliente",
}: BusinessUnitClientSelectorProps) {
  const [tipo8BusinessUnits, setTipo8BusinessUnits] = useState<Tipo8BusinessUnit[]>([])
  const [clients, setClients] = useState<Person[]>([])
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<Tipo8BusinessUnit | null>(null)
  const [selectedClient, setSelectedClient] = useState<Person | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Carregar empresas (pessoas tipo 8) na inicialização
  useEffect(() => {
    const loadTipo8BusinessUnits = async () => {
      setLoading(true)
      try {
        const units = await getTipo8BusinessUnits()
        setTipo8BusinessUnits(units)
        console.log('🏢 Empresas carregadas:', units.length)

        // Se há uma unidade pré-selecionada, carregá-la
        if (selectedBusinessUnitId && units.length > 0) {
          const preSelectedUnit = units.find(unit => unit.id_pessoa?.toString() === selectedBusinessUnitId)
          if (preSelectedUnit) {
            setSelectedBusinessUnit(preSelectedUnit)
            if (onBusinessUnitChange) {
              onBusinessUnitChange(selectedBusinessUnitId, preSelectedUnit as unknown as BusinessUnit)
            }
          }
        }

      } catch (error) {
        console.error('Erro ao carregar empresas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTipo8BusinessUnits()
  }, [selectedBusinessUnitId, onBusinessUnitChange])

  // Carregar todos os clientes (pessoas não tipo 8) quando uma unidade é selecionada
  useEffect(() => {
    const loadClients = async () => {
      if (!selectedBusinessUnit) {
        setClients([])
        return
      }

      setLoadingClients(true)
      try {
        const peopleData = await getAllPeople()
        // Filtrar apenas pessoas que não são tipo 8 (clientes)
        const clientData = peopleData.filter(person => (person as any).id_tipo_cadastro !== 8)
        setClients(clientData)
        console.log('👥 Clientes carregados:', clientData.length)
        
        // Se há um cliente pré-selecionado, carregá-lo
        if (selectedPersonId && clientData.length > 0) {
          const preSelectedClient = clientData.find(client => client.id?.toString() === selectedPersonId)
          if (preSelectedClient) {
            setSelectedClient(preSelectedClient)
            if (onPersonChange) {
              onPersonChange(selectedPersonId, preSelectedClient)
            }
          }
        }
        
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      } finally {
        setLoadingClients(false)
      }
    }

    loadClients()
  }, [selectedBusinessUnit, selectedPersonId, onPersonChange])

  const handleBusinessUnitChange = (value: string) => {
    const unit = tipo8BusinessUnits.find(u => u.id_pessoa?.toString() === value)
    setSelectedBusinessUnit(unit || null)
    
    // Limpar cliente selecionado quando muda a unidade
    setSelectedClient(null)
    
    if (onBusinessUnitChange) {
      onBusinessUnitChange(value, (unit || null) as unknown as BusinessUnit)
    }
    if (onPersonChange) {
      onPersonChange("", null)
    }
  }

  const handleClientChange = (value: string) => {
    const client = clients.find(p => p.id?.toString() === value)
    setSelectedClient(client || null)
    if (onPersonChange) {
      onPersonChange(value, client || null)
    }
  }

  const businessUnitOptions = tipo8BusinessUnits.map(unit => ({
    value: unit.id_pessoa?.toString() || "",
    label: `${unit.apelido} (${unit.abreviatura})`,
    searchText: `${unit.apelido} ${unit.abreviatura}`,
  }))

  const clientOptions = clients.map(client => ({
    value: client.id?.toString() || "",
    label: client.name,
    searchText: `${client.name}`,
  }))

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium text-gray-700 flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Seleção de Unidade de Negócio Tipo 8 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            Unidade de Negócio
            {required && <span className="text-red-500">*</span>}
          </Label>
          
          <SearchableSelect
            options={businessUnitOptions}
            value={selectedBusinessUnit?.id?.toString() || ""}
            onValueChange={handleBusinessUnitChange}
            placeholder="Selecione uma unidade de negócio..."
            disabled={disabled || loading}
            loading={loading}
            emptyMessage="Nenhuma unidade encontrada"
            searchPlaceholder="Buscar unidade..."
          />
        </div>

        {/* Seleção de Cliente */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-3 w-3" />
            {personLabel}
          </Label>
          
          <SearchableSelect
            options={clientOptions}
            value={selectedClient?.id?.toString() || ""}
            onValueChange={handleClientChange}
            placeholder={`Selecione um ${personLabel.toLowerCase()}...`}
            disabled={disabled || loadingClients || !selectedBusinessUnit}
            loading={loadingClients}
            emptyMessage={`Nenhum ${personLabel.toLowerCase()} encontrado`}
            searchPlaceholder={`Buscar ${personLabel.toLowerCase()}...`}
          />
        </div>
      </div>

      {/* Informações detalhadas */}
      {showFullInfo && (selectedBusinessUnit || selectedClient) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card da Unidade Selecionada */}
          {selectedBusinessUnit && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Unidade Selecionada
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-blue-900">{selectedBusinessUnit.apelido}</p>
                    <p className="text-sm text-blue-700">{selectedBusinessUnit.abreviatura}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card do Cliente Selecionado */}
          {selectedClient && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  {personLabel} Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-green-900">{selectedClient.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-600">
                      Vinculado à {selectedBusinessUnit?.apelido}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}