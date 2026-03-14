"use client"

import { useEffect } from 'react'
import customToast from '@/components/ui/custom-toast'
import { httpClient } from '@/lib/http-client'

/**
 * Hook para capturar automaticamente erros HTTP e exibir no toaster
 * Deve ser usado uma vez no layout principal da aplicação
 */
export const useErrorToast = () => {
  useEffect(() => {
    // Configurar interceptador de erro global
    const interceptor = httpClient.getAxiosInstance().interceptors.response.use(
      (response) => response, // Não fazer nada com respostas de sucesso
      (error) => {
        // Não exibir toast se a requisição foi bem-sucedida (status 2xx)
        if (error.response?.status >= 200 && error.response?.status < 300) {
          return Promise.reject(error)
        }
        // Capturar apenas erros HTTP
        if (error.response) {
          const status = error.response.status
          const data = error.response.data as { 
            message?: string 
            error?: string 
            details?: unknown 
            debug?: string
          }
          
          // Não exibir toast para erros de autenticação/login que já são tratados
          const isLoginRequest = error.config?.url?.includes('/login')
          
          // Montar mensagem de erro baseada na estrutura do backend
          let errorMessage = ''
          
          // Priorizar a propriedade 'message' do backend (mais detalhada), depois 'error'
          if (data.message) {
            errorMessage = data.message
          } else if (data.error) {
            errorMessage = data.error
          }
          
          // Se houver detalhes de validação, incluir na mensagem
          if (data.details && typeof data.details === 'object') {
            const fieldErrors = Object.entries(data.details)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ')
            errorMessage = errorMessage ? `${errorMessage} - ${fieldErrors}` : `Dados inválidos: ${fieldErrors}`
          }
          
          // Se em desenvolvimento e houver debug info, adicionar
          if (process.env.NODE_ENV === 'development' && data.debug) {
            errorMessage += ` (Debug: ${data.debug})`
          }
          
          // Fallback para mensagens genéricas baseadas no status
          if (!errorMessage) {
            switch (status) {
              case 400:
                errorMessage = 'Requisição inválida'
                break
              case 401:
                errorMessage = isLoginRequest ? 'Email ou senha inválidos' : 'Não autorizado'
                break
              case 403:
                errorMessage = 'Acesso negado'
                break
              case 404:
                errorMessage = 'Recurso não encontrado'
                break
              case 409:
                errorMessage = 'Conflito - registro já existe'
                break
              case 422:
                errorMessage = 'Dados inválidos'
                break
              case 500:
                errorMessage = 'Erro interno do servidor'
                break
              default:
                errorMessage = 'Ocorreu um erro inesperado'
            }
          }
          
          // Exibir toast de erro apenas se não for requisição de login
          // (para evitar duplicar mensagens que já são tratadas na UI de login)
          if (!isLoginRequest) {
            customToast.error(errorMessage, {
              autoClose: status >= 500 ? 8000 : 5000, // Erros de servidor ficam mais tempo
              closeOnClick: true,
              pauseOnHover: true,
              position: "top-right", // Força posição para evitar conflitos
            })
          }
        } else if (error.request) {
          // Erro de conectividade
          customToast.error('Não foi possível conectar ao servidor. Verifique sua conexão.', {
            autoClose: 8000,
            closeOnClick: true,
            pauseOnHover: true,
            position: "top-right",
          })
        } else {
          // Erro de configuração da requisição
          customToast.error('Erro ao processar a requisição', {
            autoClose: 5000,
            closeOnClick: true,
            pauseOnHover: true,
            position: "top-right",
          })
        }
        
        // Re-throw o erro para que outros interceptadores ou catch blocks possam tratá-lo
        return Promise.reject(error)
      }
    )
    
    // Cleanup - remover interceptador quando o hook for desmontado
    return () => {
      httpClient.getAxiosInstance().interceptors.response.eject(interceptor)
    }
  }, [])
}