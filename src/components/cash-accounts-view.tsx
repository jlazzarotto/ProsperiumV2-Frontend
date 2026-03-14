"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Eye, Calendar, X } from "lucide-react"
import { SimpleCalendar } from "@/components/simple-calendar"
import { getCashAccountsStatus, type CashAccountStatusResponse } from "@/app/services/cash-account-status-service"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import customToast from "@/components/ui/custom-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CashAccountsViewProps {
  trigger?: React.ReactNode
  dataLimite?: string // Data limite do filtro da tela (formato: yyyy-MM-dd)
}

export function CashAccountsView({ trigger, dataLimite }: CashAccountsViewProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [cashAccountsStatus, setCashAccountsStatus] = useState<CashAccountStatusResponse | null>(null)
  const [showAllAccounts, setShowAllAccounts] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // Se há dataLimite da prop, usar essa data como inicial
    return dataLimite ? new Date(dataLimite + 'T23:59:59') : null
  })
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const loadCashAccountsStatus = async (dataLimite?: string) => {
    const isInitialLoad = !cashAccountsStatus
    if (isInitialLoad) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      // Por padrão, buscar apenas contas do dashboard
      const data = await getCashAccountsStatus(dataLimite, true)
      setCashAccountsStatus(data)
    } catch (error) {
      console.error("Erro ao carregar status das contas:", error)
      customToast.error("Erro ao carregar contas")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (open) {
      // Se há dataLimite da prop ou selectedDate, usar uma delas
      const dateToUse = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : dataLimite
      loadCashAccountsStatus(dateToUse)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dataLimite])

  const handleRefresh = () => {
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : dataLimite
    loadCashAccountsStatus(dateStr)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setDatePickerOpen(false)
    const dateStr = format(date, 'yyyy-MM-dd')
    loadCashAccountsStatus(dateStr)
    customToast.success(`Saldos calculados até ${format(date, 'dd/MM/yyyy', { locale: ptBR })}`)
  }

  const clearDateFilter = () => {
    setSelectedDate(null)
    loadCashAccountsStatus(dataLimite) // Volta para dataLimite da prop se existir
    customToast.success(dataLimite ? "Voltou para filtro da tela" : "Exibindo saldos atuais")
  }

  const displayedAccounts = showAllAccounts
    ? cashAccountsStatus?.contas || []
    : (cashAccountsStatus?.contas || []).filter((c) => c.dashboard)

  const hiddenAccountsCount = (cashAccountsStatus?.contas || []).filter((c) => !c.dashboard).length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <Wallet className="h-4 w-4 mr-2" />
            Ver Contas
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900"
      >
        <SheetHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Wallet className="h-6 w-6 text-blue-600" />
                Status das Contas
                {(selectedDate || dataLimite) && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    até {selectedDate 
                      ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                      : dataLimite ? format(new Date(dataLimite + 'T23:59:59'), 'dd/MM/yyyy', { locale: ptBR }) : ''
                    }
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription className="mt-2">
                {selectedDate || dataLimite
                  ? `Saldos históricos calculados até ${selectedDate 
                      ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                      : dataLimite ? format(new Date(dataLimite + 'T23:59:59'), 'dd/MM/yyyy', { locale: ptBR }) : ''
                    }`
                  : "Visualização em tempo real de todas as contas caixa"
                }
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Seletor de Data */}
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={selectedDate || dataLimite ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "shrink-0",
                      (selectedDate || dataLimite) && "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedDate 
                      ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                      : dataLimite 
                      ? format(new Date(dataLimite + 'T23:59:59'), 'dd/MM/yyyy', { locale: ptBR })
                      : "Selecionar Data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <SimpleCalendar
                    selectedDate={selectedDate || undefined}
                    onSelect={handleDateSelect}
                    onClose={() => setDatePickerOpen(false)}
                  />
                </PopoverContent>
              </Popover>

              {/* Botão para limpar filtro de data */}
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearDateFilter}
                  className="shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Remover filtro de data"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Botão de refresh */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="shrink-0"
                title="Atualizar dados"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Resumo Geral */}
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : cashAccountsStatus && (
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-100">
                  {selectedDate || dataLimite ? "Saldo Histórico" : "Resumo Geral"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-2">
                      {formatCurrency(parseFloat(cashAccountsStatus.resumo.saldo_total_geral))}
                    </div>
                    <div className="text-sm text-blue-100">
                      {cashAccountsStatus.resumo.total_contas} conta(s) • 
                      {selectedDate || dataLimite
                        ? ` Saldo até ${selectedDate 
                            ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                            : dataLimite ? format(new Date(dataLimite + 'T23:59:59'), 'dd/MM/yyyy', { locale: ptBR }) : ''
                          }`
                        : ` Atualizado em ${format(new Date(cashAccountsStatus.resumo.data_calculo), "HH:mm:ss", { locale: ptBR })}`
                      }
                    </div>
                  </div>
                  <div
                    className={cn(
                      "p-3 rounded-full bg-white/20",
                      parseFloat(cashAccountsStatus.resumo.saldo_total_geral) >= 0
                        ? "text-white"
                        : "text-white"
                    )}
                  >
                    {parseFloat(cashAccountsStatus.resumo.saldo_total_geral) >= 0 ? (
                      <TrendingUp className="h-8 w-8" />
                    ) : (
                      <TrendingDown className="h-8 w-8" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Toggle para mostrar todas as contas */}
          {!loading && hiddenAccountsCount > 0 && (
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllAccounts(!showAllAccounts)}
                className="bg-white dark:bg-slate-800"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showAllAccounts ? "Mostrar apenas dashboard" : `Mostrar todas (${hiddenAccountsCount} oculta(s))`}
              </Button>
            </div>
          )}

          {/* Lista de Contas */}
          <div className="space-y-3">
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </>
            ) : (
              displayedAccounts.map((conta) => {
                const saldoAtual = parseFloat(conta.saldo_atual)
                const saldoInicial = parseFloat(conta.saldo_inicial)
                const variacao = saldoAtual - saldoInicial
                const isPositive = saldoAtual >= 0

                return (
                  <Card
                    key={conta.id_conta_caixa}
                    className={cn(
                      "border-2 transition-all hover:shadow-md",
                      isPositive
                        ? "border-green-200 dark:border-green-800 bg-white dark:bg-slate-800"
                        : "border-red-200 dark:border-red-800 bg-white dark:bg-slate-800"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
                            {conta.conta}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={conta.status ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {conta.status ? "Ativa" : "Inativa"}
                            </Badge>
                            {conta.dashboard && (
                              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                Dashboard
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500">
                              ID: {conta.id_conta_caixa}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Saldo Atual/Histórico - Destaque */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            {selectedDate ? `Saldo em ${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}` : "Saldo Atual"}
                          </div>
                          <div
                            className={cn(
                              "text-2xl font-bold",
                              isPositive
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            )}
                          >
                            {formatCurrency(saldoAtual)}
                          </div>
                        </div>

                        {/* Detalhes em Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2">
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                              Saldo Inicial
                            </div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {formatCurrency(saldoInicial)}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "rounded-lg p-2",
                              variacao >= 0
                                ? "bg-green-50 dark:bg-green-950/30"
                                : "bg-red-50 dark:bg-red-950/30"
                            )}
                          >
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-0.5">
                              Variação
                            </div>
                            <div
                              className={cn(
                                "text-sm font-semibold flex items-center gap-1",
                                variacao >= 0
                                  ? "text-green-700 dark:text-green-400"
                                  : "text-red-700 dark:text-red-400"
                              )}
                            >
                              {variacao >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {formatCurrency(Math.abs(variacao))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Empty State */}
          {!loading && displayedAccounts.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                Nenhuma conta encontrada
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
