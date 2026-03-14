/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileJson, Upload, Download, FileUp, Check, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DreWizardStepImportProps {
  data: any
  updateData: (data: any) => void
}

export function DreWizardStepImport({ data, updateData }: DreWizardStepImportProps) {
  const [jsonInput, setJsonInput] = useState(JSON.stringify(data, null, 2))
  const [jsonError, setJsonError] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      updateData(parsed)
      setJsonError("")
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 2000)
    } catch {
      setJsonError("JSON inválido. Verifique o formato e tente novamente.")
      setIsSuccess(false)
    }
  }

  const handleExportJson = () => {
    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `dre-config-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]

      if (file.type === "application/json" || file.name.endsWith(".json")) {
        const reader = new FileReader()

        reader.onload = (event) => {
          try {
            const content = event.target?.result as string
            setJsonInput(content)
            const parsed = JSON.parse(content)
            updateData(parsed)
            setJsonError("")
            setIsSuccess(true)
            setTimeout(() => setIsSuccess(false), 2000)
          } catch {
            setJsonError("Arquivo JSON inválido. Verifique o formato e tente novamente.")
          }
        }

        reader.readAsText(file)
      } else {
        setJsonError("Por favor, selecione um arquivo JSON válido.")
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          setJsonInput(content)
          const parsed = JSON.parse(content)
          updateData(parsed)
          setJsonError("")
          setIsSuccess(true)
          setTimeout(() => setIsSuccess(false), 2000)
        } catch {
          setJsonError("Arquivo JSON inválido. Verifique o formato e tente novamente.")
        }
      }

      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Importar Configuração</h3>

          <Card
            className={`border-2 border-dashed transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : isSuccess
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-muted-foreground/20"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: isDragging ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {isSuccess ? (
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
                    <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <FileUp className="h-10 w-10 text-primary" />
                  </div>
                )}
              </motion.div>

              {isSuccess ? (
                <h3 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">
                  Importado com Sucesso!
                </h3>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-2">Arraste e solte seu arquivo JSON aqui</h3>
                  <p className="text-sm text-muted-foreground mb-6">ou clique para selecionar um arquivo</p>
                </>
              )}

              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".json,application/json"
                onChange={handleFileSelect}
              />

              {!isSuccess && (
                <Button variant="outline" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Arquivo
                  </label>
                </Button>
              )}
            </CardContent>
          </Card>

          {jsonError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{jsonError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleExportJson}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Atual
            </Button>
            <Button variant="default" onClick={handleImportJson}>
              <FileJson className="mr-2 h-4 w-4" />
              Validar JSON
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Editor JSON</h3>
          <div className="relative">
            <div className="absolute top-2 right-2">
              <FileJson className="h-4 w-4 text-muted-foreground" />
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-[400px] p-4 font-mono text-sm border rounded-md resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

