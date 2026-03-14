"use client"

import { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { ImportFieldDef } from "@/lib/xlsx-importer/types"

interface XlsxPreviewStepProps {
  data: Record<string, unknown>[]
  fields: ImportFieldDef[]
  maxPreviewRows?: number
}

export function XlsxPreviewStep({ data, fields, maxPreviewRows = 50 }: XlsxPreviewStepProps) {
  const previewData = data.slice(0, maxPreviewRows)
  const requiredKeys = new Set(fields.filter((f) => f.required).map((f) => f.key))

  // Campos que tem pelo menos um valor nos dados
  const activeFields = useMemo(() => {
    return fields.filter((field) =>
      data.some((row) => {
        const val = row[field.key]
        return val !== undefined && val !== null && String(val).trim() !== ""
      })
    )
  }, [data, fields])

  // Validacao por linha
  const rowValidation = useMemo(() => {
    return previewData.map((row) => {
      const missingRequired: string[] = []
      for (const field of fields) {
        if (!field.required) continue
        const val = row[field.key]
        if (val === undefined || val === null || String(val).trim() === "") {
          missingRequired.push(field.key)
        }
      }
      return { valid: missingRequired.length === 0, missingRequired }
    })
  }, [previewData, fields])

  const validCount = rowValidation.filter((r) => r.valid).length
  const invalidCount = rowValidation.filter((r) => !r.valid).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {validCount} validas
        </Badge>
        {invalidCount > 0 && (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            <AlertCircle className="h-3 w-3 mr-1" />
            {invalidCount} com erros
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          Total: {data.length} linhas
          {data.length > maxPreviewRows && ` (mostrando ${maxPreviewRows})`}
        </span>
      </div>

      <div className="rounded-md border overflow-auto max-h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10">
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead className="w-[30px]"></TableHead>
              {activeFields.map((field) => (
                <TableHead key={field.key} className="text-xs whitespace-nowrap">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, idx) => {
              const validation = rowValidation[idx]
              return (
                <TableRow
                  key={idx}
                  className={!validation.valid ? "bg-red-50/50 dark:bg-red-950/20" : ""}
                >
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    {validation.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  {activeFields.map((field) => {
                    const val = row[field.key]
                    const isEmpty = val === undefined || val === null || String(val).trim() === ""
                    const isMissing = isEmpty && requiredKeys.has(field.key)
                    return (
                      <TableCell
                        key={field.key}
                        className={`text-sm truncate max-w-[200px] ${
                          isMissing ? "bg-red-100 dark:bg-red-900/30 text-red-700" : ""
                        }`}
                        title={String(val ?? "")}
                      >
                        {isEmpty ? (
                          <span className="text-muted-foreground italic">-</span>
                        ) : (
                          String(val)
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
