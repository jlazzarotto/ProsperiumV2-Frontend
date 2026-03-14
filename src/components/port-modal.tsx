"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Anchor, MapPin } from "lucide-react"
import { createPort, updatePort } from "@/app/services/port-service"
import { fetchEstados, fetchMunicipiosByIdUF, type Estado, type Municipio } from "@/app/services/internal-location-service"
import type { Port } from "@/types/types"
import customToast from "./ui/custom-toast"
import { handleError } from "@/lib/error-handler"

interface PortModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  port?: Port
  title: string
}

export function PortModal({ isOpen, onClose, onSave, port, title }: PortModalProps) {
  const [formState, setFormState] = useState<Omit<Port, "id" | "createdAt" | "updatedAt" | "code">>({
    name: "",
    acronym: "",
    state: "",
    city: "",
    cityId: undefined,
    status: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [states, setStates] = useState<Estado[]>([])
  const [cities, setCities] = useState<Municipio[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  // Carregar estados na montagem
  useEffect(() => {
    const loadStates = async () => {
      setLoadingStates(true)
      try {
        const statesData = await fetchEstados()
        setStates(statesData)
      } catch (error) {
        console.error("Erro ao carregar estados:", error)
        customToast.error("Erro ao carregar estados")
      } finally {
        setLoadingStates(false)
      }
    }

    loadStates()
  }, [])

  useEffect(() => {
    if (port) {
      setFormState({
        name: port.name || "",
        acronym: port.acronym || "",
        state: port.state || "",
        city: port.city || "",
        cityId: port.cityId,
        status: port.status ?? true,
      })

      // Carregar cidades do estado se já estiver definido
      if (port.state) {
        const state = states.find(s => s.sigla.toLowerCase() === port.state.toLowerCase())
        if (state) {
          loadCities(state.id)
        }
      }
    } else {
      setFormState({
        name: "",
        acronym: "",
        state: "",
        city: "",
        cityId: undefined,
        status: true,
      })
      setCities([])
    }
  }, [port, isOpen, states])

  const loadCities = async (idUf: number) => {
    setLoadingCities(true)
    try {
      const citiesData = await fetchMunicipiosByIdUF(idUf)
      setCities(citiesData)
    } catch (error) {
      console.error("Erro ao carregar cidades:", error)
      customToast.error("Erro ao carregar cidades")
    } finally {
      setLoadingCities(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | number | undefined) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário digita
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleStateChange = async (stateId: string) => {
    const state = states.find(s => s.id === Number(stateId))
    if (state) {
      handleInputChange("state", state.sigla)
      handleInputChange("city", "")
      handleInputChange("cityId", undefined)
      await loadCities(state.id)
    }
  }

  const handleCityChange = (cityId: string) => {
    const city = cities.find(c => c.id === Number(cityId))
    if (city) {
      handleInputChange("city", city.nome)
      handleInputChange("cityId", city.id)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formState.name || formState.name.length < 2) {
      newErrors.name = "Nome do porto deve ter no mínimo 2 caracteres"
    }

    if (!formState.acronym) {
      newErrors.acronym = "Sigla é obrigatória"
    }

    if (!formState.state) {
      newErrors.state = "Selecione a UF"
    }

    if (!formState.cityId) {
      newErrors.city = "Selecione a cidade"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      if (port?.id) {
        await updatePort(port.id, formState)
      } else {
        await createPort(formState)
      }
      onSave()
      onClose()
    } catch (error) {
      handleError(error, "salvar porto")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
        <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Anchor className="h-6 w-6 text-white" />
            </div>
            <span className="text-blue-900 dark:text-blue-100">{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6 py-6">
            {/* Card de Identificação */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                Identificação
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name" className="text-blue-800 dark:text-blue-200 font-medium">
                    Nome do Porto
                  </Label>
                  <Input
                    id="name"
                    value={formState.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="acronym" className="text-blue-800 dark:text-blue-200 font-medium">
                    Sigla
                  </Label>
                  <Input
                    id="acronym"
                    value={formState.acronym}
                    onChange={(e) => handleInputChange("acronym", e.target.value.toUpperCase())}
                    maxLength={10}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.acronym && <p className="text-sm text-red-500">{errors.acronym}</p>}
                </div>
              </div>
            </div>

            {/* Card de Localização */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Localização
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="state" className="text-blue-800 dark:text-blue-200 font-medium">
                    UF
                  </Label>
                  <SearchableSelect
                    options={states.map(state => ({
                      value: state.id.toString(),
                      label: `${state.sigla} - ${state.nome}`,
                      description: "Estado"
                    }))}
                    value={states.find(s => s.sigla.toLowerCase() === formState.state.toLowerCase())?.id.toString() || ""}
                    onValueChange={handleStateChange}
                    disabled={loadingStates}
                    loading={loadingStates}
                    placeholder="Selecione um estado..."
                    searchPlaceholder="Pesquisar estado..."
                    emptyMessage="Nenhum estado encontrado"
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="city" className="text-blue-800 dark:text-blue-200 font-medium">
                    Cidade
                  </Label>
                  <SearchableSelect
                    options={cities.map(city => ({
                      value: city.id.toString(),
                      label: city.nome,
                      description: city.capital ? "Capital" : undefined
                    }))}
                    value={formState.cityId?.toString() || ""}
                    onValueChange={handleCityChange}
                    disabled={!formState.state || loadingCities}
                    loading={loadingCities}
                    placeholder={
                      !formState.state
                        ? "Selecione um estado primeiro"
                        : "Selecione uma cidade..."
                    }
                    searchPlaceholder="Pesquisar cidade..."
                    emptyMessage="Nenhuma cidade encontrada"
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                </div>
              </div>
            </div>

            {/* Card de Status */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Status
              </h3>
              <div className="flex items-center space-x-3 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <Switch
                  id="status"
                  checked={formState.status}
                  onCheckedChange={(checked) => handleInputChange("status", checked)}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="status" className="cursor-pointer text-blue-900 dark:text-blue-100 font-medium">
                  {formState.status ? "Porto Ativo" : "Porto Inativo"}
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-blue-200 dark:border-blue-800 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
