"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import type { BatchImportResult } from "@/lib/xlsx-importer/types"

interface XlsxResultsStepProps {
  result: BatchImportResult | null
  isImporting: boolean
  progress: number
}

export function XlsxResultsStep({ result, isImporting, progress }: XlsxResultsStepProps) {
  if (isImporting) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
          Importando dados...
        </p>
        <div className="w-full max-w-md">
          <Progress value={progress} className="h-3" />
        </div>
        <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
      </div>
    )
  }

  if (!result) return null

  const failedResults = result.results.filter((r) => !r.success)

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
          <p className="text-3xl font-bold text-slate-700 dark:text-slate-200">{result.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">{result.success}</p>
          <p className="text-sm text-green-600">Importados</p>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg text-center">
          <p className="text-3xl font-bold text-red-700 dark:text-red-300">{result.failed}</p>
          <p className="text-sm text-red-600">Erros</p>
        </div>
      </div>

      {/* Erros detalhados */}
      {failedResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-red-700 dark:text-red-400">
            Detalhes dos erros ({failedResults.length})
          </h4>
          <div className="rounded-md border border-red-200 dark:border-red-800 overflow-auto max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Linha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedResults.map((r) => (
                  <TableRow key={r.row}>
                    <TableCell className="font-mono text-sm">{r.row}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Erro
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.errors
                        ? Object.entries(r.errors)
                            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
                            .join(" | ")
                        : "Erro desconhecido"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {result.failed === 0 && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              Importacao concluida com sucesso!
            </p>
            <p className="text-sm text-green-600">
              {result.success} registros importados sem erros.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
