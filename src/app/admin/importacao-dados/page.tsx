"use client"

import { useEffect, useMemo, useState } from "react"
import { Anchor, DatabaseZap, RefreshCw, Search, Ship, Waves } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import customToast from "@/components/ui/custom-toast"
import {
  type PspAnexoItem,
  type PspAnuenciaItem,
  type PspChegadaSaidaEvento,
  type PspChegadasSaidasItem,
  type PspDuvListItem,
  getPspAnexos,
  getPspAnuencias,
  getPspChegadasSaidas,
  getPspEmbarcacao,
  getPspLocaisAtracacao,
  getPspResumo,
  getPspStatus,
  listPspDuvs,
  listPspHistorico,
  type PspEmbarcacaoItem,
  type PspDuvListFilters,
  type PspHistoricoItem,
  type PspLocalAtracacaoItem,
  type PspResumoItem,
  type PspStatusInfo,
} from "@/app/services/psp-service"

type DuvFilterState = {
  imo: string
  inscricao: string
  situacaoDuv: string
  nomeEmbarcacao: string
  natureza: string
  finalizado: string
  pagina: string
  porto: string
  retornarPendencia: string
}

type DetailState = {
  resumo: PspResumoItem | null
  embarcacao: PspEmbarcacaoItem | null
  anuencias: PspAnuenciaItem[]
  chegadasSaidas: PspChegadasSaidasItem | null
  chegadasSaidasVersion: string
  anexos: PspAnexoItem[]
}

const EMPTY_FILTERS: DuvFilterState = {
  imo: "",
  inscricao: "",
  situacaoDuv: "",
  nomeEmbarcacao: "",
  natureza: "",
  finalizado: "all",
  pagina: "",
  porto: "",
  retornarPendencia: "all",
}

const EMPTY_DETAILS: DetailState = {
  resumo: null,
  embarcacao: null,
  anuencias: null,
  chegadasSaidas: null,
  chegadasSaidasVersion: "v2",
  anexos: [],
}

function normalizeFilters(filters: DuvFilterState): PspDuvListFilters {
  return {
    imo: filters.imo || undefined,
    inscricao: filters.inscricao || undefined,
    situacaoDuv: filters.situacaoDuv || undefined,
    nomeEmbarcacao: filters.nomeEmbarcacao || undefined,
    natureza: filters.natureza || undefined,
    finalizado: filters.finalizado === "all" ? undefined : filters.finalizado === "true",
    pagina: filters.pagina ? Number(filters.pagina) : undefined,
    porto: filters.porto || undefined,
    retornarPendencia: filters.retornarPendencia === "all" ? undefined : filters.retornarPendencia === "true",
  }
}

function safeString(value: unknown, fallback = "—") {
  if (typeof value === "string" && value.trim()) return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  return fallback
}

function extractDuvNumber(item: Pick<PspDuvListItem, "numeroDuv"> | null | undefined): number | null {
  const value = item?.numeroDuv
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim()) return Number(value)
  return null
}

function extractSummary(item: PspDuvListItem | PspResumoItem | null | undefined) {
  if (!item) {
    return {
      numeroDuv: "—",
      nome: "DUV sem identificação",
      porto: "—",
      natureza: "—",
      situacao: "—",
      finalizado: "—",
    }
  }

  return {
    numeroDuv: safeString(item.numeroDuv),
    nome: safeString(item.nomeEmbarcacao ?? item.nome ?? item.embarcacaoNome, "DUV sem identificação"),
    porto: safeString(item.porto ?? item.nomePorto ?? item.bitrigramaPorto),
    natureza: safeString(item.natureza ?? item.tipoEstadia ?? item.nomeCorrenteTrafego),
    situacao: safeString(item.situacaoDuv ?? item.situacao ?? item.status),
    finalizado: typeof item.finalizado === "boolean" ? (item.finalizado ? "Sim" : "Não") : "—",
  }
}

