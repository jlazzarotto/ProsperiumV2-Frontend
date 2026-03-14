import { httpClient } from '@/lib/http-client'

export interface UploadResponse {
  id_arquivo: number
  nome: string
  mime: string
  tamanho: number
  nome_fisico: string
  filepath: string
  size_formatted: string
  view_url: string
  download_url: string
}

export interface UploadAssociation {
  id_arquivo_lcto: number
  id_arquivo: number
  id_lcto: number
}

export interface UploadOperacaoAssociation {
  id_arquivo_op: number
  id_arquivo: number
  id_operacao: number
}

export interface MultiUploadResponse {
  message: string
  total_enviados: number
  total_tentativas: number
  uploads: UploadResponse[]
  associacoes: UploadAssociation[] | UploadOperacaoAssociation[]
  errors?: string[]
}

export interface LancamentoAnexo {
  id_arquivo: number
  id_arquivo_lcto: number
  nome: string
  mime: string
  tamanho: number
  nome_fisico: string
  size_formatted: string
  view_url: string
  download_url: string
  created_at: string
  tipo_documento?: string | null
  enviar_contabilidade?: boolean
}

export interface LancamentoAnexosResponse {
  id_lancamento: number
  total_anexos: number
  anexos: LancamentoAnexo[]
}

export interface OperacaoAnexo {
  id_arquivo: number
  id_arquivo_op: number
  nome: string
  mime: string
  tamanho: number
  nome_fisico: string
  size_formatted: string
  view_url: string
  download_url: string
  created_at: string
  tipo_documento?: string | null
  enviar_contabilidade?: boolean
}

export interface OperacaoAnexosResponse {
  id_operacao: number
  total_anexos: number
  anexos: OperacaoAnexo[]
}

