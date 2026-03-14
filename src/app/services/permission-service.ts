import { httpClient } from '@/lib/http-client'
import type { OperadorWithPermissions, PermissoesModulo } from '@/types/permissions'

class PermissionService {
  async getOperadores(): Promise<OperadorWithPermissions[]> {
    const response = await httpClient.get<{ data: OperadorWithPermissions[] }>('/operadores')
    return response.data
  }

  async getOperadorPermissoes(id: number): Promise<PermissoesModulo> {
    const response = await httpClient.get<{ data: PermissoesModulo }>(`/permissoes-modulo/operador/${id}`)
    return response.data
  }

  async saveOperadorPermissoes(id: number, permissoes: PermissoesModulo): Promise<void> {
    const permArray = Object.entries(permissoes).map(([modulo, perm]) => ({
      modulo,
      ver: perm.ver,
      criar_editar: perm.criar_editar,
      deletar: perm.deletar,
    }))

    await httpClient.put(`/permissoes-modulo/operador/${id}`, { permissoes: permArray })
  }

  async saveTodasPermissoes(id: number, conceder: boolean): Promise<void> {
    await httpClient.put(`/permissoes-modulo/operador/${id}`, { todas_permissoes: conceder })
  }

  async createInvite(data: {
    email: string
    nome: string
    permissoes?: PermissoesModulo
    todas_permissoes?: boolean
  }): Promise<{ token: string; id_operador: number }> {
    const body: Record<string, unknown> = {
      email: data.email,
      nome: data.nome,
    }

    if (data.todas_permissoes) {
      body.todas_permissoes = true
      body.permissoes = []
    } else if (data.permissoes) {
      body.permissoes = Object.entries(data.permissoes).map(([modulo, perm]) => ({
        modulo,
        ver: perm.ver,
        criar_editar: perm.criar_editar,
        deletar: perm.deletar,
      }))
    }

    const response = await httpClient.post<{ convite: { token: string; id_operador: number } }>('/convites', body)
    return response.convite
  }

  async resendInvite(id: number): Promise<void> {
    await httpClient.post(`/convites/${id}/reenviar`, {})
  }

  async cancelInvite(id: number): Promise<void> {
    await httpClient.delete(`/convites/${id}`)
  }

  async toggleOperadorStatus(id: number, status: boolean): Promise<void> {
    await httpClient.patch(`/operadores/${id}/status`, { status })
  }

  async deleteOperador(id: number): Promise<void> {
    await httpClient.delete(`/operadores/${id}`)
  }

  async validateToken(token: string): Promise<{ valid: boolean; email?: string; nome?: string; reason?: string }> {
    const response = await httpClient.get<{ valid: boolean; email?: string; nome?: string; reason?: string }>(
      `/convites/validar/${token}`
    )
    return response
  }

  async setPassword(token: string, password: string): Promise<{ email: string }> {
    const response = await httpClient.post<{ operador: { email: string } }>('/convites/ativar', { token, password })
    return { email: response.operador.email }
  }
}

export const permissionService = new PermissionService()
