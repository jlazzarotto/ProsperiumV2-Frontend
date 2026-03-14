"use client"

import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Columns, Eye, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type {
  ImportProfile,
  ParsedSheet,
  ColumnMapping,
  BatchImportResult,
} from "@/lib/xlsx-importer/types"
import { parseXlsxFile } from "@/lib/xlsx-importer/parser"
import { suggestMappingsByField, applyMappings } from "@/lib/xlsx-importer/mapper"
import { XlsxContextFields } from "./xlsx-context-fields"
import { XlsxUploadStep } from "./xlsx-upload-step"
import { XlsxMappingStep } from "./xlsx-mapping-step"
import { XlsxPreviewStep } from "./xlsx-preview-step"
import { XlsxResultsStep } from "./xlsx-results-step"
import { batchImport } from "@/app/services/import-service"
import customToast from "@/components/ui/custom-toast"

const STEPS = [
  { label: "Upload", icon: Upload },
  { label: "Mapeamento", icon: Columns },
  { label: "Preview", icon: Eye },
  { label: "Resultado", icon: CheckCircle2 },
]

interface XlsxImportWizardProps {
  profile: ImportProfile
}

export function XlsxImportWizard({ profile }: XlsxImportWizardProps) {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [parsedSheet, setParsedSheet] = useState<ParsedSheet | null>(null)
  const [headerRow, setHeaderRow] = useState(0)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [contextValues, setContextValues] = useState<Record<string, string>>({})
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null)

  // Dados mapeados para preview
  const mappedData = useMemo(() => {
    if (!parsedSheet || mappings.length === 0) return []
    const contextParsed: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(contextValues)) {
      if (v) {
        const fieldDef = profile.contextFields?.find((f) => f.key === k)
        if (fieldDef?.type === "select") {
          contextParsed[k] = isNaN(Number(v)) ? v : Number(v)
        } else {
          contextParsed[k] = v
        }
      }
    }
    let data = applyMappings(
      parsedSheet.rawRows,
      mappings,
      profile.fields,
      contextParsed,
      headerRow + 1
    )
    if (profile.postProcess) {
      data = profile.postProcess(data)
    }
    return data
  }, [parsedSheet, mappings, contextValues, headerRow, profile])

  const handleFileSelect = useCallback(
    async (f: File) => {
      setFile(f)
      setIsParsing(true)
      try {
        const sheet = await parseXlsxFile(f)
        setParsedSheet(sheet)
        setHeaderRow(sheet.detectedHeaderRow)
        // Tenta auto-sugerir baseado nos textos do header
        const headerTexts = (sheet.rawRows[sheet.detectedHeaderRow] || []).map(
          (c) => String(c).trim()
        )
        const suggested = suggestMappingsByField(headerTexts, profile.fields)
        setMappings(suggested)
        setStep(1)
      } catch (err) {
        console.error("Erro ao parsear XLSX:", err)
        customToast.error("Erro ao ler o arquivo XLSX")
      } finally {
        setIsParsing(false)
      }
    },
    [profile.fields]
  )

  const handleClearFile = useCallback(() => {
    setFile(null)
    setParsedSheet(null)
    setMappings([])
    setStep(0)
    setImportResult(null)
  }, [])

  const handleHeaderRowChange = useCallback(
    (row: number) => {
      setHeaderRow(row)
      if (parsedSheet) {
        const headerTexts = (parsedSheet.rawRows[row] || []).map((c) =>
          String(c).trim()
        )
        const suggested = suggestMappingsByField(headerTexts, profile.fields)
        setMappings(suggested)
      }
    },
    [parsedSheet, profile.fields]
  )

  const handleContextChange = useCallback((key: string, value: string) => {
    setContextValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleImport = useCallback(async () => {
    if (mappedData.length === 0) return

    // Validar campos de contexto obrigatorios
    const missingContext = profile.contextFields?.filter(
      (f) => f.required && !contextValues[f.key]
    )
    if (missingContext && missingContext.length > 0) {
      customToast.error(
        `Preencha: ${missingContext.map((f) => f.label).join(", ")}`
      )
      return
    }

    setIsImporting(true)
    setImportProgress(0)
    setStep(3)

    try {
      // Enviar em lotes de 500
      const BATCH_SIZE = 500
      const allResults: BatchImportResult = {
        total: mappedData.length,
        success: 0,
        failed: 0,
        results: [],
      }

      for (let i = 0; i < mappedData.length; i += BATCH_SIZE) {
        const batch = mappedData.slice(i, i + BATCH_SIZE)
        const result = await batchImport(profile.endpoint, batch)

        allResults.success += result.success
        allResults.failed += result.failed
        allResults.results.push(
          ...result.results.map((r) => ({ ...r, row: r.row + i }))
        )

        setImportProgress(
          Math.min(100, ((i + batch.length) / mappedData.length) * 100)
        )
      }

      setImportResult(allResults)

      if (allResults.failed === 0) {
        customToast.success(
          `${allResults.success} registros importados com sucesso!`
        )
      } else {
        customToast.warning(
          `${allResults.success} importados, ${allResults.failed} erros`
        )
      }
    } catch (err: unknown) {
      console.error("Erro na importacao:", err)
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      customToast.error(`Erro na importacao: ${message}`)
      setImportResult({
        total: mappedData.length,
        success: 0,
        failed: mappedData.length,
        results: [],
      })
    } finally {
      setIsImporting(false)
      setImportProgress(100)
    }
  }, [mappedData, profile, contextValues])

  // Validacao para habilitar botoes (considera campos compostos via satisfies)
  const canGoToPreview = useMemo(() => {
    const requiredFields = profile.fields.filter((f) => f.required && !f.composite)
    const satisfiedFields = new Set<string>()

    for (const m of mappings) {
      if (!m.targetField) continue
      satisfiedFields.add(m.targetField)
      const fieldDef = profile.fields.find((f) => f.key === m.targetField)
      if (fieldDef?.satisfies) {
        for (const key of fieldDef.satisfies) {
          satisfiedFields.add(key)
        }
      }
    }

    return requiredFields.every((f) => satisfiedFields.has(f.key))
  }, [mappings, profile.fields])

  const canImport = mappedData.length > 0

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon
          const isActive = idx === step
          const isCompleted = idx < step
          return (
            <div key={idx} className="flex items-center gap-2">
              {idx > 0 && (
                <div
                  className={`h-px w-8 ${
                    isCompleted ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : isCompleted
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Context fields */}
      {profile.contextFields && profile.contextFields.length > 0 && step < 3 && (
        <XlsxContextFields
          fields={profile.contextFields}
          values={contextValues}
          onChange={handleContextChange}
        />
      )}

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <XlsxUploadStep
                  file={file}
                  onFileSelect={handleFileSelect}
                  onClearFile={handleClearFile}
                />
              )}
              {step === 1 && parsedSheet && (
                <XlsxMappingStep
                  parsedSheet={parsedSheet}
                  fields={profile.fields}
                  mappings={mappings}
                  headerRow={headerRow}
                  onMappingsChange={setMappings}
                  onHeaderRowChange={handleHeaderRowChange}
                />
              )}
              {step === 2 && (
                <XlsxPreviewStep data={mappedData} fields={profile.fields} />
              )}
              {step === 3 && (
                <XlsxResultsStep
                  result={importResult}
                  isImporting={isImporting}
                  progress={importProgress}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {isParsing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Lendo arquivo...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <div>
          {step > 0 && step < 3 && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          {step === 3 && importResult && (
            <Button variant="outline" onClick={handleClearFile}>
              Nova Importacao
            </Button>
          )}
        </div>
        <div>
          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!canGoToPreview}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Preview
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={handleImport}
              disabled={!canImport || isImporting}
              className="bg-green-600 hover:bg-green-700"
            >
              Importar {mappedData.length} registros
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
