"use client"

import { useEffect, useState, useCallback } from "react"
import { MainHeader } from "@/components/main-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  LogIn,
  UserPlus,
  Trash2,
  Pencil,
  Plus,
  Shield,
  Eye,
  Power,
  RefreshCw,
  Clock,
  User,
  Globe,
} from "lucide-react"
import { auditLogService, type AuditLogEntry, type AuditLogFilters } from "@/app/services/audit-log-service"
import customToast from "@/components/ui/custom-toast"

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  login: { label: "Login", icon: <LogIn className="w-3.5 h-3.5" />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  logout: { label: "Logout", icon: <LogIn className="w-3.5 h-3.5" />, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50" },
  criar: { label: "Criar", icon: <Plus className="w-3.5 h-3.5" />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  editar: { label: "Editar", icon: <Pencil className="w-3.5 h-3.5" />, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  deletar: { label: "Deletar", icon: <Trash2 className="w-3.5 h-3.5" />, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
  visualizar: { label: "Visualizar", icon: <Eye className="w-3.5 h-3.5" />, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
  convidar: { label: "Convidar", icon: <UserPlus className="w-3.5 h-3.5" />, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  ativar: { label: "Ativar", icon: <Power className="w-3.5 h-3.5" />, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
  inativar: { label: "Inativar", icon: <Power className="w-3.5 h-3.5" />, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  permissoes: { label: "Permissoes", icon: <Shield className="w-3.5 h-3.5" />, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
  baixar: { label: "Baixa", icon: <Plus className="w-3.5 h-3.5" />, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
  cancelar_baixa: { label: "Cancelar Baixa", icon: <X className="w-3.5 h-3.5" />, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
  encerrar: { label: "Encerrar", icon: <Power className="w-3.5 h-3.5" />, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-800/50" },
  faturar: { label: "Faturar", icon: <Plus className="w-3.5 h-3.5" />, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  reabrir: { label: "Reabrir", icon: <RefreshCw className="w-3.5 h-3.5" />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
}

const DEFAULT_ACTION = { label: "Acao", icon: <Activity className="w-3.5 h-3.5" />, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50" }

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || DEFAULT_ACTION
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "agora"
  if (diffMins < 60) return `${diffMins}min atras`
  if (diffHours < 24) return `${diffHours}h atras`
  if (diffDays < 7) return `${diffDays}d atras`

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [filters, setFilters] = useState<AuditLogFilters | null>(null)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  // Filter state
  const [search, setSearch] = useState("")
  const [selectedAction, setSelectedAction] = useState<string>("")
  const [selectedModulo, setSelectedModulo] = useState<string>("")
  const [selectedOperador, setSelectedOperador] = useState<string>("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await auditLogService.getLogs({
        page,
        limit: 30,
        search: search || undefined,
        action: selectedAction || undefined,
        modulo: selectedModulo || undefined,
        id_operador: selectedOperador ? Number(selectedOperador) : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setLogs(result.data)
      setTotal(result.total)
      setPages(result.pages)
    } catch {
      customToast.error("Erro ao carregar logs")
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedAction, selectedModulo, selectedOperador, dateFrom, dateTo])

  const fetchFilters = useCallback(async () => {
    try {
      const result = await auditLogService.getFilters()
      setFilters(result)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const hasActiveFilters = selectedAction || selectedModulo || selectedOperador || dateFrom || dateTo

  const clearFilters = () => {
    setSelectedAction("")
    setSelectedModulo("")
    setSelectedOperador("")
    setDateFrom("")
    setDateTo("")
    setSearch("")
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <MainHeader />

      <div className="px-6 lg:px-10 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-blue-600">
            <Activity className="mr-2 w-8 h-8" />
            <span className="text-3xl font-medium">Logs de Auditoria</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "border-blue-500 text-blue-600" : ""}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1.5 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPage(1); fetchLogs() }}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por descricao, usuario, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Select value={selectedAction} onValueChange={(v) => { setSelectedAction(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder="Acao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as acoes</SelectItem>
                  {(filters?.actions || []).map((a) => (
                    <SelectItem key={a} value={a}>
                      {ACTION_CONFIG[a]?.label || a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedModulo} onValueChange={(v) => { setSelectedModulo(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder="Modulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os modulos</SelectItem>
                  {(filters?.modulos || []).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedOperador} onValueChange={(v) => { setSelectedOperador(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder="Usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuarios</SelectItem>
                  {(filters?.operadores || []).map((op) => (
                    <SelectItem key={op.idOperador} value={String(op.idOperador)}>
                      {op.operadorNome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Data inicio"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="h-10 rounded-lg"
              />

              <Input
                type="date"
                placeholder="Data fim"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="h-10 rounded-lg"
              />
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-700">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Timeline list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-slate-400">
                <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                <span>Carregando logs...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Activity className="w-10 h-10 mb-3 text-slate-300" />
              <p className="text-sm font-medium">Nenhum log encontrado</p>
              <p className="text-xs mt-1">Ajuste os filtros ou aguarde novas atividades</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => {
                const config = getActionConfig(log.action)
                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Action icon */}
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${config.bg}`}>
                      <span className={config.color}>{config.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm text-slate-900 dark:text-white leading-relaxed">
                            <span className="font-semibold">{log.operador_nome}</span>
                            <span className="text-slate-400 dark:text-slate-500 mx-1.5">&middot;</span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${config.color} ${config.bg}`}>
                              {config.label}
                            </span>
                          </p>
                          {log.descricao && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                              {log.descricao}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span title={formatFullDate(log.created_at)}>{formatDate(log.created_at)}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                              <User className="w-3 h-3" />
                              {log.operador_email}
                            </span>
                            {log.modulo && (
                              <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {log.modulo}
                              </span>
                            )}
                            {log.ip_address && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                <Globe className="w-3 h-3" />
                                {log.ip_address}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                          {formatFullDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <p className="text-xs text-slate-500">
                Pagina {page} de {pages} ({total} registros)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
