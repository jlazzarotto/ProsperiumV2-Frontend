"use client"

import { useEffect, useRef, useState } from "react"
import { X, Upload, FileText, Trash2, DollarSign, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/money-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/app/contexts/auth-context"
import { Transaction } from "@/app/services/transaction-service"
import { getTiposLancamento, createLancamento, updateLancamento, updateLancamentoWithAttachments, updateSerieRecorrencia, getLancamentoById, getTipoLancamentoById } from "@/app/services/lancamento-service"
import { getAllOperations, getOperationById } from "@/app/services/operation-service"
import { TripleSelector } from "@/components/ui/triple-selector"
import type { Tipo8BusinessUnit, Cliente } from "@/services/business-unit-service"
import type { BusinessUnit } from "@/types/types"
import { uploadService, type LancamentoAnexo, type MultiUploadResponse } from "@/services/upload-service"
import { MultiFileUpload, LancamentoAnexosList, DOCUMENT_TYPES, type DocumentType } from "@/components/multi-file-upload"
import { PaymentModal } from "@/components/payment-modal"
import { CostCenterRateio } from "@/components/cost-center-rateio"
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

interface FileWithConfig {
  file: File
  documentType: DocumentType | "none"
  sendToAccounting: boolean
}
import customToast from "@/components/ui/custom-toast"
import type { Operation } from "@/types/types"
import type { CostCenterAllocation } from "@/types/types"
import type { ApiTransactionType } from "@/types/api"

type RecurringEditScope = "single" | "all" | "fromThis" | null

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  transaction?: Transaction | null
  onOpenEditAfterCreate?: (lancamentoId: number) => void
  recurringEditScope?: RecurringEditScope
  onDeleteTransaction?: (transactionId: number) => void
}

