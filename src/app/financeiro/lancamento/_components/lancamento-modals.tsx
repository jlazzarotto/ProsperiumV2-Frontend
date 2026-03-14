"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Loader2, FileText, Barcode } from "lucide-react"
import { TransactionModal } from "@/components/transaction-modal"
import { PaymentModal } from "@/components/payment-modal"
import { CancelPaymentModal } from "@/components/cancel-payment-modal"
import { TransactionDetailsModal } from "@/components/transaction-details-modal"
import { RecurringTransactionModal } from "@/components/recurring-transaction-modal"
import { RecurringDeleteModal } from "@/components/recurring-delete-modal"
import { RecurringEditModal, type EditScope } from "@/components/recurring-edit-modal"
import type { Transaction } from "@/app/services/transaction-service"
import type { FinancialTransaction, LancamentoFilter } from "@/types/types"
import {
  createAsaasCobranca,
  createAsaasNotaFiscal,
  getAsaasConfigByPessoa,
  type CreateAsaasCobrancaDto,
  type CreateAsaasNotaFiscalDto,
} from "@/services/asaas-service"
import { format } from "date-fns"
import customToast from "@/components/ui/custom-toast"

interface LancamentoModalsProps {
  // Transaction modal
  isModalOpen: boolean
  setIsModalOpen: (v: boolean) => void
  currentTransactionForModal: Transaction | null
  setCurrentTransactionForModal: (v: Transaction | null) => void
  recurringEditScope: EditScope | null
  setRecurringEditScope: (v: EditScope | null) => void
  onModalSuccess: () => void
  onDeleteFromTransactionModal: (id: number) => void
  onOpenEditAfterCreate: (id: number) => void

  // Payment modal
  isPaymentModalOpen: boolean
  setIsPaymentModalOpen: (v: boolean) => void

  // Cancel payment modal
  isCancelPaymentModalOpen: boolean
  setIsCancelPaymentModalOpen: (v: boolean) => void
  onEditAfterCancel: (tx: FinancialTransaction) => void

  // Details modal
  isTransactionDetailsModalOpen: boolean
  setIsTransactionDetailsModalOpen: (v: boolean) => void
  transactionDetailsInitialTab: "capa" | "detalhes" | "anexos" | "historico"
  setTransactionDetailsInitialTab: (v: "capa" | "detalhes" | "anexos" | "historico") => void
  relatedTransactions: FinancialTransaction[]
  onTransactionUpdate: (id: string, data: Partial<FinancialTransaction>) => void
  hasDeletePermission: boolean
  onDeleteTransaction: (tx: FinancialTransaction) => void

  // Recurring modals
  isRecurringModalOpen: boolean
  setIsRecurringModalOpen: (v: boolean) => void
  isRecurringDeleteModalOpen: boolean
  setIsRecurringDeleteModalOpen: (v: boolean) => void
  isRecurringEditModalOpen: boolean
  setIsRecurringEditModalOpen: (v: boolean) => void
  onRecurringEditScopeSelected: (scope: EditScope, tx: FinancialTransaction) => void

  // Delete dialogs
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (v: boolean) => void
  isDeleteManyDialogOpen: boolean
  setIsDeleteManyDialogOpen: (v: boolean) => void
  selectedTransactionsCount: number
  onConfirmDelete: () => void
  onConfirmDeleteMany: () => void

  // Boleto modal
  isBoletoModalOpen: boolean
  setIsBoletoModalOpen: (v: boolean) => void
  boletoTransaction: FinancialTransaction | null

  // Shared
  currentTransaction: FinancialTransaction | undefined
  loading: boolean
  onSave: () => void | Promise<void>
}

