"use client"

import { useEffect } from 'react'
import customToast from '@/components/ui/custom-toast'
import { httpClient } from '@/lib/http-client'

/**
 * Hook para capturar automaticamente respostas de sucesso HTTP e exibir no toaster
 * Deve ser usado uma vez no layout principal da aplicação
 */
export const useSuccessToast = () => {
  useEffect(() => {
    // Configurar interceptador de sucesso global
    const interceptor = httpClient.getAxiosInstance().interceptors.response.use(
      (response) => {
        // Apenas para requisições POST, PUT, PATCH, DELETE com sucesso
        const method = response.config.method?.toLowerCase()
        const isModifyingRequest = ['post', 'put', 'patch', 'delete'].includes(method || '')
        
        // Não exibir toast para requisições GET (consultas)
        if (!isModifyingRequest) {
          return response
        }
        
        // Verificar se é uma requisição de login (não exibir toast)
        const isLoginRequest = response.config?.url?.includes('/login')
        if (isLoginRequest) {
          return response
        }
        
        // Mapear mensagens de sucesso baseadas no método e URL
        let successMessage = ''
        const url = response.config?.url || ''
        
        if (method === 'post') {
          if (url.includes('/agencias-bancarias') || url.includes('/bank-agencies')) {
            successMessage = 'Agência bancária cadastrada com sucesso!'
          } else if (url.includes('/portos') || url.includes('/ports')) {
            successMessage = 'Porto cadastrado com sucesso!'
          } else if (url.includes('/navios') || url.includes('/ships')) {
            successMessage = 'Navio cadastrado com sucesso!'
          } else if (url.includes('/formas-pagamento') || url.includes('/payment-methods')) {
            successMessage = 'Forma de pagamento cadastrada com sucesso!'
          } else if (url.includes('/contas-caixa') || url.includes('/cash-accounts')) {
            successMessage = 'Conta caixa cadastrada com sucesso!'
          }
          // Não exibir toast genérico - apenas para módulos específicos
        } else if (method === 'put' || method === 'patch') {
          if (url.includes('/agencias-bancarias') || url.includes('/bank-agencies')) {
            successMessage = 'Agência bancária atualizada com sucesso!'
          } else if (url.includes('/portos') || url.includes('/ports')) {
            successMessage = 'Porto atualizado com sucesso!'
          } else if (url.includes('/navios') || url.includes('/ships')) {
            successMessage = 'Navio atualizado com sucesso!'
          } else if (url.includes('/formas-pagamento') || url.includes('/payment-methods')) {
            successMessage = 'Forma de pagamento atualizada com sucesso!'
          } else if (url.includes('/contas-caixa') || url.includes('/cash-accounts')) {
            successMessage = 'Conta caixa atualizada com sucesso!'
          }
        } else if (method === 'delete') {
          if (url.includes('/agencias-bancarias') || url.includes('/bank-agencies')) {
            successMessage = 'Agência bancária excluída com sucesso!'
          } else if (url.includes('/portos') || url.includes('/ports')) {
            successMessage = 'Porto excluído com sucesso!'
          } else if (url.includes('/navios') || url.includes('/ships')) {
            successMessage = 'Navio excluído com sucesso!'
          } else if (url.includes('/formas-pagamento') || url.includes('/payment-methods')) {
            successMessage = 'Forma de pagamento excluída com sucesso!'
          } else if (url.includes('/contas-caixa') || url.includes('/cash-accounts')) {
            successMessage = 'Conta caixa excluída com sucesso!'
          }
        }
        
        if (successMessage) {
          console.log('🟢 [SUCCESS TOAST HOOK]:', successMessage, 'URL:', url, 'Method:', method)
          customToast.success(successMessage, {
            autoClose: 3000,
            position: "top-right",
          })
        }
        
        return response
      },
      (error) => {
        // Não fazer nada com erros aqui - deixar para o useErrorToast
        return Promise.reject(error)
      }
    )
    
    // Cleanup - remover interceptador quando o hook for desmontado
    return () => {
      httpClient.getAxiosInstance().interceptors.response.eject(interceptor)
    }
  }, [])
}