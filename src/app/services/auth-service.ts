import { httpClient } from '@/lib/http-client'
import type { ModulosHabilitados, PermissoesModulo } from '@/types/permissions'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  operador: {
    id: number
    email: string
    nome: string
    roles?: string[]
    [key: string]: unknown
  }
  permissoes_modulo?: PermissoesModulo
  modulos_habilitados?: ModulosHabilitados
  expires_in: number
}

export interface User {
  id: number
  email: string
  nome: string
  roles?: string[]
  permissoes_modulo?: PermissoesModulo
  modulos_habilitados?: ModulosHabilitados
  [key: string]: unknown
}

class AuthService {
  /**
   * Realiza login na API
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>('/login', {
      email,
      password,
    })

    // Salvar token no localStorage
    if (response.token) {
      this.setToken(response.token)
    }

    // Salvar dados do usuário (operador) com permissoes
    if (response.operador) {
      const user: User = {
        ...response.operador,
        roles: response.operador.roles,
        permissoes_modulo: response.permissoes_modulo,
        modulos_habilitados: response.modulos_habilitados,
      }
      this.setUser(user)
    }

    return response
  }

  /**
   * Realiza logout
   */
  logout(): void {
    this.removeToken()
    this.removeUser()
    httpClient.removeAuthToken()
  }

  /**
   * Salva o token no localStorage e cookie
   */
  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      httpClient.setAuthToken(token)

      // Salvar também em cookie para o middleware
      document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Strict`
    }
  }

  /**
   * Obtém o token do localStorage
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  /**
   * Remove o token do localStorage e cookie
   */
  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')

      // Remover também o cookie
      document.cookie = 'auth_token=; path=/; max-age=0'
    }
  }

  /**
   * Salva os dados do usuário no localStorage
   */
  private setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user))
    }
  }

  /**
   * Obtém os dados do usuário do localStorage
   */
  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data')
      if (userData) {
        try {
          return JSON.parse(userData)
        } catch (error) {
          console.error('Error parsing user data:', error)
          return null
        }
      }
    }
    return null
  }

  /**
   * Remove os dados do usuário do localStorage
   */
  private removeUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data')
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const authService = new AuthService()
