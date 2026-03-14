import type { ImportFieldDef, ColumnMapping } from "./types"

/** Converte indice de coluna para letra (0=A, 1=B, ..., 25=Z, 26=AA, etc.) */
export function colIndexToLetter(idx: number): string {
  let s = ""
  let n = idx
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}

/**
 * Sugere mapeamentos baseado nos matchHints dos campos e nos textos do header.
 * Retorna um ColumnMapping por campo encontrado (ao inves de por coluna source).
 */
export function suggestMappingsByField(
  headerTexts: string[],
  fields: ImportFieldDef[]
): ColumnMapping[] {
  const mappings: ColumnMapping[] = []
  const usedColumns = new Set<number>()

  for (const field of fields) {
    if (!field.matchHints || field.matchHints.length === 0) continue

    for (let colIdx = 0; colIdx < headerTexts.length; colIdx++) {
      if (usedColumns.has(colIdx)) continue
      const normalized = headerTexts[colIdx]
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()

      if (normalized && field.matchHints.some((hint) => normalized.includes(hint.toLowerCase()))) {
        mappings.push({
          sourceIndex: colIdx,
          sourceHeader: colIndexToLetter(colIdx),
          targetField: field.key,
        })
        usedColumns.add(colIdx)
        break
      }
    }
  }

  return mappings
}

/**
 * Aplica os mapeamentos e transformacoes para produzir
 * um array de objetos prontos para enviar ao backend.
 */
export function applyMappings(
  rows: string[][],
  mappings: ColumnMapping[],
  fields: ImportFieldDef[],
  context: Record<string, unknown>,
  startRow: number
): Record<string, unknown>[] {
  const fieldMap = new Map(fields.map((f) => [f.key, f]))

  return rows
    .slice(startRow)
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row) => {
      const obj: Record<string, unknown> = { ...context }

      // 1) Campos compostos primeiro (spread no objeto)
      for (const mapping of mappings) {
        if (!mapping.targetField) continue
        const fieldDef = fieldMap.get(mapping.targetField)
        if (!fieldDef?.composite) continue
        const rawValue = String(row[mapping.sourceIndex] ?? "")
        if (!rawValue.trim()) continue
        const result = fieldDef.transform ? fieldDef.transform(rawValue) : null
        if (typeof result === "object" && result !== null) {
          for (const [k, v] of Object.entries(result)) {
            if (v !== "" && v !== undefined && v !== null) {
              obj[k] = v
            }
          }
        }
      }

      // 2) Campos individuais (sobrescrevem compostos se tambem mapeados)
      for (const mapping of mappings) {
        if (!mapping.targetField) continue
        const fieldDef = fieldMap.get(mapping.targetField)
        if (!fieldDef || fieldDef.composite) continue
        const rawValue = String(row[mapping.sourceIndex] ?? "")

        const value = fieldDef.transform
          ? fieldDef.transform(rawValue)
          : rawValue.trim()

        if (value !== "" && value !== undefined && value !== null) {
          obj[mapping.targetField] = value
        }
      }

      // 3) Aplica defaults para campos nao mapeados
      for (const field of fields) {
        if (field.composite) continue
        if (obj[field.key] === undefined && field.defaultValue !== undefined) {
          obj[field.key] = field.defaultValue
        }
      }

      return obj
    })
}

/**
 * Valida os dados mapeados contra os campos obrigatorios.
 * Retorna array de erros por linha (index 0 = primeira linha de dados).
 */
export function validateMappedData(
  data: Record<string, unknown>[],
  fields: ImportFieldDef[]
): { row: number; errors: string[] }[] {
  const requiredFields = fields.filter((f) => f.required)
  const errors: { row: number; errors: string[] }[] = []

  data.forEach((item, index) => {
    const rowErrors: string[] = []
    for (const field of requiredFields) {
      const val = item[field.key]
      if (val === undefined || val === null || String(val).trim() === "") {
        rowErrors.push(`${field.label} e obrigatorio`)
      }
    }
    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, errors: rowErrors })
    }
  })

  return errors
}
