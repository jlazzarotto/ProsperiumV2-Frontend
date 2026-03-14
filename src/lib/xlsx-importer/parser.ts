import * as XLSX from "xlsx"
import type { ParsedSheet } from "./types"

/**
 * Faz parse de um arquivo XLSX e retorna os dados da primeira sheet.
 * Todos os valores sao convertidos para string.
 */
export function parseXlsxFile(file: File): Promise<ParsedSheet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: "array" })
        const sheetName = wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        const rawRows: string[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
          raw: false,
        })
        const detectedHeaderRow = detectHeaderRow(rawRows)
        resolve({ sheetName, rawRows, detectedHeaderRow })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Retorna todas as sheets de um arquivo XLSX.
 */
export function parseXlsxFileAllSheets(file: File): Promise<ParsedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: "array" })
        const sheets: ParsedSheet[] = wb.SheetNames.map((sheetName) => {
          const ws = wb.Sheets[sheetName]
          const rawRows: string[][] = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: "",
            raw: false,
          })
          return { sheetName, rawRows, detectedHeaderRow: detectHeaderRow(rawRows) }
        })
        resolve(sheets)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Heuristica para detectar a linha de header:
 * Primeira linha com >= 3 celulas preenchidas onde a proxima linha
 * tambem tem >= 2 celulas preenchidas (indicando dados).
 */
export function detectHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length - 1, 20); i++) {
    const filledCells = rows[i].filter((c) => String(c).trim() !== "").length
    const nextFilled = rows[i + 1]?.filter((c) => String(c).trim() !== "").length ?? 0
    if (filledCells >= 3 && nextFilled >= 2) return i
  }
  return 0
}

/**
 * Extrai os headers de uma linha especifica.
 * Remove celulas vazias no final.
 */
export function getHeaders(rows: string[][], headerRow: number): string[] {
  const row = rows[headerRow] || []
  // Encontra o ultimo indice com valor nao-vazio
  let lastIndex = row.length - 1
  while (lastIndex >= 0 && String(row[lastIndex]).trim() === "") {
    lastIndex--
  }
  return row.slice(0, lastIndex + 1).map((cell) => String(cell).trim())
}
