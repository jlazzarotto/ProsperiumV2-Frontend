/**
 * Exemplo de como usar o sistema de toasters centralizado
 */

import { GlobalToastHttpClient, useGlobalToast, handleResponse, handleError } from '@/lib/global-toast'

// ========== MÉTODO 1: Usando o GlobalToastHttpClient (mais simples) ==========

export const operationServiceWithToasts = {
  // GET com toaster automático de erro (sem toast de sucesso para listagem)
  async getAll() {
    return GlobalToastHttpClient.get('/operacoes', {
      showSuccess: false, // Não mostrar "sucesso" para listagem
      showErrors: true
    })
  },

  // POST com toasters automáticos
  async create(data: any) {
    return GlobalToastHttpClient.post('/operacoes', data, {
      customSuccessMessage: 'Operação criada com sucesso!',
      customErrorMessage: 'Erro ao criar operação'
    })
  },

  // PUT com toasters automáticos
  async update(id: string, data: any) {
    return GlobalToastHttpClient.put(`/operacoes/${id}`, data, {
      customSuccessMessage: 'Operação atualizada com sucesso!',
    })
  },

  // DELETE com toasters automáticos
  async delete(id: string) {
    return GlobalToastHttpClient.delete(`/operacoes/${id}`, {
      customSuccessMessage: 'Operação excluída com sucesso!',
    })
  }
}

// ========== MÉTODO 2: Usando o hook em componentes ==========

export function useOperationService() {
  const toast = useGlobalToast()
  
  return {
    async createOperation(data: any) {
      return toast.post('/operacoes', data, {
        customSuccessMessage: 'Operação criada com sucesso!'
      })
    },
    
    async updateOperation(id: string, data: any) {
      return toast.put(`/operacoes/${id}`, data)
    },
    
    // Método com controle manual dos toasters
    async customOperation(data: any) {
      try {
        const response = await toast.get('/operacoes/custom', { showSuccess: false })
        
        // Lógica customizada
        if ((response as any).some_condition) {
          toast.handleSuccess('Condição especial atendida!')
        }
        
        return response
      } catch (error) {
        // toast.handleError já foi chamado automaticamente
        // mas você pode adicionar lógica extra aqui
        console.log('Erro customizado:', error)
        throw error
      }
    }
  }
}

// ========== MÉTODO 3: Interceptando respostas manualmente ==========

export const manualToastService = {
  async processOperation(data: any) {
    try {
      const { httpClient } = await import('@/lib/http-client')
      const response = await httpClient.post('/operacoes/process', data)
      
      // Controle manual da resposta
      return handleResponse(response as any, {
        customSuccessMessage: 'Processamento concluído!',
        showErrors: true
      })
      
    } catch (error) {
      // Controle manual do erro
      return handleError(error, {
        customErrorMessage: 'Falha no processamento da operação'
      })
    }
  }
}

// ========== COMO USAR EM COMPONENTES ==========

/*
// Exemplo 1: Usando o serviço direto
const handleCreate = async () => {
  try {
    await operationServiceWithToasts.create(formData)
    // Toast de sucesso já foi mostrado automaticamente
    onClose()
    refetch()
  } catch (error) {
    // Toast de erro já foi mostrado automaticamente
    console.log('Erro capturado:', error)
  }
}

// Exemplo 2: Usando o hook
function MyComponent() {
  const operationService = useOperationService()
  
  const handleSubmit = async () => {
    try {
      await operationService.createOperation(data)
      // Sucesso/erro já tratados
    } catch (error) {
      // Apenas lógica adicional se necessário
    }
  }
}

// Exemplo 3: Casos especiais (sem toasters automáticos)
const handleSpecialCase = async () => {
  try {
    const response = await GlobalToastHttpClient.get('/data', {
      showSuccess: false,
      showErrors: false  // Desabilitar toasters automáticos
    })
    
    // Tratar resposta manualmente
    if (response.special_condition) {
      customToast.success('Caso especial tratado!')
    }
  } catch (error) {
    // Tratar erro manualmente
    customToast.error('Erro especial: ' + error.message)
  }
}
*/