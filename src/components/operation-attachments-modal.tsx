/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Operation } from "@/types/types"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  Tag,
  Clock,
  CreditCard,
  Landmark,
  FileSpreadsheet,
  Paperclip,
  Anchor,
  MapPin,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getAllShips } from "@/app/services/ship-service"
import { getAllPorts } from "@/app/services/port-service"
import type { Ship, Port } from "@/types/types"
import { format, isValid, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MultiFileUpload, LancamentoAnexosList } from "@/components/multi-file-upload"
import { uploadService, type LancamentoAnexo, type OperacaoAnexo, type MultiUploadResponse } from "@/services/upload-service"
import customToast from "@/components/ui/custom-toast"

interface OperationAttachmentsModalProps {
  isOpen: boolean
  onClose: () => void
  operation: Operation | undefined
}

export function OperationAttachmentsModal({
  isOpen,
  onClose,
  operation,
}: OperationAttachmentsModalProps) {
  const [activeTab, setActiveTab] = useState("capa")
  const [shipData, setShipData] = useState<Ship | null>(null)
  const [portData, setPortData] = useState<Port | null>(null)
  const [anexos, setAnexos] = useState<OperacaoAnexo[]>([])
  const [loadingAnexos, setLoadingAnexos] = useState(false)

  // Função para buscar anexos da operação
  const fetchAnexos = async () => {
    if (!operation?.id) return

    setLoadingAnexos(true)
    try {
      const response = await uploadService.getOperacaoAnexos(Number(operation.id))
      setAnexos(response.anexos)
    } catch (error) {
      console.error("Erro ao buscar anexos:", error)
      customToast.error("Erro ao carregar anexos")
    } finally {
      setLoadingAnexos(false)
    }
  }

  useEffect(() => {
    if (isOpen && operation) {
      console.log("🔍 Operation data received in modal:", {
        id: operation.id,
        description: operation.description,
        voyage: operation.voyage
      })
      
      const fetchRelatedData = async () => {
        try {
          // Se a operação tem navio, buscar dados do navio
          if (operation.shipId) {
            const ships = await getAllShips()
            const ship = ships.find((s) => s.id === operation.shipId)
            if (ship) {
              setShipData(ship)
            }
          }

          // Se a operação tem porto, buscar dados do porto
          if (operation.portId) {
            const ports = await getAllPorts()
            const port = ports.find((p) => p.id === operation.portId)
            if (port) {
              setPortData(port)
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados relacionados:", error)
        }
      }

      fetchRelatedData()
      fetchAnexos()
    }
  }, [isOpen, operation])

  if (!operation) return null

  // Função para formatar datas corretamente
  const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return "-"

    try {
      let date: Date

      // Handle Firestore Timestamp objects
      if (typeof dateString === "object" && dateString !== null && "seconds" in dateString) {
        // @ts-ignore - Firestore timestamp object
        date = new Date(dateString.seconds * 1000)
      } else if (dateString instanceof Date) {
        date = dateString
      } else if (typeof dateString === "string") {
        // Tentar converter string para data
        date = parseISO(dateString)
      } else {
        return "-"
      }

      // Check if date is valid
      if (!isValid(date)) {
        return "-"
      }

      // Formatar no padrão brasileiro: dd/MM/yyyy
      return format(date, "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "-"
    }
  }

  // Função para determinar o status da operação
  const getOperationStatus = () => {
    if (operation.closedAt) {
      return { status: "Encerrada", color: "bg-red-100 text-red-800 border-red-300" }
    }
    
    if (!operation.startDate) {
      return { status: "Planejada", color: "bg-blue-100 text-blue-800 border-blue-300" }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startDate = new Date(operation.startDate)
    startDate.setHours(0, 0, 0, 0)
    
    if (startDate <= today) {
      return { status: "Em Andamento", color: "bg-green-100 text-green-800 border-green-300" }
    } else {
      return { status: "Aguardando", color: "bg-yellow-100 text-yellow-800 border-yellow-300" }
    }
  }

  const operationStatus = getOperationStatus()

  // Callbacks para upload
  const handleUploadComplete = (response: MultiUploadResponse) => {
    customToast.success(`${response.total_enviados} arquivo(s) enviado(s) com sucesso!`, {
      position: "top-right"
    })
    fetchAnexos() // Recarregar lista de anexos
  }

  const handleRemoveAnexo = (anexoId: number) => {
    setAnexos(prev => prev.filter(anexo => anexo.id_arquivo !== anexoId))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden dark:bg-slate-900 dark:border-slate-700">
        <DialogHeader className="pb-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Landmark className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800">Detalhes da Operação</DialogTitle>
                <DialogDescription className="text-slate-600 mt-1">
                  Código: <span className="font-medium text-slate-800">{operation.code}</span>
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={operationStatus.color}>
                {operationStatus.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="capa" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Operacional
              </TabsTrigger>
              <TabsTrigger value="anexos" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Anexos
                {anexos.length > 0 && (
                  <span className="ml-1 bg-blue-500 text-white rounded-full text-xs px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                    {anexos.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="capa" className="space-y-6">
              {/* Seção principal com informações destacadas */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Data de Início</p>
                    <p className="text-lg font-semibold text-slate-800">{formatDate(operation.startDate)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Previsão de Término</p>
                    <p className="text-lg font-semibold text-slate-800">{formatDate(operation.endDate)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Cliente</p>
                    <p className="text-lg font-semibold text-slate-800">{operation.clientName || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Informações Básicas
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">Código da Operação</label>
                    <div className="text-slate-800 font-mono bg-slate-50 px-3 py-2 rounded-md border">{operation.code}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">Viagem</label>
                    <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">{operation.voyage || "Não informado"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">Data de Início</label>
                    <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">{formatDate(operation.startDate)}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">Previsão de Término</label>
                    <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">{formatDate(operation.endDate)}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">Unidade de Negócio</label>
                    <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">{operation.businessUnitName || "Não informado"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">Status</label>
                    <div className="flex items-center gap-2">
                      <Badge className={operationStatus.color}>
                        {operationStatus.status}
                      </Badge>
                      {operation.closedAt && (
                        <span className="text-sm text-slate-600">
                          em {formatDate(operation.closedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-600">Descrição</label>
                    <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border min-h-[80px]">{operation.description}</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="detalhes" className="space-y-6">
              {/* Informações Operacionais */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-blue-600" />
                    Informações Operacionais
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shipData && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-600">Navio</label>
                      <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border flex items-center gap-2">
                        <Anchor className="h-4 w-4 text-blue-600" />
                        {shipData.shipName}
                      </div>
                    </div>
                  )}
                  
                  {portData && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-600">Porto</label>
                      <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        {portData.name}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">Criado em</label>
                    <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">{formatDate(operation.createdAt || null)}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600">Última atualização</label>
                    <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border">{formatDate(operation.updatedAt || null)}</div>
                  </div>
                </div>
              </div>

              {/* Status da Operação */}
              <div className={`rounded-lg p-6 border-2 ${
                operation.closedAt
                  ? 'bg-red-50 border-red-200'
                  : operationStatus.status === 'Em Andamento'
                    ? 'bg-green-50 border-green-200'
                    : operationStatus.status === 'Aguardando'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Status Operacional</h3>
                    <p className="text-slate-600 mt-1">
                      {operation.closedAt
                        ? `Operação encerrada em ${formatDate(operation.closedAt)}`
                        : operationStatus.status === 'Em Andamento'
                          ? 'Operação em andamento'
                          : operationStatus.status === 'Aguardando'
                            ? `Operação iniciará em ${formatDate(operation.startDate)}`
                            : 'Operação planejada'
                      }
                    </p>
                  </div>
                  <Badge 
                    className={`${operationStatus.color} text-lg px-4 py-2`}
                  >
                    {operationStatus.status}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="anexos" className="space-y-6">
              {/* Upload de novos arquivos */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-blue-600" />
                    Adicionar Anexos
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">Faça upload de documentos relacionados a esta operação</p>
                </div>
                <div className="p-6">
                  <MultiFileUpload
                    operacaoId={Number(operation.id)}
                    onUploadComplete={handleUploadComplete}
                    maxFiles={10}
                  />
                </div>
              </div>

              {/* Lista de anexos existentes */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Anexos Existentes
                    {anexos.length > 0 && (
                      <Badge className="bg-green-100 text-green-800 border border-green-300">
                        {anexos.length} {anexos.length === 1 ? 'arquivo' : 'arquivos'}
                      </Badge>
                    )}
                  </h3>
                </div>
                <div className="p-6">
                  {loadingAnexos ? (
                    <div className="flex items-center justify-center py-12">
                      <Clock className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-3 text-slate-600">Carregando anexos...</span>
                    </div>
                  ) : anexos.length === 0 ? (
                    <div className="text-center py-12">
                      <Paperclip className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 text-lg font-medium mb-2">Nenhum anexo encontrado</p>
                      <p className="text-slate-400 text-sm">Use a seção acima para adicionar documentos</p>
                    </div>
                  ) : (
                    <LancamentoAnexosList
                      operacaoId={Number(operation.id)}
                      anexos={anexos}
                      onRemoveAnexo={handleRemoveAnexo}
                    />
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-500">
              Última atualização: {formatDate(new Date())}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="px-6">
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  // TODO: Implement print functionality
                  customToast.info('Funcionalidade de impressão em desenvolvimento', { position: 'bottom-right' })
                }}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}