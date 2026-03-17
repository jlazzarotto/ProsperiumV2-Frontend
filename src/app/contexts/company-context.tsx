"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

interface CompanyContextType {
  selectedCompanyId: number | null
  setSelectedCompanyId: (id: number | null) => void
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

const STORAGE_KEY = "prosperium_selected_company_id"

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<number | null>(null)

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      const id = parseInt(stored, 10)
      if (!isNaN(id)) {
        setSelectedCompanyIdState(id)
      }
    }
  }, [])

  const setSelectedCompanyId = useCallback((id: number | null) => {
    setSelectedCompanyIdState(id)
    if (id === null) {
      sessionStorage.removeItem(STORAGE_KEY)
    } else {
      sessionStorage.setItem(STORAGE_KEY, String(id))
    }
  }, [])

  return (
    <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId }}>
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompany = () => {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}
