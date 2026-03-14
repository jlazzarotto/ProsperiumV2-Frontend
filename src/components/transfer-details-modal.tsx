/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Receipt, ArrowDownLeft, ArrowUpRight, Eye } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Transfer, FinancialTransaction } from "@/types/types"
import customToast from "./ui/custom-toast"
import { httpClient } from "@/lib/http-client"
import { TransactionDetailsModal } from "./transaction-details-modal"

interface TransferDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  transfer: Transfer | null
}

interface TransactionDetail {
  id_lancamento: number
  data_lancamento: string
  data_vencimento: string
  data_pagamento?: string
  descricao: string
  valor: string
  id_conta_caixa: number
  conta_nome?: string
  banco_nome?: string
  tipo_natureza: string // 'debito' ou 'credito'
  status: string
}

export function TransferDetailsModal({ isOpen, onClose, transfer }: TransferDetailsModalProps) {
  const [transactions, setTransactions] = useState<TransactionDetail[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | undefined>(undefined)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen && transfer) {
      loadTransactionDetails()
    }
  }, [isOpen, transfer])

  const loadTransactionDetails = async () => {
    console.log('🔍 Transfer object:', transfer)
    
    // Verificar se temos os IDs dos lançamentos (pode vir como id_lancamento_origem/destino ou como IDs diretos)
    const origemId = transfer?.id_lancamento_origem || (transfer as any)?.id_origem || (transfer as any)?.id_lancamento_origem
    const destinoId = transfer?.id_lancamento_destino || (transfer as any)?.id_destino || (transfer as any)?.id_lancamento_destino
    
    console.log('🔍 IDs encontrados:', { origemId, destinoId })
    
    if (!origemId || !destinoId) {
      customToast.error("IDs dos lançamentos não encontrados")
      console.error('❌ IDs não encontrados:', {
        id_lancamento_origem: transfer?.id_lancamento_origem,
        id_lancamento_destino: transfer?.id_lancamento_destino,
        transfer_full: transfer
      })
      return
    }

    setIsLoading(true)
    try {
      // Buscar os dois lançamentos da transferência usando os IDs corretos
      const [origemResponse, destinoResponse] = await Promise.all([
        httpClient.get(`/lancamentos/${origemId}`),
        httpClient.get(`/lancamentos/${destinoId}`)
      ])

      const transactionsList: TransactionDetail[] = []
      
      if (origemResponse) {
        transactionsList.push({
          ...origemResponse,
          tipo_natureza: 'debito'
        } as any)
      }
      
      if (destinoResponse) {
        transactionsList.push({
          ...destinoResponse,
          tipo_natureza: 'credito'
        } as any)
      }

      setTransactions(transactionsList)
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error)
      customToast.error("Erro ao carregar detalhes dos lançamentos")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-600 flex items-center">
            <Receipt className="mr-2 h-6 w-6" />
            Detalhes da Transferência #{transfer?.code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações da Transferência */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">Informações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-slate-600">Descrição:</span>
                <p className="text-slate-800">{transfer?.description || '-'}</p>
              </div>
              <div>
                <span className="font-medium text-slate-600">Valor:</span>
                <p className="text-slate-800 font-bold text-lg">{transfer?.value}</p>
              </div>
              <div>
                <span className="font-medium text-slate-600">Data:</span>
                <p className="text-slate-800">
                  {transfer?.date ? format(new Date(transfer.date), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                </p>
              </div>
              <div>
                <span className="font-medium text-slate-600">Status:</span>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Concluída
                </Badge>
              </div>
            </div>
          </div>

          {/* Contas Envolvidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold mb-2 text-red-700 flex items-center">
                <ArrowUpRight className="mr-2 h-5 w-5" />
                Conta Origem (Débito)
              </h3>
              <p className="text-red-800">{transfer?.origem}</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold mb-2 text-green-700 flex items-center">
                <ArrowDownLeft className="mr-2 h-5 w-5" />
                Conta Destino (Crédito)
              </h3>
              <p className="text-green-800">{transfer?.destino}</p>
            </div>
          </div>

          {/* Lançamentos Detalhados */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-800">Lançamentos Gerados</h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Carregando detalhes...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div 
                    key={(transaction as any).id_lcto || (transaction as any).id_lancamento}
                    className={`p-4 rounded-lg border ${
                      transaction.tipo_natureza === 'debito' 
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20' 
                        : 'bg-green-50 border-green-200 dark:bg-green-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {transaction.tipo_natureza === 'debito' ? (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            )}
                            <span className={`font-semibold ${
                              transaction.tipo_natureza === 'debito' ? 'text-red-700' : 'text-green-700'
                            }`}>
                              {transaction.tipo_natureza === 'debito' ? 'Débito (Saída)' : 'Crédito (Entrada)'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              ID: {transaction.id_lancamento}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                // Buscar dados completos do lançamento para o modal
                                const response = await httpClient.get(`/lancamentos/${transaction.id_lancamento}`)
                                
                                // Mapear dados da API para o formato esperado pelo FinancialTransaction
                                const mappedTransaction: FinancialTransaction = {
                                  id: (response as any).id_lancamento?.toString(),
                                  code: (response as any).id_lancamento?.toString(),
                                  date: new Date((response as any).data_lancamento),
                                  dueDate: new Date((response as any).data_vencimento),
                                  paymentDate: (response as any).data_pagamento ? new Date((response as any).data_pagamento) : null,
                                  description: (response as any).descricao,
                                  value: typeof (response as any).valor === 'string' ? parseFloat((response as any).valor) : (response as any).valor,
                                  type: (response as any).natureza === 'credito' ? 'entrada' : 'saida',
                                  status: (response as any).data_pagamento ? 'baixado' : 'pendente',
                                  transactionTypeId: (response as any).id_conta_contabil?.toString() || '',
                                  transactionTypeName: (response as any).tipo_nome || 'N/A',
                                  cashAccountId: (response as any).id_conta_caixa?.toString() || '',
                                  cashAccountName: (response as any).conta_nome || (transaction as any).conta_nome || 'N/A',
                                  clientId: (response as any).id_pessoa?.toString(),
                                  clientName: (response as any).pessoa_nome || 'N/A',
                                  businessUnitId: (response as any).id_un_negocio?.toString(),
                                  businessUnitName: (response as any).un_negocio_nome || 'N/A',
                                  operationId: (response as any).id_operacao?.toString(),
                                  operationCode: (response as any).operacao_codigo,
                                  document: (response as any).numero_documento,
                                  competence: (response as any).competencia?.toString(),
                                  createdAt: (response as any).created_at,
                                  lastUpdatedAt: (response as any).updated_at
                                }
                                
                                setSelectedTransaction(mappedTransaction)
                                setIsTransactionModalOpen(true)
                              } catch (error) {
                                console.error('Erro ao carregar lançamento:', error)
                                customToast.error('Erro ao carregar detalhes do lançamento')
                              }
                            }}
                            className="h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 hover:border-blue-300 transition-colors"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Detalhes
                          </Button>
                        </div>
                        
                        <p className="text-slate-700 mb-2">{transaction.descricao}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-slate-500">Emissão:</span>
                            <p>{formatDate(transaction.data_lancamento)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-500">Vencimento:</span>
                            <p>{formatDate(transaction.data_vencimento)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-500">Pagamento:</span>
                            <p>{transaction.data_pagamento ? formatDate(transaction.data_pagamento) : 'Pendente'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-500">Status:</span>
                            <Badge className={transaction.status === 'baixado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {transaction.status === 'baixado' ? 'Baixado' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-lg font-bold ${
                          transaction.tipo_natureza === 'debito' ? 'text-red-700' : 'text-green-700'
                        }`}>
                          {transaction.tipo_natureza === 'debito' ? '-' : '+'}{formatCurrency(transaction.valor)}
                        </p>
                        <p className="text-sm text-slate-500">Conta: {transaction.id_conta_caixa}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Receipt className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum lançamento detalhado encontrado</p>
                    <p className="text-sm">Os lançamentos podem ter sido criados em versões anteriores</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            <Eye className="mr-2 h-4 w-4" />
            Fechar
          </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do lançamento */}
      <TransactionDetailsModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transaction={selectedTransaction}
      />
    </>
  )
}