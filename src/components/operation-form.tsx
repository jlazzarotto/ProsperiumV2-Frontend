/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Anchor, Ship as ShipIcon, Users, Calendar, Package, Paperclip } from "lucide-react"
import { createOperation, updateOperation, operationServiceWithToasts } from "@/app/services/operation-service"
import { getActiveShips } from "@/app/services/ship-service"
import { getActivePorts } from "@/app/services/port-service"
import { getTipo8BusinessUnits, getClientesVinculadosUnidade } from "@/services/business-unit-service"
import { TripleSelector } from "@/components/ui/triple-selector"
import type { Operation, Ship, Port } from "@/types/types"
import customToast from "@/components/ui/custom-toast"
import { format } from "date-fns"
import { MultiFileUpload } from "@/components/multi-file-upload"
import { uploadService, type MultiUploadResponse } from "@/services/upload-service"

interface OperationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  operation?: Operation
  title: string
}

export function OperationModal({ isOpen, onClose, onSave, operation, title }: OperationModalProps) {
  const [loading, setLoading] = useState(false)
  const [ships, setShips] = useState<Ship[]>([])
  const [ports, setPorts] = useState<Port[]>([])
  const [formState, setFormState] = useState<Partial<Operation> & { empresaId: string }>({
    code: "",
    voyage: "",
    shipId: "",
    shipName: "",
    portId: "",
    portName: "",
    clientId: "",
    clientName: "",
    businessUnitId: "",
    businessUnitName: "",
    empresaId: "",
    startDate: undefined,
    endDate: undefined,
    tons: 0,
    description: "",
    status: 1, // 1 = ativo, 0 = inativo
  })
  const [tonsInput, setTonnageInput] = useState("0,0000")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const tonsInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadShips()
      loadPorts()

      if (operation) {
        setFormState({
          code: operation.code || "",
          voyage: operation.voyage || "",
          shipId: operation.shipId || "",
          shipName: operation.shipName || "",
          portId: operation.portId || "",
          portName: operation.portName || "",
          clientId: operation.clientId || "",
          clientName: operation.clientName || "",
          businessUnitId: operation.businessUnitId || "",
          businessUnitName: operation.businessUnitName || "",
          clientBusinessUnitId: operation.clientBusinessUnitId || "",
          empresaId: "",
          startDate: operation.startDate || null,
          endDate: operation.endDate || null,
          tons: operation.tons || 0,
          description: operation.description || "",
          status: operation.status ?? 1,
        })

        setTonnageInput(formatTonnageDisplay(operation.tons?.toString() || "0"))

        // Reverse lookup: find which empresa this client belongs to
        if (operation.clientId) {
          findEmpresaForCliente(operation.clientId).then(empresaId => {
            if (empresaId) setFormState(prev => ({ ...prev, empresaId }))
          })
        }
      } else {
        const randomCode = `OP${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`
        setAttachments([])
        setFormState({
          code: randomCode,
          voyage: "",
          shipId: "",
          shipName: "",
          portId: "",
          portName: "",
          clientId: "",
          clientName: "",
          businessUnitId: "",
          businessUnitName: "",
          empresaId: "",
          startDate: undefined,
          endDate: undefined,
          tons: 0,
          description: "",
          status: 1,
        })

        setTonnageInput("0,0000")
      }

      setValidationErrors({})
    }
  }, [isOpen, operation])

  const loadShips = async () => {
    try {
      const data = await getActiveShips()
      setShips(data)
    } catch (error) {
      console.error("Error loading ships:", error)
      customToast.error("Erro ao carregar navios")
    }
  }

  const loadPorts = async () => {
    try {
      const data = await getActivePorts()
      setPorts(data)
    } catch (error) {
      console.error("Error loading ports:", error)
      customToast.error("Erro ao carregar portos")
    }
  }

  const findEmpresaForCliente = async (clientId: string): Promise<string> => {
    if (!clientId) return ""
    try {
      const empresas = await getTipo8BusinessUnits()
      const results = await Promise.all(
        empresas.map(async (empresa) => {
          const empresaIdStr = empresa.id_pessoa?.toString() || String(empresa.id)
          const clientes = await getClientesVinculadosUnidade(empresaIdStr)
          return clientes.some(c => c.id?.toString() === clientId) ? empresaIdStr : null
        })
      )
      return results.find(r => r !== null) || ""
    } catch {
      return ""
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }))

    // Limpar erro de validação quando o campo é preenchido
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleUploadComplete = (response: MultiUploadResponse) => {
    // Toast já exibido pelo MultiFileUpload - sem duplicação
    console.log('Upload concluído:', response)
  }

  const handleShipChange = (shipId: string) => {
    const selectedShip = ships.find((ship) => ship.id === shipId)
    if (selectedShip) {
      setFormState((prev) => ({
        ...prev,
        shipId,
        shipName: selectedShip.shipName,
      }))

      // Limpar erro de validação
      if (validationErrors.shipId) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.shipId
          return newErrors
        })
      }
    }
  }

  const handlePortChange = (portId: string) => {
    const selectedPort = ports.find((port) => port.id === portId)
    if (selectedPort) {
      setFormState((prev) => ({
        ...prev,
        portId,
        portName: selectedPort.name,
      }))

      // Limpar erro de validação
      if (validationErrors.portId) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.portId
          return newErrors
        })
      }
    }
  }


  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formState.voyage) {
      errors.voyage = "O campo Viagem é obrigatório"
    }

    if (!formState.shipId) {
      errors.shipId = "É necessário selecionar um Navio"
    }

    if (!formState.portId) {
      errors.portId = "É necessário selecionar um Porto"
    }

    if (!formState.clientId) {
      errors.clientId = "É necessário selecionar um Cliente"
    }

    if (!formState.businessUnitId) {
      errors.businessUnitId = "É necessário selecionar uma Unidade de Negócio"
    }

    // Validar datas
    if (formState.startDate && formState.endDate) {
      const startDate = new Date(formState.startDate)
      const endDate = new Date(formState.endDate)

      if (endDate < startDate) {
        errors.endDate = "A data de término não pode ser anterior à data de início"
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      // Mostrar mensagem de erro com o primeiro erro encontrado
      const firstError = Object.values(validationErrors)[0]
      customToast.error(firstError)
      return
    }

    // Converter o valor de toneladas para número antes de salvar
    const numericTonnage = Number.parseFloat(tonsInput.replace(/\./g, "").replace(",", ".")) || 0

    const dataToSave = {
      ...formState,
      tons: numericTonnage,
      status: formState.status === 1 || formState.status === true ? 1 : 0,
      endDate: formState.endDate || null,
    }

    console.log('[handleSave] Dados a enviar:', dataToSave)

    setLoading(true)
    try {
      let operationId: string | undefined
      
      if (operation?.id) {
        // Atualização com toast automático
        await operationServiceWithToasts.update(operation.id, dataToSave)
        operationId = operation.id
      } else {
        // Criação com toast automático ou manual baseado em anexos
        if (attachments.length > 0) {
          // Se tem anexos, usar serviço sem toast para controlar mensagem final
          const createResponse = await createOperation(dataToSave as Omit<Operation, "id">)
          console.log("📋 Response da criação:", createResponse)
          operationId = String((createResponse as any).id)
        } else {
          // Sem anexos, usar serviço com toast automático
          const createResponse = await operationServiceWithToasts.create(dataToSave)
          operationId = String((createResponse as any).id)
        }
      }

      // Upload dos anexos se existirem (apenas para novas operações)
      if (!operation?.id && attachments.length > 0 && operationId) {
        setUploading(true)
        try {
          console.log(`🚀 Iniciando upload de ${attachments.length} arquivo(s) para operação ${operationId}`)
          
          const uploadResponse = await uploadService.uploadFilesToOperacao(
            Number(operationId), 
            attachments.map(file => ({file, documentType: undefined, sendToAccounting: false}))
          )
          
          console.log("✅ Resposta do upload:", uploadResponse)
          
          if (uploadResponse.total_enviados > 0) {
            customToast.success(
              `Operação criada! ${uploadResponse.total_enviados} arquivo(s) enviado(s) com sucesso!`
            )
          } else {
            customToast.warning("Operação criada, mas nenhum arquivo foi enviado")
          }
          
          if (uploadResponse.errors && uploadResponse.errors.length > 0) {
            uploadResponse.errors.forEach(error => {
              customToast.error(error)
            })
          }
        } catch (uploadError) {
          console.error("❌ Erro ao fazer upload dos anexos:", uploadError)
          customToast.error("Operação criada, mas houve erro no upload dos anexos")
        } finally {
          setUploading(false)
        }
      }
      
      onSave()
      onClose()
    } catch (error: any) {
      console.error("Error saving operation:", error)
      // Erro já tratado pelos toasters automáticos quando aplicável
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (date: Date | null | undefined) => {
    if (!date) return ""
    return format(new Date(date), "yyyy-MM-dd")
  }

  // Função para formatar o valor de toneladas para exibição
  const formatTonnageDisplay = (value: string | number) => {
    let number: number
    if (typeof value === 'number') {
      // Já é número — usar diretamente
      number = value
    } else {
      const str = value.toString().trim()
      if (str.includes(',')) {
        // Formato PT-BR: "1.234,5678" — remove separadores de milhar (.) e converte vírgula → ponto
        number = Number.parseFloat(str.replace(/\./g, '').replace(',', '.'))
      } else {
        // Formato API/EN: "1234.5678" — o ponto já é decimal
        number = Number.parseFloat(str)
      }
    }

    if (isNaN(number)) return "0,0000"

    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
      useGrouping: true,
    })
  }

  // Simplificar a função handleTonnageChange
  const handleTonnageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Permitir apenas números, vírgula e ponto
    const filtered = inputValue.replace(/[^\d.,]/g, "")

    // Permitir apenas uma vírgula ou ponto
    const parts = filtered.split(/[,.]/)
    if (parts.length > 2) {
      return // Não permitir mais de um separador decimal
    }

    // Atualizar o valor do input
    setTonnageInput(filtered)

    // Converter para número para armazenar no estado
    const normalized = filtered.replace(/\./g, "").replace(",", ".")
    const numericValue = Number.parseFloat(normalized) || 0
    handleInputChange("tons", numericValue)
  }

  // Limpar o campo ao receber foco para facilitar a digitação
  const handleTonnageFocus = () => {
    setTonnageInput("")
  }

  // Formatar o valor ao perder o foco
  const handleTonnageBlur = () => {
    if (!tonsInput.trim()) {
      setTonnageInput("0,0000")
      handleInputChange("tons", 0)
    } else {
      const formattedValue = formatTonnageDisplay(tonsInput)
      setTonnageInput(formattedValue)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
        <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Anchor className="h-6 w-6 text-white" />
            </div>
            <span className="text-blue-900 dark:text-blue-100">{title}</span>
          </DialogTitle>
          <DialogDescription className="text-blue-700 dark:text-blue-300">
            Preencha os dados da operação. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6 py-6">
            {/* Card de Identificação */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                Identificação
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="code" className="text-blue-800 dark:text-blue-200 font-medium">
                    Código
                  </Label>
                  <Input
                    id="code"
                    value={formState.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    disabled
                    className="border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="voyage" className="text-blue-800 dark:text-blue-200 font-medium">
                    Viagem *
                  </Label>
                  <Input
                    id="voyage"
                    value={formState.voyage}
                    onChange={(e) => handleInputChange("voyage", e.target.value)}
                    className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.voyage ? "border-red-500" : ""}`}
                  />
                  {validationErrors.voyage && <p className="text-xs text-red-500">{validationErrors.voyage}</p>}
                </div>
              </div>
            </div>

            {/* Card de Navio e Porto */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <ShipIcon className="h-5 w-5 text-blue-600" />
                Navio e Porto
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="ship" className="text-blue-800 dark:text-blue-200 font-medium">
                    Navio *
                  </Label>
                  <Select value={formState.shipId} onValueChange={handleShipChange}>
                    <SelectTrigger className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.shipId ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Selecione o navio" />
                    </SelectTrigger>
                    <SelectContent>
                      {ships.map((ship) => (
                        <SelectItem key={ship.id} value={ship.id || ""}>
                          {ship.shipName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.shipId && <p className="text-xs text-red-500">{validationErrors.shipId}</p>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="port" className="text-blue-800 dark:text-blue-200 font-medium">
                    Porto *
                  </Label>
                  <Select value={formState.portId} onValueChange={handlePortChange}>
                    <SelectTrigger className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.portId ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Selecione o porto" />
                    </SelectTrigger>
                    <SelectContent>
                      {ports.map((port) => (
                        <SelectItem key={port.id} value={port.id || ""}>
                          {port.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.portId && <p className="text-xs text-red-500">{validationErrors.portId}</p>}
                </div>
              </div>
            </div>

            {/* Card de Empresa, Unidade e Cliente */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Empresa, Unidade e Cliente
              </h3>
              <TripleSelector
                key={formState.empresaId || 'no-empresa'}
                selectedBusinessUnitId={formState.empresaId || ""}
                selectedUnitId={formState.businessUnitId || ""}
                selectedPersonId={formState.clientId || ""}
                allowReverseLoading={true}
                onBusinessUnitChange={(id) => setFormState(prev => ({ ...prev, empresaId: id }))}
                onUnitChange={(id, unit) => {
                  setFormState(prev => ({
                    ...prev,
                    businessUnitId: id,
                    businessUnitName: unit?.name || "",
                  }))
                  if (validationErrors.businessUnitId) {
                    setValidationErrors(prev => { const e = { ...prev }; delete e.businessUnitId; return e })
                  }
                }}
                onPersonChange={(id, person) => {
                  setFormState(prev => ({
                    ...prev,
                    clientId: id,
                    clientName: (person as any)?.nome || (person as any)?.name || "",
                  }))
                  if (validationErrors.clientId) {
                    setValidationErrors(prev => { const e = { ...prev }; delete e.clientId; return e })
                  }
                }}
                required={true}
                personLabel="Cliente"
                showFullInfo={true}
                label="Empresa, Unidade e Cliente"
              />
              {(validationErrors.clientId || validationErrors.businessUnitId) && (
                <p className="text-xs text-red-500 mt-2">
                  {validationErrors.clientId || validationErrors.businessUnitId}
                </p>
              )}
            </div>

            {/* Card de Período e Carga */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Período e Carga
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="startDate" className="text-blue-800 dark:text-blue-200 font-medium">
                    Início da operação
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formatDateForInput(formState.startDate)}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value + "T00:00:00") : null
                      handleInputChange("startDate", date)
                    }}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="endDate" className="text-blue-800 dark:text-blue-200 font-medium">
                    Término da operação
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formatDateForInput(formState.endDate)}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value + "T00:00:00") : null
                      handleInputChange("endDate", date)
                    }}
                    className={`border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500 ${validationErrors.endDate ? "border-red-500" : ""}`}
                  />
                  {validationErrors.endDate && <p className="text-xs text-red-500">{validationErrors.endDate}</p>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="tons" className="text-blue-800 dark:text-blue-200 font-medium">
                    Toneladas
                  </Label>
                  <Input
                    id="tons"
                    ref={tonsInputRef}
                    value={tonsInput}
                    onChange={handleTonnageChange}
                    onFocus={handleTonnageFocus}
                    onBlur={handleTonnageBlur}
                    className="font-mono border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400">Formato: 0,0000</p>
                </div>
              </div>
            </div>

            {/* Card de Descrição */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Descrição e Status
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="description" className="text-blue-800 dark:text-blue-200 font-medium">
                    Detalhes da operação
                  </Label>
                  <Textarea
                    id="description"
                    value={formState.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={3}
                    className="border-blue-200 dark:border-blue-700 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Card de Anexos */}
            <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Paperclip className="h-5 w-5 text-blue-600" />
                Anexos da Operação
              </h3>
              <div className="space-y-4">
                {operation?.id ? (
                  // Para operações existentes - upload direto
                  <MultiFileUpload
                    operacaoId={Number(operation.id)}
                    onUploadComplete={handleUploadComplete}
                    maxFiles={10}
                  />
                ) : (
                  // Para novas operações - apenas selecionar arquivos
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            const newFiles = Array.from(e.target.files)
                            const validation = uploadService.validateFiles(newFiles)
                            
                            if (!validation.valid) {
                              validation.errors.forEach(error => customToast.error(error))
                              e.target.value = ''
                              return
                            }
                            
                            setAttachments(prev => [...prev, ...newFiles])
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.xls,.xlsx"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Paperclip className="h-10 w-10 text-gray-400" />
                        <p className="text-lg font-medium text-gray-700">
                          Clique para selecionar arquivos
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, imagens, documentos • Máximo 10 arquivos • 10MB por arquivo
                        </p>
                      </label>
                    </div>
                    
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          Arquivos selecionados ({attachments.length})
                        </h4>
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-700"
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-blue-200 dark:border-blue-800 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
