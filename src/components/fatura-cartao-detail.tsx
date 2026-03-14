"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, RotateCcw, Receipt, TrendingUp, TrendingDown, Wallet, CalendarDays, ShoppingCart, FileText } from "lucide-react"
import { FaturaStatusBadge } from "@/components/fatura-status-badge"
import { getItensFatura, estornarItem, formatCompetencia } from "@/app/services/fatura-cartao-service"
import type { FaturaCartao, ItemFatura } from "@/types/types"
import { toast } from "react-toastify"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FaturaCartaoDetailProps {
  fatura: FaturaCartao
  onEstornar?: () => void
}

const ITEM_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  registrado: { label: 'Registrado', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  em_fatura:  { label: 'Na fatura',  className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
  conciliado: { label: 'Conciliado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  estornado:  { label: 'Estornado',  className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' },
}

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dateStr
  }
}

const formatBRL = (val: number | string): string =>
  Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function FaturaCartaoDetail({ fatura, onEstornar }: FaturaCartaoDetailProps) {
  const [itens, setItens] = useState<ItemFatura[]>([])
  const [loading, setLoading] = useState(true)
  const [estornando, setEstornando] = useState<number | null>(null)
  const [confirmEstorno, setConfirmEstorno] = useState<ItemFatura | null>(null)

  useEffect(() => {
    if (!fatura.id_fatura) return
    setLoading(true)
    getItensFatura(fatura.id_fatura)
      .then(setItens)
      .catch(() => toast.error("Erro ao carregar itens da fatura"))
      .finally(() => setLoading(false))
  }, [fatura.id_fatura])

  const handleEstornar = async () => {
    if (!confirmEstorno?.id_item_fatura) return
    setEstornando(confirmEstorno.id_item_fatura)
    try {
      await estornarItem(confirmEstorno.id_item_fatura)
      toast.success("Estorno processado com sucesso")
      setItens(prev => prev.map(i =>
        i.id_item_fatura === confirmEstorno.id_item_fatura ? { ...i, status: 'estornado' } : i
      ))
      onEstornar?.()
    } catch {
      toast.error("Erro ao processar estorno")
    } finally {
      setEstornando(null)
      setConfirmEstorno(null)
    }
  }

  const valorTotal = Number(fatura.valor_total)
  const valorPago = Number(fatura.valor_pago)
  const saldoRestante = Number(fatura.saldo_restante ?? 0) || (valorTotal - valorPago)
  const percentPago = valorTotal > 0 ? Math.min(100, (valorPago / valorTotal) * 100) : 0

  const { itensAtivos, totalEstornado, qtdItens } = useMemo(() => {
    const ativos = itens.filter(i => i.status !== 'estornado')
    const estornados = itens.filter(i => i.status === 'estornado')
    const totalEst = estornados.reduce((s, i) => s + Number(i.valor), 0)
    return { itensAtivos: ativos, totalEstornado: totalEst, qtdItens: ativos.length }
  }, [itens])

  const competenciaMes = formatCompetencia(fatura.competencia)
  const [mesNum, anoNum] = competenciaMes.split('/')
  const MESES = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const mesNome = MESES[Number(mesNum)] || mesNum

  return (
    <>
      <div className="space-y-4">
        {/* Header da Fatura */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 px-6 py-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Receipt className="h-5 w-5 text-slate-300" />
                  <h2 className="text-lg font-semibold">
                    Fatura de {mesNome} {anoNum}
                  </h2>
                </div>
                {fatura.cartao_apelido && (
                  <p className="text-slate-400 text-sm ml-8">
                    {fatura.cartao_apelido} {fatura.cartao_operadora ? `(${fatura.cartao_operadora})` : ''}
                  </p>
                )}
              </div>
              <FaturaStatusBadge status={fatura.status} size="lg" />
            </div>

            {/* Datas */}
            <div className="flex items-center gap-6 mt-4 ml-8">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Fecha: <strong className="text-white">{formatDate(fatura.dt_fechamento)}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Vence: <strong className="text-white">{formatDate(fatura.dt_vencimento)}</strong></span>
              </div>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    <ShoppingCart className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatBRL(valorTotal)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{qtdItens} {qtdItens === 1 ? 'item' : 'itens'}</p>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40">
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pago</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatBRL(valorPago)}</p>
                {valorTotal > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">{percentPago.toFixed(0)}%</span>
                    </div>
                    <Progress value={percentPago} className="h-1.5" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-md ${saldoRestante > 0 ? 'bg-red-100 dark:bg-red-950/40' : 'bg-emerald-100 dark:bg-emerald-950/40'}`}>
                    {saldoRestante > 0
                      ? <TrendingUp className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      : <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    }
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Restante</span>
                </div>
                <p className={`text-2xl font-bold mt-1 ${saldoRestante > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {formatBRL(saldoRestante)}
                </p>
                {saldoRestante <= 0 && valorTotal > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Fatura quitada</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Itens */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4.5 w-4.5 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Itens da fatura</h3>
                <Badge variant="secondary" className="text-xs font-normal">{itens.length}</Badge>
              </div>
              {totalEstornado > 0 && (
                <span className="text-xs text-muted-foreground">
                  Estornos: {formatBRL(totalEstornado)}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-0 pb-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Carregando itens...</p>
              </div>
            ) : itens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                  <Receipt className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium">Nenhum item nesta fatura</p>
                <p className="text-xs">Itens aparecem aqui quando compras sao registradas ou lancamentos sao baixados com cartao.</p>
              </div>
            ) : (
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50/50">
                      <TableHead className="pl-6 font-semibold text-xs uppercase tracking-wider">Descricao</TableHead>
                      <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Parcela</TableHead>
                      <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Data</TableHead>
                      <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Valor</TableHead>
                      <TableHead className="text-center font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-right pr-6 font-semibold text-xs uppercase tracking-wider w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, idx) => {
                      const isEstornado = item.status === 'estornado'
                      const cfg = ITEM_STATUS_CONFIG[item.status] ?? ITEM_STATUS_CONFIG.registrado
                      return (
                        <TableRow
                          key={item.id_item_fatura}
                          className={`
                            transition-colors
                            ${isEstornado ? 'opacity-40' : ''}
                            ${idx % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-slate-800/20'}
                          `}
                        >
                          <TableCell className={`pl-6 ${isEstornado ? 'line-through' : ''}`}>
                            <div>
                              <p className="font-medium text-sm">{item.descricao ?? `Lancamento #${item.id_lcto}`}</p>
                              {item.numero_documento && (
                                <p className="text-xs text-muted-foreground mt-0.5">Doc: {item.numero_documento}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.parcela_total > 1 ? (
                              <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                                {item.parcela_num}/{item.parcela_total}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">a vista</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {formatDate(item.data_compra)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold text-sm ${isEstornado ? 'line-through' : ''}`}>
                            {formatBRL(item.valor)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[11px] font-medium ${cfg.className}`}>
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            {!isEstornado && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    onClick={() => setConfirmEstorno(item)}
                                    disabled={estornando === item.id_item_fatura}
                                  >
                                    {estornando === item.id_item_fatura
                                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      : <RotateCcw className="h-3.5 w-3.5" />
                                    }
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Estornar item</TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!confirmEstorno} onOpenChange={(v) => !v && setConfirmEstorno(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-red-500" />
              Confirmar estorno
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Deseja estornar o item abaixo?
                </p>
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 space-y-1">
                  <p className="font-medium text-red-800 dark:text-red-200 text-sm">
                    {confirmEstorno?.descricao ?? `Lancamento #${confirmEstorno?.id_lcto}`}
                  </p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">
                    {formatBRL(confirmEstorno?.valor ?? 0)}
                  </p>
                </div>
                {fatura.status === 'fechada' && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                    A fatura ja esta fechada. Sera gerado um credito na proxima fatura.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEstornar} className="bg-red-600 hover:bg-red-700 text-white">
              Confirmar estorno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
