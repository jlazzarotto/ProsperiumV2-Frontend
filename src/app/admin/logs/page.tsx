"use client"

import Link from "next/link"
import { Activity, ShieldAlert } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LogsPage() {
  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50/70 px-4 py-6 dark:bg-slate-950 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Logs de auditoria indisponíveis nesta versão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                <Activity className="h-4 w-4 text-blue-600" />
                O backend atual grava auditoria, mas ainda não expõe consulta REST para essa trilha.
              </div>
              <p>
                A tela anterior dependia de um contrato legado de `audit-logs` por operador e não é compatível com o
                modelo atual de auditoria do Symfony.
              </p>
              <p>
                Quando a task de auditoria enterprise for implementada, esta rota pode voltar com um contrato novo,
                aderente a `auditoria_logs`.
              </p>
              <Button asChild>
                <Link href="/">Voltar para a visão inicial</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
