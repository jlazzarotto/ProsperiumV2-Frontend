import type { ImportProfile } from "../types"

/** Regex: separa codigo e descricao quando estao na mesma celula.
 *  Ex: "1.1.01 - Caixa Geral", "1 ATIVO", "1.01.001-Banco" */
const CODIGO_DESC_REGEX = /^(\d[\d.]*)\s*[-–—]?\s*([A-Za-zÀ-ÿ].*)$/

export const planoContasProfile: ImportProfile = {
  id: "planoContas",
  label: "Plano de Contas",
  endpoint: "/contas-contabeis/importar",
  contextFields: [
    {
      key: "regime_tributario",
      label: "Regime Tributario",
      type: "select",
      options: [
        { value: "1", label: "Lucro Real / Presumido" },
        { value: "2", label: "Simples Nacional / MEI" },
      ],
      required: true,
    },
    {
      key: "dt_ini",
      label: "Data Inicio",
      type: "date",
      required: true,
    },
  ],
  fields: [
    // --- Campo composto: codigo + descricao na mesma coluna ---
    {
      key: "codigo_descricao",
      label: "Codigo + Descricao (mesma coluna)",
      required: false,
      type: "string",
      composite: true,
      satisfies: ["codigo", "descricao"],
      matchHints: [],
      transform: (raw: string) => {
        const trimmed = raw.trim()
        const match = trimmed.match(CODIGO_DESC_REGEX)
        if (match) {
          return {
            codigo: match[1].replace(/\.$/, ""),
            descricao: match[2].trim().replace(/\s+/g, " "),
          }
        }
        return { descricao: trimmed }
      },
    },
    // --- Campos individuais ---
    {
      key: "codigo",
      label: "Codigo",
      required: true,
      type: "string",
      matchHints: ["codigo", "cod", "classificacao", "class", "code"],
    },
    {
      key: "descricao",
      label: "Descricao / Nome",
      required: true,
      type: "string",
      matchHints: ["descricao", "desc", "nome", "name", "conta"],
      transform: (raw: string) => raw.trim().replace(/\s+/g, " "),
    },
    {
      key: "abreviatura",
      label: "Abreviatura / Apelido",
      required: false,
      type: "string",
      matchHints: ["abreviatura", "apelido", "sigla", "abrev"],
      transform: (raw: string) => raw.trim().substring(0, 50),
    },
    {
      key: "tipo",
      label: "Tipo (S=Sintetica, A=Analitica)",
      required: false,
      type: "string",
      matchHints: ["tipo", "type"],
      transform: (raw: string) => {
        const v = raw.trim().toUpperCase()
        if (v === "T" || v === "S" || v.startsWith("SINT")) return "S"
        if (v === "A" || v.startsWith("ANAL")) return "A"
        // Vazio ou nao reconhecido = Analitica
        return "A"
      },
      defaultValue: "A",
    },
    {
      key: "natureza",
      label: "Natureza (1=Devedora, 2=Credora)",
      required: false,
      type: "number",
      matchHints: ["natureza", "nat", "grupo", "group"],
      transform: (raw: string) => {
        const v = raw.trim().toLowerCase()
        if (v === "1" || v === "d" || v === "devedora") return 1
        if (v === "2" || v === "c" || v === "credora") return 2
        if (v.includes("ativo") || v.includes("despesa") || v.includes("custo")) return 1
        if (v.includes("passivo") || v.includes("receita")) return 2
        const n = parseInt(v)
        if (n === 1 || n === 2) return n
        return undefined // sera inferida pelo postProcess
      },
    },
    {
      key: "conta_superior",
      label: "Conta Superior",
      required: false,
      type: "string",
      matchHints: ["superior", "pai", "parent", "conta_superior"],
    },
    {
      key: "nivel",
      label: "Nivel Hierarquico (1-10)",
      required: false,
      type: "number",
      matchHints: ["nivel", "level", "hierarquia"],
      transform: (raw: string) => {
        const v = parseInt(raw)
        return isNaN(v) ? undefined : Math.min(10, Math.max(1, v))
      },
    },
    {
      key: "orientacoes",
      label: "Orientacoes / Observacoes",
      required: false,
      type: "string",
      matchHints: ["orientacao", "orientacoes", "obs", "observacao", "nota"],
    },
    {
      key: "id_integracao",
      label: "ID Integracao",
      required: false,
      type: "number",
      matchHints: ["integracao", "integra", "id_integracao", "id integracao", "ext", "externo"],
      transform: (raw: string) => {
        const v = parseInt(raw)
        return isNaN(v) ? undefined : v
      },
    },
  ],

  /**
   * Pos-processamento: infere natureza automaticamente pela hierarquia.
   * - ATIVO / DESPESA / CUSTO → devedora (1) — filhos tambem
   * - PASSIVO / RECEITA / PATRIMONIO → credora (2) — filhos tambem
   */
  postProcess: (data) => {
    // 1) Identifica natureza dos grupos raiz (contas sem ponto = nivel 1)
    const rootNatureza = new Map<string, number>()

    for (const row of data) {
      const codigo = String(row.codigo || "").trim()
      const descricao = String(row.descricao || "").toLowerCase()

      // Conta raiz: sem ponto no codigo (ex: "1", "2", "3")
      if (codigo && !codigo.includes(".")) {
        if (
          descricao.includes("ativo") ||
          descricao.includes("despesa") ||
          descricao.includes("custo")
        ) {
          rootNatureza.set(codigo, 1) // devedora
        } else if (
          descricao.includes("passivo") ||
          descricao.includes("receita") ||
          descricao.includes("patrimonio") ||
          descricao.includes("patrimônio")
        ) {
          rootNatureza.set(codigo, 2) // credora
        }
      }
    }

    // 2) Aplica natureza a todas as contas baseado na raiz do codigo
    return data.map((row) => {
      // Se ja tem natureza definida, mantem
      if (row.natureza !== undefined && row.natureza !== null) return row

      const codigo = String(row.codigo || "").trim()
      const rootCode = codigo.split(".")[0]
      const nat = rootNatureza.get(rootCode)

      return { ...row, natureza: nat ?? 1 }
    })
  },
}