export function LancamentoModals(props: LancamentoModalsProps) {
  const {
    isModalOpen, setIsModalOpen,
    currentTransactionForModal, setCurrentTransactionForModal,
    recurringEditScope, setRecurringEditScope,
    onModalSuccess, onDeleteFromTransactionModal, onOpenEditAfterCreate,
    isPaymentModalOpen, setIsPaymentModalOpen,
    isCancelPaymentModalOpen, setIsCancelPaymentModalOpen, onEditAfterCancel,
    isTransactionDetailsModalOpen, setIsTransactionDetailsModalOpen,
    transactionDetailsInitialTab, setTransactionDetailsInitialTab,
    relatedTransactions, onTransactionUpdate, hasDeletePermission, onDeleteTransaction,
    isRecurringModalOpen, setIsRecurringModalOpen,
    isRecurringDeleteModalOpen, setIsRecurringDeleteModalOpen,
    isRecurringEditModalOpen, setIsRecurringEditModalOpen, onRecurringEditScopeSelected,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    isDeleteManyDialogOpen, setIsDeleteManyDialogOpen,
    selectedTransactionsCount, onConfirmDelete, onConfirmDeleteMany,
    isBoletoModalOpen, setIsBoletoModalOpen, boletoTransaction,
    currentTransaction, loading, onSave,
  } = props

  // Boleto form state
  const [emissaoTipo, setEmissaoTipo] = useState<'boleto' | 'nf' | 'boleto_nf'>('boleto')
  const [boletoFormData, setBoletoFormData] = useState({
    valor: 0,
    descricao: '',
    data_vencimento: '',
    forma_pagamento: 'BOLETO' as 'BOLETO' | 'PIX' | 'CREDIT_CARD',
  })
  const [boletoSubmitting, setBoletoSubmitting] = useState(false)

  // Reset boleto form when modal opens
  React.useEffect(() => {
    if (boletoTransaction && isBoletoModalOpen) {
      setEmissaoTipo('boleto')
      setBoletoFormData({
        valor: boletoTransaction.value,
        descricao: boletoTransaction.description,
        data_vencimento: format(boletoTransaction.dueDate, 'yyyy-MM-dd'),
        forma_pagamento: 'BOLETO',
      })
    }
  }, [boletoTransaction, isBoletoModalOpen])

  const handleSubmitBoleto = async () => {
    if (!boletoTransaction) return

    const empresaId = (boletoTransaction as any).empresaId || boletoTransaction.businessUnitId
    if (!empresaId) { customToast.error('Lancamento sem empresa associada'); return }
    if (!boletoTransaction.clientId) { customToast.error('Lancamento sem pessoa/cliente'); return }

    setBoletoSubmitting(true)
    try {
      const config = await getAsaasConfigByPessoa(Number(empresaId))
      if (!config || !config.status) {
        customToast.error('Esta unidade de negocio nao possui configuracao do Asaas. Configure primeiro em Asaas > Configuracao.')
        setBoletoSubmitting(false)
        return
      }

      const resultados: string[] = []

      if (emissaoTipo === 'boleto' || emissaoTipo === 'boleto_nf') {
        const payload: CreateAsaasCobrancaDto = {
          id_asaas_unidade_negocio: config.id_asaas_unidade_negocio,
          id_pessoa: Number(boletoTransaction.clientId),
          valor: boletoFormData.valor,
          descricao: boletoFormData.descricao,
          data_vencimento: boletoFormData.data_vencimento,
          forma_pagamento: boletoFormData.forma_pagamento,
          external_reference: `lancamento_${boletoTransaction.id}`,
          id_lancamento: Number(boletoTransaction.id),
          cliente_nome: boletoTransaction.clientName || undefined,
        }
        await createAsaasCobranca(payload)
        resultados.push('Cobranca')
      }

      if (emissaoTipo === 'nf' || emissaoTipo === 'boleto_nf') {
        const nfPayload: CreateAsaasNotaFiscalDto = {
          id_asaas_unidade_negocio: config.id_asaas_unidade_negocio,
          id_pessoa: Number(boletoTransaction.clientId),
          tipo_operacao: 'WITHOUT_PAYMENT',
          descricao_servico: boletoFormData.descricao,
          valor_servicos: boletoFormData.valor,
          data_competencia: boletoFormData.data_vencimento,
          cliente_nome: boletoTransaction.clientName || undefined,
        }
        await createAsaasNotaFiscal(nfPayload)
        resultados.push('Nota Fiscal')
      }

      customToast.success(`${resultados.join(' e ')} criada com sucesso!`)
      setIsBoletoModalOpen(false)
    } catch (error: any) {
      customToast.error(error.response?.data?.message || error.response?.data?.error || 'Erro ao emitir')
    } finally {
      setBoletoSubmitting(false)
    }
  }

  return (
    <>
      {/* Modal de cadastro/edição de lançamento */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setRecurringEditScope(null) }}
        onSuccess={onModalSuccess}
        transaction={currentTransactionForModal}
        recurringEditScope={recurringEditScope}
        onDeleteTransaction={onDeleteFromTransactionModal}
        onOpenEditAfterCreate={onOpenEditAfterCreate}
      />

      {/* Modal de recorrência */}
      <RecurringTransactionModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        transaction={currentTransaction as Partial<FinancialTransaction>}
        onSave={onSave}
      />

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o lançamento <span className="font-bold">{currentTransaction?.code}</span>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={onConfirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        transaction={currentTransaction}
        onSave={async () => { onSave() }}
      />

      <CancelPaymentModal
        isOpen={isCancelPaymentModalOpen}
        onClose={() => setIsCancelPaymentModalOpen(false)}
        transaction={currentTransaction}
        onSave={async () => { onSave() }}
        onOpenEditModal={onEditAfterCancel}
      />

      <TransactionDetailsModal
        isOpen={isTransactionDetailsModalOpen}
        onClose={() => { setIsTransactionDetailsModalOpen(false); setTransactionDetailsInitialTab("capa") }}
        transaction={currentTransaction}
        recurrenceData={relatedTransactions}
        onTransactionUpdate={onTransactionUpdate}
        initialTab={transactionDetailsInitialTab}
        onDeleteTransaction={hasDeletePermission ? onDeleteTransaction : undefined}
      />

      {/* Dialog de confirmação para exclusão em massa */}
      <AlertDialog open={isDeleteManyDialogOpen} onOpenChange={setIsDeleteManyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedTransactionsCount} lançamento(s)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDeleteMany} className="bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecurringDeleteModal
        isOpen={isRecurringDeleteModalOpen}
        onClose={() => setIsRecurringDeleteModalOpen(false)}
        transaction={currentTransaction || null}
        onSuccess={() => { setIsRecurringDeleteModalOpen(false); onSave() }}
      />

      <RecurringEditModal
        isOpen={isRecurringEditModalOpen}
        onClose={() => setIsRecurringEditModalOpen(false)}
        transaction={currentTransaction || null}
        onSelectScope={onRecurringEditScopeSelected}
      />

      {/* Modal de Emitir Boleto/Nota Fiscal Asaas */}
      <Dialog open={isBoletoModalOpen} onOpenChange={setIsBoletoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-orange-600" />
              Emitir via Asaas
            </DialogTitle>
            <DialogDescription>
              Escolha o que deseja emitir a partir deste lancamento
            </DialogDescription>
          </DialogHeader>

          {boletoTransaction && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Lancamento:</span>
                  <span className="font-medium">{boletoTransaction.description}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Cliente:</span>
                  <span className="font-medium">{boletoTransaction.clientName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unidade:</span>
                  <span className="font-medium">{boletoTransaction.businessUnitName || '-'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>O que deseja emitir?</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEmissaoTipo('boleto')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      emissaoTipo === 'boleto' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Barcode className={`h-5 w-5 mx-auto mb-1 ${emissaoTipo === 'boleto' ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${emissaoTipo === 'boleto' ? 'text-orange-700' : 'text-gray-500'}`}>So Boleto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmissaoTipo('nf')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      emissaoTipo === 'nf' ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className={`h-5 w-5 mx-auto mb-1 ${emissaoTipo === 'nf' ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${emissaoTipo === 'nf' ? 'text-purple-700' : 'text-gray-500'}`}>So Nota Fiscal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmissaoTipo('boleto_nf')}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      emissaoTipo === 'boleto_nf' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-center gap-0.5 mb-1">
                      <Barcode className={`h-4 w-4 ${emissaoTipo === 'boleto_nf' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <FileText className={`h-4 w-4 ${emissaoTipo === 'boleto_nf' ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <span className={`text-xs font-medium ${emissaoTipo === 'boleto_nf' ? 'text-blue-700' : 'text-gray-500'}`}>Boleto + NF</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="boleto_valor">Valor</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <Input
                      id="boleto_valor"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-10"
                      value={boletoFormData.valor || ''}
                      onChange={(e) => setBoletoFormData({ ...boletoFormData, valor: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boleto_vencimento">{emissaoTipo === 'nf' ? 'Data Competencia' : 'Vencimento'}</Label>
                  <Input
                    id="boleto_vencimento"
                    type="date"
                    value={boletoFormData.data_vencimento}
                    onChange={(e) => setBoletoFormData({ ...boletoFormData, data_vencimento: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="boleto_descricao">Descricao</Label>
                <Input
                  id="boleto_descricao"
                  value={boletoFormData.descricao}
                  onChange={(e) => setBoletoFormData({ ...boletoFormData, descricao: e.target.value })}
                />
              </div>

              {(emissaoTipo === 'boleto' || emissaoTipo === 'boleto_nf') && (
                <div className="space-y-2">
                  <Label htmlFor="boleto_forma">Forma de Pagamento</Label>
                  <select
                    id="boleto_forma"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={boletoFormData.forma_pagamento}
                    onChange={(e) => setBoletoFormData({ ...boletoFormData, forma_pagamento: e.target.value as 'BOLETO' | 'PIX' | 'CREDIT_CARD' })}
                  >
                    <option value="BOLETO">Boleto Bancario</option>
                    <option value="PIX">PIX</option>
                    <option value="CREDIT_CARD">Cartao de Credito</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBoletoModalOpen(false)} disabled={boletoSubmitting}>Cancelar</Button>
            <Button
              onClick={handleSubmitBoleto}
              disabled={boletoSubmitting}
              className={
                emissaoTipo === 'nf' ? 'bg-gradient-to-r from-purple-600 to-indigo-700'
                : emissaoTipo === 'boleto_nf' ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                : 'bg-gradient-to-r from-orange-600 to-amber-700'
              }
            >
              {boletoSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : emissaoTipo === 'nf' ? <FileText className="h-4 w-4 mr-2" /> : <Barcode className="h-4 w-4 mr-2" />}
              {emissaoTipo === 'boleto' ? 'Emitir Cobranca' : emissaoTipo === 'nf' ? 'Emitir Nota Fiscal' : 'Emitir Boleto + NF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
