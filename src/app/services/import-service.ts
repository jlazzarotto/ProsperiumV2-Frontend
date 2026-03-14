import { httpClient } from "@/lib/http-client"
import type { BatchImportResult } from "@/lib/xlsx-importer/types"

/**
 * Envia um lote de items para importacao no backend.
 */
export async function batchImport(
  endpoint: string,
  items: Record<string, unknown>[]
): Promise<BatchImportResult> {
  return httpClient.post<BatchImportResult>(endpoint, { items })
}
