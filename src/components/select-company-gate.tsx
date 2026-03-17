"use client"

import { useEffect, useState } from "react"
import { Building2, ChevronRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCompanies, type CompanyItem } from "@/app/services/core-saas-service"
import { useCompany } from "@/app/contexts/company-context"
import customToast from "@/components/ui/custom-toast"

export function SelectCompanyGate() {
  const { setSelectedCompanyId } = useCompany()
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>("")

  useEffect(() => {
    const loadCompanies = async () => {
      setLoading(true)
      try {
        const data = await getCompanies()
        setCompanies(data)
      } catch (error) {
        console.error("Erro ao carregar empresas:", error)
        customToast.error("Erro ao carregar empresas", { position: "top-right" })
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
  }, [])

  const handleSelect = () => {
    if (!selectedId) {
      customToast.error("Selecione uma empresa", { position: "top-right" })
      return
    }

    const id = parseInt(selectedId, 10)
    if (!isNaN(id)) {
      setSelectedCompanyId(id)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Selecione uma Empresa</CardTitle>
          <CardDescription>Escolha com qual empresa deseja trabalhar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhuma empresa disponível</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Empresa</label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={String(company.id)}>
                        {company.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSelect}
                disabled={!selectedId || loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
