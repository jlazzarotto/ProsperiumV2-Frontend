/**
 * Sistema centralizado de toasters para interceptar erros e sucessos da API
 */

import customToast from "@/components/ui/custom-toast"

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  debug?: string
  errors?: string[]
  success?: boolean
  status?: number
}

export interface ToastConfig {
  showSuccess?: boolean
  showErrors?: boolean
  customSuccessMessage?: string
  customErrorMessage?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  silent?: boolean // Para operações que já têm toasters próprios
}

/**
 * Intercepta resposta da API e mostra toasters automaticamente
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>, 
  config: ToastConfig = {}
): T {
  const {
    showSuccess = true,
    showErrors = true,
    customSuccessMessage,
    customErrorMessage,
    position = 'top-right',
    silent = false
  } = config

  // Se modo silent, não mostrar nenhum toast
  if (silent) {
    return response.data || response as T
  }

  // Determinar se é sucesso ou erro baseado na resposta
  const isSuccess = response.status ? 
    (response.status >= 200 && response.status < 300) :
    (!response.error && !response.errors)

  if (isSuccess && showSuccess) {
    // Mostrar toast de sucesso
    const message = customSuccessMessage || 
                   response.message || 
                   'Operação realizada com sucesso!'
    
    customToast.success(message, { position })
  }
  
  if (!isSuccess && showErrors) {
    // Mostrar toast(s) de erro
    if (customErrorMessage) {
      customToast.error(customErrorMessage, { position })
    } else if (response.error) {
      customToast.error(response.error, { position })
    } else if (response.errors && response.errors.length > 0) {
      response.errors.forEach(error => {
        customToast.error(error, { position })
      })
    } else {
      customToast.error('Erro inesperado na operação', { position })
    }
  }

  return response.data || response as T
}

/**
 * Intercepta erro de requisição/network e mostra toast
 */
export function handleApiError(
  error: any,
  config: ToastConfig = {}
): never {
  console.error('API Error:', error)

  // Erros HTTP (com response) já são tratados pelo useErrorToast global (ErrorToastProvider no layout).
  // Apenas mostrar toast para erros de rede/conectividade (sem response).
  if (!error?.response) {
    const { customErrorMessage, position = 'top-right' } = config
    let errorMessage = customErrorMessage || 'Erro de conexão com o servidor'
    if (error?.message) errorMessage = error.message
    customToast.error(errorMessage, { position })
  }

  throw error
}

/**
 * Classe para ser usada como wrapper do httpClient
 */
export class GlobalToastHttpClient {
  
  /**
   * Faz uma requisição GET com toasters automáticos
   */
  static async get<T>(
    url: string, 
    toastConfig?: ToastConfig
  ): Promise<T> {
    try {
      const { httpClient } = await import('@/lib/http-client')
      const response = await httpClient.get<ApiResponse<T>>(url)
      return handleApiResponse(response, toastConfig)
    } catch (error) {
      return handleApiError(error, toastConfig)
    }
  }

  /**
   * Faz uma requisição POST com toasters automáticos
   */
  static async post<T>(
    url: string,
    data?: any,
    toastConfig?: ToastConfig
  ): Promise<T> {
    try {
      const { httpClient } = await import('@/lib/http-client')
      const response = await httpClient.post<ApiResponse<T>>(url, data)
      return handleApiResponse(response, toastConfig)
    } catch (error) {
      return handleApiError(error, toastConfig)
    }
  }

  /**
   * Faz uma requisição PUT com toasters automáticos
   */
  static async put<T>(
    url: string,
    data?: any,
    toastConfig?: ToastConfig
  ): Promise<T> {
    try {
      const { httpClient } = await import('@/lib/http-client')
      const response = await httpClient.put<ApiResponse<T>>(url, data)
      return handleApiResponse(response, toastConfig)
    } catch (error) {
      return handleApiError(error, toastConfig)
    }
  }

  /**
   * Faz uma requisição DELETE com toasters automáticos
   */
  static async delete<T>(
    url: string,
    toastConfig?: ToastConfig
  ): Promise<T> {
    try {
      const { httpClient } = await import('@/lib/http-client')
      const response = await httpClient.delete<ApiResponse<T>>(url)
      return handleApiResponse(response, toastConfig)
    } catch (error) {
      return handleApiError(error, toastConfig)
    }
  }
}

/**
 * Hook para usar o cliente com toasters
 */
export function useGlobalToast() {
  return {
    get: GlobalToastHttpClient.get,
    post: GlobalToastHttpClient.post,
    put: GlobalToastHttpClient.put,
    delete: GlobalToastHttpClient.delete,
    
    // Helpers para casos específicos
    handleSuccess: (message: string) => customToast.success(message),
    handleError: (error: any) => handleApiError(error),
    handleResponse: <T>(response: ApiResponse<T>, config?: ToastConfig) => 
      handleApiResponse(response, config)
  }
}

// Export das funções principais para uso direto
export { handleApiResponse as handleResponse, handleApiError as handleError }