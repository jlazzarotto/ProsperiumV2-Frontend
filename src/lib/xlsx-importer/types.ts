/** Descritor de um campo alvo no perfil de importacao */
export interface ImportFieldDef {
  key: string
  label: string
  required: boolean
  type: "string" | "number" | "date" | "boolean"
  /** Transformador de valor (celula bruta → valor final) */
  transform?: (raw: string) => unknown
  /** Hints para auto-sugestao: se header da coluna contem algum hint, sugere este campo */
  matchHints?: string[]
  /** Valor padrao quando coluna nao mapeada */
  defaultValue?: unknown
  /** Se true, o transform retorna um objeto que sera espalhado no registro */
  composite?: boolean
  /** Campos satisfeitos por este campo composto (ex: ["codigo", "descricao"]) */
  satisfies?: string[]
}

/** Campo de contexto (fora do XLSX — ex: regime tributario, data inicio) */
export interface ContextFieldDef {
  key: string
  label: string
  type: "select" | "date" | "text"
  options?: { value: string; label: string }[]
  required: boolean
  defaultValue?: string
}

/** Perfil de importacao: descreve uma entidade alvo */
export interface ImportProfile {
  id: string
  label: string
  fields: ImportFieldDef[]
  contextFields?: ContextFieldDef[]
  /** Endpoint backend (ex: "/contas-contabeis/importar") */
  endpoint: string
  /** Pos-processamento dos dados mapeados (ex: inferir natureza pela hierarquia) */
  postProcess?: (data: Record<string, unknown>[]) => Record<string, unknown>[]
}

/** Dados parseados de uma sheet XLSX */
export interface ParsedSheet {
  sheetName: string
  rawRows: string[][]
  detectedHeaderRow: number
}

/** Uma entrada de mapeamento: coluna source → campo target */
export interface ColumnMapping {
  sourceIndex: number
  sourceHeader: string
  targetField: string | null
}

/** Resultado de uma linha importada */
export interface RowImportResult {
  row: number
  success: boolean
  id?: number
  errors?: Record<string, string[]>
}

/** Resultado geral da importacao batch */
export interface BatchImportResult {
  total: number
  success: number
  failed: number
  results: RowImportResult[]
}
