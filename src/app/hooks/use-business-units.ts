"use client"

import { useState, useEffect, useRef } from "react"
import {
  getAllBusinessUnits,
  addBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit,
  searchBusinessUnits,
  getBusinessUnitById,
} from "@/app/services/business-unit-service"
import type { BusinessUnit } from "@/types/types"
import customToast from "@/components/ui/custom-toast"

// Chave para armazenar no localStorage
const CACHE_KEY = "business_units_cache"

export const useBusinessUnits = () => {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasLoadedRef = useRef(false)
  const saveToCache = (units: BusinessUnit[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(units))
    } catch (err) {
      console.error("Error saving to cache:", err)
    }
  }

  // Função para carregar do cache
  const loadFromCache = (): BusinessUnit[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      return cached ? JSON.parse(cached) : null
    } catch (err) {
      console.error("Error loading from cache:", err)
      return null
    }
  }

  // Fetch business units
  const fetchBusinessUnits = async (forceRefresh = false) => {
    // Se já carregamos e não estamos forçando atualização, não faça nada
    if (hasLoadedRef.current && !forceRefresh) {
      return
    }

    try {
      // Primeiro, tente carregar do cache se não estamos forçando atualização
      if (!forceRefresh) {
        const cached = loadFromCache()
        if (cached && cached.length > 0) {
          console.log("Loaded business units from cache:", cached)
          setBusinessUnits(cached)
          hasLoadedRef.current = true
          return
        }
      }

      // Se não temos cache ou estamos forçando atualização, carregue da API
      setLoading(true)
      setError(null)
      console.log("Fetching business units from API...")
      const units = await getAllBusinessUnits()
      console.log("Fetched business units:", units)

      setBusinessUnits(units)
      saveToCache(units)
      hasLoadedRef.current = true
    } catch (err) {
      console.error("Error fetching business units:", err)
      setError("Falha ao carregar as unidades de negócio. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch - use effect sem dependências para garantir que rode apenas uma vez
  useEffect(() => {
    fetchBusinessUnits()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Add a business unit
  const addBusinessUnitHandler = async (businessUnit: Omit<BusinessUnit, "id">) => {
    try {
      setLoading(true)
      setError(null)
      const id = await addBusinessUnit(businessUnit)
      const newBusinessUnit = { ...businessUnit, id }

      // Atualizar o estado e o cache
      const updatedUnits = [newBusinessUnit, ...businessUnits]
      setBusinessUnits(updatedUnits)
      saveToCache(updatedUnits)

      customToast.success("Unidade de negócio cadastrada com sucesso", {position: "top-right"})

      return id
    } catch (err) {
      console.error("Error adding business unit:", err)
      setError("Falha ao adicionar unidade de negócio. Por favor, tente novamente.")

      customToast.error("Erro ao cadastrar unidade de negócio", {position: "top-right"})

      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateBusinessUnitHandler = async (id: string, businessUnit: Partial<BusinessUnit>) => {
    try {
      setLoading(true)
      setError(null)
      await updateBusinessUnit(id, businessUnit)

      // Atualizar o estado e o cache
      const updatedUnits = businessUnits.map((unit) => (unit.id === id ? { ...unit, ...businessUnit, id } : unit))
      setBusinessUnits(updatedUnits)
      saveToCache(updatedUnits)

      customToast.success("Unidade de negócio atualizada com sucesso", {position: "top-right"})
    } catch (err) {
      console.error("Error updating business unit:", err)
      setError("Falha ao atualizar unidade de negócio. Por favor, tente novamente.")

      customToast.error("Erro ao atualizar unidade de negócio", {position: "top-right"})
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete a business unit
  const deleteBusinessUnitHandler = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await deleteBusinessUnit(id)

      // Atualizar o estado e o cache
      const updatedUnits = businessUnits.filter((unit) => unit.id !== id)
      setBusinessUnits(updatedUnits)
      saveToCache(updatedUnits)

      customToast.success("Unidade de negócio excluída com sucesso", {position: "top-right"})
    } catch (err) {
      console.error("Error deleting business unit:", err)
      setError("Falha ao excluir unidade de negócio. Por favor, tente novamente.")

      customToast.error("Erro ao excluir unidade de negócio", {position: "top-right"})

      throw err
    } finally {
      setLoading(false)
    }
  }

  // Search business units
  const searchBusinessUnitsHandler = async (searchTerm: string) => {
    // Se o termo de pesquisa estiver vazio, use os dados em cache
    if (!searchTerm.trim()) {
      const cached = loadFromCache()
      if (cached) {
        setBusinessUnits(cached)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)
      const results = await searchBusinessUnits(searchTerm)
      setBusinessUnits(results)
      // Não salvamos resultados de pesquisa no cache
    } catch (err) {
      console.error("Error searching business units:", err)
      setError("Falha ao pesquisar. Por favor, tente novamente.")

      customToast.error("Erro na pesquisa de unidades de negócio", {position: "top-right"})
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getBusinessUnit = async (id: string) => {
    // Primeiro, tente encontrar no estado atual
    const existingUnit = businessUnits.find((unit) => unit.id === id)
    if (existingUnit) {
      return existingUnit
    }

    try {
      setLoading(true)
      return await getBusinessUnitById(id)
    } catch (err) {
      console.error("Error getting business unit:", err)
      setError("Falha ao buscar unidade de negócio. Por favor, tente novamente.")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshBusinessUnits = async () => {
    await fetchBusinessUnits(true)
  }

  return {
    businessUnits,
    loading,
    error,
    addBusinessUnit: addBusinessUnitHandler,
    updateBusinessUnit: updateBusinessUnitHandler,
    deleteBusinessUnit: deleteBusinessUnitHandler,
    searchBusinessUnits: searchBusinessUnitsHandler,
    getBusinessUnit,
    refreshBusinessUnits,
  }
}

