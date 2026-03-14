"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { getCostCenters } from "@/app/services/cost-center-service"
import type { CostCenterAllocation, CostCenterNode } from "@/types/types"
import { Trash2, Split } from "lucide-react"

interface CostCenterRateioProps {
  companyId?: string
  totalAmount: number
  value: CostCenterAllocation[]
  onChange: (value: CostCenterAllocation[]) => void
  disabled?: boolean
}

interface FlatAnalyticNode {
  id: number
  label: string
  description: string
}

const flattenAnalyticNodes = (nodes: CostCenterNode[]): FlatAnalyticNode[] => {
  const items: FlatAnalyticNode[] = []

  const walk = (entries: CostCenterNode[]) => {
    entries.forEach((node) => {
      if (node.is_analytic && node.is_active) {
        items.push({
          id: node.id_cost_center,
          label: `${node.code} - ${node.name}`,
          description: node.path,
        })
      }
      if (node.children.length > 0) {
        walk(node.children)
      }
    })
  }

  walk(nodes)
  return items
}

const normalizeAllocations = (allocations: CostCenterAllocation[]): CostCenterAllocation[] => {
  if (allocations.length === 1) {
    return [{ ...allocations[0], percent: 100 }]
  }
  return allocations
}

export function CostCenterRateio({ companyId, totalAmount, value, onChange, disabled = false }: CostCenterRateioProps) {
  const [nodes, setNodes] = useState<CostCenterNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedToAdd, setSelectedToAdd] = useState("")

  useEffect(() => {
    if (!companyId) {
      setNodes([])
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getCostCenters(Number(companyId), true)
        if (!cancelled) {
          setNodes(response)
        }
      } catch (loadError) {
        console.error("Erro ao carregar centros de custo:", loadError)
        if (!cancelled) {
          setNodes([])
          setError("Não foi possível carregar os centros de custo.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [companyId])

  const flatOptions = useMemo(() => flattenAnalyticNodes(nodes), [nodes])

  const options = useMemo(
    () =>
      flatOptions
        .filter((option) => !value.some((item) => item.id === option.id))
        .map((option) => ({
          value: String(option.id),
          label: option.label,
          description: option.description,
        })),
    [flatOptions, value]
  )

  const allocationsWithMeta = useMemo(() => {
    return normalizeAllocations(value).map((item) => {
      const meta = flatOptions.find((option) => option.id === item.id)
      const percent = Number(item.percent || 0)
      const amount = totalAmount > 0 ? (totalAmount * percent) / 100 : 0

      return {
        ...item,
        percent,
        label: meta?.label ?? `Centro #${item.id}`,
        description: meta?.description ?? "",
        amount,
      }
    })
  }, [flatOptions, totalAmount, value])

  const totalPercent = allocationsWithMeta.reduce((sum, item) => sum + item.percent, 0)

  const updateAllocations = (next: CostCenterAllocation[]) => {
    onChange(normalizeAllocations(next))
  }

  const addCostCenter = () => {
    if (!selectedToAdd) return
    const option = flatOptions.find((item) => String(item.id) === selectedToAdd)
    if (!option) return

    const next = [...value, { id: option.id, percent: value.length === 0 ? 100 : 0 }]
    updateAllocations(next)
    setSelectedToAdd("")
  }

  const removeCostCenter = (id: number) => {
    updateAllocations(value.filter((item) => item.id !== id))
  }

  const changePercent = (id: number, percent: string) => {
    const parsed = Number(percent)
    updateAllocations(
      value.map((item) => (item.id === id ? { ...item, percent: Number.isFinite(parsed) ? parsed : 0 } : item))
    )
  }

  const splitEqually = () => {
    if (value.length === 0) return
    const base = Math.floor((100 / value.length) * 1000000) / 1000000
    let remaining = 100
    const next = value.map((item, index) => {
      const percent = index === value.length - 1 ? Number(remaining.toFixed(6)) : base
      remaining = Number((remaining - percent).toFixed(6))
      return { ...item, percent }
    })
    updateAllocations(next)
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Centros de custo</Label>
          <p className="text-xs text-slate-500">Selecione apenas centros analíticos. Em múltiplos centros, a soma deve ser 100%.</p>
        </div>
        {value.length > 1 ? (
          <Button type="button" variant="outline" size="sm" onClick={splitEqually} disabled={disabled}>
            <Split className="mr-2 h-4 w-4" />
            Ratear igualmente
          </Button>
        ) : null}
      </div>

      {!companyId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Selecione a empresa antes de vincular centros de custo.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <SearchableSelect
              value={selectedToAdd}
              onValueChange={setSelectedToAdd}
              disabled={disabled || loading || options.length === 0}
              loading={loading}
              placeholder="Adicionar centro de custo"
              searchPlaceholder="Pesquisar centro..."
              emptyMessage="Nenhum centro analítico disponível"
              options={options}
            />
            <Button type="button" onClick={addCostCenter} disabled={disabled || !selectedToAdd}>
              Adicionar
            </Button>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          {allocationsWithMeta.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
              Nenhum centro de custo selecionado.
            </div>
          ) : (
            <div className="space-y-2">
              {allocationsWithMeta.map((item) => (
                <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_110px_120px_44px] items-center gap-3 rounded-md border bg-white px-3 py-2 dark:bg-slate-950">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</div>
                    <div className="truncate text-xs text-slate-500">{item.description}</div>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.000001"
                    value={Number.isFinite(item.percent) ? item.percent : 0}
                    onChange={(event) => changePercent(item.id, event.target.value)}
                    disabled={disabled || allocationsWithMeta.length === 1}
                    className="bg-slate-50 text-right"
                  />
                  <div className="text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                    {amountFormatter.format(item.amount)}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeCostCenter(item.id)} disabled={disabled}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              ))}

              <div className={`flex justify-between rounded-md px-3 py-2 text-sm font-medium ${Math.abs(totalPercent - 100) > 0.0001 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                <span>Total do rateio</span>
                <span>{totalPercent.toFixed(6).replace(/\.?0+$/, "")}%</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const amountFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})
