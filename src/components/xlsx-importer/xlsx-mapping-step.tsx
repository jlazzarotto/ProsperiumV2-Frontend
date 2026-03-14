"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Wand2 } from "lucide-react"
import type {
  ImportFieldDef,
  ColumnMapping,
  ParsedSheet,
} from "@/lib/xlsx-importer/types"
import {
  colIndexToLetter,
  suggestMappingsByField,
} from "@/lib/xlsx-importer/mapper"

interface XlsxMappingStepProps {
  parsedSheet: ParsedSheet
  fields: ImportFieldDef[]
  mappings: ColumnMapping[]
  headerRow: number
  onMappingsChange: (mappings: ColumnMapping[]) => void
  onHeaderRowChange: (row: number) => void
}

export function XlsxMappingStep({
  parsedSheet,
  fields,
  mappings,
  headerRow,
  onMappingsChange,
  onHeaderRowChange,
}: XlsxMappingStepProps) {
  // Numero de colunas (max das primeiras linhas)
  const colCount = useMemo(() => {
    let max = 0
    for (let i = 0; i < Math.min(parsedSheet.rawRows.length, 20); i++) {
      if (parsedSheet.rawRows[i].length > max)
        max = parsedSheet.rawRows[i].length
    }
    return max
  }, [parsedSheet.rawRows])

  // Preview: filtra linhas em branco, mantém indice original
  const previewRows = useMemo(() => {
    const rows: { originalIdx: number; cells: string[] }[] = []
    const limit = Math.min(parsedSheet.rawRows.length, 50)
    for (let i = 0; i < limit; i++) {
      const row = parsedSheet.rawRows[i]
      const isBlank = !row.some((cell) => String(cell).trim() !== "")
      if (isBlank && i !== headerRow) continue
      rows.push({ originalIdx: i, cells: row })
      if (rows.length >= 15) break
    }
    return rows
  }, [parsedSheet.rawRows, headerRow])

  // colIndex -> fieldKey
  const colToField = useMemo(() => {
    const map = new Map<number, string>()
    for (const m of mappings) {
      if (m.targetField) map.set(m.sourceIndex, m.targetField)
    }
    return map
  }, [mappings])

  // Campos ja atribuidos
  const usedFields = useMemo(
    () =>
      new Set(
        mappings
          .filter((m) => m.targetField)
          .map((m) => m.targetField!)
      ),
    [mappings]
  )

  // Campos satisfeitos (diretos + via composite.satisfies)
  const satisfiedFields = useMemo(() => {
    const set = new Set<string>()
    for (const m of mappings) {
      if (!m.targetField) continue
      set.add(m.targetField)
      const fieldDef = fields.find((f) => f.key === m.targetField)
      if (fieldDef?.satisfies) {
        for (const key of fieldDef.satisfies) {
          set.add(key)
        }
      }
    }
    return set
  }, [mappings, fields])

  // Campos obrigatorios faltando (considera satisfies)
  const missingRequired = useMemo(
    () =>
      fields.filter(
        (f) => f.required && !f.composite && !satisfiedFields.has(f.key)
      ),
    [fields, satisfiedFields]
  )

  // Atribui campo a coluna direto no header da planilha
  const handleColumnAssign = (colIndex: number, fieldKey: string) => {
    // Remove mapeamento anterior desta coluna E deste campo
    let updated = mappings.filter(
      (m) => m.sourceIndex !== colIndex && m.targetField !== fieldKey
    )

    if (fieldKey !== "__none__") {
      updated.push({
        sourceIndex: colIndex,
        sourceHeader: colIndexToLetter(colIndex),
        targetField: fieldKey,
      })
    }

    onMappingsChange(updated)
  }

  const handleAutoDetect = () => {
    const headerTexts = (parsedSheet.rawRows[headerRow] || []).map((c) =>
      String(c).trim()
    )
    const suggested = suggestMappingsByField(headerTexts, fields)
    onMappingsChange(suggested)
  }

  // Label do campo atribuido a coluna
  const getFieldLabel = (colIndex: number) => {
    const fieldKey = colToField.get(colIndex)
    if (!fieldKey) return null
    const f = fields.find((fd) => fd.key === fieldKey)
    return f ? f.label : fieldKey
  }

  return (
    <div className="space-y-4">
      {/* Config bar */}
      <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">
            Linha do cabecalho:
          </Label>
          <Input
            type="number"
            min={0}
            max={Math.min(parsedSheet.rawRows.length - 1, 50)}
            value={headerRow}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              if (!isNaN(v) && v >= 0) onHeaderRowChange(v)
            }}
            className="w-20"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoDetect}
          className="ml-auto"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Auto-detectar
        </Button>
      </div>

      {/* Planilha com mapeamento direto nos headers */}
      <div className="rounded-md border overflow-auto max-h-[480px]">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="px-2 py-1 text-left font-medium text-muted-foreground border-b border-r w-[40px]">
                #
              </th>
              {Array.from({ length: colCount }, (_, colIdx) => {
                const currentField = colToField.get(colIdx) || "__none__"
                const fieldLabel = getFieldLabel(colIdx)

                return (
                  <th
                    key={colIdx}
                    className={`px-1 py-1 border-b border-r min-w-[130px] align-top ${
                      fieldLabel
                        ? "bg-blue-50 dark:bg-blue-900/30"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-muted-foreground text-[11px]">
                        {colIndexToLetter(colIdx)}
                      </span>
                      <Select
                        value={currentField}
                        onValueChange={(v) =>
                          handleColumnAssign(colIdx, v)
                        }
                      >
                        <SelectTrigger
                          className={`h-6 text-[10px] px-1.5 w-full ${
                            fieldLabel
                              ? "border-blue-400 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-semibold"
                              : "border-dashed"
                          }`}
                        >
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-muted-foreground">
                              —
                            </span>
                          </SelectItem>
                          {fields.map((field) => {
                            const isUsedElsewhere =
                              usedFields.has(field.key) &&
                              colToField.get(colIdx) !== field.key

                            return (
                              <SelectItem
                                key={field.key}
                                value={field.key}
                              >
                                {field.label}
                                {field.required && " *"}
                                {isUsedElsewhere && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    (trocar)
                                  </span>
                                )}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {previewRows.map(({ originalIdx, cells }) => (
              <tr
                key={originalIdx}
                className={
                  originalIdx === headerRow
                    ? "bg-yellow-50 dark:bg-yellow-900/20 font-semibold"
                    : "bg-white dark:bg-slate-900 even:bg-slate-50 dark:even:bg-slate-800/30"
                }
              >
                <td className="px-2 py-1 text-muted-foreground border-b border-r font-mono text-center whitespace-nowrap">
                  {originalIdx + 1}
                  {originalIdx === headerRow && (
                    <span
                      className="ml-0.5 text-yellow-600 dark:text-yellow-400"
                      title="Cabecalho"
                    >
                      *
                    </span>
                  )}
                </td>
                {Array.from({ length: colCount }, (_, colIdx) => {
                  const isMapped = colToField.has(colIdx)
                  return (
                    <td
                      key={colIdx}
                      className={`px-2 py-1 border-b border-r truncate max-w-[180px] ${
                        isMapped
                          ? "bg-blue-50/40 dark:bg-blue-900/10"
                          : ""
                      }`}
                      title={String(cells[colIdx] ?? "")}
                    >
                      {String(cells[colIdx] ?? "").substring(0, 50)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          <span className="font-medium">
            {mappings.filter((m) => m.targetField).length}
          </span>{" "}
          de {fields.length} campos mapeados
        </div>
        {missingRequired.length > 0 && (
          <span className="text-red-500">
            Faltam:{" "}
            {missingRequired.map((f) => f.label).join(", ")}
          </span>
        )}
      </div>
    </div>
  )
}
