import { httpClient } from '@/lib/http-client'

export interface CompanyItem {
  id: number
  nome: string
  status: string
  createdAt: string
  updatedAt: string
  tenantInstance: {
    id: number
    tenancyMode: 'shared' | 'dedicated'
    databaseKey: string
    status: string
  }
}

export interface EmpresaItem {
  id: number
  companyId: number
  razaoSocial: string
  nomeFantasia: string | null
  apelido?: string | null
  abreviatura?: string | null
  cnpj?: string | null
  cpfCnpj?: string | null
  inscricaoEstadual?: string | null
  inscricaoMunicipal?: string | null
  cep?: string | null
  estado?: string | null
  cidade?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  endereco?: {
    cep?: string | null
    estado?: string | null
    cidade?: string | null
    logradouro?: string | null
    numero?: string | null
    complemento?: string | null
    bairro?: string | null
  } | null
  status: string
  [key: string]: unknown
}

export interface UnidadeItem {
  id: number
  companyId: number
  nome: string
  abreviatura: string
  status: string
}

interface ListResponse<T> {
  success: boolean
  data: {
    items: T[]
  }
}

interface ItemResponse<T> {
  success: boolean
  data: {
    item: T
  }
}

export async function getCompanies(): Promise<CompanyItem[]> {
  const response = await httpClient.get<ListResponse<CompanyItem>>('/v1/companies')
  return response.data.items
}

export async function createCompany(payload: {
  nome: string
  tenancyMode: 'shared' | 'dedicated'
  databaseKey?: string
  status?: string
}): Promise<CompanyItem> {
  const response = await httpClient.post<ItemResponse<CompanyItem>>('/v1/companies', payload)
  return response.data.item
}

export async function updateCompany(id: number, payload: {
  nome: string
  tenancyMode: 'shared' | 'dedicated'
  databaseKey?: string
  status?: string
}): Promise<CompanyItem> {
  const response = await httpClient.put<ItemResponse<CompanyItem>>(`/v1/companies/${id}`, payload)
  return response.data.item
}

export async function getEmpresas(companyId?: number): Promise<EmpresaItem[]> {
  const query = companyId ? `?companyId=${companyId}` : ''
  const response = await httpClient.get<ListResponse<EmpresaItem>>(`/v1/empresas${query}`)
  return response.data.items
}

export async function createEmpresa(payload: {
  companyId: number
  razaoSocial: string
  nomeFantasia?: string
  apelido?: string
  abreviatura?: string
  cnpj?: string
  cpfCnpj?: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  cep?: string
  estado?: string
  cidade?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  endereco?: {
    cep?: string
    estado?: string
    cidade?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
  }
  status?: string
}): Promise<EmpresaItem> {
  const response = await httpClient.post<ItemResponse<EmpresaItem>>('/v1/empresas', payload)
  return response.data.item
}

export async function updateEmpresa(id: number, payload: {
  companyId: number
  razaoSocial: string
  nomeFantasia?: string
  apelido?: string
  abreviatura?: string
  cnpj?: string
  cpfCnpj?: string
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  cep?: string
  estado?: string
  cidade?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  endereco?: {
    cep?: string
    estado?: string
    cidade?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
  }
  status?: string
}): Promise<EmpresaItem> {
  const response = await httpClient.put<ItemResponse<EmpresaItem>>(`/v1/empresas/${id}`, payload)
  return response.data.item
}

export interface TenantOption {
  key: string
  type: 'shared' | 'dedicated'
}

export async function getTenantOptions(): Promise<TenantOption[]> {
  const response = await httpClient.get<{ success: boolean; data: { items: TenantOption[] } }>('/v1/companies/tenant-options')
  return response.data.items
}

export async function getUnidades(companyId?: number): Promise<UnidadeItem[]> {
  const query = companyId ? `?companyId=${companyId}` : ''
  const response = await httpClient.get<ListResponse<UnidadeItem>>(`/v1/unidades${query}`)
  return response.data.items
}

export async function createUnidade(payload: {
  companyId: number
  nome: string
  abreviatura: string
  status?: string
}): Promise<UnidadeItem> {
  const response = await httpClient.post<ItemResponse<UnidadeItem>>('/v1/unidades', payload)
  return response.data.item
}

export async function updateUnidade(id: number, payload: {
  companyId: number
  nome: string
  abreviatura: string
  status?: string
}): Promise<UnidadeItem> {
  const response = await httpClient.put<ItemResponse<UnidadeItem>>(`/v1/unidades/${id}`, payload)
  return response.data.item
}

export interface TenantProvisionResult {
  status: 'success' | 'already_applied' | 'failure'
  message: string
  databaseKey: string
  version: string
  statementsTotal: number
  statementsExecuted: number
  errors?: Array<{ statement: number; error: string }>
}

export async function provisionTenantDatabase(databaseKey: string): Promise<TenantProvisionResult> {
  const response = await httpClient.post<{ success: boolean; data: TenantProvisionResult }>('/v1/admin/tenant-provision', { databaseKey })
  return response.data
}
