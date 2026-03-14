import { httpClient } from '@/lib/http-client'

export interface AuditLogEntry {
  id: number
  id_operador: number
  operador_nome: string
  operador_email: string
  action: string
  modulo: string
  entity_type: string | null
  entity_id: number | null
  descricao: string | null
  detalhes: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface AuditLogFilters {
  modulos: string[]
  operadores: { idOperador: number; operadorNome: string; operadorEmail: string }[]
  actions: string[]
}

export interface AuditLogResponse {
  data: AuditLogEntry[]
  total: number
  page: number
  limit: number
  pages: number
}

class AuditLogService {
  async getLogs(params: {
    page?: number
    limit?: number
    id_operador?: number
    action?: string
    modulo?: string
    search?: string
    date_from?: string
    date_to?: string
  } = {}): Promise<AuditLogResponse> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value))
      }
    })
    const query = searchParams.toString()
    const response = await httpClient.get<AuditLogResponse>(`/audit-logs${query ? '?' + query : ''}`)
    return response
  }

  async getFilters(): Promise<AuditLogFilters> {
    const response = await httpClient.get<AuditLogFilters>('/audit-logs/filters')
    return response
  }
}

export const auditLogService = new AuditLogService()
