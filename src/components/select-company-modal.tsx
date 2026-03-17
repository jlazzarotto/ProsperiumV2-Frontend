"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"
import { setSelectedCompanyId, getSelectedCompanyId } from "@/hooks/use-company-required"
import type { CompanyItem } from "@/app/services/core-saas-service"
import { getCompanies } from "@/app/services/core-saas-service"

interface SelectCompanyModalProps {
  isOpen: boolean
  onClose?: () => void
}

export function SelectCompanyModal({ isOpen, onClose }: SelectCompanyModalProps) {
  const { user, isRoot } = useAuth()
  const router = useRouter()
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!isOpen || !isRoot) return

    const loadCompanies = async () => {
      try {
        setLoading(true)
        const data = await getCompanies()
        setCompanies(data)

        // Se já tem um selecionado no sessionStorage, carrega
        const previousSelection = getSelectedCompanyId()
        if (previousSelection && data.some(c => c.id === previousSelection)) {
          setSelectedId(previousSelection)
        }
      } catch (error) {
        console.error("Erro ao carregar companies:", error)
        customToast.error("Erro ao carregar Grupos Econômicos", { position: "top-right" })
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
  }, [isOpen, isRoot])

  const handleSelect = (companyId: number) => {
    setSelectedId(companyId)
  }

  const handleConfirm = async () => {
    if (!selectedId) {
      customToast.error("Selecione um Grupo Econômico", { position: "top-right" })
      return
    }

    try {
      setConfirming(true)
      // Salvar a seleção no sessionStorage
      setSelectedCompanyId(selectedId)

      customToast.success("Grupo Econômico selecionado com sucesso!", {
        position: "top-right",
        autoClose: 2000
      })

      // Fechar modal e recarregar página para aplicar o novo context
      onClose?.()
      // Aguardar um pouco para o sessionStorage ser aplicado
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      console.error("Erro ao selecionar company:", error)
      customToast.error("Erro ao selecionar Grupo Econômico", { position: "top-right" })
    } finally {
      setConfirming(false)
    }
  }

  const selectedCompany = companies.find(c => c.id === selectedId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-blue-600" />
            Selecionar Grupo Econômico
          </DialogTitle>
          <DialogDescription>
            Para continuar, você precisa selecionar um Grupo Econômico.
            Você pode alterar essa seleção a qualquer momento em Administrador.
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Você está logado como <strong>{user?.nome}</strong> (Administrador - ROLE_ROOT).
            Para acessar os módulos operacionais (Financeiro, Cadastros, etc.),
            selecione um Grupo Econômico abaixo.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            </div>
          ) : companies.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p>Nenhum Grupo Econômico disponível</p>
            </div>
          ) : (
            companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelect(company.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedId === company.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                    : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {company.razaoSocial}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {company.nomeFantasia}
                    </p>
                    {company.cnpj && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        CNPJ: {company.cnpj}
                      </p>
                    )}
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 mt-1 ${
                    selectedId === company.id
                      ? "border-blue-600 bg-blue-600"
                      : "border-slate-300 dark:border-slate-600"
                  }`}>
                    {selectedId === company.id && (
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {selectedCompany && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Selecionado: <strong>{selectedCompany.razaoSocial}</strong>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => onClose?.()}
            className="rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedId || confirming || loading}
            className="rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            {confirming ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Selecionando...</span>
              </div>
            ) : (
              "Confirmar Seleção"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
