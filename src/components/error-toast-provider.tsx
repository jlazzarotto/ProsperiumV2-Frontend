"use client"

import { useErrorToast } from '@/hooks/use-error-toast'
// import { useSuccessToast } from '@/hooks/use-success-toast'

/**
 * Componente que inicializa o sistema de toasts global (erro e sucesso)
 * Deve ser usado uma vez no layout principal da aplicação
 */
export default function ErrorToastProvider() {
  useErrorToast()
  // useSuccessToast() // DESABILITADO - toasts de sucesso manuais
  return null // Este componente não renderiza nada
}