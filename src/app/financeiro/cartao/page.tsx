"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, CreditCard, Plus, Lock, Wallet, Upload, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCartoesAtivos } from "@/app/services/cartao-service"
import { getAllFaturas, fecharFatura } from "@/app/services/fatura-cartao-service"
import type { Cartao, FaturaCartao } from "@/types/types"
import { FaturaStatusBadge } from "@/components/fatura-status-badge"
import { FaturaCartaoDetail } from "@/components/fatura-cartao-detail"
import { PagarFaturaModal } from "@/components/pagar-fatura-modal"
import { ImportarExtratoModal } from "@/components/importar-extrato-modal"
import { formatCompetencia } from "@/app/services/fatura-cartao-service"
import { toast } from "react-toastify"

const MESES_CURTO = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const formatBRL = (val: number | string): string =>
  Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CartaoHubPage() {
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [selectedCartaoId, setSelectedCartaoId] = useState<number | null>(null)
  const [faturas, setFaturas] = useState<FaturaCartao[]>([])
  const [faturaAtual, setFaturaAtual] = useState<FaturaCartao | null>(null)
  const [loadingCartoes, setLoadingCartoes] = useState(true)
  const [loadingFaturas, setLoadingFaturas] = useState(false)
  const [isPagarOpen, setIsPagarOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const loadCartoes = useCallback(async () => {
    setLoadingCartoes(true)
    try {
      const data = await getCartoesAtivos()
      setCartoes(data)
      if (data.length > 0 && !selectedCartaoId) {
        setSelectedCartaoId(data[0].id_cartao!)
      }
    } catch {
      toast.error("Erro ao carregar cartoes")
    } finally {
      setLoadingCartoes(false)
    }
  }, [selectedCartaoId])

  const loadFaturas = useCallback(async (idCartao: number) => {
    setLoadingFaturas(true)
    try {
      const data = await getAllFaturas({ id_cartao: idCartao, limit: 12 })
      setFaturas(data)
      const atual = data.find(f => f.status === 'aberta' || f.status === 'fechada') ?? data[0] ?? null
      setFaturaAtual(atual)
    } catch {
      toast.error("Erro ao carregar faturas")
    } finally {
      setLoadingFaturas(false)
    }
  }, [])

  useEffect(() => { loadCartoes() }, [loadCartoes])

  useEffect(() => {
    if (selectedCartaoId) loadFaturas(selectedCartaoId)
  }, [selectedCartaoId, loadFaturas])

  const handleFecharFatura = async () => {
    if (!selectedCartaoId) return
    setIsClosing(true)
    try {
      const result = await fecharFatura({ id_cartao: selectedCartaoId })
      toast.success(`Fatura fechada! Total: ${formatBRL(result.valor_total)}`)
      loadFaturas(selectedCartaoId)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao fechar fatura'
      toast.error(msg)
    } finally {
      setIsClosing(false)
    }
  }

  const selectedCartao = cartoes.find(c => c.id_cartao === selectedCartaoId)

  // Navegacao entre faturas
  const currentFaturaIndex = faturas.findIndex(f => f.id_fatura === faturaAtual?.id_fatura)
  const canGoPrev = currentFaturaIndex < faturas.length - 1
  const canGoNext = currentFaturaIndex > 0
  const goPrev = () => canGoPrev && setFaturaAtual(faturas[currentFaturaIndex + 1])
  const goNext = () => canGoNext && setFaturaAtual(faturas[currentFaturaIndex - 1])

  if (loadingCartoes) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando cartoes...</p>
        </div>
      </div>
    )
  }

  if (cartoes.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <MainHeader />
        <div className="flex flex-col items-center justify-center flex-1 gap-6 text-muted-foreground">
          <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800">
            <CreditCard className="h-12 w-12" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">Nenhum cartao cadastrado</p>
            <p className="text-sm mt-1">Cadastre um cartao de credito para comecar a gerenciar suas faturas.</p>
          </div>
          <Button onClick={() => window.location.href = '/cadastros/formas-pagamento'}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar cartao
          </Button>
        </div>
      </div>
    )
  }

  const showPagar = faturaAtual && (faturaAtual.status === 'fechada' || faturaAtual.status === 'parcial' || faturaAtual.status === 'em_atraso')

  return (
    <div className="flex flex-col h-full">
      <MainHeader />

      <div className="p-6 space-y-5 flex-1">
        {/* Cabecalho com Card Visual do Cartao */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Card visual do cartao */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5 text-white shadow-lg min-h-[160px]">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-10 -translate-x-10" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <CreditCard className="h-7 w-7 text-slate-300" />
                  {cartoes.length > 1 && (
                    <Select
                      value={selectedCartaoId ? String(selectedCartaoId) : ''}
                      onValueChange={(v) => setSelectedCartaoId(Number(v))}
                    >
                      <SelectTrigger className="w-auto h-7 border-white/20 bg-white/10 text-white text-xs hover:bg-white/20 [&>svg]:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cartoes.map(c => (
                          <SelectItem key={c.id_cartao} value={String(c.id_cartao)}>
                            {c.apelido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedCartao && (
                  <>
                    <p className="text-lg font-semibold tracking-wide">{selectedCartao.apelido}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{selectedCartao.operadora}</p>

                    <div className="flex gap-6 mt-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Fechamento</p>
                        <p className="text-sm font-medium">Dia {selectedCartao.dia_fechamento}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Vencimento</p>
                        <p className="text-sm font-medium">Dia {selectedCartao.dia_vencimento}</p>
                      </div>
                      {selectedCartao.limite_credito && Number(selectedCartao.limite_credito) > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Limite</p>
                          <p className="text-sm font-medium">{formatBRL(selectedCartao.limite_credito)}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Acoes e navegacao */}
          <div className="flex-1 w-full space-y-4">
            {/* Acoes */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleFecharFatura} disabled={isClosing} className="gap-1.5">
                {isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Fechar fatura
              </Button>
              {showPagar && (
                <Button size="sm" onClick={() => setIsPagarOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Wallet className="h-4 w-4" />
                  Pagar fatura
                </Button>
              )}
              {faturaAtual && (
                <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="gap-1.5">
                  <Upload className="h-4 w-4" />
                  Importar extrato
                </Button>
              )}
            </div>

            {/* Timeline de faturas */}
            {!loadingFaturas && faturas.length > 0 && (
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={goPrev} disabled={!canGoPrev}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fatura anterior</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
                  <TooltipProvider>
                    {faturas.map(f => {
                      const comp = formatCompetencia(f.competencia)
                      const [mes, ano] = comp.split('/')
                      const mesNome = MESES_CURTO[Number(mes)] || mes
                      const isSelected = faturaAtual?.id_fatura === f.id_fatura
                      const valor = Number(f.valor_total)

                      return (
                        <Tooltip key={f.id_fatura}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setFaturaAtual(f)}
                              className={`
                                flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-center whitespace-nowrap transition-all min-w-[72px]
                                ${isSelected
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                                  : 'border-border hover:bg-muted/50 hover:border-muted-foreground/20'
                                }
                              `}
                            >
                              <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {mesNome}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{ano}</span>
                              <FaturaStatusBadge status={f.status} size="xs" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-center">
                            <p className="font-medium">{mesNome}/{ano}</p>
                            <p className="text-xs">{formatBRL(valor)}</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </TooltipProvider>
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={goNext} disabled={!canGoNext}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Proxima fatura</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>

        {/* Conteudo principal */}
        {loadingFaturas ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando faturas...</p>
          </div>
        ) : faturaAtual ? (
          <FaturaCartaoDetail
            fatura={faturaAtual}
            onEstornar={() => loadFaturas(selectedCartaoId!)}
          />
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <div className="p-5 rounded-full bg-slate-100 dark:bg-slate-800">
                <Calendar className="h-10 w-10" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">Nenhuma fatura encontrada</p>
                <p className="text-sm mt-1 max-w-md">
                  Baixe lancamentos selecionando este cartao como forma de pagamento na tela de lancamentos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedCartaoId && (
        <>
          {faturaAtual?.id_fatura && (
            <>
              <PagarFaturaModal
                open={isPagarOpen}
                onOpenChange={setIsPagarOpen}
                fatura={faturaAtual}
                onSave={() => loadFaturas(selectedCartaoId)}
              />
              <ImportarExtratoModal
                open={isImportOpen}
                onOpenChange={setIsImportOpen}
                idFatura={faturaAtual.id_fatura}
                onSave={() => loadFaturas(selectedCartaoId)}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
