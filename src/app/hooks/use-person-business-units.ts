"use client"

import { useState, useEffect } from "react"
import { httpClient } from "@/lib/http-client"
import customToast from "@/components/ui/custom-toast"

interface BusinessUnit {
  id: string
  code: string
  name: string
  abbreviation: string
  documentId: string
  city: string
  state: string
  isPrimary: boolean
}

export const usePersonBusinessUnits = (personId?: string) => {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPersonBusinessUnits = async () => {
    if (!personId) {
      setBusinessUnits([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Buscando filiais para pessoa:', personId)
      
      // Usar a API real que funciona
      const data = await httpClient.get(`pessoas/${personId}/vinculos-unidades-negocio`)
      console.log('Dados recebidos:', data)
      
      // Filtrar apenas filiais próprias (is_own_unit = true) 
      const filiaisData = Array.isArray(data) ? data.filter((item: any) => item.is_own_unit) : []
      console.log('Filiais filtradas:', filiaisData)
      
      // Mapear para o formato BusinessUnit
      const units: BusinessUnit[] = filiaisData.map((item: any) => ({
        id: item.id_un_negocio?.toString(),
        code: item.unidade?.codigo || '',
        name: item.unidade?.apelido || '',
        abbreviation: item.unidade?.abreviatura || '',
        documentId: item.unidade?.cnpj || '',
        city: item.unidade?.cidade || '',
        state: item.unidade?.estado || '',
        isPrimary: item.is_primary || false
      }))
      
      console.log('Units mapeadas:', units)
      setBusinessUnits(units)
    } catch (err) {
      console.error("Error fetching person business units:", err)
      setError("Failed to load business units. Please try again.")
      setBusinessUnits([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPersonBusinessUnits()
  }, [personId, fetchPersonBusinessUnits])

  const addBusinessUnitToPerson = async (businessUnitData: any, isPrimary = false) => {
    if (!personId) return

    try {
      setLoading(true)

      // Create the business unit first via API
      const response = await httpClient.post('un-negocios', {
        ...businessUnitData,
        tipo_cadastro_id: 2, // Business unit type
        pessoa_id: personId
      })

      console.log('Business unit created:', response)

      // Refresh the data
      await fetchPersonBusinessUnits()

      customToast.success("Unidade de negócio adicionada com sucesso!", {position: "top-right"})
    } catch (err) {
      console.error("Error adding business unit to person:", err)
      setError("Failed to add business unit. Please try again.")

      customToast.error("Erro ao adicionar unidade de negócio", {position: "top-right"})
    } finally {
      setLoading(false)
    }
  }

  const removeBusinessUnitFromPerson = async (businessUnitId: string) => {
    try {
      setLoading(true)

      // Delete the business unit via API
      await httpClient.delete(`un-negocios/${businessUnitId}`)

      // Refresh the data
      await fetchPersonBusinessUnits()

      customToast.success("Unidade de negócio removida com sucesso!", {position: "top-right"})
    } catch (err) {
      console.error("Error removing business unit from person:", err)
      setError("Failed to remove business unit. Please try again.")
      customToast.error("Erro ao remover unidade de negócio", {position: "top-right"})
    } finally {
      setLoading(false)
    }
  }

  const setPrimaryBusinessUnitForPerson = async (businessUnitId: string) => {
    if (!personId) return

    try {
      setLoading(true)

      // Set the primary business unit via API
      await httpClient.put(`pessoas/${personId}/unidade-primaria`, {
        unidade_negocio_id: businessUnitId
      })

      // Refresh the data
      await fetchPersonBusinessUnits()
      customToast.success("Unidade de negócio primária atualizada com sucesso!", {position: "top-right"})
    } catch (err) {
      console.error("Error setting primary business unit:", err)
      setError("Failed to set primary business unit. Please try again.")
      customToast.error("Erro ao atualizar unidade de negócio primária", {position: "top-right"})
    } finally {
      setLoading(false)
    }
  }

  return {
    businessUnits,
    loading,
    error,
    addBusinessUnitToPerson,
    removeBusinessUnitFromPerson,
    setPrimaryBusinessUnitForPerson,
    refreshBusinessUnits: fetchPersonBusinessUnits,
  }
}

