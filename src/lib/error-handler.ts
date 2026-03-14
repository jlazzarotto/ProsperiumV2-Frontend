import customToast from "@/components/ui/custom-toast"

/**
 * Extrai mensagem de erro de diferentes tipos de erro
 */
export const getErrorMessage = (error: unknown): string => {
  // Verificar se é um erro HTTP com resposta detalhada
  if (error && typeof error === 'object' && 'response' in error) {
    const httpError = error as { response?: { data?: { message?: string; error?: string } } };
    
    // Verificar se há dados na resposta
    if (httpError.response && httpError.response.data) {
      const responseData = httpError.response.data;
      
      // Priorizar a mensagem específica do erro
      if (responseData.message) {
        return responseData.message;
      }
      
      // Se não houver message, verificar error
      if (responseData.error) {
        return responseData.error;
      }
      
      // Se houver details de validação, mostrar o primeiro
      // @ts-ignore
      if (responseData.details && Array.isArray(responseData.details) && responseData.details.length > 0) {
        // @ts-ignore
        return responseData.details[0].message || responseData.details[0];
      }
    }
    
    // Fallback para status text se disponível
    // @ts-ignore
    if (httpError.response && httpError.response.statusText) {
      // @ts-ignore
      return `Erro ${httpError.response.status}: ${httpError.response.statusText}`;
    }
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  
  return "Ocorreu um erro inesperado"
}

/**
 * Mostra toast de erro com mensagem apropriada
 */
export const showErrorToast = (error: unknown, fallbackMessage?: string) => {
  const message = getErrorMessage(error) || fallbackMessage || "Ocorreu um erro inesperado"
  customToast.error(message, {
    position: "bottom-right",
  })
}

/**
 * Handler padrão para catch de operações
 */
export const handleError = (error: unknown, context: string, fallbackMessage?: string) => {
  console.error(`Erro em ${context}:`, error)
  showErrorToast(error, fallbackMessage)
}