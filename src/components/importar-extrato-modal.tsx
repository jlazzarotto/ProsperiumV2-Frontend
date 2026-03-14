"use client"

import { useState, useRef } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { importarExtrato } from "@/app/services/fatura-cartao-service"
import type { ImportResult } from "@/types/types"
import { toast } from "react-toastify"
import { cn } from "@/lib/utils"

interface ImportarExtratoModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  idFatura: number
  onSave: () => void
}

export function ImportarExtratoModal({ open, onOpenChange, idFatura, onSave }: ImportarExtratoModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.ofx')) {
      toast.error("Apenas arquivos CSV são suportados por enquanto")
      return
    }
    setFile(f)
    setResult(null)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    try {
      const res = await importarExtrato(idFatura, file)
      setResult(res)
      toast.success(`Extrato processado: ${res.conciliados} conciliados, ${res.pendentes} pendentes, ${res.divergentes} divergentes`)
      onSave()
    } catch {
      toast.error("Erro ao importar extrato")
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar extrato do cartão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drop zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
            )}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.ofx"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Arraste o arquivo CSV aqui</p>
                <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-2">Separador esperado: ponto-e-vírgula (;)</p>
                <p className="text-xs text-muted-foreground">Colunas: data; descricao/historico; valor</p>
              </div>
            )}
          </div>

          {/* Resultado */}
          {result && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{result.conciliados}</p>
                <p className="text-xs text-green-600">Conciliados</p>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-700">{result.pendentes}</p>
                <p className="text-xs text-yellow-600">Pendentes</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-600" />
                <p className="text-2xl font-bold text-red-700">{result.divergentes}</p>
                <p className="text-xs text-red-600">Divergentes</p>
              </div>
            </div>
          )}

          {/* Itens pendentes */}
          {result && result.detalhe.pendentes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Itens sem correspondência (pendentes de classificação):</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.detalhe.pendentes.map((item, i) => (
                  <div key={i} className="text-xs flex justify-between bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                    <span>{item.csv.descricao ?? item.csv.historico ?? '—'}</span>
                    <span className="font-medium">{item.csv.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {file && !result && (
            <Button onClick={handleImport} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Importar extrato
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
