/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Ship, Anchor, MapPin, Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Operation } from "@/types/types"

interface OperationsSummaryProps {
  loading: boolean
  operations: Operation[]
}

function isValidDate(dateValue: any): boolean {
  if (!dateValue) return false
  const date = new Date(dateValue)
  return !isNaN(date.getTime())
}

export function OperationsSummary({ loading, operations }: OperationsSummaryProps) {
  // Filtrar operações ativas
  const activeOperations = operations.filter((op) => op.endDate === null || (op.endDate && new Date(op.endDate) >= new Date()))

  // Ordenar por data de início (mais recentes primeiro)
  const sortedOperations = [...activeOperations].sort((a, b) => {
    if (!a.startDate) return 1
    if (!b.startDate) return -1
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })

  // Pegar as 3 operações mais recentes
  const recentOperations = sortedOperations.slice(0, 3)

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle>Operações Recentes</CardTitle>
        <CardDescription>Últimas operações ativas</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : recentOperations.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">Nenhuma operação ativa encontrada</div>
        ) : (
          <div className="space-y-4">
            {recentOperations.map((operation) => (
              <div
                key={operation.id}
                className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <Anchor className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-medium">
                      {operation.code} - {operation.voyage}
                    </h3>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Ativa</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Ship className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                    {operation.shipName || "Não informado"}
                  </div>

                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                    {operation.portName || "Não informado"}
                  </div>

                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                    {operation.startDate && isValidDate(operation.startDate)
                      ? format(new Date(operation.startDate), "dd/MM/yyyy", { locale: ptBR })
                      : "Não iniciada"}
                  </div>

                  <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                    {operation.tonnage
                      ? `${operation.tonnage.toLocaleString("pt-BR")} toneladas`
                      : "Tonelagem não informada"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
