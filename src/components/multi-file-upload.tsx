"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  Edit,
  Save
} from "lucide-react"
import { uploadService, type MultiUploadResponse, type LancamentoAnexo, type OperacaoAnexo } from "@/services/upload-service"
import customToast from "@/components/ui/custom-toast"
import { motion, AnimatePresence } from "framer-motion"

// Tipos de documento disponíveis
export const DOCUMENT_TYPES = {
  nota_fiscal: "Nota fiscal",
  nota_debito: "Nota de débito", 
  recibo: "Recibo",
  boleto: "Boleto",
  contrato: "Contrato",
  comprovante_pagamento: "Comprovante de pagamento"
} as const

export type DocumentType = keyof typeof DOCUMENT_TYPES

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MultiFileUploadProps {
  lancamentoId?: number
  operacaoId?: number
  onUploadComplete?: (response: MultiUploadResponse) => void
  onFilesChange?: (files: File[]) => void
  onFilesConfigChange?: (files: FileWithConfig[]) => void // Nova prop para passar arquivos com configuração
  maxFiles?: number
  className?: string
  preparationMode?: boolean // Novo modo para preparação sem upload imediato
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface FileWithConfig {
  file: File
  documentType: DocumentType | "none"
  sendToAccounting: boolean
}

export function MultiFileUpload({
  lancamentoId,
  operacaoId,
  onUploadComplete,
  onFilesChange,
  onFilesConfigChange,
  maxFiles = 10,
  className = "",
  preparationMode = false
}: MultiFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithConfig[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [showAccountingConflictDialog, setShowAccountingConflictDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const accountingConflictResolverRef = useRef<((choice: "replace" | "keep" | "cancel") => void) | null>(null)

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase()
    if (type.includes('image')) return <Image className="h-4 w-4 text-blue-500" />
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    if (type.includes('excel') || type.includes('spreadsheet')) return <BarChart3 className="h-4 w-4 text-green-500" />
    if (type.includes('word') || type.includes('document')) return <FileText className="h-4 w-4 text-blue-600" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validation = uploadService.validateFiles(fileArray)
    
    if (!validation.valid) {
      validation.errors.forEach(error => {
        customToast.error(error)
      })
      return
    }

    // Verificar limite de arquivos
    const totalFiles = selectedFiles.length + fileArray.length
    if (totalFiles > maxFiles) {
      customToast.error(`Máximo de ${maxFiles} arquivos permitidos`)
      return
    }

    // Verificar duplicatas
    const newFiles = fileArray.filter(file => 
      !selectedFiles.some(existing => 
        existing.file.name === file.name && existing.file.size === file.size
      )
    )

    if (newFiles.length !== fileArray.length) {
      customToast.warning("Alguns arquivos foram ignorados (duplicatas)")
    }

    if (newFiles.length > 0) {
      // Criar FileWithConfig objects com configurações padrão
      const filesWithConfig: FileWithConfig[] = newFiles.map(file => ({
        file,
        documentType: "none",
        sendToAccounting: false
      }))
      
      const updatedFiles = [...selectedFiles, ...filesWithConfig]
      setSelectedFiles(updatedFiles)
      onFilesChange?.(updatedFiles.map(f => f.file))
      onFilesConfigChange?.(updatedFiles)
    }
  }, [selectedFiles, maxFiles, onFilesChange, onFilesConfigChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updatedFiles)
    onFilesChange?.(updatedFiles.map(f => f.file))
    onFilesConfigChange?.(updatedFiles)
  }

  const clearAll = () => {
    setSelectedFiles([])
    setUploadProgress([])
    onFilesChange?.([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const resolveAccountingConflict = (choice: "replace" | "keep" | "cancel") => {
    const resolver = accountingConflictResolverRef.current
    accountingConflictResolverRef.current = null
    setShowAccountingConflictDialog(false)
    resolver?.(choice)
  }

  const promptAccountingConflict = () =>
    new Promise<"replace" | "keep" | "cancel">((resolve) => {
      accountingConflictResolverRef.current = resolve
      setShowAccountingConflictDialog(true)
    })

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return
    
    // Validação mais rigorosa dos IDs
    if ((!lancamentoId || lancamentoId <= 0) && (!operacaoId || operacaoId <= 0)) {
      customToast.error("Não é possível fazer upload sem um lançamento ou operação válida")
      console.error("❌ Upload tentado sem ID válido:", { lancamentoId, operacaoId })
      return
    }
    
    console.log("🚀 Iniciando upload com IDs:", { lancamentoId, operacaoId })

    let filesToUpload = selectedFiles
    if (lancamentoId) {
      const hasNewAccountingFile = selectedFiles.some((file) => file.sendToAccounting)
      if (hasNewAccountingFile) {
        const response = await uploadService.getLancamentoAnexos(lancamentoId)
        const hasExistingAccountingFile = response.anexos.some((anexo) => anexo.enviar_contabilidade)

        if (hasExistingAccountingFile) {
          const choice = await promptAccountingConflict()
          if (choice === "cancel") {
            return
          }
          if (choice === "keep") {
            filesToUpload = selectedFiles.map((file) => ({
              ...file,
              sendToAccounting: false
            }))
          }
        }
      }
    }

    setUploading(true)
    setUploadProgress(
      filesToUpload.map(file => ({
        fileName: file.file.name,
        progress: 0,
        status: 'uploading'
      }))
    )

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => 
          prev.map(item => 
            item.status === 'uploading' ? {
              ...item,
              progress: Math.min(item.progress + Math.random() * 30, 90)
            } : item
          )
        )
      }, 500)

      // Preparar arquivos com configurações individuais
      const filesWithConfig = filesToUpload.map(fileConfig => ({
        file: fileConfig.file,
        documentType: fileConfig.documentType !== "none" ? fileConfig.documentType : undefined,
        sendToAccounting: fileConfig.sendToAccounting
      }))

      // Fazer upload
      let response: MultiUploadResponse
      if (lancamentoId) {
        response = await uploadService.uploadFilesToLancamento(lancamentoId, filesWithConfig)
      } else if (operacaoId) {
        response = await uploadService.uploadFilesToOperacao(operacaoId, filesWithConfig)
      } else {
        throw new Error('Deve ser fornecido lancamentoId ou operacaoId')
      }
      
      clearInterval(progressInterval)

      // Atualizar status final
      setUploadProgress(prev => {
        const newProgress = [...prev]
        
        if (response.errors && response.errors.length > 0) {
          // Marcar arquivos com erro
          response.errors.forEach(error => {
            const fileIndex = newProgress.findIndex(p => error.includes(p.fileName))
            if (fileIndex >= 0) {
              newProgress[fileIndex] = {
                ...newProgress[fileIndex],
                progress: 100,
                status: 'error',
                error
              }
            }
          })
          
          // Marcar arquivos bem-sucedidos
          newProgress.forEach((item, index) => {
            if (item.status === 'uploading') {
              newProgress[index] = {
                ...item,
                progress: 100,
                status: 'success'
              }
            }
          })
        } else {
          // Todos os arquivos foram bem-sucedidos
          return newProgress.map(item => ({
            ...item,
            progress: 100,
            status: 'success' as const
          }))
        }
        
        return newProgress
      })

      // Notificações
      if (response.total_enviados > 0) {
        customToast.success(
          `${response.total_enviados} arquivo(s) enviado(s) com sucesso!`
        )
      }

      if (response.errors && response.errors.length > 0) {
        response.errors.forEach(error => {
          customToast.error(error)
        })
      }

      onUploadComplete?.(response)

      // Limpar arquivos bem-sucedidos após 2 segundos
      setTimeout(() => {
        setSelectedFiles(prev => 
          prev.filter((_, index) => {
            const progress = uploadProgress[index]
            return progress && progress.status === 'error'
          })
        )
        setUploadProgress(prev => 
          prev.filter(item => item.status === 'error')
        )
      }, 2000)

    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      customToast.error("Erro ao fazer upload dos arquivos")
      
      // Marcar todos como erro
      setUploadProgress(prev => 
        prev.map(item => ({
          ...item,
          progress: 100,
          status: 'error',
          error: 'Erro no upload'
        }))
      )
    } finally {
      setUploading(false)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors duration-200 ${
          dragActive 
            ? "border-blue-400 bg-blue-50 dark:bg-blue-950" 
            : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
        }`}
      >
        <CardContent
          className="flex flex-col items-center justify-center py-8 px-4 text-center cursor-pointer"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            PDF, imagens, documentos Word/Excel • Máximo {maxFiles} arquivos • 10MB por arquivo
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleInputChange}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx"
          />
        </CardContent>
      </Card>


      {/* Lista de Arquivos Selecionados */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Arquivos selecionados ({selectedFiles.length})
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={uploading}
              >
                Limpar tudo
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedFiles.map((fileConfig, index) => {
                const progress = uploadProgress[index]
                const isUploading = progress?.status === 'uploading'
                const isSuccess = progress?.status === 'success'
                const isError = progress?.status === 'error'

                return (
                  <motion.div
                    key={`${fileConfig.file.name}-${fileConfig.file.size}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 rounded-md border ${
                      isError ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' :
                      isSuccess ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' :
                      'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    {/* Header do arquivo */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(fileConfig.file)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {fileConfig.file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {uploadService.formatFileSize(fileConfig.file.size)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUploading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                        {isSuccess && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {isError && <AlertCircle className="h-4 w-4 text-red-500" />}
                        
                        {!isUploading && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              removeFile(index)
                            }}
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Configurações individuais do arquivo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Tipo de documento
                        </Label>
                        <Select 
                          value={fileConfig.documentType} 
                          onValueChange={(value: DocumentType | "none") => {
                            const updatedFiles = [...selectedFiles]
                            updatedFiles[index] = { ...fileConfig, documentType: value }
                            setSelectedFiles(updatedFiles)
                            onFilesConfigChange?.(updatedFiles)
                          }}
                          disabled={uploading}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem classificação</SelectItem>
                            {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-4">
                        <Checkbox 
                          id={`send-to-accounting-${index}`}
                          checked={fileConfig.sendToAccounting}
                          onCheckedChange={(checked) => {
                            const updatedFiles = [...selectedFiles]
                            updatedFiles[index] = { ...fileConfig, sendToAccounting: checked as boolean }
                            setSelectedFiles(updatedFiles)
                            onFilesConfigChange?.(updatedFiles)
                          }}
                          disabled={uploading}
                        />
                        <Label 
                          htmlFor={`send-to-accounting-${index}`}
                          className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
                        >
                          Enviar para contabilidade
                        </Label>
                      </div>
                    </div>
                    
                    {/* Barra de progresso */}
                    {progress && (
                      <div className="mt-3">
                        {isUploading && (
                          <Progress value={progress.progress} className="h-1" />
                        )}
                        {isError && progress.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {progress.error}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedFiles.length} arquivo(s)
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Total: {uploadService.formatFileSize(
                    selectedFiles.reduce((total, fileConfig) => total + fileConfig.file.size, 0)
                  )}
                </span>
              </div>
              
              {/* Só mostrar botão de upload se não estiver em modo de preparação */}
              {!preparationMode && (
                <Button
                  type="button"
                  onClick={uploadFiles}
                  disabled={uploading || selectedFiles.length === 0 || ((!lancamentoId || lancamentoId <= 0) && (!operacaoId || operacaoId <= 0))}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar arquivo(s)
                    </>
                  )}
                </Button>
              )}
              
              {/* Mostrar mensagem informativa no modo de preparação */}
              {preparationMode && (
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Os arquivos serão enviados após salvar o lançamento
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog
        open={showAccountingConflictDialog}
        onOpenChange={(open) => {
          if (!open && accountingConflictResolverRef.current) {
            resolveAccountingConflict("cancel")
            return
          }

          setShowAccountingConflictDialog(open)
        }}
      >
        <AlertDialogContent className="sm:max-w-[560px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio para contabilidade</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe outro arquivo marcado como &quot;Enviar para contabilidade&quot;, deseja substituí-lo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => resolveAccountingConflict("cancel")}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => resolveAccountingConflict("keep")}
            >
              Não
            </Button>
            <Button
              type="button"
              onClick={() => resolveAccountingConflict("replace")}
            >
              Sim
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Componente para listar anexos existentes
interface LancamentoAnexosListProps {
  lancamentoId?: number
  operacaoId?: number
  anexos: (LancamentoAnexo | OperacaoAnexo)[]
  onRemoveAnexo?: (anexoId: number) => void
  onUpdateAnexo?: (anexoId: number, updated: LancamentoAnexo | OperacaoAnexo) => void
  onRefresh?: () => void | Promise<void>
  className?: string
}

export function LancamentoAnexosList({
  lancamentoId,
  operacaoId,
  anexos,
  onRemoveAnexo,
  onUpdateAnexo,
  onRefresh,
  className = ""
}: LancamentoAnexosListProps) {
  const [removing, setRemoving] = useState<number | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [editingAnexo, setEditingAnexo] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [anexoToDelete, setAnexoToDelete] = useState<LancamentoAnexo | OperacaoAnexo | null>(null)
  const [tempConfigs, setTempConfigs] = useState<Record<number, {documentType: DocumentType | "none", sendToAccounting: boolean}>>({})
  const [showAccountingConflictDialog, setShowAccountingConflictDialog] = useState(false)
  const accountingConflictResolverRef = useRef<((choice: "replace" | "keep" | "cancel") => void) | null>(null)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <Image className="h-4 w-4 text-blue-500" />
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <BarChart3 className="h-4 w-4 text-green-500" />
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="h-4 w-4 text-blue-600" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const handleRemoveClick = (anexo: LancamentoAnexo | OperacaoAnexo) => {
    setAnexoToDelete(anexo)
    setDeleteDialogOpen(true)
  }

  const confirmRemove = async () => {
    if (!anexoToDelete) return

    setRemoving(anexoToDelete.id_arquivo)
    try {
      if (lancamentoId) {
        await uploadService.removeAnexoLancamento(lancamentoId, anexoToDelete.id_arquivo)
      } else if (operacaoId) {
        await uploadService.removeAnexoOperacao(operacaoId, anexoToDelete.id_arquivo)
      } else {
        throw new Error('Deve ser fornecido lancamentoId ou operacaoId')
      }
      customToast.success("Anexo removido com sucesso!")
      onRemoveAnexo?.(anexoToDelete.id_arquivo)
    } catch (error) {
      console.error("Erro ao remover anexo:", error)
      customToast.error("Erro ao remover anexo")
    } finally {
      setRemoving(null)
      setDeleteDialogOpen(false)
      setAnexoToDelete(null)
    }
  }

  const resolveAccountingConflict = (choice: "replace" | "keep" | "cancel") => {
    const resolver = accountingConflictResolverRef.current
    accountingConflictResolverRef.current = null
    setShowAccountingConflictDialog(false)
    resolver?.(choice)
  }

  const promptAccountingConflict = () =>
    new Promise<"replace" | "keep" | "cancel">((resolve) => {
      accountingConflictResolverRef.current = resolve
      setShowAccountingConflictDialog(true)
    })

  const handleUpdateAnexo = async (anexo: LancamentoAnexo | OperacaoAnexo) => {
    const config = tempConfigs[anexo.id_arquivo]
    if (!config) return

    let nextConfig = config
    const hasExistingAccountingFile =
      Boolean(lancamentoId) &&
      config.sendToAccounting &&
      anexos.some((item) => item.id_arquivo !== anexo.id_arquivo && item.enviar_contabilidade)

    if (hasExistingAccountingFile) {
      const choice = await promptAccountingConflict()
      if (choice === "cancel") {
        return
      }
      if (choice === "keep") {
        nextConfig = {
          ...config,
          sendToAccounting: false,
        }
      }
    }

    setUpdating(anexo.id_arquivo)
    try {
      // Usar endpoint específico para lançamentos ou genérico para operações
      if (lancamentoId) {
        await uploadService.updateLancamentoAnexoConfig(anexo.id_arquivo, lancamentoId, {
          documentType: nextConfig.documentType === "none" ? null : nextConfig.documentType,
          sendToAccounting: nextConfig.sendToAccounting
        })
      } else {
        await uploadService.updateAnexoConfig(anexo.id_arquivo, {
          documentType: nextConfig.documentType === "none" ? null : nextConfig.documentType,
          sendToAccounting: nextConfig.sendToAccounting
        })
      }
      
      // Criar objeto atualizado
      const updatedAnexo = {
        ...anexo,
        tipo_documento: nextConfig.documentType === "none" ? null : nextConfig.documentType,
        enviar_contabilidade: nextConfig.sendToAccounting
      }
      
      customToast.success("Configurações atualizadas com sucesso!")
      onUpdateAnexo?.(anexo.id_arquivo, updatedAnexo)
      setEditingAnexo(null)
      
      // Recarregar anexos para garantir dados atualizados
      if (onRefresh) {
        await onRefresh()
      }
      
      // Limpar configuração temporária
      setTempConfigs(prev => {
        const newConfigs = { ...prev }
        delete newConfigs[anexo.id_arquivo]
        return newConfigs
      })
    } catch (error) {
      console.error("Erro ao atualizar anexo:", error)
      customToast.error("Erro ao atualizar configurações")
    } finally {
      setUpdating(null)
    }
  }

  const getTempConfig = (anexoId: number, anexo: LancamentoAnexo | OperacaoAnexo) => {
    return tempConfigs[anexoId] || {
      documentType: (anexo.tipo_documento as DocumentType) || "none",
      sendToAccounting: anexo.enviar_contabilidade || false
    }
  }

  const updateTempConfig = (anexoId: number, updates: Partial<{documentType: DocumentType | "none", sendToAccounting: boolean}>) => {
    setTempConfigs(prev => ({
      ...prev,
      [anexoId]: {
        ...getTempConfig(anexoId, anexos.find(a => a.id_arquivo === anexoId)!),
        ...updates
      }
    }))
  }

  if (anexos.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum anexo encontrado</p>
      </div>
    )
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Anexos ({anexos.length})
        </h3>
        
        {anexos.map((anexo) => {
          const isEditing = editingAnexo === anexo.id_arquivo
          const currentConfig = getTempConfig(anexo.id_arquivo, anexo)

          return (
            <motion.div
              key={anexo.id_arquivo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-md border transition-colors ${
                isEditing 
                  ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950' 
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getFileIcon(anexo.mime)}
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {anexo.nome}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{anexo.size_formatted}</span>
                    <span>•</span>
                    <span>{new Date(anexo.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Tipo de documento
                        </Label>
                        <Select 
                          value={currentConfig.documentType} 
                          onValueChange={(value: DocumentType | "none") => updateTempConfig(anexo.id_arquivo, { documentType: value })}
                          disabled={updating === anexo.id_arquivo}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem classificação</SelectItem>
                            {Object.entries(DOCUMENT_TYPES).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-4">
                        <Checkbox 
                          id={`edit-send-to-accounting-${anexo.id_arquivo}`}
                          checked={currentConfig.sendToAccounting}
                          onCheckedChange={(checked) => updateTempConfig(anexo.id_arquivo, { sendToAccounting: checked as boolean })}
                          disabled={updating === anexo.id_arquivo}
                        />
                        <Label 
                          htmlFor={`edit-send-to-accounting-${anexo.id_arquivo}`}
                          className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer"
                        >
                          Enviar para contabilidade
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-xs">
                      {anexo.tipo_documento && (
                        <Badge variant="outline" className="text-xs">
                          {DOCUMENT_TYPES[anexo.tipo_documento as DocumentType] || anexo.tipo_documento}
                        </Badge>
                      )}
                      {anexo.enviar_contabilidade && (
                        <Badge variant="secondary" className="text-xs">
                          Contabilidade
                        </Badge>
                      )}
                      {!anexo.tipo_documento && !anexo.enviar_contabilidade && (
                        <span className="text-gray-500 dark:text-gray-400">Sem configuração</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleUpdateAnexo(anexo)
                        }}
                        disabled={updating === anexo.id_arquivo}
                        title="Salvar"
                        className="text-green-600 hover:text-green-700"
                      >
                        {updating === anexo.id_arquivo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAnexo(null)
                          // Limpar configuração temporária
                          setTempConfigs(prev => {
                            const newConfigs = { ...prev }
                            delete newConfigs[anexo.id_arquivo]
                            return newConfigs
                          })
                        }}
                        disabled={updating === anexo.id_arquivo}
                        title="Cancelar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('auth_token')
                            const response = await fetch(`/api/view/${anexo.id_arquivo}`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            })
                            
                            if (response.ok) {
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              window.open(url, '_blank')
                              window.URL.revokeObjectURL(url)
                            } else {
                              customToast.error("Erro ao visualizar arquivo")
                            }
                          } catch (error) {
                            console.error("Erro ao visualizar:", error)
                            customToast.error("Erro ao visualizar arquivo")
                          }
                        }}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
              
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('auth_token')
                            const response = await fetch(`/api/download/${anexo.id_arquivo}`, {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            })
                            
                            if (response.ok) {
                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = anexo.nome
                              a.click()
                              window.URL.revokeObjectURL(url)
                            } else {
                              customToast.error("Erro ao baixar arquivo")
                            }
                          } catch (error) {
                            console.error("Erro ao baixar:", error)
                            customToast.error("Erro ao baixar arquivo")
                          }
                        }}
                        title="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAnexo(anexo.id_arquivo)
                          // Inicializar configuração temporária
                          updateTempConfig(anexo.id_arquivo, {})
                        }}
                        title="Editar configurações"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveClick(anexo)}
                        disabled={removing === anexo.id_arquivo}
                        title="Remover"
                      >
                        {removing === anexo.id_arquivo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anexo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o anexo <strong>{anexoToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showAccountingConflictDialog}
        onOpenChange={(open) => {
          if (!open && accountingConflictResolverRef.current) {
            resolveAccountingConflict("cancel")
            return
          }

          setShowAccountingConflictDialog(open)
        }}
      >
        <AlertDialogContent className="sm:max-w-[560px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio para contabilidade</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe outro arquivo marcado como &quot;Enviar para contabilidade&quot;, deseja substituí-lo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => resolveAccountingConflict("cancel")}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => resolveAccountingConflict("keep")}
            >
              Não
            </Button>
            <Button
              type="button"
              onClick={() => resolveAccountingConflict("replace")}
            >
              Sim
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
