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
import type { FinancialTransaction } from "@/types/types"
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
  Plus,
  Minus,
  ExternalLink,
  Barcode,
  Trash2,
} from "lucide-react"
import { formatCurrency, getStatusColor } from "@/lib/utils"
import { getAllCashAccounts, getCashAccountById } from "@/app/services/cash-account-api-service"
import { getAllPaymentMethods, getAllPaymentMethodsContaCaixa } from "@/app/services/payment-method-service"
import { getLancamentoById } from "@/app/services/lancamento-service"
import { getAsaasCobrancas, type AsaasCobranca } from "@/services/asaas-service"
import { getAllOperations } from "@/app/services/operation-service"
import { getAllShips } from "@/app/services/ship-service"
import { getAllPorts } from "@/app/services/port-service"
import type { Operation, Ship, Port } from "@/types/types"
import { format, isValid, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MultiFileUpload, LancamentoAnexosList } from "@/components/multi-file-upload"
import { uploadService, type LancamentoAnexo, type MultiUploadResponse } from "@/services/upload-service"
import customToast from "@/components/ui/custom-toast"

interface TransactionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: FinancialTransaction | undefined
  recurrenceData?: FinancialTransaction[]
  onTransactionUpdate?: (transactionId: string, updatedData: Partial<FinancialTransaction>) => void
  initialTab?: "capa" | "detalhes" | "anexos" | "historico"
  onDeleteTransaction?: (transaction: FinancialTransaction) => void
}