export function TransactionModal({ isOpen, onClose, onSuccess, transaction, onOpenEditAfterCreate, recurringEditScope, onDeleteTransaction }: TransactionModalProps) {
  const { hasFeature } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [transactionTypes, setTransactionTypes] = useState<ApiTransactionType[]>([])
  const [anexos, setAnexos] = useState<LancamentoAnexo[]>([])
  const [loadingAnexos, setLoadingAnexos] = useState(false)
  const [operations, setOperations] = useState<Operation[]>([])
  const [attachments, setAttachments] = useState<FileWithConfig[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [modalReady, setModalReady] = useState(false)
  const [tripleSelectorReady, setTripleSelectorReady] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [createdTransaction, setCreatedTransaction] = useState<any>(null)
  const [showAccountingConflictDialog, setShowAccountingConflictDialog] = useState(false)
  const [costCenterAllocations, setCostCenterAllocations] = useState<CostCenterAllocation[]>([])
  const accountingConflictResolverRef = useRef<((choice: "replace" | "keep" | "cancel") => void) | null>(null)
  
  
  // Estados para lógica reversa na edição
  const [resolvedBusinessUnit, setResolvedBusinessUnit] = useState<Tipo8BusinessUnit | null>(null)
  const [resolvedPerson, setResolvedPerson] = useState<Cliente | null>(null)
  const [resolvedUnit, setResolvedUnit] = useState<BusinessUnit | null>(null)
  const canUseOperationsModule = hasFeature("cadastros.operacoes")
  const canUseCusteio = hasFeature("financeiro.custeio")
  
  // Verificar se o lançamento está baixado (pago)
  const isLancamentoBaixado = Boolean(transaction?.data_pagamento && transaction.data_pagamento.trim() !== "")

  const [formData, setFormData] = useState({
    id_tipo_lancamento: "",  // UI: tipo de lancamento (tp_lctos); resolve id_conta_contabil ao submeter
    id_conta_contabil: "",   // Resolvido automaticamente a partir do tipo selecionado
    id_pessoa: "",      // Devedor/Credor (pessoa) → API espera id_pessoa
    id_un_negocio: "",  // Unidade (pessoa tipo 10)
    id_empresa: "",     // Empresa (pessoa tipo 8)
    id_pessoa_negocio: "",
    id_operacao: "",
    numero_documento: "",
    descricao: "",
    valor: "",
    data_lancamento: "",
    data_vencimento: "",
    natureza: "credito" as "credito" | "debito",
    status: true,
    custeio: false,
  })

  // Função para buscar anexos existentes
  const fetchAnexos = async (lancamentoId: number) => {
    setLoadingAnexos(true)
    try {
      const response = await uploadService.getLancamentoAnexos(lancamentoId)
      setAnexos(response.anexos || [])
    } catch (error) {
      console.error("Erro ao buscar anexos:", error)
    } finally {
      setLoadingAnexos(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Modal abrindo - Forçando reload completo dos dados')
      setModalReady(false)
      
      // Resetar todos os estados primeiro
      setTransactionTypes([])
      setOperations([])
      setAnexos([])
      setAttachments([])
      
      // Carregar dados sempre, independente se é edição ou novo
      loadData()
      
      if (transaction) {
        console.log('📝 Modo edição - Carregando dados do lançamento:', transaction.id_lancamento)
        setIsEditMode(true)
        
        // Aguardar um pouco para garantir que loadData termine
        setTimeout(() => {
          const loadEditTransaction = async () => {
            try {
              const transactionFromApi = await getLancamentoById(transaction.id_lancamento)

              console.log('🔧 EDIT MODE - Dados do lançamento recebidos:', {
                id_lancamento: transactionFromApi.id_lancamento,
                id_tp_lcto: transactionFromApi.id_tp_lcto,
                id_conta_contabil: transactionFromApi.id_conta_contabil,
                id_pessoa: transactionFromApi.id_pessoa,
                id_un_negocio: transactionFromApi.id_un_negocio,
              })

              const formDataToSet = {
                id_tipo_lancamento: transactionFromApi.id_tp_lcto ? String(transactionFromApi.id_tp_lcto) : "",
                id_conta_contabil: transactionFromApi.id_conta_contabil?.toString() || "",
                id_pessoa: transactionFromApi.id_pessoa?.toString() || "",
                id_un_negocio: transactionFromApi.id_un_negocio?.toString() || "",
                id_empresa: (transactionFromApi as any).id_empresa?.toString() || "",
                id_pessoa_negocio: (transactionFromApi as any).id_pessoa_negocio?.toString() || "",
                id_operacao: transactionFromApi.id_operacao?.toString() || "",
                numero_documento: transactionFromApi.numero_documento || "",
                descricao: transactionFromApi.descricao || "",
                valor: String(transactionFromApi.valor || ""),
                data_lancamento: transactionFromApi.data_lancamento?.split(" ")[0] || "",
                data_vencimento: transactionFromApi.data_vencimento?.split(" ")[0] || "",
                natureza: (transactionFromApi.natureza === 'entrada' ? 'credito' : 'debito') as "credito" | "debito",
                status: Boolean(transactionFromApi.status),
                custeio: transactionFromApi.custeio ?? false,
              }

              setFormData(formDataToSet)
              setCostCenterAllocations(transactionFromApi.centros_custo || [])

              setTimeout(() => {
                setTripleSelectorReady(true)
                console.log('✅ EDIT MODE - TripleSelector pronto para receber dados')
              }, 100)

              fetchAnexos(transaction.id_lancamento)
            } catch (error) {
              console.error('❌ Erro ao recarregar lançamento em modo edição:', error)
              customToast.error("Erro ao carregar dados completos do lançamento")
            }
          }

          void loadEditTransaction()
        }, 200)
      } else {
        console.log('➕ Modo novo lançamento')
        setIsEditMode(false)
        setTimeout(() => {
          resetForm()
          // Limpar também os estados resolvidos para garantir que TripleSelector inicie limpo
          setResolvedBusinessUnit(null)
          setResolvedPerson(null)
          setResolvedUnit(null)
          setTripleSelectorReady(true)
          console.log('✅ NEW MODE - TripleSelector pronto (vazio)')
        }, 200)
      }
    } else {
      // Quando fechar o modal, limpar tudo
      setModalReady(false)
      setTripleSelectorReady(false)
      setTransactionTypes([])
      setOperations([])
      setAnexos([])
      setAttachments([])
    }
  }, [isOpen, transaction?.id_lancamento]) // Usar id_lancamento específico para forçar reload

  // Função para carregar dados reversos quando campos estão faltando
  const loadReverseData = async (transaction: Transaction) => {
    try {
      console.log('🔍 Carregando dados reversos para transação:', transaction.id_lancamento)
    } catch (error) {
      console.error('❌ Erro ao carregar dados reversos:', error)
    }
  }

  // Limpeza automática dos estados resolvidos quando não estiver em modo de edição
  useEffect(() => {
    if (!isEditMode) {
      setResolvedBusinessUnit(null)
      setResolvedPerson(null) 
      setResolvedUnit(null)
    }
  }, [isEditMode])

  useEffect(() => {
    if (!isEditMode || formData.id_tipo_lancamento || !formData.id_conta_contabil || transactionTypes.length === 0) {
      return
    }

    const naturezaNumero = formData.natureza === "credito" ? 1 : 2
    const tipoSelecionado = transactionTypes.find((type) =>
      String(type.id_conta_contabil ?? "") === formData.id_conta_contabil &&
      type.natureza === naturezaNumero
    )

    if (!tipoSelecionado?.id_tp_lcto) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      id_tipo_lancamento: String(tipoSelecionado.id_tp_lcto),
    }))
  }, [isEditMode, formData.id_tipo_lancamento, formData.id_conta_contabil, formData.natureza, transactionTypes])

  useEffect(() => {
    if (!isEditMode || !transaction?.id_lancamento) {
      return
    }

    const selectedTipoId = transaction.id_tp_lcto ? String(transaction.id_tp_lcto) : formData.id_tipo_lancamento
    if (!selectedTipoId) {
      return
    }

    const alreadyLoaded = transactionTypes.some((type) => type.id_tp_lcto?.toString() === selectedTipoId)
    if (alreadyLoaded) {
      return
    }

    let cancelled = false

    const loadMissingTipoLancamento = async () => {
      try {
        const tipoLancamento = await getTipoLancamentoById(Number(selectedTipoId))
        if (!tipoLancamento?.id_tp_lcto) {
          return
        }

        if (cancelled) {
          return
        }

        setTransactionTypes((prev) => (
          prev.some((type) => type.id_tp_lcto === tipoLancamento.id_tp_lcto)
            ? prev
            : [...prev, tipoLancamento]
        ))
      } catch (error) {
        console.warn("Erro ao carregar tipo de lançamento inativo para edição:", error)
      }
    }

    void loadMissingTipoLancamento()

    return () => {
      cancelled = true
    }
  }, [isEditMode, transaction?.id_lancamento, transaction?.id_tp_lcto, formData.id_tipo_lancamento, transactionTypes])

  // Garante que a operação selecionada exista no dropdown ao editar.
  // Isso cobre casos em que a operação vinculada ao lançamento não vem em /operacoes.
  useEffect(() => {
    const selectedOperationId = formData.id_operacao
    if (!canUseOperationsModule) return
    if (!isOpen || !selectedOperationId) return

    const hasSelectedOperation = operations.some((operation) => operation.id === selectedOperationId)

    if (hasSelectedOperation) {
      setFormData((prev) => (
        prev.id_operacao === selectedOperationId
          ? prev
          : { ...prev, id_operacao: selectedOperationId }
      ))
      return
    }

    let cancelled = false

    const loadSelectedOperation = async () => {
      try {
        const selectedOperation = await getOperationById(selectedOperationId)
        if (!selectedOperation || cancelled) return

        setOperations((prev) => (
          prev.some((operation) => operation.id === selectedOperationId)
            ? prev
            : [selectedOperation, ...prev]
        ))
        setFormData((prev) => ({ ...prev, id_operacao: selectedOperationId }))
      } catch (error) {
        console.warn("Erro ao carregar operação vinculada ao lançamento:", error)
      }
    }

    void loadSelectedOperation()

    return () => {
      cancelled = true
    }
  }, [isOpen, formData.id_operacao, operations, canUseOperationsModule])
  const loadData = async () => {
    try {
      console.log('🚀 [FORÇA RELOAD] Iniciando carregamento completo dos dados do modal')
      
      // Forçar reload dos tipos de lançamento
      const typesRes = await getTiposLancamento()
      console.log('🔍 [FORÇA RELOAD] Tipos de lançamento carregados:', typesRes?.length || 0)
      
      if (!typesRes || typesRes.length === 0) {
        console.error('❌ [FORÇA RELOAD] Nenhum tipo de lançamento carregado - tentando novamente...')
        // Tentar novamente após um delay
        setTimeout(async () => {
          try {
            const retryTypesRes = await getTiposLancamento()
            setTransactionTypes(retryTypesRes || [])
            console.log('🔄 [FORÇA RELOAD] Retry tipos successful:', retryTypesRes?.length || 0)
          } catch (retryError) {
            console.error('❌ [FORÇA RELOAD] Retry tipos falhou:', retryError)
            setTransactionTypes([])
          }
        }, 500)
      } else {
        setTransactionTypes(typesRes)
      }
      
      // Carregar operações apenas quando o módulo estiver habilitado para o cliente
      if (canUseOperationsModule) {
        try {
          const operationsRes = await getAllOperations()
          setOperations(operationsRes || [])
          console.log('🔍 [FORÇA RELOAD] Operações carregadas:', operationsRes?.length || 0)
        } catch (operationError) {
          console.warn('⚠️ [FORÇA RELOAD] Erro ao carregar operações:', operationError)
          setOperations([])
          // Tentar novamente
          setTimeout(async () => {
            try {
              const retryOpsRes = await getAllOperations()
              setOperations(retryOpsRes || [])
              console.log('🔄 [FORÇA RELOAD] Retry operações successful:', retryOpsRes?.length || 0)
            } catch (retryError) {
              console.warn('❌ [FORÇA RELOAD] Retry operações falhou:', retryError)
              setOperations([])
            }
          }, 500)
        }
      } else {
        setOperations([])
      }
      
      // Aguardar mais tempo para garantir que tudo carregue
      setTimeout(() => {
        setModalReady(true)
        console.log('✅ [FORÇA RELOAD] Modal pronto - todos os dados carregados')
      }, 800)
    } catch (error) {
      console.error('❌ [FORÇA RELOAD] Erro grave ao carregar dados:', error)
      // Mesmo com erro, marcar como pronto para não travar
      setTimeout(() => {
        setModalReady(true)
      }, 500)
    }
  }

  const resetForm = () => {
    console.log('🧹 Resetando formulário para novo lançamento')
    setFormData({
      id_tipo_lancamento: "",
      id_conta_contabil: "",
      id_pessoa: "",
      id_un_negocio: "",
      id_empresa: "",
      id_pessoa_negocio: "",
      id_operacao: "",
      numero_documento: "",
      descricao: "",
      valor: "",
      data_lancamento: new Date().toISOString().split("T")[0],
      data_vencimento: new Date().toISOString().split("T")[0],
      natureza: "credito",
      status: true,
      custeio: false,
    })

    // Limpar estados resolvidos para garantir TripleSelector limpo
    setResolvedBusinessUnit(null)
    setResolvedPerson(null)
    setResolvedUnit(null)
    
    setAttachments([])
    setAnexos([])
    setLoadingAnexos(false)
    setCostCenterAllocations([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("📁 Debug handleFileChange - arquivos selecionados:", e.target.files?.length)
    
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      console.log("📁 Arquivos capturados:", newFiles.map(f => f.name))
      
      // Validar arquivos
      const validation = uploadService.validateFiles(newFiles)
      
      if (!validation.valid) {
        validation.errors.forEach(error => {
          customToast.error(error)
        })
        // Limpar o input file
        e.target.value = ''
        return
      }
      
      setAttachments((prev) => {
        // Criar FileWithConfig objects com configurações padrão
        const filesWithConfig: FileWithConfig[] = newFiles.map(file => ({
          file,
          documentType: "none",
          sendToAccounting: false
        }))
        
        const updated = [...prev, ...filesWithConfig]
        console.log("📁 Estado attachments atualizado:", updated.length, "arquivos")
        return updated
      })
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Callback para upload de arquivos
  const handleUploadComplete = (response: MultiUploadResponse) => {
    if (response.total_enviados > 0) {
      customToast.success(
        `${response.total_enviados} arquivo(s) enviado(s) com sucesso!`,
        
      )
    }
    
    if (response.errors && response.errors.length > 0) {
      response.errors.forEach(error => {
        customToast.error(error)
      })
    }
    
    // Recarregar anexos se estivermos editando
    if (isEditMode && transaction) {
      fetchAnexos(transaction.id_lancamento)
    }
  }

  const handleRemoveAnexo = (anexoId: number) => {
    // Atualizar estado local após remoção bem-sucedida pelo componente LancamentoAnexosList
    setAnexos(prev => prev.filter(anexo => anexo.id_arquivo !== anexoId))
  }

  const resolveAccountingConflict = (choice: "replace" | "keep" | "cancel") => {
    setShowAccountingConflictDialog(false)
    accountingConflictResolverRef.current?.(choice)
    accountingConflictResolverRef.current = null
  }

  const promptAccountingConflict = () =>
    new Promise<"replace" | "keep" | "cancel">((resolve) => {
      accountingConflictResolverRef.current = resolve
      setShowAccountingConflictDialog(true)
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log("🔍 Debug upload - Iniciando submit:")
    console.log("- attachments.length:", attachments.length)
    console.log("- attachments:", attachments)
    console.log("- isEditMode:", isEditMode)

    try {
      // Converter valor para número, removendo formatação se necessário
      let valorNumerico: number
      if (typeof formData.valor === 'number') {
        valorNumerico = formData.valor
      } else {
        const valorString = String(formData.valor)
        // Se já é um número em formato string simples (123.33), usar direto
        if (/^\d+(\.\d{1,2})?$/.test(valorString)) {
          valorNumerico = parseFloat(valorString)
        } else {
          // Se tem formatação brasileira (R$ 1.234,56), limpar primeiro
          const valorLimpo = valorString
            .replace(/[R$\s]/g, '') // Remove R$ e espaços
            .replace(/\./g, '') // Remove pontos de milhar
            .replace(',', '.') // Troca vírgula por ponto decimal
          valorNumerico = parseFloat(valorLimpo) || 0
        }
      }
      
      console.log("💰 Debug valor:")
      console.log("- formData.valor original:", formData.valor)
      console.log("- tipo do valor:", typeof formData.valor)
      console.log("- valorNumerico final:", valorNumerico)

      // Resolver conta contábil a partir do tipo de lançamento selecionado
      const tipoSelecionado = transactionTypes.find(type => type.id_tp_lcto?.toString() === formData.id_tipo_lancamento)
      const contaContabilId = tipoSelecionado?.id_conta_contabil ? String(tipoSelecionado.id_conta_contabil) : formData.id_conta_contabil

      // Validação de campos obrigatórios antes de enviar
      if (!contaContabilId || !formData.id_pessoa || !formData.id_un_negocio) {
        const camposFaltando = []
        if (!contaContabilId) camposFaltando.push("Tipo de Lançamento")
        if (!formData.id_pessoa) camposFaltando.push("Devedor/Credor")
        if (!formData.id_un_negocio) camposFaltando.push("Unidade")

        customToast.error(`Campos obrigatórios não preenchidos: ${camposFaltando.join(", ")}`)
        return
      }

      const naturezaFromTipo: 'credito' | 'debito' = tipoSelecionado ? (tipoSelecionado.natureza === 1 ? 'credito' : 'debito') : 'credito'
      const totalRateio = costCenterAllocations.reduce((sum, item) => sum + Number(item.percent || 0), 0)

      if (costCenterAllocations.length > 1 && Math.abs(totalRateio - 100) > 0.0001) {
        customToast.error("A soma do rateio dos centros de custo deve ser 100%")
        return
      }

      // Se o lançamento está baixado, enviar apenas os campos permitidos
      const data = isLancamentoBaixado && transaction ? {
        numero_documento: formData.numero_documento || null,
        descricao: formData.descricao || '',
        data_emissao: `${formData.data_lancamento} 00:00:00`,
        id_operacao: formData.id_operacao ? parseInt(formData.id_operacao) : null,
      } : {
        id_conta_contabil: parseInt(contaContabilId) || 0,
        id_tp_lcto: parseInt(formData.id_tipo_lancamento) || undefined,
        id_pessoa: parseInt(formData.id_pessoa) || 0,          // Devedor/Credor
        id_un_negocio: parseInt(formData.id_un_negocio) || 0, // Unidade (pessoa tipo 10)
        id_empresa: parseInt(formData.id_empresa) || 0,        // Empresa (pessoa tipo 8)
        id_pessoa_negocio: parseInt(formData.id_pessoa_negocio) || 0,
        numero_documento: formData.numero_documento || null,
        descricao: formData.descricao || '',
        valor: valorNumerico,
        data_lancamento: `${formData.data_lancamento} 00:00:00`,
        data_vencimento: `${formData.data_vencimento} 00:00:00`,
        natureza: naturezaFromTipo, // Natureza baseada no tipo de lançamento selecionado
        custeio: canUseCusteio ? formData.custeio : false,
        id_operacao: formData.id_operacao ? parseInt(formData.id_operacao) : null,
        centros_custo: costCenterAllocations.map((item) => ({
          id: item.id,
          percent: Number(item.percent),
        })),
      }
      
      console.log("🔍 Validação de campos:")
      console.log("- id_conta_contabil:", data.id_conta_contabil)
      console.log("- id_pessoa (Devedor/Credor):", data.id_pessoa)
      console.log("- id_un_negocio (Unidade Negócio):", data.id_un_negocio)
      console.log("- id_tipo_lancamento:", formData.id_tipo_lancamento)
      console.log("- id_pessoa_negocio (Unidade específica):", data.id_pessoa_negocio)
      
      console.log("📝 Dados finais para API:", data)

      let savedTransaction: Transaction | unknown
      let lancamentoId: number
      const successActionLabel = transaction ? "Lançamento atualizado" : "Lançamento criado"
      let accountingConflictResolution: "replace" | "keep" | undefined
      let attachmentsToUpload = attachments

      const shouldUseCombinedUpdateWithAttachments =
        Boolean(transaction) &&
        attachments.length > 0 &&
        recurringEditScope !== "all" &&
        recurringEditScope !== "fromThis"

      const hasExistingAccountingFile = Boolean(transaction?.id_lancamento) && anexos.some((anexo) => anexo.enviar_contabilidade)
      const hasNewAccountingFile = attachments.some((attachment) => attachment.sendToAccounting)

      if (shouldUseCombinedUpdateWithAttachments && hasExistingAccountingFile && hasNewAccountingFile) {
        const choice = await promptAccountingConflict()
        if (choice === "cancel") {
          return
        }
        accountingConflictResolution = choice
        if (choice === "keep") {
          attachmentsToUpload = attachments.map((attachment) => ({
            ...attachment,
            sendToAccounting: false
          }))
        }
      }

      if (transaction) {
        lancamentoId = transaction.id_lancamento

        if (recurringEditScope === "all" || recurringEditScope === "fromThis") {
          // Atualizar série de recorrência
          const serieData: Record<string, unknown> = { ...data }
          // Não enviar campos que não têm persistência no endpoint de série.
          delete serieData.natureza
          delete serieData.id_pessoa_negocio
          delete serieData.id_conta_caixa
          delete serieData.data_vencimento
          if (recurringEditScope === "fromThis") {
            serieData.a_partir_de_id = transaction.id_lancamento
          }
          const result = await updateSerieRecorrencia(transaction.id_lancamento, serieData, true)
          customToast.success(`${result.atualizados} lançamento(s) da série atualizado(s)!`)
        } else {
          // Atualizar apenas este lançamento (scope "single" ou null)
          if (shouldUseCombinedUpdateWithAttachments) {
            const filesWithConfig = attachmentsToUpload.map(fileConfig => ({
              file: fileConfig.file,
              documentType: fileConfig.documentType !== "none" ? fileConfig.documentType : undefined,
              sendToAccounting: fileConfig.sendToAccounting
            }))

            savedTransaction = await updateLancamentoWithAttachments(
              transaction.id_lancamento,
              data as any,
              filesWithConfig,
              accountingConflictResolution
            )
          } else {
            savedTransaction = await updateLancamento(transaction.id_lancamento, data as any)
          }
        }
      } else {
        const createResponse = await createLancamento(data as any)
        console.log("📋 Response da criação:", createResponse)
        lancamentoId = createResponse.id
        savedTransaction = { id_lancamento: lancamentoId, ...data }
      }

      // Upload dos anexos se existirem
      if (attachments.length > 0 && !shouldUseCombinedUpdateWithAttachments) {
        setUploading(true)
        try {
          console.log(`🚀 Iniciando upload de ${attachments.length} arquivo(s) para lançamento ${lancamentoId}`)
          
          // Converter attachments para o formato esperado do upload service
          const filesWithConfig = attachments.map(fileConfig => ({
            file: fileConfig.file,
            documentType: fileConfig.documentType !== "none" ? fileConfig.documentType : undefined,
            sendToAccounting: fileConfig.sendToAccounting
          }))

          const uploadResponse = await uploadService.uploadFilesToLancamento(
            lancamentoId, 
            filesWithConfig
          )
          
          console.log("✅ Resposta do upload:", uploadResponse)
          
          if (uploadResponse.total_enviados > 0) {
            customToast.success(
              `${successActionLabel}! ${uploadResponse.total_enviados} arquivo(s) enviado(s) com sucesso!`, 
              
            )
          } else {
            customToast.warning(`${successActionLabel}, mas nenhum arquivo foi enviado`)
          }
          
          if (uploadResponse.errors && uploadResponse.errors.length > 0) {
            uploadResponse.errors.forEach(error => {
              customToast.error(error)
            })
          }
        } catch (uploadError) {
          console.error("❌ Erro ao fazer upload dos anexos:", uploadError)
          customToast.error(`${successActionLabel}, mas houve erro no upload dos anexos`)
        } finally {
          setUploading(false)
        }
      } else {
        customToast.success(`${successActionLabel} com sucesso!`)
      }
      
      // Para novos lançamentos (sem anexos ou com anexos), perguntar se deseja baixar
      // Se lançamento já está baixado, não perguntar se quer baixar novamente
      if (isLancamentoBaixado) {
        customToast.success("Lançamento atualizado com sucesso!")
        onSuccess()
        onClose()
        return
      }

      // Para lançamentos não baixados, perguntar se deseja baixar
      // Buscar nomes para exibição no resumo
      const tipoLancamentoNome = transactionTypes.find(t => t.id_tp_lcto?.toString() === formData.id_tipo_lancamento)?.nome || '-'
      const pessoaNome = resolvedPerson?.nome || '-'
      const unidadeNegocioNome = resolvedBusinessUnit?.apelido || '-'
      const unidadeEspecificaNome = resolvedUnit ? (resolvedUnit as any).apelido || (resolvedUnit as any).name : '-'

      // Calcular competência (YYYYMM) da data de lançamento
      const dataLanc = new Date(formData.data_lancamento + "T12:00:00")
      const competencia = `${dataLanc.getFullYear()}${String(dataLanc.getMonth() + 1).padStart(2, '0')}`

      setCreatedTransaction({
        id: lancamentoId.toString(),
        code: formData.numero_documento || '',
        date: new Date(formData.data_lancamento + "T12:00:00"),
        dueDate: new Date(formData.data_vencimento + "T12:00:00"),
        description: formData.descricao || '',
        descricao: formData.descricao || '',
        value: valorNumerico,
        type: data.natureza === 'credito' ? 'entrada' : 'saida',
        natureza: data.natureza,
        status: 'pendente',
        transactionTypeId: formData.id_conta_contabil,
        transactionTypeName: tipoLancamentoNome,
        cashAccountId: '',
        cashAccountName: '',
        // Informações completas para o resumo
        pessoaNome: pessoaNome,
        unidadeNegocioNome: unidadeNegocioNome,
        unidadeEspecificaNome: unidadeEspecificaNome,
        competencia: competencia,
        // Manter campos originais para compatibilidade
        id_lancamento: lancamentoId,
        id_lcto: lancamentoId,
        valor: valorNumerico,
        data_vencimento: formData.data_vencimento,
        data_lancamento: formData.data_lancamento
      })
      setShowDownloadDialog(true)
      return // Não fechar ainda

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error)
      customToast.error("Erro ao salvar lançamento. Verifique os dados e tente novamente.")
    } finally {
      setLoading(false)
    }
  }



  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 rounded-lg shadow-2xl">
        <div className="shrink-0 flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 border-b border-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">
              {transaction ? "Editar Lançamento" : "Novo Lançamento"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 relative">
            {/* Loading overlay */}
            {!modalReady && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Carregando dados...</p>
                </div>
              </div>
            )}

            {/* Aviso quando lançamento está baixado */}
            {isLancamentoBaixado && (
              <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-amber-800 font-medium text-sm">
                  Lançamento Baixado - alguns campos permanecem bloqueados. Para edição completa, cancele a baixa.
                </span>
              </div>
            )}

            {/* Linha 1: Data Emissão | Data Vencimento | (vazio ou código em edição) */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="data_lancamento" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Data Emissão *
                </Label>
                <Input
                  id="data_lancamento"
                  type="date"
                  value={formData.data_lancamento}
                  onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
                  required
                  className="bg-slate-100 dark:bg-slate-800 border-0"
                />
              </div>
              <div>
                <Label htmlFor="data_vencimento" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Data Vencimento *
                </Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                  required
                  disabled={isLancamentoBaixado}
                  className="bg-slate-100 dark:bg-slate-800 border-0"
                />
              </div>
              <div>
                {canUseOperationsModule ? (
                  <>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      Operação
                    </Label>
                    <SearchableSelect
                      value={formData.id_operacao}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, id_operacao: value }))}
                      placeholder="Selecione..."
                      searchPlaceholder="Pesquisar..."
                      emptyMessage="Nenhuma operação"
                      options={operations.map(operation => ({
                        value: operation.id || "",
                        label: `${operation.shipName || operation.code || "Navio"} [ ${operation.voyage || operation.description || "-"} ]`,
                        description: `ID: ${operation.id}`
                      }))}
                    />
                  </>
                ) : null}
              </div>
            </div>

            {/* Linha 2: Natureza | Tipo Lançamento */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Natureza *
                </Label>
                <Select
                  value={formData.natureza === "credito" ? "1" : "2"}
                  onValueChange={(value) => {
                    const natureza = value === "1" ? "credito" : "debito"
                    setFormData(prev => ({
                      ...prev,
                      natureza,
                      id_tipo_lancamento: isEditMode ? prev.id_tipo_lancamento : "",
                      id_conta_contabil: isEditMode ? prev.id_conta_contabil : ""
                    }))
                  }}
                  disabled={isLancamentoBaixado}
                >
                  <SelectTrigger className="bg-slate-100 dark:bg-slate-800 border-0">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Entradas(+)</SelectItem>
                    <SelectItem value="2">Saídas(-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Tipo de Lançamento *
                </Label>
                <SearchableSelect
                  value={formData.id_tipo_lancamento}
                  onValueChange={(value) => {
                    const tipoSelecionado = transactionTypes.find(type => type.id_tp_lcto?.toString() === value)
                    setFormData(prev => ({
                      ...prev,
                      id_tipo_lancamento: value,
                      id_conta_contabil: tipoSelecionado?.id_conta_contabil ? String(tipoSelecionado.id_conta_contabil) : prev.id_conta_contabil,
                      natureza: tipoSelecionado
                        ? (tipoSelecionado.natureza === 1 ? "credito" : "debito")
                        : prev.natureza
                    }))
                  }}
                  disabled={isLancamentoBaixado}
                  placeholder="Selecione..."
                  searchPlaceholder="Pesquisar tipo..."
                  emptyMessage="Nenhum tipo encontrado"
                  options={transactionTypes
                    .filter(type => {
                      if (!formData.natureza) return true
                      const naturezaNumero = formData.natureza === "credito" ? 1 : 2
                      return type.natureza === naturezaNumero
                    })
                    .map(type => ({
                      value: type.id_tp_lcto?.toString() || "",
                      label: type.nome,
                      description: type.natureza === 1 ? "Entrada" : "Saída"
                    }))}
                />
              </div>
              <div></div>
            </div>

            {/* Linha 3: TripleSelector (Unidade de Negócio, Devedor/Credor, Unidade) */}
            <div className="mb-4">
              {tripleSelectorReady ? (
                <TripleSelector
                  selectedBusinessUnitId={isEditMode ? formData.id_empresa : ""}
                  selectedPersonId={isEditMode ? formData.id_pessoa : ""}
                  selectedUnitId={isEditMode ? formData.id_un_negocio : ""}
                  key={`triple-selector-${isEditMode ? transaction?.id_lancamento : 'new'}`}
                  onBusinessUnitChange={(businessUnitId: string, businessUnit: Tipo8BusinessUnit | null) => {
                    setFormData(prev => ({
                      ...prev,
                      id_empresa: businessUnitId,
                      id_pessoa: isEditMode ? prev.id_pessoa : "",
                      id_un_negocio: isEditMode ? prev.id_un_negocio : "",
                    }))
                    setCostCenterAllocations([])
                    setResolvedBusinessUnit(businessUnit)
                  }}
                  onPersonChange={(personId: string, person: Cliente | null) => {
                    setFormData(prev => ({
                      ...prev,
                      id_pessoa: personId
                    }))
                    setResolvedPerson(person)
                  }}
                  onUnitChange={(unitId: string, unit: BusinessUnit | null) => {
                    setFormData(prev => ({
                      ...prev,
                      id_un_negocio: unitId
                    }))
                    setResolvedUnit(unit)
                  }}
                  required={true}
                  personLabel="Devedor/Credor"
                  label=""
                  isVisible={isOpen}
                  showFullInfo={false}
                  disabled={isLancamentoBaixado}
                  allowReverseLoading={true}
                />
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                </div>
              )}
            </div>

            {/* Linha 4: Valor | Doc nr | (vazio) */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="valor" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Valor *
                </Label>
                <MoneyInput
                  id="valor"
                  value={formData.valor}
                  onChange={(value) => setFormData({ ...formData, valor: value })}
                  required
                  disabled={isLancamentoBaixado}
                  className="bg-slate-100 dark:bg-slate-800 border-0"
                />
              </div>
              <div>
                <Label htmlFor="numero_documento" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Doc nr
                </Label>
                <Input
                  id="numero_documento"
                  value={formData.numero_documento}
                  onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                  placeholder=""
                  className="bg-slate-100 dark:bg-slate-800 border-0"
                />
              </div>
              <div></div>
            </div>

            {/* Linha 5: Descrição (largura total) */}
            <div className="mb-4">
              <Label htmlFor="descricao" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Descrição
              </Label>
              <textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do lançamento"
                rows={3}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Linha 6: Custeio */}
            {canUseCusteio ? (
              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  id="custeio"
                  checked={formData.custeio}
                  onCheckedChange={(checked) => setFormData({ ...formData, custeio: checked === true })}
                />
                <Label htmlFor="custeio" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Custeio
                </Label>
              </div>
            ) : null}

            <div className="mb-4">
              <CostCenterRateio
                companyId={formData.id_empresa}
                totalAmount={valorParaRateio(formData.valor)}
                value={costCenterAllocations}
                onChange={setCostCenterAllocations}
                disabled={isLancamentoBaixado}
              />
            </div>

            {/* Linha 7: Anexos (largura total, altura maior) */}
            <div>
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Anexos {(attachments.length > 0 || anexos.length > 0) && <span className="text-blue-600">({isEditMode ? anexos.length : attachments.length})</span>}
              </Label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer min-h-[180px] flex flex-col items-center justify-center">
                {!isEditMode ? (
                  <MultiFileUpload
                    preparationMode={true}
                    onFilesConfigChange={(files) => {
                      setAttachments(files)
                    }}
                    maxFiles={10}
                  />
                ) : (
                  <>
                    <MultiFileUpload
                      lancamentoId={transaction?.id_lancamento}
                      onUploadComplete={handleUploadComplete}
                      maxFiles={10}
                    />
                    {loadingAnexos ? (
                      <div className="mt-2 text-xs text-slate-500">Carregando...</div>
                    ) : anexos.length > 0 ? (
                      <div className="mt-2 text-xs text-slate-500">{anexos.length} anexo(s)</div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            {isEditMode && !isLancamentoBaixado && transaction?.id_lancamento && onDeleteTransaction && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDeleteTransaction(transaction.id_lancamento)}
                disabled={loading || uploading}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {loading ? "Salvando..." : uploading ? "Enviando anexos..." : "Gravar"}
            </Button>
          </div>
        </form>
      </div>

      {/* Dialog de confirmação para baixar lançamento - Com resumo completo */}
      <AlertDialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lançamento Criado com Sucesso!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Deseja baixar o lançamento agora?</p>

                {/* Resumo Completo do Lançamento */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b pb-2">
                    Resumo Completo do Lançamento
                  </h4>

                  {/* Valor e Natureza em destaque */}
                  <div className={`p-3 rounded-lg ${createdTransaction?.type === 'entrada' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-500">Valor:</span>
                        <p className={`text-2xl font-bold ${createdTransaction?.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                          {createdTransaction?.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(createdTransaction.value) : '-'}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${createdTransaction?.type === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {createdTransaction?.type === 'entrada' ? '↑ ENTRADA (Crédito)' : '↓ SAÍDA (Débito)'}
                      </div>
                    </div>
                  </div>

                  {/* Informações em grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Descrição:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {createdTransaction?.descricao || '-'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Tipo de Lançamento:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {createdTransaction?.transactionTypeName || '-'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Nº Documento:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {createdTransaction?.code || '-'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Unidade de Negócio:</span>
                      <p className="font-medium text-purple-700 dark:text-purple-400">
                        {createdTransaction?.unidadeNegocioNome || '-'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Devedor/Credor:</span>
                      <p className="font-medium text-blue-700 dark:text-blue-400">
                        {createdTransaction?.pessoaNome || '-'}
                      </p>
                    </div>

                    {createdTransaction?.unidadeEspecificaNome && createdTransaction.unidadeEspecificaNome !== '-' && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-xs">Unidade Específica:</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {createdTransaction.unidadeEspecificaNome}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Competência:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {createdTransaction?.competencia || '-'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Data de Emissão:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {createdTransaction?.data_lancamento ? new Date(createdTransaction.data_lancamento + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Data de Vencimento:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {createdTransaction?.data_vencimento ? new Date(createdTransaction.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-wrap sm:justify-between">
            <AlertDialogCancel
              onClick={() => {
                setShowDownloadDialog(false)
                // Se tiver callback para abrir em modo de edição, chamar em vez de fechar
                if (onOpenEditAfterCreate && createdTransaction?.id_lancamento) {
                  onSuccess() // Refresh lista
                  onClose() // Fechar modal atual
                  // Chamar callback para abrir modal de edição com o lançamento criado
                  setTimeout(() => {
                    onOpenEditAfterCreate(createdTransaction.id_lancamento)
                  }, 100)
                } else {
                  onSuccess()
                  onClose()
                }
              }}
              className="border-slate-300"
            >
              Editar lançamento
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setShowDownloadDialog(false)
                onSuccess()
                onClose()
              }}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              Concluir
            </Button>
            <AlertDialogAction
              onClick={() => {
                setShowDownloadDialog(false)
                setShowPaymentModal(true)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Baixar agora
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

      {/* Modal de pagamento para baixar o lançamento */}
      {createdTransaction && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            onSuccess()
            onClose()
          }}
          transaction={createdTransaction}
          onSave={async () => {
            setShowPaymentModal(false)
            onSuccess()
            onClose()
          }}
        />
      )}
    </div>
  )
}

function valorParaRateio(valor: string | number): number {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0
  }

  const valorString = String(valor || "")
  if (/^\d+(\.\d{1,2})?$/.test(valorString)) {
    return parseFloat(valorString)
  }

  const normalized = valorString.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".")
  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}
