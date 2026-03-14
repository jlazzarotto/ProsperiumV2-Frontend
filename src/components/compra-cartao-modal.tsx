"use client"

import { useState, useEffect } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { registrarCompraCartao } from "@/app/services/fatura-cartao-service"
import { getCartoesAtivos } from "@/app/services/cartao-service"
import type { Cartao, CompraCartaoPayload } from "@/types/types"
import { toast } from "react-toastify"

interface CompraCartaoModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  idCartaoDefault?: number
  onSave: () => void
}

const PARCELAS_OPTIONS = Array.from({ length: 48 }, (_, i) => i + 1)

export function CompraCartaoModal({ open, onOpenChange, idCartaoDefault, onSave }: CompraCartaoModalProps) {
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [form, setForm] = useState<Partial<CompraCartaoPayload>>({
    id_cartao: idCartaoDefault,
    parcelas: 1,
    data_compra: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      getCartoesAtivos().then(setCartoes).catch(() => {})
      setForm({
        id_cartao: idCartaoDefault,
        parcelas: 1,
        data_compra: new Date().toISOString().slice(0, 10),
      })
      setErrors({})
    }
  }, [open, idCartaoDefault])

  const set = <K extends keyof CompraCartaoPayload>(k: K, v: CompraCartaoPayload[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.id_cartao) e.id_cartao = 'Selecione o cartão'
    if (!form.id_conta_contabil) e.id_conta_contabil = 'Informe a conta contábil'
    if (!form.descricao?.trim()) e.descricao = 'Descrição é obrigatória'
    if (!form.valor || form.valor <= 0) e.valor = 'Valor deve ser positivo'
    if (!form.data_compra) e.data_compra = 'Data da compra é obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const result = await registrarCompraCartao(form as CompraCartaoPayload)
      const parcelas = result.parcelas?.length ?? 1
      toast.success(`Compra registrada! ${parcelas}x de ${Number((form.valor ?? 0) / parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
      onSave()
      onOpenChange(false)
    } catch {
      toast.error("Erro ao registrar compra")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova compra no cartão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Cartão *</Label>
            <Select
              value={form.id_cartao ? String(form.id_cartao) : ''}
              onValueChange={v => set('id_cartao', Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar cartão" />
              </SelectTrigger>
              <SelectContent>
                {cartoes.map(c => (
                  <SelectItem key={c.id_cartao} value={String(c.id_cartao)}>
                    {c.apelido} — {c.operadora}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.id_cartao && <p className="text-xs text-destructive">{errors.id_cartao}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={form.descricao ?? ''}
              onChange={e => set('descricao', e.target.value)}
              placeholder="Ex: Supermercado Extra"
            />
            {errors.descricao && <p className="text-xs text-destructive">{errors.descricao}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="valor">Valor total (R$) *</Label>
              <Input
                id="valor"
                type="number"
                min={0.01}
                step={0.01}
                value={form.valor ?? ''}
                onChange={e => set('valor', Number(e.target.value))}
                placeholder="0,00"
              />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor}</p>}
            </div>

            <div className="space-y-1">
              <Label>Parcelas</Label>
              <Select
                value={String(form.parcelas ?? 1)}
                onValueChange={v => set('parcelas', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARCELAS_OPTIONS.map(n => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x {form.valor && n > 0
                        ? `— ${(Number(form.valor) / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="data_compra">Data da compra *</Label>
              <Input
                id="data_compra"
                type="date"
                value={form.data_compra ?? ''}
                onChange={e => set('data_compra', e.target.value)}
              />
              {errors.data_compra && <p className="text-xs text-destructive">{errors.data_compra}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="conta_contabil">ID Conta contábil *</Label>
              <Input
                id="conta_contabil"
                type="number"
                min={1}
                value={form.id_conta_contabil ?? ''}
                onChange={e => set('id_conta_contabil', Number(e.target.value))}
                placeholder="ID do tipo"
              />
              {errors.id_conta_contabil && <p className="text-xs text-destructive">{errors.id_conta_contabil}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="num_doc">Número do documento (opcional)</Label>
            <Input
              id="num_doc"
              value={form.numero_documento ?? ''}
              onChange={e => set('numero_documento', e.target.value)}
              placeholder="Nº da nota fiscal, etc."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