export function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
  recurrenceData = [],
  onTransactionUpdate,
  initialTab = "capa",
  onDeleteTransaction,
}: TransactionDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("capa")
  const [cashAccountName, setCashAccountName] = useState<string>("")
  const [paymentMethodName, setPaymentMethodName] = useState<string>("")
  const [operationData, setOperationData] = useState<Operation | null>(null)
  const [shipData, setShipData] = useState<Ship | null>(null)
  const [portData, setPortData] = useState<Port | null>(null)
  const [anexos, setAnexos] = useState<LancamentoAnexo[]>([])
  const [loadingAnexos, setLoadingAnexos] = useState(false)
  const [asaasCobrancas, setAsaasCobrancas] = useState<AsaasCobranca[]>([])
  const hasRecurrenceTab = recurrenceData.length > 0

  useEffect(() => {
    if (!isOpen) return

    if (initialTab === "historico" && !hasRecurrenceTab) {
      setActiveTab("capa")
      return
    }

    setActiveTab(initialTab)
  }, [isOpen, initialTab, hasRecurrenceTab, transaction?.id])

  // Função para buscar anexos
  const fetchAnexos = async () => {
    if (!transaction?.id) return

    setLoadingAnexos(true)
    try {
      const response = await uploadService.getLancamentoAnexos(Number(transaction.id))
      setAnexos(response.anexos)
      
      // Atualizar dados da transação no pai se o número de anexos mudou
      if (transaction && onTransactionUpdate && response.total_anexos !== transaction.totalAnexos) {
        onTransactionUpdate(transaction.id, {
          totalAnexos: response.total_anexos,
          hasAttachments: response.total_anexos > 0
        })
      }
    } catch (error) {
      console.error("Erro ao buscar anexos:", error)
      customToast.error("Erro ao carregar anexos")
    } finally {
      setLoadingAnexos(false)
    }
  }

  // Função para recarregar dados da transação
  const reloadTransactionData = async () => {
    if (!transaction?.id) return

    try {
      // Buscar dados atualizados da transação
      const updatedTransaction = await getLancamentoById(Number(transaction.id))
      
      // Atualizar método de pagamento se existe
      if (updatedTransaction.id_forma_pgto_conta_caixa) {
        const formasPagamento = await getAllPaymentMethodsContaCaixa()
        const formaPagamento = formasPagamento.find(f => f.id === String(updatedTransaction.id_forma_pgto_conta_caixa))
        if (formaPagamento) {
          setPaymentMethodName(formaPagamento.name)
        }
      } else {
        setPaymentMethodName("Não informado")
      }
    } catch (error) {
      console.error("Erro ao recarregar dados da transação:", error)
    }
  }

  useEffect(() => {
    if (isOpen && transaction) {
      console.log("🔍 Transaction data received in modal:", {
        id: transaction.id,
        cashAccountId: transaction.cashAccountId,
        paymentMethod: transaction.paymentMethod,
        description: transaction.description
      })
      
      const fetchRelatedData = async () => {
        try {
          // Buscar informações da conta caixa usando endpoint específico
          if (transaction.cashAccountName && transaction.cashAccountName !== '-') {
            setCashAccountName(transaction.cashAccountName)
          } else if (transaction.cashAccountId && transaction.cashAccountId !== '') {
            try {
              const account = await getCashAccountById(transaction.cashAccountId)
              if (account) {
                setCashAccountName(account.account)
              } else {
                setCashAccountName(`Conta não encontrada (ID: ${transaction.cashAccountId})`)
              }
            } catch (error) {
              console.error("🔍 Error fetching cash account:", error)
              setCashAccountName(`Erro ao buscar conta (ID: ${transaction.cashAccountId})`)
            }
          } else {
            console.log("🔍 No cashAccountId provided:", transaction.cashAccountId)
            setCashAccountName(transaction.permutado ? "Permutado" : "-")
          }

          if (transaction.paymentMethod) {
            const methods = await getAllPaymentMethods()
            const method = methods.find((m) => m.id === transaction.paymentMethod)
            if (method) {
              setPaymentMethodName(method.name)
            }
          }

          // Buscar informações da operação, navio e porto
          if (transaction.operationId) {
            const operations = await getAllOperations()
            const operation = operations.find((op) => op.id === transaction.operationId)
            if (operation) {
              setOperationData(operation)

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
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados relacionados:", error)
        }
      }

      fetchRelatedData()
      fetchAnexos()
      reloadTransactionData()

      // Buscar cobranças Asaas vinculadas ao lançamento
      if (transaction.id) {
        getAsaasCobrancas(1, 10, { id_lancamento: Number(transaction.id) })
          .then(res => setAsaasCobrancas(res.data || []))
          .catch(() => setAsaasCobrancas([]))
      }
    }
  }, [isOpen, transaction])

  if (!transaction) return null

  // Função para calcular valor total com ajustes
  const calculateTotalValueWithAdjustments = (): number => {
    const baseValue = transaction.paidValue || transaction.value
    const adjustments = transaction.jurosDescontoAssociados || []
    
    if (adjustments.length === 0) return baseValue
    
    return adjustments.reduce((total, adj) => {
      const adjValue = parseFloat(adj.valor.toString())
      if (adj.tipo === 'juros') {
        return total + adjValue
      } else {
        return total - adjValue
      }
    }, baseValue)
  }

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

  // Extrair informações da parcela do código (ex: LANC3541-3/5 -> Parcela 3 de 5)
  const getInstallmentInfo = (code: string): { current: number; total: number } | null => {
    try {
      const parts = code.split("-")
      if (parts.length < 2) return null

      const installmentPart = parts[1]
      const installmentInfo = installmentPart.split("/")

      if (installmentInfo.length !== 2) return null

      const current = Number.parseInt(installmentInfo[0])
      const total = Number.parseInt(installmentInfo[1])

      if (isNaN(current) || isNaN(total)) return null

      return { current, total }
    } catch (error) {
      return null
    }
  }

  // Verificar se o código atual é parte de uma recorrência
  const isRecurring = getInstallmentInfo(transaction.code ?? "") !== null

  // Ordenar recorrências por número da parcela
  const sortedRecurrenceData = [...recurrenceData].sort((a, b) => {
    const infoA = getInstallmentInfo(a.code ?? "")
    const infoB = getInstallmentInfo(b.code ?? "")

    if (!infoA && !infoB) return 0
    if (!infoA) return 1
    if (!infoB) return -1

    return infoA.current - infoB.current
  })

  // Callbacks para upload
  const handleUploadComplete = (response: MultiUploadResponse) => {
    customToast.success(`${response.total_enviados} arquivo(s) enviado(s) com sucesso!`, {
      position: "top-right"
    })
    fetchAnexos() // Recarregar lista de anexos
    
    // Atualizar dados da transação no pai para refletir novos anexos
    if (transaction?.id && onTransactionUpdate) {
      const newTotalAnexos = anexos.length + response.total_enviados
      onTransactionUpdate(transaction.id, {
        totalAnexos: newTotalAnexos,
        hasAttachments: newTotalAnexos > 0
      })
    }
  }

  const handleRemoveAnexo = (anexoId: number) => {
    setAnexos(prev => {
      const newAnexos = prev.filter(anexo => anexo.id_arquivo !== anexoId)
      
      // Atualizar dados da transação no pai para refletir remoção do anexo
      if (transaction?.id && onTransactionUpdate) {
        const newTotalAnexos = newAnexos.length
        onTransactionUpdate(transaction.id, {
          totalAnexos: newTotalAnexos,
          hasAttachments: newTotalAnexos > 0
        })
      }
      
      return newAnexos
    })
  }

  const renderActionsSummary = () => (
    <div className="flex items-center justify-between w-full">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Última atualização: {formatDate(new Date())}
      </div>
      <div className="flex items-center gap-2">
        {transaction.status !== "baixado" && onDeleteTransaction && (
          <Button
            variant="destructive"
            onClick={() => {
              onClose()
              onDeleteTransaction(transaction)
            }}
            className="px-6"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="px-6">
          Fechar
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden dark:bg-slate-900 dark:border-slate-700">
        <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white">Detalhes do Lançamento</DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-300 mt-1">
                  Código: <span className="font-medium text-slate-800 dark:text-white">{transaction.code}</span>
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${
                  transaction.type === "entrada"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-red-100 text-red-700 border-red-200"
                } rounded-full px-3 py-1 flex items-center gap-1.5 font-semibold`}
              >
                {transaction.type === "entrada" ? (
                  <>
                    <Plus className="h-3 w-3" />
                    <span>Entrada</span>
                  </>
                ) : (
                  <>
                    <Minus className="h-3 w-3" />
                    <span>Saída</span>
                  </>
                )}
              </Badge>
              <Badge 
                className={
                  transaction.status === "baixado"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : transaction.status === "cancelado"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                }
              >
                { transaction.status === "baixado"
                  ? "Baixado"
                  : transaction.status === "cancelado"
                    ? "Cancelado"
                    : "Pendente"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${hasRecurrenceTab ? 'grid-cols-4' : 'grid-cols-3'} mb-6 dark:bg-slate-800`}>
              <TabsTrigger value="capa" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Financeiro
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
              {hasRecurrenceTab && (
                <TabsTrigger value="historico" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recorrência
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="capa" className="space-y-6">
              {/* Seção principal com informações destacadas */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full mx-auto mb-3">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Valor Total (com Ajustes)</p>
                    <p className={`text-2xl font-bold flex items-center gap-2 justify-center ${
                      transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'entrada' ? (
                        <>
                          <Plus className="h-6 w-6" />
                          <span>{formatCurrency(calculateTotalValueWithAdjustments())}</span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-6 w-6" />
                          <span>{formatCurrency(calculateTotalValueWithAdjustments())}</span>
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Vencimento</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">{formatDate(transaction.dueDate)}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full mx-auto mb-3">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Pessoa</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-white">{transaction.clientName || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Informações Básicas
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Código do Lançamento</label>
                    <div className="text-slate-800 dark:text-white font-mono bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{transaction.code}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Competência</label>
                    <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{transaction.competence || "Não informado"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Data de Emissão</label>
                    <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{formatDate(transaction.date)}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Tipo de Transação</label>
                    <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{transaction.transactionTypeName || "Não informado"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Unidade de Negócio</label>
                    <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{transaction.businessUnitName || "Não informado"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Documento</label>
                    <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{transaction.document || "Não informado"}</div>
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Descrição</label>
                    <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600 min-h-[80px]">{transaction.description}</div>
                  </div>
                </div>
              </div>

              {/* Informações da Operação */}
              {operationData && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-blue-600" />
                      Informações da Operação
                    </h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Código da Operação</label>
                      <div className="text-slate-800 bg-slate-50 px-3 py-2 rounded-md border font-mono">{operationData.code}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Viagem</label>
                      <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{operationData.voyage || "Não informado"}</div>
                    </div>
                    
                    {shipData && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Navio</label>
                        <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{shipData.shipName}</div>
                      </div>
                    )}
                    
                    {portData && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Porto</label>
                        <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{portData.name}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/80 dark:bg-slate-800">
                {renderActionsSummary()}
              </div>
            </TabsContent>

            <TabsContent value="detalhes" className="space-y-6">
              {/* Status de Pagamento */}
              <div className={`rounded-lg p-6 border-2 ${
                 transaction.status === 'baixado'
                  ? 'bg-green-50 border-green-200'
                  : transaction.status === 'cancelado'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Status do Pagamento</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      {transaction.paymentDate
                        ? `Baixado em ${formatDate(transaction.paymentDate)}`
                        : transaction.status === 'cancelado'
                          ? 'Pagamento cancelado'
                          : `Vencimento em ${formatDate(transaction.dueDate)}`
                      }
                    </p>
                  </div>
                  <Badge 
                    className={`text-lg px-4 py-2 ${
                       transaction.status === "baixado"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : transaction.status === "cancelado"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    }`}
                  >
                    { transaction.status === "baixado"
                      ? "Baixado"
                      : transaction.status === "cancelado"
                        ? "Cancelado"
                        : "Pendente"}
                  </Badge>
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Informações Financeiras
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Conta Caixa</label>
                    <div className={`text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600 ${cashAccountName === "-" ? "text-center" : ""}`}>{cashAccountName || "Não informado"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Método de Pagamento</label>
                    <div className="text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-md border dark:border-slate-600">{paymentMethodName || "Não informado"}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Data de Pagamento</label>
                    <div className={`px-3 py-2 rounded-md border ${
                      transaction.paymentDate 
                        ? 'text-green-800 bg-green-50 border-green-200' 
                        : 'text-slate-800 bg-slate-50'
                    }`}>
                      {transaction.paymentDate ? formatDate(transaction.paymentDate) : "Não pago"}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Valor Líquido (com Ajustes)</label>
                    <div className={`px-3 py-2 rounded-full border font-semibold flex items-center gap-2 justify-center ${
                      transaction.type === 'entrada'
                        ? 'text-green-700 bg-green-100 border-green-200'
                        : 'text-red-700 bg-red-100 border-red-200'
                    }`}>
                      {transaction.type === 'entrada' ? (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>{formatCurrency(calculateTotalValueWithAdjustments())}</span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4" />
                          <span>{formatCurrency(calculateTotalValueWithAdjustments())}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cobranças Asaas vinculadas */}
              {asaasCobrancas.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-orange-200 dark:border-orange-700 shadow-sm">
                  <div className="px-6 py-4 border-b border-orange-200 dark:border-orange-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Barcode className="h-5 w-5 text-orange-600" />
                      Cobrancas Asaas
                      <Badge className="bg-orange-100 text-orange-800 border border-orange-300">
                        {asaasCobrancas.length}
                      </Badge>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {asaasCobrancas.map((cob) => (
                      <div key={cob.id_asaas_cobranca} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{cob.descricao}</span>
                            <Badge className={
                              cob.status === 'RECEIVED' || cob.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-700'
                                : cob.status === 'OVERDUE'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }>
                              {cob.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 flex gap-3">
                            <span>{formatCurrency(Number(cob.valor))}</span>
                            <span>{cob.forma_pagamento}</span>
                            <span>Venc: {cob.data_vencimento}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {cob.invoice_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => window.open(cob.invoice_url!, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Fatura
                            </Button>
                          )}
                          {cob.bank_slip_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => window.open(cob.bank_slip_url!, '_blank')}
                            >
                              <Barcode className="h-3 w-3 mr-1" />
                              Boleto
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="anexos" className="space-y-6">
              {/* Upload de novos arquivos */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-blue-600" />
                    Adicionar Anexos
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">Faça upload de documentos relacionados a este lançamento</p>
                </div>
                <div className="p-6">
                  <MultiFileUpload
                    lancamentoId={Number(transaction.id)}
                    onUploadComplete={handleUploadComplete}
                    maxFiles={10}
                  />
                </div>
              </div>

              {/* Lista de anexos existentes */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
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
                      lancamentoId={Number(transaction.id)}
                      anexos={anexos}
                      onRemoveAnexo={handleRemoveAnexo}
                      onUpdateAnexo={(anexoId, updatedAnexo) => {
                        setAnexos(prev =>
                          prev.map(anexo =>
                            anexo.id_arquivo === anexoId ? { ...anexo, ...updatedAnexo } : anexo
                          )
                        )
                      }}
                      onRefresh={fetchAnexos}
                    />
                  )}
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/80 dark:bg-slate-800">
                {renderActionsSummary()}
              </div>
            </TabsContent>

            <TabsContent value="historico" className="space-y-6">
              {hasRecurrenceTab ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Histórico de Recorrência
                      <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                        {recurrenceData.length} {recurrenceData.length === 1 ? 'lançamento' : 'lançamentos'}
                      </Badge>
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">Todos os lançamentos desta série recorrente</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-200">Vencimento</th>
                          <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-200">Valor</th>
                          <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-200">Status</th>
                          <th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-200">Pagamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-600">
                        {sortedRecurrenceData.map((item, index) => {
                          const isCurrentTransaction = item.id === transaction.id
                          return (
                            <tr 
                              key={index} 
                              className={`hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                                isCurrentTransaction ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                              }`}
                            >
                              <td className="p-4 text-slate-700 dark:text-slate-200">{formatDate(item.dueDate)}</td>
                              <td className="p-4 font-semibold text-slate-800 dark:text-white">{formatCurrency(item.value)}</td>
                              <td className="p-4">
                                <Badge className={getStatusColor(item.status)}>
                                  {( item.status === "baixado") ? "Baixado" : item.status === "cancelado" ? "Cancelado" : "Pendente"}
                                </Badge>
                              </td>
                              <td className="p-4 text-slate-700 dark:text-slate-200">
                                {item.paymentDate ? (
                                  <span className="text-green-700 font-medium">{formatDate(item.paymentDate)}</span>
                                ) : (
                                  <span className="text-slate-400">Não pago</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : isRecurring ? (
                <div className="bg-white rounded-lg border border-yellow-200 shadow-sm">
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Recorrência Não Encontrada</h3>
                    <p className="text-slate-600">Não foi possível encontrar outras parcelas relacionadas a este lançamento.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Lançamento Único</h3>
                    <p className="text-slate-600">Este lançamento não faz parte de uma recorrência.</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4">
          {renderActionsSummary()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
