import { httpClient } from '@/lib/http-client'

/**
 * Interfaces para Upload
 */
export interface Upload {
  id_arquivo: number
  nome: string
  mime: string
  tamanho: number
  nome_fisico: string
  filepath?: string
  id_operador: number
  created_at: string
  updated_at: string
  status: number
}

export interface UploadLancamento {
  id_arquivo_lcto: number
  id_arquivo: number
  id_lcto: number
  id_operador: number
  created_at: string
  updated_at: string
  status: number
}

export interface UploadWithDetails extends Upload {
  size_formatted: string
  view_url: string
  download_url: string
}

/**
 * Faz upload de um arquivo e associa a um lançamento
 */
export const uploadArquivoLancamento = async (
  lancamentoId: number,
  file: File
): Promise<{ 
  message: string
  upload: Upload
  associacao: UploadLancamento
}> => {
  try {
    const formData = new FormData()
    formData.append('arquivo', file)
    formData.append('id_lcto', lancamentoId.toString())

    const response = await httpClient.post<{
      message: string
      upload: Upload
      associacao: UploadLancamento
    }>('/uploads/lancamentos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response
  } catch (error) {
    console.error('❌ Erro ao fazer upload do arquivo:', error)
    throw error
  }
}

/**
 * Lista anexos de um lançamento específico
 */
export const getAnexosLancamento = async (
  lancamentoId: number
): Promise<{
  id_lancamento: number
  total_anexos: number
  anexos: UploadWithDetails[]
}> => {
  try {
    const response = await httpClient.get<{
      id_lancamento: number
      total_anexos: number
      anexos: UploadWithDetails[]
    }>(`/lancamentos/${lancamentoId}/anexos`)

    return response
  } catch (error) {
    console.error('❌ Erro ao buscar anexos:', error)
    throw error
  }
}

/**
 * Remove a associação de um arquivo com um lançamento
 */
export const removeAnexoLancamento = async (
  lancamentoId: number,
  arquivoId: number
): Promise<{ message: string }> => {
  try {
    const response = await httpClient.delete<{ message: string }>(
      `/lancamentos/${lancamentoId}/anexos/${arquivoId}`
    )
    return response
  } catch (error) {
    console.error('❌ Erro ao remover anexo:', error)
    throw error
  }
}

/**
 * Deleta permanentemente um arquivo (se não estiver sendo usado)
 */
export const deleteUpload = async (
  arquivoId: number
): Promise<{ message: string }> => {
  try {
    const response = await httpClient.delete<{ message: string }>(
      `/uploads/${arquivoId}`
    )
    return response
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error)
    throw error
  }
}

/**
 * Busca informações de um arquivo específico
 */
export const getUploadInfo = async (
  arquivoId: number
): Promise<UploadWithDetails> => {
  try {
    const response = await httpClient.get<UploadWithDetails>(
      `/uploads/${arquivoId}`
    )
    return response
  } catch (error) {
    console.error('❌ Erro ao buscar informações do arquivo:', error)
    throw error
  }
}

/**
 * Lista todos os uploads de um usuário
 */
export const getUserUploads = async (
  operadorId: number,
  page: number = 1,
  limit: number = 50
): Promise<{
  uploads: UploadWithDetails[]
  total: number
  page: number
  limit: number
}> => {
  try {
    const response = await httpClient.get<{
      uploads: UploadWithDetails[]
      total: number
      page: number
      limit: number
    }>(`/uploads?id_operador=${operadorId}&page=${page}&limit=${limit}`)

    return response
  } catch (error) {
    console.error('❌ Erro ao buscar uploads do usuário:', error)
    throw error
  }
}

/**
 * Gera URL para visualizar/baixar arquivo
 */
export const generateFileUrl = (arquivoId: number, action: 'view' | 'download' = 'view'): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  return `${baseUrl}/uploads/${arquivoId}/${action}`
}

/**
 * Formata tamanho do arquivo
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Valida tipo de arquivo
 */
export const validateFileType = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'image/png', 
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  
  return allowedTypes.includes(file.type)
}

/**
 * Valida tamanho do arquivo (máximo 10MB)
 */
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxBytes
}