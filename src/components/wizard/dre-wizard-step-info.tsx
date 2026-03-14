"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import type { DreData } from "@/lib/dre-store"

interface DreWizardStepInfoProps {
  data: Partial<DreData>
  updateData: (data: Partial<DreData>) => void
}

export function DreWizardStepInfo({ data, updateData }: DreWizardStepInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Informações Básicas</h3>
        <p className="text-sm text-muted-foreground">
          Preencha as informações básicas do seu Demonstrativo de Resultado do Exercício.
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-400">Dica</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-500">
          Estas informações serão exibidas no cabeçalho do seu DRE e ajudarão a identificá-lo na lista de DREs.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do DRE</Label>
            <Input
              id="name"
              placeholder="Ex: DRE Trimestral 2024"
              value={data.name || ""}
              onChange={(e) => updateData({ name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Nome da Empresa</Label>
            <Input
              id="company"
              placeholder="Ex: Empresa Demonstração Ltda"
              value={data.company || ""}
              onChange={(e) => updateData({ company: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="Ex: 12.345.678/0001-90"
              value={data.cnpj || ""}
              onChange={(e) => updateData({ cnpj: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Input
              id="period"
              placeholder="Ex: Janeiro a Março de 2024"
              value={data.period || ""}
              onChange={(e) => updateData({ period: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

