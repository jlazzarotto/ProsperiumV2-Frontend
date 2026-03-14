"use client"

import { useState, useEffect } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Loader2, AlertTriangle, Wallet, Receipt, TrendingDown } from "lucide-react"
import { pagarFatura } from "@/app/services/fatura-cartao-service"
import type { FaturaCartao, PagarFaturaPayload } from "@/types/types"
import { toast } from "react-toastify"

interface PagarFaturaModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  fatura: FaturaCartao
  onSave: () => void
}

const formatBRL = (val: number | string): string =>
  Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function PagarFaturaModal({ open, onOpenChange, fatura, onSave }: PagarFaturaModalProps) {
  const valorTotal = Number(fatura.valor_total)
  const valorPago = Number(fatura.valor_pago)
  const saldoRestante = Number(fatura.saldo_restante ?? 0) || (valorTotal - valorPago)
  const percentPago = valorTotal > 0 ? Math.min(100, (valorPago / valorTotal) * 100) : 0

  const [form, setForm] = useState<Partial<PagarFaturaPayload>>({
    valor: saldoRestante,
    data_pgto: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setForm({
        valor: saldoRestante,
        data_pgto: new Date().toISOString().slice(0, 10),
      })
      setErrors({})
    }
  }, [open, saldoRestante])

  const set = <K extends keyof PagarFaturaPayload>(k: K, v: PagarFaturaPayload[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.valor || form.valor <= 0) e.valor = 'Valor deve ser positivo'
    if (form.valor && form.valor > saldoRestante + 0.01) e.valor = 'Valor nao pode ser maior que o saldo restante'
    if (!form.data_pgto) e.data_pgto = 'Data de pagamento e obrigatoria'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const isParcial = (form.valor ?? 0) < saldoRestante - 0.01
  const novoPercent = valorTotal > 0 ? Math.min(100, ((valorPago + (form.valor ?? 0)) / valorTotal) * 100) : 0

  const handleSave = async () => {
    if (!validate() || !fatura.id_fatura) return
    setSaving(true)
    try {
      const result = await pagarFatura(fatura.id_fatura, form as PagarFaturaPayload)
      toast.success(result.aviso ?? "Pagamento da fatura registrado!")
      onSave()
      onOpenChange(false)
    } catch {
      toast.error("Erro ao registrar pagamento da fatura")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-0 shadow-xl overflow-hidden">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 text-white">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-5 w-5" />
              <DialogTitle className="text-white text-lg">Pagar fatura</DialogTitle>
            </div>
            <p className="text-emerald-100 text-sm">
              {fatura.cartao_apelido && `${fatura.cartao_apelido} — `}
              Competencia {(() => {
                const comp = String(fatura.competencia)
                return `${comp.slice(4, 6)}/${comp.slice(0, 4)}`
              })()}
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Resumo visual */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total da fatura</span>
              <span className="font-semibold">{formatBRL(valorTotal)}</span>
            </div>

            {valorPago > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Ja pago
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatBRL(valorPago)}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Saldo restante</span>
                <span className="text-lg font-bold">{formatBRL(saldoRestante)}</span>
              </div>
              <Progress value={percentPago} className="h-2" />
              <p className="text-[11px] text-muted-foreground text-right">{percentPago.toFixed(0)}% pago</p>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-1.5">
            <Label htmlFor="valor_pagar" className="text-sm font-medium">Valor a pagar</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                id="valor_pagar"
                type="number"
                min={0.01}
                max={saldoRestante}
                step={0.01}
                value={form.valor ?? ''}
                onChange={e => set('valor', Number(e.target.value))}
                className="pl-10 h-11 text-lg font-semibold"
              />
            </div>
            {errors.valor && <p className="text-xs text-destructive">{errors.valor}</p>}

            {/* Preview da barra apos pagamento */}
            {(form.valor ?? 0) > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Apos pagamento</span>
                  <span className="font-medium">{novoPercent.toFixed(0)}%</span>
                </div>
                <Progress value={novoPercent} className="h-1.5" />
              </div>
            )}
          </div>

          {isParcial && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Pagamento parcial</p>
                <p className="text-xs mt-0.5">
                  O saldo restante de{' '}
                  <strong>{formatBRL(saldoRestante - (form.valor ?? 0))}</strong>{' '}
                  gerara lancamento de rotativo (juros).
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="data_pgto" className="text-sm font-medium">Data do pagamento</Label>
            <Input
              id="data_pgto"
              type="date"
              value={form.data_pgto ?? ''}
              onChange={e => set('data_pgto', e.target.value)}
              className="h-10"
            />
            {errors.data_pgto && <p className="text-xs text-destructive">{errors.data_pgto}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc_pgto" className="text-sm font-medium">
              Descricao <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="desc_pgto"
              value={form.descricao ?? ''}
              onChange={e => set('descricao', e.target.value)}
              placeholder="Ex: Pagamento via Pix"
              className="h-10"
            />
          </div>

          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Receipt className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            O debito bancario sera vinculado quando voce realizar a baixa do lancamento gerado.
          </p>
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t">
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Wallet className="h-4 w-4 mr-2" />
              Confirmar pagamento
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