function pickFirst(record: Record<string, unknown> | null, keys: string[], fallback = "—") {
  if (!record) return fallback
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value
    if (typeof value === "number") return String(value)
    if (typeof value === "boolean") return value ? "Sim" : "Não"
  }
  return fallback
}

function extractResumoMetrics(value: PspResumoItem | null) {
  const record = value ? (value as Record<string, unknown>) : null
  return [
    { label: "DUV", value: pickFirst(record, ["numeroDuv"]) },
    { label: "Embarcação", value: pickFirst(record, ["nomeEmbarcacao", "nome", "embarcacaoNome"]) },
    { label: "Porto", value: pickFirst(record, ["porto", "nomePorto", "bitrigramaPorto"]) },
    { label: "Natureza", value: pickFirst(record, ["natureza", "tipoEstadia", "nomeCorrenteTrafego"]) },
    { label: "Situação", value: pickFirst(record, ["situacaoDuv", "situacao", "status"]) },
    { label: "Finalizado", value: pickFirst(record, ["finalizado"]) },
  ]
}

function extractEmbarcacaoMetrics(value: PspEmbarcacaoItem | null) {
  const record = value ? (value as Record<string, unknown>) : null
  return [
    { label: "Nome", value: pickFirst(record, ["nome"]) },
    { label: "IMO", value: pickFirst(record, ["imo"]) },
    { label: "Inscrição", value: pickFirst(record, ["numeroInscricao"]) },
    { label: "Bandeira", value: pickFirst(record, ["bandeira"]) },
    { label: "Área de navegação", value: pickFirst(record, ["areaNavegacao"]) },
    { label: "Tipo", value: pickFirst(record, ["tipoEmbarcacao", "tipo"]) },
    { label: "Arqueação bruta", value: pickFirst(record, ["arqueacaoBruta"]) },
    { label: "Comprimento", value: pickFirst(record, ["comprimento"]) },
  ]
}

function extractChegadasRows(value: PspChegadasSaidasItem | null) {
  const eventos = value?.eventosEstadia ?? []

  return eventos.map((item, index) => {
    const event = item as PspChegadaSaidaEvento
    const chegada = event.chegada ? (event.chegada as Record<string, unknown>) : null
    const saida = event.saida ? (event.saida as Record<string, unknown>) : null
    const eventRecord = event as Record<string, unknown>

    return {
      id: `${pickFirst(eventRecord, ["idPSPChegada", "codigoEventoMovimentacao"], String(index))}-${index}`,
      evento: pickFirst(eventRecord, ["eventoMovimentacao", "codigoEventoMovimentacao"]),
      chegada: pickFirst(chegada, ["dataChegada", "dataHoraChegada", "data"]),
      local: pickFirst(chegada, ["nomeLocal", "local", "tipoLocal"]),
      saida: pickFirst(saida, ["dataSaida", "dataHoraSaida", "data"]),
      situacao: pickFirst(eventRecord, ["situacao", "status"]),
    }
  })
}

function extractAnuenciasRows(value: PspAnuenciaItem[]) {
  return value.map((item, index) => {
    const record = item as Record<string, unknown>
    return {
      id: `${pickFirst(record, ["nomeOrgao", "orgao", "tipo"], String(index))}-${index}`,
      orgao: pickFirst(record, ["nomeOrgao", "orgao", "autoridade"]),
      situacao: pickFirst(record, ["situacao", "status", "resultado"]),
      exigencia: pickFirst(record, ["exigencia"]),
      observacao: pickFirst(record, ["observacao"]),
    }
  })
}

function extractAnexosRows(value: PspAnexoItem[]) {
  return value.map((item, index) => {
    const record = item as Record<string, unknown>
    return {
      id: `${pickFirst(record, ["id", "nomeArquivo", "tipoDocumento"], String(index))}-${index}`,
      documento: pickFirst(record, ["tipoDocumento", "descricao", "nomeTipoDocumento"]),
      arquivo: pickFirst(record, ["nomeArquivo", "arquivo"]),
      url: pickFirst(record, ["url"]),
      observacoes: pickFirst(record, ["observacoes", "observacao"]),
    }
  })
}

