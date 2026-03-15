import { httpClient } from "@/lib/http-client"

export interface BancoItem {
  id: number
  codigoCompe: string
  nome: string
  ispb: string | null
  documento: string | null
  nomeCurto: string | null
  rede: string | null
  tipo: string | null
  tipoPix: string | null
  site: string | null
  dataInicioOperacao: string | null
  dataInicioPix: string | null
  dataRegistroOrigem: string | null
  dataAtualizacaoOrigem: string | null
  status: string
}

export interface PessoaCadastroItem {
  id: number
  companyId: number
  empresaId: number | null
  nome: string
  documento: string | null
  classificacao: string
  status: string
}

export interface ContaFinanceiraItem {
  id: number
  companyId: number
  empresaId: number
  unidadeId: number | null
  bancoId: number | null
  banco: BancoItem | null
  titularPessoaId: number | null
  titularPessoaNome: string | null
  codigo: string
  nome: string
  tipo: string
  agencia: string | null
  contaNumero: string | null
  contaDigito: string | null
  saldoInicial: string
  dataSaldoInicial: string | null
  permiteMovimentoNegativo: boolean
  status: "active" | "inactive"
}

interface ContaFinanceiraListResponse {
  success: boolean
  data: {
    items: ContaFinanceiraItem[]
  }
}

interface ContaFinanceiraItemResponse {
  success: boolean
  data: {
    item: ContaFinanceiraItem
  }
}

interface BancoListResponse {
  success: boolean
  data: {
    items: BancoItem[]
  }
}

interface PessoaListResponse {
  success: boolean
  data: {
    items: PessoaCadastroItem[]
  }
}

export async function listBancos(companyId: number, status = "active"): Promise<BancoItem[]> {
  const params = new URLSearchParams({ companyId: String(companyId), status })
  const response = await httpClient.get<BancoListResponse>(`/v1/bancos?${params.toString()}`)
  return response.data.items
}

export async function listPessoas(companyId: number, empresaId?: number, status = "active"): Promise<PessoaCadastroItem[]> {
  const params = new URLSearchParams({ companyId: String(companyId), status })
  if (empresaId) params.set("empresaId", String(empresaId))
  const response = await httpClient.get<PessoaListResponse>(`/v1/pessoas?${params.toString()}`)
  return response.data.items
}

export async function listContasFinanceiras(companyId: number, empresaId?: number, status?: string): Promise<ContaFinanceiraItem[]> {
  const params = new URLSearchParams({ companyId: String(companyId) })
  if (empresaId) params.set("empresaId", String(empresaId))
  if (status) params.set("status", status)
  const response = await httpClient.get<ContaFinanceiraListResponse>(`/v1/contas-financeiras?${params.toString()}`)
  return response.data.items
}

export async function createContaFinanceira(payload: {
  companyId: number
  empresaId: number
  unidadeId?: number | null
  bancoId?: number | null
  titularPessoaId?: number | null
  codigo: string
  nome: string
  tipo: string
  agencia?: string | null
  contaNumero?: string | null
  contaDigito?: string | null
  saldoInicial?: number
  dataSaldoInicial?: string | null
  permiteMovimentoNegativo?: boolean
  status?: "active" | "inactive"
}): Promise<ContaFinanceiraItem> {
  const response = await httpClient.post<ContaFinanceiraItemResponse>("/v1/contas-financeiras", payload)
  return response.data.item
}

export async function updateContaFinanceira(id: number, payload: {
  companyId: number
  empresaId: number
  unidadeId?: number | null
  bancoId?: number | null
  titularPessoaId?: number | null
  codigo: string
  nome: string
  tipo: string
  agencia?: string | null
  contaNumero?: string | null
  contaDigito?: string | null
  saldoInicial?: number
  dataSaldoInicial?: string | null
  permiteMovimentoNegativo?: boolean
  status?: "active" | "inactive"
}): Promise<ContaFinanceiraItem> {
  const response = await httpClient.put<ContaFinanceiraItemResponse>(`/v1/contas-financeiras/${id}`, payload)
  return response.data.item
}
