import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// Usa a rewrite estável do Next.js para encaminhar chamadas ao backend Symfony.
const API_BASE_URL = '/api/backend'

class HttpClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 120000, // Aumentar para 2 minutos para relatórios pesados
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Adicionar token de autenticação automaticamente se disponível
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }

        console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`, config.data)
        return config
      },
      (error: AxiosError) => {
        console.error('[HTTP] Request error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor - apenas para logs e autenticação
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[HTTP] Response ${response.config.url}:`, response.data)
        return response
      },
      (error: AxiosError) => {
        console.error('[HTTP] Response error:', error.response?.data || error.message)

        // Tratar apenas questões de autenticação aqui
        // Os toasts de erro serão tratados pelo useErrorToast hook
        if (error.response) {
          const status = error.response.status
          const data = error.response.data as { message?: string; error?: string; details?: unknown }
          const isLoginRequest = error.config?.url?.includes('/login')

          // Apenas tratar logout automático para 401 em requisições não-login
          if (status === 401 && !isLoginRequest && typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user_data')
            document.cookie = 'auth_token=; path=/; max-age=0'
            window.location.href = '/'
          }

          // Para erros 500 com indicação de problema de autenticação
          if (status === 500 && !isLoginRequest) {
            const errorMessage = data.message || data.error || ''
            const isAuthError = errorMessage.toLowerCase().includes('token') ||
                                errorMessage.toLowerCase().includes('autenticação') ||
                                errorMessage.toLowerCase().includes('unauthorized')

            if (isAuthError && typeof window !== 'undefined') {
              localStorage.removeItem('auth_token')
              localStorage.removeItem('user_data')
              document.cookie = 'auth_token=; path=/; max-age=0'
              window.location.href = '/'
            }
          }
        }

        // Re-throw o erro para que seja tratado pelo useErrorToast ou outros interceptadores
        return Promise.reject(error)
      }
    )
  }

  // Métodos HTTP
  async get<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  // Método para configurar o token de autenticação
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // Método para remover o token de autenticação
  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization']
  }

  // Método para acessar os interceptors (usado pelo useErrorToast)
  getAxiosInstance(): AxiosInstance {
    return this.client
  }
}

// Exportar instância única (singleton)
export const httpClient = new HttpClient()