function JsonPanel({ value, emptyLabel }: { value: unknown; emptyLabel: string }) {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <ScrollArea className="h-[420px] rounded-xl border border-slate-200 bg-slate-950/95">
      <pre className="p-4 text-xs leading-6 text-slate-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    </ScrollArea>
  )
}

export default function ImportacaoDadosPage() {
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [statusInfo, setStatusInfo] = useState<PspStatusInfo | null>(null)
  const [filters, setFilters] = useState<DuvFilterState>(EMPTY_FILTERS)
  const [loadingList, setLoadingList] = useState(false)
  const [duvs, setDuvs] = useState<PspDuvListItem[]>([])
  const [selectedDuvNumber, setSelectedDuvNumber] = useState<number | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [details, setDetails] = useState<DetailState>(EMPTY_DETAILS)
  const [portoLookup, setPortoLookup] = useState("")
  const [loadingPorto, setLoadingPorto] = useState(false)
  const [locaisAtracacao, setLocaisAtracacao] = useState<PspLocalAtracacaoItem[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [historico, setHistorico] = useState<PspHistoricoItem[]>([])

  const selectedDuv = useMemo(
    () => duvs.find((item) => extractDuvNumber(item) === selectedDuvNumber) ?? null,
    [duvs, selectedDuvNumber]
  )

  const loadStatus = async () => {
    setLoadingStatus(true)
    try {
      const info = await getPspStatus()
      setStatusInfo(info)
      customToast.success("Conexão com PSP validada.")
    } catch (error) {
      console.error("Erro ao validar PSP:", error)
      customToast.error("Falha ao validar autenticação PSP.")
    } finally {
      setLoadingStatus(false)
    }
  }

  const loadHistorico = async () => {
    setLoadingHistorico(true)
    try {
      const items = await listPspHistorico(20)
      setHistorico(items)
    } catch (error) {
      console.error("Erro ao carregar histórico PSP:", error)
      customToast.error("Falha ao carregar histórico PSP.")
      setHistorico([])
    } finally {
      setLoadingHistorico(false)
    }
  }

  const loadDuvs = async (nextFilters = filters) => {
    setLoadingList(true)
    try {
      const items = await listPspDuvs(normalizeFilters(nextFilters))
      setDuvs(items)
      const firstDuv = items.map(extractDuvNumber).find((value) => value !== null) ?? null
      setSelectedDuvNumber(firstDuv)
      if (firstDuv === null) {
        setDetails(EMPTY_DETAILS)
      }
    } catch (error) {
      console.error("Erro ao consultar DUVs:", error)
      customToast.error("Falha ao consultar DUVs no PSP.")
      setDuvs([])
      setSelectedDuvNumber(null)
      setDetails(EMPTY_DETAILS)
    } finally {
      setLoadingList(false)
    }
  }

  const loadDetails = async (numeroDuv: number) => {
    setLoadingDetails(true)
    try {
      const [resumo, embarcacao, anuencias, chegadasSaidas, anexos] = await Promise.all([
        getPspResumo(numeroDuv),
        getPspEmbarcacao(numeroDuv),
        getPspAnuencias(numeroDuv),
        getPspChegadasSaidas(numeroDuv, true),
        getPspAnexos(numeroDuv),
      ])

      setDetails({
        resumo,
        embarcacao,
        anuencias,
        chegadasSaidas: chegadasSaidas.item,
        chegadasSaidasVersion: chegadasSaidas.version,
        anexos,
      })
    } catch (error) {
      console.error(`Erro ao carregar detalhes do DUV ${numeroDuv}:`, error)
      customToast.error("Falha ao carregar detalhes do DUV.")
      setDetails(EMPTY_DETAILS)
    } finally {
      setLoadingDetails(false)
    }
  }

  const loadLocaisAtracacao = async () => {
    if (!portoLookup.trim()) {
      customToast.error("Informe o bitrigrama do porto.")
      return
    }

    setLoadingPorto(true)
    try {
      const items = await getPspLocaisAtracacao(portoLookup.trim().toLowerCase())
      setLocaisAtracacao(items)
    } catch (error) {
      console.error("Erro ao consultar locais de atracação:", error)
      customToast.error("Falha ao consultar locais de atracação.")
      setLocaisAtracacao([])
    } finally {
      setLoadingPorto(false)
    }
  }

  useEffect(() => {
    void loadStatus()
    void loadHistorico()
  }, [])

  useEffect(() => {
    if (selectedDuvNumber !== null) {
      void loadDetails(selectedDuvNumber)
    }
  }, [selectedDuvNumber])

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.24),_transparent_30%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">
          <Card className="overflow-hidden border-slate-200 bg-slate-900 text-slate-50 shadow-xl">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.5fr_0.9fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-sky-400/50 bg-sky-500/10 text-sky-100">admin.importacao_dados</Badge>
                  <Badge className="bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/15">PSP marítimo-portuário</Badge>
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">Operação Porto sem Papel</h1>
                  <p className="max-w-3xl text-sm text-slate-300">
                    Consulta operacional de DUVs, embarcação, anuências, chegadas e saídas, anexos e cadastro portuário
                    a partir da integração já exposta no backend.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => void loadStatus()} disabled={loadingStatus} className="bg-sky-500 text-slate-950 hover:bg-sky-400">
                      <RefreshCw className={`mr-2 h-4 w-4 ${loadingStatus ? "animate-spin" : ""}`} />
                      Testar conexão PSP
                    </Button>
                    <Button variant="outline" onClick={() => void loadHistorico()} disabled={loadingHistorico} className="border-slate-700 bg-slate-800/70 text-slate-100 hover:bg-slate-700">
                      <RefreshCw className={`mr-2 h-4 w-4 ${loadingHistorico ? "animate-spin" : ""}`} />
                      Atualizar histórico
                    </Button>
                  {statusInfo ? (
                    <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-200">
                      Token ativo: <span className="font-mono text-sky-300">{statusInfo.tokenPreview}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <Card className="border-slate-700 bg-slate-800/75 text-slate-50">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">Conectividade</CardDescription>
                    <CardTitle className="text-lg">{statusInfo?.authenticated ? "Autenticado" : "Pendente"}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-slate-700 bg-slate-800/75 text-slate-50">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">DUVs carregados</CardDescription>
                    <CardTitle className="text-lg">{duvs.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-slate-700 bg-slate-800/75 text-slate-50">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-slate-400">DUV selecionado</CardDescription>
                    <CardTitle className="text-lg">{selectedDuvNumber ?? "—"}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[1.05fr_1.25fr]">
            <div className="space-y-5">
              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DatabaseZap className="h-5 w-5 text-sky-600" />
                    <CardTitle>Consulta de DUVs</CardTitle>
                  </div>
                  <CardDescription>Preencha ao menos um critério reconhecido pelo PSP e carregue a lista operacional.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="imo">IMO</Label>
                      <Input id="imo" value={filters.imo} onChange={(event) => setFilters((current) => ({ ...current, imo: event.target.value }))} placeholder="15169198" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inscricao">Inscrição</Label>
                      <Input id="inscricao" value={filters.inscricao} onChange={(event) => setFilters((current) => ({ ...current, inscricao: event.target.value }))} placeholder="Inscrição marítima" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomeEmbarcacao">Nome da embarcação</Label>
                      <Input id="nomeEmbarcacao" value={filters.nomeEmbarcacao} onChange={(event) => setFilters((current) => ({ ...current, nomeEmbarcacao: event.target.value }))} placeholder="Nome parcial" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="porto">Porto</Label>
                      <Input id="porto" value={filters.porto} onChange={(event) => setFilters((current) => ({ ...current, porto: event.target.value }))} placeholder="BRSSZ" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="natureza">Natureza</Label>
                      <Input id="natureza" value={filters.natureza} onChange={(event) => setFilters((current) => ({ ...current, natureza: event.target.value }))} placeholder="NORMAL" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="situacaoDuv">Situação DUV</Label>
                      <Input id="situacaoDuv" value={filters.situacaoDuv} onChange={(event) => setFilters((current) => ({ ...current, situacaoDuv: event.target.value }))} placeholder="ABERTO, FINALIZADO..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Finalizado</Label>
                      <Select value={filters.finalizado} onValueChange={(value) => setFilters((current) => ({ ...current, finalizado: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Retornar pendência</Label>
                      <Select value={filters.retornarPendencia} onValueChange={(value) => setFilters((current) => ({ ...current, retornarPendencia: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Automático" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Automático</SelectItem>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => void loadDuvs()} disabled={loadingList}>
                      <Search className={`mr-2 h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
                      Consultar DUVs
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilters(EMPTY_FILTERS)
                        setDuvs([])
                        setSelectedDuvNumber(null)
                        setDetails(EMPTY_DETAILS)
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Anchor className="h-5 w-5 text-amber-600" />
                    <CardTitle>Cadastro portuário</CardTitle>
                  </div>
                  <CardDescription>Consulta direta dos locais de atracação por bitrigrama do porto.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Input value={portoLookup} onChange={(event) => setPortoLookup(event.target.value)} placeholder="BRSSZ" className="max-w-[220px]" />
                    <Button variant="outline" onClick={() => void loadLocaisAtracacao()} disabled={loadingPorto}>
                      <Waves className={`mr-2 h-4 w-4 ${loadingPorto ? "animate-spin" : ""}`} />
                      Consultar locais
                    </Button>
                  </div>
                  <JsonPanel value={locaisAtracacao} emptyLabel="Nenhum local de atracação carregado." />
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DatabaseZap className="h-5 w-5 text-slate-700" />
                    <CardTitle>Histórico PSP</CardTitle>
                  </div>
                  <CardDescription>Últimas consultas persistidas para auditoria e troubleshooting.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quando</TableHead>
                          <TableHead>Endpoint</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duração</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historico.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                              {loadingHistorico ? "Carregando histórico..." : "Nenhum histórico carregado."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          historico.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{new Date(item.createdAt).toLocaleString("pt-BR")}</TableCell>
                              <TableCell className="font-medium">{item.endpointKey}</TableCell>
                              <TableCell>{item.success ? "Sucesso" : "Erro"}</TableCell>
                              <TableCell>{item.durationMs} ms</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-slate-700" />
                    <CardTitle>Lista operacional de DUVs</CardTitle>
                  </div>
                  <CardDescription>Clique em uma linha para carregar os detalhes do DUV.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Embarcação</TableHead>
                          <TableHead>Porto</TableHead>
                          <TableHead>Natureza</TableHead>
                          <TableHead>Situação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {duvs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                              {loadingList ? "Carregando DUVs..." : "Nenhum DUV carregado."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          duvs.map((item, index) => {
                            const summary = extractSummary(item)
                            const duvNumber = extractDuvNumber(item)
                            const isSelected = duvNumber !== null && duvNumber === selectedDuvNumber

                            return (
                              <TableRow
                                key={`${summary.numeroDuv}-${index}`}
                                className={`cursor-pointer ${isSelected ? "bg-sky-50" : ""}`}
                                onClick={() => {
                                  if (duvNumber !== null) {
                                    setSelectedDuvNumber(duvNumber)
                                  }
                                }}
                              >
                                <TableCell className="font-medium">{summary.numeroDuv}</TableCell>
                                <TableCell>{summary.nome}</TableCell>
                                <TableCell>{summary.porto}</TableCell>
                                <TableCell>{summary.natureza}</TableCell>
                                <TableCell>{summary.situacao}</TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Detalhes do DUV {selectedDuvNumber ?? "—"}</CardTitle>
                      <CardDescription>
                        {selectedDuv ? extractSummary(selectedDuv).nome : "Selecione um DUV na lista para inspecionar os retornos do PSP."}
                      </CardDescription>
                    </div>
                    {loadingDetails ? <Badge variant="secondary">Atualizando</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="resumo" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="resumo">Resumo</TabsTrigger>
                      <TabsTrigger value="embarcacao">Embarcação</TabsTrigger>
                      <TabsTrigger value="chegadas">Chegadas/Saídas</TabsTrigger>
                      <TabsTrigger value="anuencias">Anuências</TabsTrigger>
                      <TabsTrigger value="anexos">Anexos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="resumo" className="mt-4 space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {extractResumoMetrics(details.resumo).map((metric) => (
                          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
                        ))}
                      </div>
                      <RawJsonAccordion title="JSON completo do resumo" value={details.resumo} emptyLabel="Resumo ainda não carregado." />
                    </TabsContent>

                    <TabsContent value="embarcacao" className="mt-4 space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {extractEmbarcacaoMetrics(details.embarcacao).map((metric) => (
                          <MetricCard key={metric.label} label={metric.label} value={metric.value} />
                        ))}
                      </div>
                      <RawJsonAccordion title="JSON completo da embarcação" value={details.embarcacao} emptyLabel="Dados da embarcação ainda não carregados." />
                    </TabsContent>

                    <TabsContent value="chegadas" className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Badge variant="outline">{details.chegadasSaidasVersion}</Badge>
                        <span>Endpoint com campos complementares quando disponível.</span>
                      </div>
                      <StructuredTable
                        columns={["Evento", "Chegada", "Local", "Saída", "Situação"]}
                        rows={extractChegadasRows(details.chegadasSaidas).map((row) => [row.evento, row.chegada, row.local, row.saida, row.situacao])}
                        emptyLabel="Chegadas e saídas ainda não carregadas."
                      />
                      <RawJsonAccordion title="JSON completo de chegadas e saídas" value={details.chegadasSaidas} emptyLabel="Chegadas e saídas ainda não carregadas." />
                    </TabsContent>

                    <TabsContent value="anuencias" className="mt-4 space-y-4">
                      <StructuredTable
                        columns={["Órgão", "Situação", "Exigência", "Observação"]}
                        rows={extractAnuenciasRows(details.anuencias).map((row) => [row.orgao, row.situacao, row.exigencia, row.observacao])}
                        emptyLabel="Anuências ainda não carregadas."
                      />
                      <RawJsonAccordion title="JSON completo de anuências" value={details.anuencias} emptyLabel="Anuências ainda não carregadas." />
                    </TabsContent>

                    <TabsContent value="anexos" className="mt-4 space-y-4">
                      <StructuredTable
                        columns={["Documento", "Arquivo", "URL", "Observações"]}
                        rows={extractAnexosRows(details.anexos).map((row) => [row.documento, row.arquivo, row.url, row.observacoes])}
                        emptyLabel="Nenhum anexo retornado."
                      />
                      <RawJsonAccordion title="JSON completo de anexos" value={details.anexos} emptyLabel="Nenhum anexo retornado." />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-900">{value}</div>
    </div>
  )
}

function StructuredTable({
  columns,
  rows,
  emptyLabel,
}: {
  columns: string[]
  rows: string[][]
  emptyLabel: string
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row[0] ?? "row"}-${index}`}>
              {row.map((cell, cellIndex) => (
                <TableCell key={`${columns[cellIndex]}-${index}`}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RawJsonAccordion({
  title,
  value,
  emptyLabel,
}: {
  title: string
  value: unknown
  emptyLabel: string
}) {
  return (
    <Accordion type="single" collapsible className="rounded-xl border border-slate-200 px-4">
      <AccordionItem value="json" className="border-b-0">
        <AccordionTrigger className="text-sm text-slate-700 hover:no-underline">{title}</AccordionTrigger>
        <AccordionContent>
          <Separator className="mb-4" />
          <JsonPanel value={value} emptyLabel={emptyLabel} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
