"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Building, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonModal } from "@/components/person-modal"
import { getTipo8BusinessUnits, getClientesVinculadosUnidade } from "@/services/business-unit-service"
import { getAllBusinessUnitSummaries } from "@/app/services/business-unit-summary-service"
import { SearchableSelect } from "@/components/ui/searchable-select"
import type { BusinessUnit } from "@/types/types"
import type { Tipo8BusinessUnit, Cliente } from "@/services/business-unit-service"

interface TripleSelectorProps {
  selectedBusinessUnitId?: string
  selectedPersonId?: string
  selectedUnitId?: string
  onBusinessUnitChange?: (businessUnitId: string, businessUnit: Tipo8BusinessUnit | null) => void
  onPersonChange?: (personId: string, person: Cliente | null) => void
  onUnitChange?: (unitId: string, unit: BusinessUnit | null) => void
  disabled?: boolean
  required?: boolean
  label?: string
  showFullInfo?: boolean
  personLabel?: string
  vertical?: boolean
  isVisible?: boolean
  allowReverseLoading?: boolean
}

export function TripleSelector({
  selectedBusinessUnitId = "",
  selectedPersonId = "",
  selectedUnitId = "",
  onBusinessUnitChange,
  onPersonChange,
  onUnitChange,
  disabled = false,
  required = false,
  label = "Empresa, Unidade e Devedor/Credor",
  showFullInfo = true,
  personLabel = "Devedor/Credor",
  vertical = false,
  isVisible = true,
  allowReverseLoading = false,
}: TripleSelectorProps) {
  const [tipo8BusinessUnits, setTipo8BusinessUnits] = useState<Tipo8BusinessUnit[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [unidades, setUnidades] = useState<BusinessUnit[]>([])
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<Tipo8BusinessUnit | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [selectedUnidade, setSelectedUnidade] = useState<BusinessUnit | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loadingUnidades, setLoadingUnidades] = useState(false)

  const [showPersonModal, setShowPersonModal] = useState(false)

  // Reset quando não está visível ou é modo criação
  useEffect(() => {
    if (!isVisible) return
    if (!selectedBusinessUnitId && !selectedPersonId && !selectedUnitId) {
      setSelectedBusinessUnit(null)
      setSelectedCliente(null)
      setSelectedUnidade(null)
      setClientes([])
    }
  }, [isVisible, selectedBusinessUnitId, selectedPersonId, selectedUnitId])

  // Carregar empresas (tipo 8)
  useEffect(() => {
    const loadTipo8BusinessUnits = async () => {
      setLoading(true)
      try {
        const units = await getTipo8BusinessUnits()
        setTipo8BusinessUnits(units)

        if (selectedBusinessUnitId && units.length > 0 && !selectedBusinessUnit && allowReverseLoading) {
          const preSelected = units.find(unit => unit.id_pessoa?.toString() === selectedBusinessUnitId)
          if (preSelected) setSelectedBusinessUnit(preSelected)
        }
      } catch (error) {
        console.error('Erro ao carregar empresas:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTipo8BusinessUnits()
  }, [])

  // Carregar clientes vinculados quando empresa é selecionada
  useEffect(() => {
    const loadClientesVinculados = async () => {
      if (!selectedBusinessUnit) {
        setClientes([])
        setSelectedCliente(null)
        return
      }

      setLoadingClientes(true)
      try {
        const clientesData = await getClientesVinculadosUnidade(selectedBusinessUnit.id.toString())
        setClientes(clientesData)

        if (selectedPersonId && clientesData.length > 0 && !selectedCliente && allowReverseLoading) {
          const preSelected = clientesData.find(c => c.id?.toString() === selectedPersonId)
          if (preSelected) setSelectedCliente(preSelected)
        }
      } catch (error) {
        console.error('Erro ao carregar clientes vinculados:', error)
        setClientes([])
      } finally {
        setLoadingClientes(false)
      }
    }
    loadClientesVinculados()
  }, [selectedBusinessUnit?.id])

  // Carregar unidades (pessoas tipo 10) sempre, sem depender da empresa
  useEffect(() => {
    const loadUnidades = async () => {
      setLoadingUnidades(true)
      try {
        const businessUnitSummaries = await getAllBusinessUnitSummaries()
        const unidadesData: BusinessUnit[] = businessUnitSummaries.map((u) => ({
          id: u.id,
          code: u.id,
          name: u.apelido,
          abbreviation: u.abreviatura || "",
          postalCode: "",
          city: "",
          state: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
        }))
        setUnidades(unidadesData)

        if (selectedUnitId && unidadesData.length > 0 && !selectedUnidade && allowReverseLoading) {
          const preSelected = unidadesData.find(unit => unit.id?.toString() === selectedUnitId)
          if (preSelected) setSelectedUnidade(preSelected)
        } else if (unidadesData.length === 1 && !selectedUnidade && allowReverseLoading) {
          const unicaUnidade = unidadesData[0]
          setSelectedUnidade(unicaUnidade)
          if (onUnitChange) onUnitChange(unicaUnidade.id || "", unicaUnidade)
        }
      } catch (error) {
        console.error('Erro ao carregar unidades:', error)
        setUnidades([])
      } finally {
        setLoadingUnidades(false)
      }
    }
    loadUnidades()
  }, [])

  const handleBusinessUnitChange = (value: string) => {
    const unit = value ? tipo8BusinessUnits.find(u => u.id_pessoa?.toString() === value) : null
    setSelectedBusinessUnit(unit || null)
    setSelectedCliente(null)

    if (onBusinessUnitChange) onBusinessUnitChange(value, unit || null)
    if (onPersonChange) onPersonChange("", null)
  }

  const handleUnidadeChange = (value: string) => {
    const unidade = value ? unidades.find(u => u.id?.toString() === value) : null
    setSelectedUnidade(unidade || null)
    if (onUnitChange) onUnitChange(value, unidade || null)
  }

  const handleClienteChange = (value: string) => {
    const cliente = value ? clientes.find(c => c.id?.toString() === value) : null
    setSelectedCliente(cliente || null)
    if (onPersonChange) onPersonChange(value, cliente || null)
  }

  const handlePersonModalClose = async (saved: boolean) => {
    setShowPersonModal(false)
    if (saved && selectedBusinessUnit) {
      try {
        const clientesData = await getClientesVinculadosUnidade(selectedBusinessUnit.id.toString())
        setClientes(clientesData)
      } catch (error) {
        console.error('Erro ao recarregar clientes:', error)
      }
    }
  }

  const businessUnitOptions = [
    { value: "", label: "-- Selecione empresa --", searchText: "limpar remover" },
    ...tipo8BusinessUnits.map(unit => ({
      value: unit.id_pessoa?.toString() || "",
      label: `${unit.apelido || unit.abreviatura} (${unit.abreviatura})`,
      searchText: `${unit.apelido || ''} ${unit.abreviatura}`,
    }))
  ]

  const unidadeOptions = [
    { value: "", label: "-- Selecione unidade --", searchText: "limpar remover" },
    ...unidades.map(unidade => ({
      value: unidade.id?.toString() || "",
      label: `${unidade.name} (${unidade.abbreviation})`,
      searchText: `${unidade.name} ${unidade.abbreviation}`,
    }))
  ]

  const clienteOptions = [
    { value: "", label: `-- Selecione ${personLabel.toLowerCase()} --`, searchText: "limpar remover" },
    ...clientes.map(cliente => ({
      value: cliente.id?.toString() || "",
      label: cliente.nome,
      searchText: cliente.nome,
    }))
  ]

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium text-gray-700 flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <div className={`grid gap-4 ${vertical ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* 1. Empresa (tipo 8) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-3 w-3 text-purple-600" />
            Empresa
            {required && <span className="text-red-500">*</span>}
          </Label>

          <SearchableSelect
            options={businessUnitOptions}
            value={selectedBusinessUnit?.id_pessoa?.toString() || ""}
            onValueChange={handleBusinessUnitChange}
            placeholder="Selecione empresa..."
            disabled={disabled || loading}
            loading={loading}
            emptyMessage="Nenhuma empresa encontrada"
            searchPlaceholder="Buscar empresa..."
          />
        </div>

        {/* 2. Unidade */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Building className="h-3 w-3 text-green-600" />
            Unidade
          </Label>

          <SearchableSelect
            options={unidadeOptions}
            value={selectedUnidade?.id?.toString() || ""}
            onValueChange={handleUnidadeChange}
            placeholder="Selecione unidade..."
            disabled={disabled || loadingUnidades}
            loading={loadingUnidades}
            emptyMessage="Nenhuma unidade encontrada"
            searchPlaceholder="Buscar unidade..."
          />
        </div>

        {/* 3. Devedor/Credor */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-3 w-3 text-blue-600" />
            {personLabel}
            {required && <span className="text-red-500">*</span>}
          </Label>

          <div className="flex gap-2">
            <div className="flex-1">
              <SearchableSelect
                options={clienteOptions}
                value={selectedCliente?.id?.toString() || ""}
                onValueChange={handleClienteChange}
                placeholder={`Selecione ${personLabel.toLowerCase()}...`}
                disabled={disabled || loadingClientes || !selectedBusinessUnit}
                loading={loadingClientes}
                emptyMessage={`Nenhum ${personLabel.toLowerCase()} encontrado`}
                searchPlaceholder={`Buscar ${personLabel.toLowerCase()}...`}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowPersonModal(true)}
              disabled={disabled}
              title={`Criar novo ${personLabel.toLowerCase()}`}
              className="h-10 w-10 shrink-0 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
            >
              <Plus className="h-4 w-4 text-blue-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cards informativos */}
      {showFullInfo && (selectedBusinessUnit || selectedUnidade || selectedCliente) && (
        <div className={`grid gap-4 ${vertical ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Card Empresa */}
          {selectedBusinessUnit && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  Empresa Selecionada
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <p className="font-medium text-purple-900">{selectedBusinessUnit.apelido}</p>
                  <p className="text-sm text-purple-700">{selectedBusinessUnit.abreviatura}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card Unidade */}
          {selectedUnidade && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4 text-green-600" />
                  Unidade Selecionada
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <p className="font-medium text-green-900">{selectedUnidade.name}</p>
                  <p className="text-sm text-green-700">{selectedUnidade.abbreviation}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card Devedor/Credor */}
          {selectedCliente && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  {personLabel} Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <p className="font-medium text-blue-900">{selectedCliente.nome}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal de Pessoa */}
      {showPersonModal && (
        <PersonModal
          person={null}
          onClose={handlePersonModalClose}
          defaultBusinessUnitId={selectedBusinessUnit?.id_pessoa?.toString()}
        />
      )}
    </div>
  )
}