class UploadService {
  /**
   * Upload múltiplos arquivos para um lançamento com configurações individuais
   */
  async uploadFilesToLancamento(
    lancamentoId: number, 
    filesWithConfig: Array<{file: File, documentType?: string, sendToAccounting?: boolean}>
  ): Promise<MultiUploadResponse> {
    console.log('📤 uploadFilesToLancamento chamado com:', { lancamentoId, filesCount: filesWithConfig.length })
    
    if (!lancamentoId || lancamentoId <= 0) {
      console.error('❌ lancamentoId inválido:', lancamentoId)
      throw new Error(`ID do lançamento inválido: ${lancamentoId}`)
    }
    
    const formData = new FormData()
    formData.append('id_lcto', lancamentoId.toString())
    console.log('📤 id_lcto enviado:', lancamentoId.toString())
    
    // Adicionar múltiplos arquivos com suas configurações individuais
    filesWithConfig.forEach((fileConfig, index) => {
      formData.append('arquivos[]', fileConfig.file)
      
      // Adicionar configurações individuais por arquivo usando índice
      if (fileConfig.documentType && fileConfig.documentType !== 'none') {
        formData.append(`tipos_documento[${index}]`, fileConfig.documentType)
      }
      if (fileConfig.sendToAccounting !== undefined) {
        formData.append(`enviar_contabilidade[${index}]`, fileConfig.sendToAccounting.toString())
      }
    })

    // Debug: Vamos ver exatamente o que está no FormData
    console.log('🔍 FormData contents:')
    for (let [key, value] of formData.entries()) {
      if (key === 'id_lcto') {
        console.log(`  ⭐ ${key}: "${value}" (type: ${typeof value}, length: ${value.toString().length})`)
      } else {
        console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}` : value)
      }
    }
    
    // Verificação extra do id_lcto
    const idLctoValue = formData.get('id_lcto')
    console.log('🔍 Verificação extra id_lcto:', {
      value: idLctoValue,
      type: typeof idLctoValue,
      isEmpty: !idLctoValue,
      isNull: idLctoValue === null,
      isUndefined: idLctoValue === undefined,
      toString: idLctoValue?.toString()
    })

    // Usar proxy do Next.js em vez de chamada direta
    console.log('📤 Enviando via proxy do Next.js...')
    const token = localStorage.getItem('auth_token')
    
    // Usar endpoint do proxy Next.js
    const endpoint = `/api/proxy/uploads/lancamentos`
    console.log('🔄 Usando proxy do Next.js:', endpoint)
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Não definir Content-Type para FormData - o fetch define automaticamente com boundary
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Resposta da API:', response.status, errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json() as MultiUploadResponse
    console.log('✅ Resposta da API direta:', result)
    return result
  }

  /**
   * Upload único arquivo para um lançamento (compatibilidade)
   */
  async uploadFileToLancamento(lancamentoId: number, file: File): Promise<MultiUploadResponse> {
    return this.uploadFilesToLancamento(lancamentoId, [{file, documentType: undefined, sendToAccounting: false}])
  }

  /**
   * Obter anexos de um lançamento
   */
  async getLancamentoAnexos(lancamentoId: number): Promise<LancamentoAnexosResponse> {
    try {
      const response = await httpClient.get<LancamentoAnexosResponse>(
        `/lancamentos/${lancamentoId}/anexos`
      )
      
      // Defensive programming - ensure response exists and has expected structure
      if (!response) {
        console.warn('API response is null or undefined', response)
        return {
          id_lancamento: lancamentoId,
          total_anexos: 0,
          anexos: []
        }
      }
      
      // Ensure anexos property exists
      if (!response.anexos) {
        console.warn('Response missing anexos property', response)
        return {
          id_lancamento: lancamentoId,
          total_anexos: 0,
          anexos: []
        }
      }
      
      return response
    } catch (error) {
      console.error('Error fetching lancamento anexos:', error)
      // Return empty structure to prevent crashes
      return {
        id_lancamento: lancamentoId,
        total_anexos: 0,
        anexos: []
      }
    }
  }

  /**
   * Remover anexo de um lançamento
   */
  async removeAnexoLancamento(lancamentoId: number, arquivoId: number): Promise<void> {
    await httpClient.delete(`/lancamentos/${lancamentoId}/anexos/${arquivoId}`)
  }

  /**
   * Upload múltiplos arquivos para uma operação
   */
  async uploadFilesToOperacao(
    operacaoId: number, 
    filesWithConfig: Array<{file: File, documentType?: string, sendToAccounting?: boolean}>
  ): Promise<MultiUploadResponse> {
    const formData = new FormData()
    formData.append('id_operacao', operacaoId.toString())
    
    // Adicionar múltiplos arquivos com suas configurações individuais
    filesWithConfig.forEach((fileConfig, index) => {
      formData.append('arquivos[]', fileConfig.file)
      
      // Adicionar configurações individuais por arquivo usando índice
      if (fileConfig.documentType && fileConfig.documentType !== 'none') {
        formData.append(`tipos_documento[${index}]`, fileConfig.documentType)
      }
      if (fileConfig.sendToAccounting !== undefined) {
        formData.append(`enviar_contabilidade[${index}]`, fileConfig.sendToAccounting.toString())
      }
    })

    const response = await httpClient.post<MultiUploadResponse>(
      '/uploads/operacoes', 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return response
  }

  /**
   * Upload único arquivo para uma operação (compatibilidade)
   */
  async uploadFileToOperacao(operacaoId: number, file: File): Promise<MultiUploadResponse> {
    return this.uploadFilesToOperacao(operacaoId, [{file, documentType: undefined, sendToAccounting: false}])
  }

  /**
   * Obter anexos de uma operação
   */
  async getOperacaoAnexos(operacaoId: number): Promise<OperacaoAnexosResponse> {
    try {
      const response = await httpClient.get<OperacaoAnexosResponse>(
        `/operacoes/${operacaoId}/anexos`
      )
      
      // Defensive programming - ensure response exists and has expected structure
      if (!response) {
        console.warn('API response is null or undefined', response)
        return {
          id_operacao: operacaoId,
          total_anexos: 0,
          anexos: []
        }
      }
      
      // Ensure anexos property exists
      if (!response.anexos) {
        console.warn('Response missing anexos property', response)
        return {
          id_operacao: operacaoId,
          total_anexos: 0,
          anexos: []
        }
      }
      
      return response
    } catch (error) {
      console.error('Error fetching operacao anexos:', error)
      // Return empty structure to prevent crashes
      return {
        id_operacao: operacaoId,
        total_anexos: 0,
        anexos: []
      }
    }
  }

  /**
   * Remover anexo de uma operação
   */
  async removeAnexoOperacao(operacaoId: number, arquivoId: number): Promise<void> {
    await httpClient.delete(`/operacoes/${operacaoId}/anexos/${arquivoId}`)
  }

  /**
   * Atualizar configurações de um anexo de lançamento
   */
  async updateLancamentoAnexoConfig(
    arquivoId: number,
    lancamentoId: number,
    config: {
      documentType?: string | null
      sendToAccounting?: boolean
    }
  ): Promise<void> {
    const payload: any = {}
    
    if (config.documentType !== undefined) {
      payload.tipo_documento = config.documentType === 'none' ? null : config.documentType
    }
    
    if (config.sendToAccounting !== undefined) {
      payload.enviar_contabilidade = config.sendToAccounting
    }

    await httpClient.put(`/uploads/${arquivoId}/lancamentos/${lancamentoId}/config`, payload)
  }

  /**
   * Atualizar configurações de um anexo existente (método genérico)
   */
  async updateAnexoConfig(
    arquivoId: number,
    config: {
      documentType?: string | null
      sendToAccounting?: boolean
    }
  ): Promise<void> {
    const payload: any = {}
    
    if (config.documentType !== undefined) {
      payload.tipo_documento = config.documentType === 'none' ? null : config.documentType
    }
    
    if (config.sendToAccounting !== undefined) {
      payload.enviar_contabilidade = config.sendToAccounting
    }

    await httpClient.put(`/uploads/${arquivoId}/config`, payload)
  }

  /**
   * Obter informações de um upload
   */
  async getUploadInfo(uploadId: number): Promise<UploadResponse> {
    const response = await httpClient.get<UploadResponse>(`/uploads/${uploadId}`)
    return response
  }

  /**
   * Gerar URL para visualizar arquivo
   */
  getViewUrl(uploadId: number): string {
    return `/api/view/${uploadId}`
  }

  /**
   * Gerar URL para baixar arquivo
   */
  getDownloadUrl(uploadId: number): string {
    return `/api/download/${uploadId}`
  }

  /**
   * Validar arquivos antes do upload
   */
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const allowedTypes = [
      'application/pdf',
      'image/png', 
      'image/jpeg', 
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain' // Para arquivos .txt
    ]
    const maxFileSize = 10 * 1024 * 1024 // 10MB

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`Arquivo "${file.name}": Tipo não permitido`)
      }
      
      if (file.size > maxFileSize) {
        errors.push(`Arquivo "${file.name}": Muito grande (máx 10MB)`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Formatar tamanho do arquivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Obter ícone baseado no tipo MIME
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    return '📎'
  }
}

export const uploadService = new UploadService()
