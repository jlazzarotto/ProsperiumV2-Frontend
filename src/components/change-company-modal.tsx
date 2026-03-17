"use client"

import { useEffect, useState } from "react"
import { Building2, ChevronRight, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCompanies, type CompanyItem } from "@/app/services/core-saas-service"
import { useCompany } from "@/app/contexts/company-context"
import customToast from "@/components/ui/custom-toast"

interface ChangeCompanyModalProps {
  open: boolean
  onClose: () => void
}

export function ChangeCompanyModal({ open, onClose }: ChangeCompanyModalProps) {
  const { selectedCompanyId, setSelectedCompanyId } = useCompany()
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string>("")

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getCompanies()
      .then(setCompanies)
      .catch(() => customToast.error("Erro ao carregar empresas", { position: "top-right" }))
      .finally(() => setLoading(false))
  }, [open])

  // Pré-selecionar a company atual ao abrir
  useEffect(() => {
    if (open) {
      setSelectedId(selectedCompanyId ? String(selectedCompanyId) : "")
    }
  }, [open, selectedCompanyId])

  const currentCompany = companies.find((c) => c.id === selectedCompanyId)

  const handleConfirm = () => {
    if (!selectedId) {
      customToast.error("Selecione uma empresa", { position: "top-right" })
      return
    }
    const id = parseInt(selectedId, 10)
    if (!isNaN(id)) {
      setSelectedCompanyId(id)
      customToast.success(
        `Empresa alterada para: ${companies.find((c) => c.id === id)?.nome}`,
        { position: "top-right", autoClose: 3000 }
      )
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Mudar Company</DialogTitle>
              <DialogDescription>
                {currentCompany
                  ? `Atual: ${currentCompany.nome}`
                  : "Nenhuma empresa selecionada"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Selecione a empresa
              </label>
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
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedId || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirmar
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
