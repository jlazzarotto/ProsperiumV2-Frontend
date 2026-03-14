"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, X } from "lucide-react"

interface XlsxUploadStepProps {
  file: File | null
  onFileSelect: (file: File) => void
  onClearFile: () => void
}

export function XlsxUploadStep({ file, onFileSelect, onClearFile }: XlsxUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase()
    if (ext !== "xlsx" && ext !== "xls") {
      return
    }
    onFileSelect(f)
  }, [onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-slate-300 dark:border-slate-700 hover:border-blue-400"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
            Arraste o arquivo XLSX aqui
          </p>
          <p className="text-sm text-slate-400 mt-1">
            ou clique para selecionar
          </p>
          <p className="text-xs text-slate-400 mt-3">
            Formatos aceitos: .xlsx, .xls
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-green-800 dark:text-green-200 truncate">
              {file.name}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearFile}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
