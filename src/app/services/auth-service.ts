import { httpClient } from '@/lib/http-client'
import type { NavigationCategory } from '@/types/navigation'
import type { ModulosHabilitados, PermissoesModulo } from '@/types/permissions'

export interface LoginRequest {
  email: string
  password: string
}

interface JwtLoginResponse {
  token: string
}

export interface User {
  id: number
  email: string
  nome: string
  role: string
  roles: string[]
  status?: string
  companyIds?: number[]
  empresaIds?: number[]
  unidadeIds?: number[]
  profileCodes?: string[]
  permissoes_modulo?: PermissoesModulo
  modulos_habilitados?: ModulosHabilitados
  menu?: NavigationCategory[]
  [key: string]: unknown
}

interface MeResponse {
  success: boolean
  data: {
    item: {
      id: number
      nome: string
      email: string
      role: string
      status: string
      companyIds: number[]
      empresaIds: number[]
      unidadeIds: number[]
      profileCodes: string[]
      modulos_habilitados?: ModulosHabilitados
      permissoes_modulo?: PermissoesModulo
      menu?: NavigationCategory[]
    }
  }
}

export interface LoginResponse {
  token: string
  user: User
}

class AuthService {
  /**
   * Realiza login na API
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await httpClient.post<JwtLoginResponse>('/v1/auth/login', {
      email,
      password,
    })

    if (response.token) {
      this.setToken(response.token)
    }

    const user = await this.fetchCurrentUser()
    this.setUser(user)

    return {
      token: response.token,
      user,
    }
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

  async fetchCurrentUser(): Promise<User> {
    const response = await httpClient.get<MeResponse>('/v1/me')
    const item = response.data.item

    return {
      ...item,
      roles: [item.role, 'ROLE_USER'],
    }
  }
}

export const authService = new AuthService()
