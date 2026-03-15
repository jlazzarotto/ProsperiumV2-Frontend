import { httpClient } from "@/lib/http-client"

export interface PspStatusInfo {
  authenticated: boolean
  tokenPreview: string
}

export interface PspDuvListFilters {
  imo?: string
  inscricao?: string
  situacaoDuv?: string
  nomeEmbarcacao?: string
  natureza?: string
  finalizado?: boolean
  pagina?: number
  porto?: string
  retornarPendencia?: boolean
}

export interface PspDuvListItem {
  numeroDuv?: number | string
  nomeEmbarcacao?: string
  embarcacaoNome?: string
  nome?: string
  porto?: string
  nomePorto?: string
  bitrigramaPorto?: string
  natureza?: string
  tipoEstadia?: string
  nomeCorrenteTrafego?: string
  situacaoDuv?: string
  situacao?: string
  status?: string
  finalizado?: boolean
  [key: string]: unknown
}

export interface PspResumoItem {
  numeroDuv?: number | string
  nomeEmbarcacao?: string
  embarcacaoNome?: string
  nome?: string
  porto?: string
  nomePorto?: string
  bitrigramaPorto?: string
  natureza?: string
  tipoEstadia?: string
  nomeCorrenteTrafego?: string
  situacaoDuv?: string
  situacao?: string
  status?: string
  finalizado?: boolean
  [key: string]: unknown
}

export interface PspEmbarcacaoItem {
  nome?: string
  imo?: string
  numeroInscricao?: string
  bandeira?: string
  areaNavegacao?: string
  tipoEmbarcacao?: string
  tipo?: string
  arqueacaoBruta?: string | number
  comprimento?: string | number
  [key: string]: unknown
}

export interface PspAnuenciaItem {
  nomeOrgao?: string
  orgao?: string
  autoridade?: string
  situacao?: string
  status?: string
  resultado?: string
  exigencia?: string
  observacao?: string
  tipo?: string
  [key: string]: unknown
}

export interface PspChegadaSaidaEventoData {
  dataChegada?: string
  dataHoraChegada?: string
  dataSaida?: string
  dataHoraSaida?: string
  data?: string
  nomeLocal?: string
  local?: string
  tipoLocal?: string
  [key: string]: unknown
}

export interface PspChegadaSaidaEvento {
  idPSPChegada?: number | string
  codigoEventoMovimentacao?: string
  eventoMovimentacao?: string
  situacao?: string
  status?: string
  chegada?: PspChegadaSaidaEventoData
  saida?: PspChegadaSaidaEventoData
  [key: string]: unknown
}

export interface PspChegadasSaidasItem {
  eventosEstadia?: PspChegadaSaidaEvento[]
  [key: string]: unknown
}

export interface PspAnexoItem {
  id?: number | string
  tipoDocumento?: string
  descricao?: string
  nomeTipoDocumento?: string
  nomeArquivo?: string
  arquivo?: string
  url?: string
  observacoes?: string
  observacao?: string
  [key: string]: unknown
}

export interface PspLocalAtracacaoItem {
  idPSPAreaPorto?: number
  idPSPBerco?: number
  idPSPCabeco?: number
  idPSPFundeadouro?: number
  idPSPBoiaAmarracao?: number
  nome?: string
  descricao?: string
  tipoLocal?: string
  [key: string]: unknown
}

export interface PspHistoricoItem {
  id: number
  companyId: number | null
  userId: number | null
  endpointKey: string
  request: Record<string, unknown>
  response: Record<string, unknown> | null
  success: boolean
  durationMs: number
  errorMessage: string | null
  createdAt: string
}

interface Envelope<T> {
  success: boolean
  data: T
}

interface PspStatusResponse {
  psp: PspStatusInfo
}

interface PspItemsResponse<T> {
  items: T[]
}

interface PspItemResponse<T> {
  item: T
}

interface PspItemWithMetaResponse<T> {
  item: T
  meta: {
    version: string
  }
}

function buildQuery(filters: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return
    }
    params.set(key, String(value))
  })

  return params.toString()
}

export async function getPspStatus(): Promise<PspStatusInfo> {
  const response = await httpClient.get<Envelope<PspStatusResponse>>("/v1/integracoes/psp/status")
  return response.data.psp
}

export async function listPspDuvs(filters: PspDuvListFilters): Promise<PspDuvListItem[]> {
  const query = buildQuery(filters)
  const response = await httpClient.get<Envelope<PspItemsResponse<PspDuvListItem>>>(`/v1/integracoes/psp/duvs${query ? `?${query}` : ""}`)
  return response.data.items
}

export async function getPspResumo(numeroDuv: number): Promise<PspResumoItem> {
  const response = await httpClient.get<Envelope<PspItemResponse<PspResumoItem>>>(`/v1/integracoes/psp/duvs/${numeroDuv}/resumo`)
  return response.data.item
}

export async function getPspEmbarcacao(numeroDuv: number): Promise<PspEmbarcacaoItem> {
  const response = await httpClient.get<Envelope<PspItemResponse<PspEmbarcacaoItem>>>(`/v1/integracoes/psp/duvs/${numeroDuv}/embarcacao`)
  return response.data.item
}

export async function getPspAnuencias(numeroDuv: number): Promise<PspAnuenciaItem[]> {
  const response = await httpClient.get<Envelope<PspItemResponse<PspAnuenciaItem[]>>>(`/v1/integracoes/psp/duvs/${numeroDuv}/anuencias`)
  return response.data.item
}

export async function getPspChegadasSaidas(numeroDuv: number, v2 = true): Promise<{ item: PspChegadasSaidasItem; version: string }> {
  const query = buildQuery({ v2 })
  const response = await httpClient.get<Envelope<PspItemWithMetaResponse<PspChegadasSaidasItem>>>(`/v1/integracoes/psp/duvs/${numeroDuv}/chegadas-saidas?${query}`)
  return {
    item: response.data.item,
    version: response.data.meta.version,
  }
}

export async function getPspAnexos(numeroDuv: number): Promise<PspAnexoItem[]> {
  const response = await httpClient.get<Envelope<PspItemsResponse<PspAnexoItem>>>(`/v1/integracoes/psp/duvs/${numeroDuv}/anexos`)
  return response.data.items
}

export async function getPspLocaisAtracacao(bitrigramaPorto: string): Promise<PspLocalAtracacaoItem[]> {
  const response = await httpClient.get<Envelope<PspItemsResponse<PspLocalAtracacaoItem>>>(`/v1/integracoes/psp/cadastro/portos/${bitrigramaPorto}/locais-atracacao`)
  return response.data.items
}

export async function listPspHistorico(limit = 30, endpointKey?: string): Promise<PspHistoricoItem[]> {
  const query = buildQuery({ limit, endpointKey })
  const response = await httpClient.get<Envelope<PspItemsResponse<PspHistoricoItem>>>(`/v1/integracoes/psp/historico?${query}`)
  return response.data.items
}
