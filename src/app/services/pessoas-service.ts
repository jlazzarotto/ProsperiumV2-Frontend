import { httpClient } from '@/lib/http-client'

export interface PessoaItem {
  id: number
  companyId: number
  tipoPessoa: 'PF' | 'PJ'
  classificacao?: string | null
  nomeRazao: string
  nomeFantasia?: string | null
  documento?: string | null
  inscricaoEstadual?: string | null
  emailPrincipal?: string | null
  telefonePrincipal?: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface PessoaEnderecoItem {
  id: number
  pessoaId: number
  tipoEndereco: string
  logradouro: string
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade: string
  uf?: string | null
  cep?: string | null
  pais: string
  principal: boolean
  createdAt: string
  updatedAt: string
}

export interface PessoaContatoItem {
  id: number
  pessoaId: number
  nomeContato: string
  cargo?: string | null
  email?: string | null
  telefone?: string | null
  principal: boolean
  createdAt: string
  updatedAt: string
}

interface ListResponse<T> {
  success: boolean
  data: { items: T[] }
}

interface ItemResponse<T> {
  success: boolean
  data: { item: T }
}

// ── Pessoas ──────────────────────────────────────────────────────────────────

export async function getPessoas(companyId: number, tipoPessoa?: string, status?: string): Promise<PessoaItem[]> {
  const params = new URLSearchParams({ companyId: String(companyId) })
  if (tipoPessoa) params.set('tipoPessoa', tipoPessoa)
  if (status) params.set('status', status)
  const response = await httpClient.get<ListResponse<PessoaItem>>(
    `/v1/pessoas?${params}`,
    { headers: { 'X-Company-Id': String(companyId) } }
  )
  return response.data.items
}

export async function getPessoa(id: number): Promise<PessoaItem> {
  const response = await httpClient.get<ItemResponse<PessoaItem>>(`/v1/pessoas/${id}`)
  return response.data.item
}

export async function createPessoa(payload: {
  companyId: number
  tipoPessoa: 'PF' | 'PJ'
  classificacao?: string | null
  nomeRazao: string
  nomeFantasia?: string | null
  documento?: string | null
  inscricaoEstadual?: string | null
  emailPrincipal?: string | null
  telefonePrincipal?: string | null
  status?: string
}): Promise<PessoaItem> {
  const response = await httpClient.post<ItemResponse<PessoaItem>>('/v1/pessoas', payload)
  return response.data.item
}

export async function updatePessoa(id: number, payload: {
  tipoPessoa: 'PF' | 'PJ'
  classificacao?: string | null
  nomeRazao: string
  nomeFantasia?: string | null
  documento?: string | null
  inscricaoEstadual?: string | null
  emailPrincipal?: string | null
  telefonePrincipal?: string | null
  status?: string
}): Promise<PessoaItem> {
  const response = await httpClient.put<ItemResponse<PessoaItem>>(`/v1/pessoas/${id}`, payload)
  return response.data.item
}

export async function deletePessoa(id: number): Promise<void> {
  await httpClient.delete(`/v1/pessoas/${id}`)
}

// ── Endereços ─────────────────────────────────────────────────────────────────

export async function getPessoaEnderecos(pessoaId: number): Promise<PessoaEnderecoItem[]> {
  const response = await httpClient.get<ListResponse<PessoaEnderecoItem>>(`/v1/pessoas/${pessoaId}/enderecos`)
  return response.data.items
}

export async function createPessoaEndereco(pessoaId: number, payload: {
  tipoEndereco: string
  logradouro: string
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade: string
  uf?: string | null
  cep?: string | null
  pais?: string
  principal?: boolean
}): Promise<PessoaEnderecoItem> {
  const response = await httpClient.post<ItemResponse<PessoaEnderecoItem>>(`/v1/pessoas/${pessoaId}/enderecos`, payload)
  return response.data.item
}

export async function updatePessoaEndereco(pessoaId: number, id: number, payload: {
  tipoEndereco: string
  logradouro: string
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade: string
  uf?: string | null
  cep?: string | null
  pais?: string
  principal?: boolean
}): Promise<PessoaEnderecoItem> {
  const response = await httpClient.put<ItemResponse<PessoaEnderecoItem>>(`/v1/pessoas/${pessoaId}/enderecos/${id}`, payload)
  return response.data.item
}

export async function deletePessoaEndereco(pessoaId: number, id: number): Promise<void> {
  await httpClient.delete(`/v1/pessoas/${pessoaId}/enderecos/${id}`)
}

// ── Contatos ─────────────────────────────────────────────────────────────────

export async function getPessoaContatos(pessoaId: number): Promise<PessoaContatoItem[]> {
  const response = await httpClient.get<ListResponse<PessoaContatoItem>>(`/v1/pessoas/${pessoaId}/contatos`)
  return response.data.items
}

export async function createPessoaContato(pessoaId: number, payload: {
  nomeContato: string
  cargo?: string | null
  email?: string | null
  telefone?: string | null
  principal?: boolean
}): Promise<PessoaContatoItem> {
  const response = await httpClient.post<ItemResponse<PessoaContatoItem>>(`/v1/pessoas/${pessoaId}/contatos`, payload)
  return response.data.item
}

export async function updatePessoaContato(pessoaId: number, id: number, payload: {
  nomeContato: string
  cargo?: string | null
  email?: string | null
  telefone?: string | null
  principal?: boolean
}): Promise<PessoaContatoItem> {
  const response = await httpClient.put<ItemResponse<PessoaContatoItem>>(`/v1/pessoas/${pessoaId}/contatos/${id}`, payload)
  return response.data.item
}

export async function deletePessoaContato(pessoaId: number, id: number): Promise<void> {
  await httpClient.delete(`/v1/pessoas/${pessoaId}/contatos/${id}`)
}
