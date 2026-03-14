/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { DatePickerInput } from "@/components/date-picker-input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { baixarLancamento, updateLancamento, getLancamentoById } from "@/app/services/lancamento-service"
import { getAllPaymentMethods, getPaymentMethodsByAccount } from "@/app/services/payment-method-service"
import { getActiveCashAccounts, getCashAccountById } from "@/app/services/cash-account-api-service"
import { getBankAgencyById, getAllBankAgencies } from "@/app/services/bank-agency-service"
import { fetchBanksFromAPI } from "@/app/services/bank-service"
import { getAllPeople } from "@/app/services/person-api-service"
import { getAllBusinessUnits } from "@/app/services/business-unit-api-service"
import { getAllPorts } from "@/app/services/port-service"
import { getAllShips } from "@/app/services/ship-service"
// import { getAllOperations } from "@/app/services/operation-service"
import type { FinancialTransaction, PaymentMethod, CashAccount, User, Person, BusinessUnit, Port, Ship, Operation, Lancamento } from "@/types/types"
import customToast from "@/components/ui/custom-toast"
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
import { Loader2, AlertTriangle, Info, DollarSign, CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: FinancialTransaction | undefined
  onSave: () => Promise<void>
  currentUser?: User
}

const COMPENSACAO_CREDITO_ID = "compensacao-credito"

export function PaymentModal({ isOpen, onClose, transaction, onSave, currentUser }: PaymentModalProps) {
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())
  const [paymentValue, setPaymentValue] = useState<string>("")
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [showInterestDialog, setShowInterestDialog] = useState(false)
  const [showPartialPaymentDialog, setShowPartialPaymentDialog] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState<PaymentMethod[]>([])
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [interestValue, setInterestValue] = useState<number>(0)
  const [remainingValue, setRemainingValue] = useState<number>(0)
  const [people, setPeople] = useState<Person[]>([])
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [ports, setPorts] = useState<Port[]>([])
  const [ships, setShips] = useState<Ship[]>([])
  // const [operations, setOperations] = useState<Operation[]>([])
  const [transactionDetails, setTransactionDetails] = useState<Lancamento | null>(null)
  const [accountBankInfo, setAccountBankInfo] = useState<Map<string, string>>(new Map()) // Map<accountId, bankName>
  const [parcelas, setParcelas] = useState<number>(1)
  const [valorParcela, setValorParcela] = useState<string>("")
  const selectedAccountObj = cashAccounts.find(a => a.id === selectedAccount)

  // Detectar se a forma de pagamento selecionada é cartão de crédito
  const selectedMethodObj = filteredPaymentMethods.find(m => m.id === paymentMethod)
  const isCartaoCredito = selectedMethodObj?.tipo === 'cartao_credito'
  const isCompensacaoCredito = selectedAccountObj?.isCompensacaoCredito === true

  const withCompensacaoCreditoOption = (accounts: CashAccount[]) => ([
    ...accounts,
    {
      id: COMPENSACAO_CREDITO_ID,
      code: COMPENSACAO_CREDITO_ID,
      account: "Compensação de crédito",
      isCompensacaoCredito: true,
      businessUnitId: "",
      startDate: new Date(),
      value: "0.00",
      currentBalance: 0,
      accountingAccount: "",
      showInDashboard: false,
      paymentMethods: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  // Carregar métodos de pagamento, contas caixa e outros dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const natureza = transaction?.type ?? null
        const idEmissor = transaction?.clientId ? Number(transaction.clientId) : null

        const [methods, accounts, peopleData, unitsData, portsData, shipsData, allAgencies] = await Promise.all([
          getAllPaymentMethods(),
          getActiveCashAccounts(),
          getAllPeople(),
          getAllBusinessUnits(),
          getAllPorts(),
          getAllShips(),
          getAllBankAgencies(),
        ])
        setPaymentMethods(methods)
        setCashAccounts(withCompensacaoCreditoOption(accounts))
        setPeople(peopleData)
        setBusinessUnits(unitsData)
        setPorts(portsData)
        setShips(shipsData)

        // Criar mapa de agencyId -> bankName (igual ao transfer-modal)
        const agencyMap = new Map<string, string>()
        allAgencies.forEach(agency => {
          if (agency.id) {
            agencyMap.set(agency.id, agency.bankName || agency.agencyName || 'Sem banco')
          }
        })
        setAccountBankInfo(agencyMap)

        // Se houver transação, buscar detalhes completos
        if (transaction?.id) {
          try {
            const details = await getLancamentoById(Number(transaction.id))
            setTransactionDetails(details)
          } catch (error) {
            console.error("Erro ao buscar detalhes do lançamento:", error)
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        customToast.error("Erro ao carregar dados necessários")
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen, transaction])

  useEffect(() => {
    if (!isOpen) return

    const natureza = transactionDetails?.natureza ?? transaction?.type ?? null
    const idEmissor = transactionDetails?.id_emissor ?? transactionDetails?.id_pessoa ?? (transaction?.clientId ? Number(transaction.clientId) : null)

    getActiveCashAccounts({
      idEmissor: idEmissor ? Number(idEmissor) : null,
      natureza,
    })
      .then((accounts) => {
        setCashAccounts(withCompensacaoCreditoOption(accounts))
      })
      .catch((error) => {
        console.error("Erro ao recarregar contas caixa com saldo adto:", error)
      })
  }, [isOpen, transactionDetails, transaction?.clientId, transaction?.type])

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      setPaymentDate(new Date())
      setPaymentValue(formatCurrency(transaction.value))
      setSelectedAccount(transaction.cashAccountId || "")
      setPaymentMethod("")
      setDescription(`Pagamento do lançamento ${transaction.code}`)
      setParcelas(1)
      setValorParcela("")
    }
  }, [transaction])

  // Filtrar métodos de pagamento quando a conta for selecionada
  useEffect(() => {
    if (selectedAccount) {
      setPaymentMethod("")
      setParcelas(1)

      const natureza = transactionDetails?.natureza ?? transaction?.type ?? null
      const idEmissor = transactionDetails?.id_emissor ?? transactionDetails?.id_pessoa ?? (transaction?.clientId ? Number(transaction.clientId) : null)
      const idOperacao = transactionDetails?.id_operacao ?? (transaction?.operationId ? Number(transaction.operationId) : null)

      console.log('🔄 Carregando formas de pagamento para conta:', selectedAccount)
      getPaymentMethodsByAccount(selectedAccount, isCompensacaoCredito ? {
        idEmissor: idEmissor ? Number(idEmissor) : null,
        idOperacao: idOperacao ?? null,
        natureza,
      } : undefined)
        .then((methods) => {
          console.log('💳 Formas de pagamento carregadas:', methods)
          setFilteredPaymentMethods(methods)
          if (isCompensacaoCredito && methods.length === 0) {
            setSelectedAccount("")
            customToast.info("Não existe saldo disponível pra compensação de crédito")
          }
        })
        .catch(error => {
          console.error('Erro ao buscar formas de pagamento da conta:', error)
          setFilteredPaymentMethods([])
        })
    } else {
      setPaymentMethod("")
      setFilteredPaymentMethods([])
    }
  }, [selectedAccount, isCompensacaoCredito, transactionDetails, transaction?.clientId, transaction?.type])

  // Função para formatar valor monetário
  const formatMonetaryValue = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/[^\d]/g, '')
    
    if (numbers === '') return ''
    
    // Converte para número e divide por 100 para ter os centavos
    const amount = parseInt(numbers) / 100
    
    // Formata para BRL
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  // Handler para mudança do valor
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatMonetaryValue(e.target.value)
    setPaymentValue(formattedValue)
  }

  // Função para extrair valor numérico da string formatada
  const extractNumericValue = (formattedValue: string): number => {
    const numbersOnly = formattedValue.replace(/[^\d]/g, '')
    return parseInt(numbersOnly || '0') / 100
  }

  const extractSaldoFromOptionLabel = (label: string): number | null => {
    let saldoChars = ""
    let i = label.length - 1
    let currentChar = ""

    if (i < 0) {
      return null
    }

    do {
      currentChar = label[i]
      if (currentChar !== " ") {
        saldoChars = currentChar + saldoChars
      }
      i -= 1
    } while (i >= 0 && currentChar !== " ")

    if (!saldoChars) {
      return null
    }

    const normalizedSaldo = saldoChars.replace(/[^\d.,-]/g, "").replace(",", ".")
    const parsedSaldo = Number(normalizedSaldo)

    return Number.isFinite(parsedSaldo) ? parsedSaldo : null
  }

  // Modificar a validação de data para permitir pagamentos no dia atual
  const handleConfirmPayment = async () => {
    if (!transaction?.id) return

    // Validar campos obrigatórios
    if (!selectedAccount) {
      customToast.error("Selecione uma conta caixa")
      return
    }

    if (!paymentMethod) {
      customToast.error("Selecione um método de pagamento")
      return
    }

    // Validar data de pagamento - permitir pagamentos até o dia atual (inclusive)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Fim do dia atual
    if (paymentDate > today) {
      customToast.error("A data de pagamento não pode ser superior à data atual")
      return
    }

    // Verificar se o valor do pagamento é válido
    let paymentValueNum = extractNumericValue(paymentValue)

    if (isNaN(paymentValueNum) || paymentValueNum <= 0) {
      customToast.error("Valor de pagamento inválido")
      return
    }

    const transactionValue = transaction.value

    if (isCompensacaoCredito && selectedMethodObj?.isSaldoAdmto) {
      const saldoSelecionado = extractSaldoFromOptionLabel(selectedMethodObj.name)
      if (saldoSelecionado !== null && saldoSelecionado < transactionValue) {
        paymentValueNum = saldoSelecionado
        setPaymentValue(formatCurrency(saldoSelecionado))
      }
    }

    // Para cartão de crédito, o valor vai para a fatura
    if (isCartaoCredito) {
      if (parcelas > 1) {
        const vlrParc = extractNumericValue(valorParcela)
        if (isNaN(vlrParc) || vlrParc <= 0) {
          customToast.error("Informe o valor da parcela")
          return
        }
      }
      await processPayment(transactionValue)
      return
    }

    if (paymentValueNum < transactionValue) {
      setRemainingValue(transactionValue - paymentValueNum)
      setShowPartialPaymentDialog(true)
      return
    }

    if (paymentValueNum > transactionValue) {
      setInterestValue(paymentValueNum - transactionValue)
      setShowInterestDialog(true)
      return
    }

    await processPayment(paymentValueNum)
  }

  const processPayment = async (paymentValueNum: number, isPartialPayment: boolean = false) => {
    if (!transaction?.id) return

    setLoading(true)
    try {
      // Formatar data para o formato da API (YYYY-MM-DD)
      const formattedDate = paymentDate.toISOString().split('T')[0]

      // Preparar payload da baixa
      const payload: Record<string, unknown> = {
        data_pgto: formattedDate,
        valor: paymentValueNum,
        conta_caixa: isCompensacaoCredito ? null : Number(selectedAccount),
        forma_pagamento: isCompensacaoCredito && selectedMethodObj?.isSaldoAdmto
          ? (selectedMethodObj.permutadoTipo ?? null)
          : (paymentMethod ? Number(paymentMethod) : undefined),
        descricao: description || `Pagamento do lançamento ${transaction.code}`,
        baixa_parcial: isPartialPayment,
      }

      // Se é cartão de crédito, adicionar id_cartao, parcelas e valor_parcela
      if (isCartaoCredito && selectedMethodObj?.idFormaPgto) {
        payload.id_cartao = Number(selectedMethodObj.idFormaPgto)
        payload.parcelas = parcelas
        if (parcelas > 1) {
          payload.valor_parcela = extractNumericValue(valorParcela)
        }
      }

      console.log('Payload da baixa:', payload)

      // Usar a API de baixar lançamento
      await baixarLancamento(Number(transaction.id), payload as any)

      await onSave()

      if (isCartaoCredito) {
        const vlrParc = parcelas > 1 ? extractNumericValue(valorParcela) : paymentValueNum
        const msg = parcelas > 1
          ? `Baixado no ${selectedMethodObj?.name || 'cartão'} em ${parcelas}x de ${formatCurrency(vlrParc)}. Fatura atualizada — confira em Financeiro > Cartão.`
          : `Baixado no ${selectedMethodObj?.name || 'cartão'} (à vista). Fatura atualizada — confira em Financeiro > Cartão.`
        customToast.success(msg)
      } else if (isPartialPayment && paymentValueNum < transaction.value) {
        const saldoRestante = transaction.value - paymentValueNum
        customToast.success(
          `Baixa parcial realizada! Valor pago: ${formatCurrency(paymentValueNum)}. Foi criado um novo lançamento com saldo restante de ${formatCurrency(saldoRestante)}.`,
          {
            position: "bottom-right",
          },
        )
      } else if (paymentValueNum < transaction.value) {
        customToast.success(
          `Lançamento baixado com desconto de ${formatCurrency(transaction.value - paymentValueNum)}! A API criou automaticamente o lançamento de desconto.`,
          {
            position: "bottom-right",
          },
        )
      } else if (interestValue > 0) {
        customToast.success(
          `Lançamento baixado com sucesso! A API criou automaticamente o lançamento de juros/multa no valor de ${formatCurrency(interestValue)}`,
          { position: "bottom-right"},
        )
      } else {
        customToast.success("Lançamento baixado com sucesso!")
      }

      onClose()
    } catch (err: unknown) {
      console.error("Erro ao baixar lançamento:", err)
      const apiMsg = (err as any)?.response?.data?.error || (err as any)?.response?.data?.debug || (err as any)?.message || ''
      customToast.error(apiMsg ? `Erro: ${apiMsg}` : "Erro ao baixar lançamento")
    } finally {
      setLoading(false)
    }
  }

  const handlePartialPayment = async () => {
    // Implementar pagamento parcial
    const paymentValueNum = extractNumericValue(paymentValue)
    await processPayment(paymentValueNum, true)
  }

  const handlePaymentWithInterest = async () => {
    // Implementar pagamento com juros
    const paymentValueNum = extractNumericValue(paymentValue)
    setShowInterestDialog(false)
    await processPayment(paymentValueNum)
  }

  if (!transaction) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl">
          <div className="bg-white dark:bg-slate-900">
            <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-slate-900 dark:text-white text-xl font-medium">
                    Baixar Lançamento
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400 mt-1">
                    #{transaction.code} • {formatCurrency(transaction.value)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="p-6 space-y-4">
              {/* Card de Dados do Pagamento */}
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Dados do Pagamento
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-blue-700 dark:text-blue-300 block mb-1.5">
                      Data de Pagamento *
                    </label>
                    <DatePickerInput
                      date={paymentDate}
                      setDate={(date) => {
                        if (date) {
                          const today = new Date()
                          today.setHours(23, 59, 59, 999)
                          if (date <= today) {
                            setPaymentDate(date)
                          } else {
                            customToast.error("A data de pagamento não pode ser superior à data atual")
                          }
                        }
                      }}
                      placeholder="dd/mm/aaaa"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-blue-700 dark:text-blue-300 block mb-1.5">
                      Valor do Pagamento *
                    </label>
                    <Input
                      value={paymentValue}
                      onChange={handleValueChange}
                      placeholder="R$ 0,00"
                      className="h-10 border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Card de Conta e Forma de Pagamento */}
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Conta Caixa e Forma de Pagamento
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-green-700 dark:text-green-300 block mb-1.5">
                      Conta Caixa *
                    </label>
                    <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                      <SelectTrigger className="h-10 border-green-200 dark:border-green-700 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Selecione uma conta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cashAccounts.map((account) => {
                          if (account.isCompensacaoCredito) {
                            return (
                              <SelectItem key={account.id} value={account.id || ""}>
                                {account.account}
                              </SelectItem>
                            )
                          }

                          const bankName = account.bankAgencyId ? accountBankInfo.get(account.bankAgencyId) : null
                          return (
                            <SelectItem key={account.id} value={account.id || ""}>
                              {account.account} - {bankName || 'Sem banco'}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-green-700 dark:text-green-300 block mb-1.5">
                      Forma de Pagamento *
                    </label>
                    <SearchableSelect
                      options={filteredPaymentMethods.map((method) => ({
                        value: method.id || "",
                        label: method.name,
                        description: (method.tipo as string) === 'cartao_credito' ? 'Cartão de Crédito' : undefined,
                      }))}
                      value={paymentMethod}
                      onValueChange={(v) => { setPaymentMethod(v); setParcelas(1) }}
                      placeholder="Selecione um método..."
                      searchPlaceholder="Pesquisar forma de pagamento..."
                      emptyMessage="Nenhuma forma encontrada"
                      disabled={!selectedAccount || (isCompensacaoCredito && filteredPaymentMethods.length === 0)}
                    />
                  </div>
                </div>

                {/* Parcelas - aparece quando a forma de pagamento selecionada é cartão de crédito */}
                {isCartaoCredito && (() => {
                  const limite = selectedMethodObj?.limite_credito ? Number(selectedMethodObj.limite_credito) : 0
                  const totalCartao = parcelas > 1 && extractNumericValue(valorParcela) > 0
                    ? parcelas * extractNumericValue(valorParcela)
                    : transaction.value
                  return (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                            {selectedMethodObj?.name} {selectedMethodObj?.operadora ? `(${selectedMethodObj.operadora})` : ''}
                          </span>
                        </div>
                        {limite > 0 && (
                          <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
                            Limite: {formatCurrency(limite)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-purple-700 dark:text-purple-300 block mb-1.5">
                            Parcelas
                          </label>
                          <Select
                            value={String(parcelas)}
                            onValueChange={(v) => { setParcelas(Number(v)); setValorParcela("") }}
                          >
                            <SelectTrigger className="h-10 border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 48 }, (_, i) => i + 1).map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n}x{n === 1 ? ' (a vista)' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {parcelas > 1 && (
                          <div>
                            <label className="text-xs font-medium text-purple-700 dark:text-purple-300 block mb-1.5">
                              Valor da Parcela
                            </label>
                            <Input
                              value={valorParcela}
                              onChange={(e) => setValorParcela(formatMonetaryValue(e.target.value))}
                              placeholder="R$ 0,00"
                              className="h-10 border-purple-200 dark:border-purple-700 focus:border-purple-500 focus:ring-purple-500 dark:bg-slate-800 font-semibold"
                            />
                          </div>
                        )}
                      </div>

                      {/* Resumo da compra no cartao */}
                      <div className="mt-3 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-700 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Valor do lancamento:</span>
                          <span className="font-medium">{formatCurrency(transaction.value)}</span>
                        </div>
                        {parcelas > 1 && extractNumericValue(valorParcela) > 0 && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-400">Total parcelado ({parcelas}x {formatCurrency(extractNumericValue(valorParcela))}):</span>
                              <span className="font-semibold text-purple-700 dark:text-purple-300">{formatCurrency(totalCartao)}</span>
                            </div>
                            {totalCartao > transaction.value && (
                              <div className="flex justify-between text-xs">
                                <span className="text-red-600 dark:text-red-400">Juros:</span>
                                <span className="font-semibold text-red-600 dark:text-red-400">+{formatCurrency(totalCartao - transaction.value)}</span>
                              </div>
                            )}
                          </>
                        )}
                        {selectedMethodObj?.dia_fechamento && (
                          <div className="flex justify-between text-xs border-t border-purple-100 dark:border-purple-800 pt-1.5 mt-1">
                            <span className="text-slate-500 dark:text-slate-500">Fecha dia {selectedMethodObj.dia_fechamento} · Vence dia {selectedMethodObj.dia_vencimento}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 flex-shrink-0" />
                        O valor sera lancado na fatura do cartao. Confira em Financeiro &gt; Cartao.
                      </p>
                    </div>
                  )
                })()}
              </div>

              {/* Card de Descrição */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  Descrição/Observações
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Observações sobre o pagamento..."
                  rows={2}
                  className="border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-700 dark:text-slate-300 w-full">
                    <p className="font-medium mb-3">Informações do lançamento</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div>
                        <span className="font-medium">Valor original:</span>
                        <p className="text-slate-600 dark:text-slate-400">{formatCurrency(transaction.value)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Vencimento:</span>
                        <p className="text-slate-600 dark:text-slate-400">{new Date(transaction.dueDate).toLocaleDateString("pt-BR")}</p>
                      </div>

                      {transaction.clientId && (
                        <div>
                          <span className="font-medium">Cliente:</span>
                          <p className="text-slate-600 dark:text-slate-400">{transaction.clientName || people.find(p => p.id === transaction.clientId)?.name || transaction.clientId}</p>
                        </div>
                      )}

                      {transaction.businessUnitId && (
                        <div>
                          <span className="font-medium">Unidade de Negócio:</span>
                          <p className="text-slate-600 dark:text-slate-400">{transaction.businessUnitName || businessUnits.find(u => u.id === transaction.businessUnitId)?.name || transaction.businessUnitId}</p>
                        </div>
                      )}

                      {transaction.operationId && (
                        <div>
                          <span className="font-medium">Operação:</span>
                          <p className="text-slate-600 dark:text-slate-400">{transaction.operationCode || transaction.operationId}</p>
                        </div>
                      )}

                      {transactionDetails?.id_pessoa && !transaction.clientId && (
                        <div>
                          <span className="font-medium">Pessoa:</span>
                          <p className="text-slate-600 dark:text-slate-400">{people.find(p => p.id === String(transactionDetails.id_pessoa))?.name || transactionDetails.id_pessoa}</p>
                        </div>
                      )}

                      {transactionDetails?.id_un_negocio && !transaction.businessUnitId && (
                        <div>
                          <span className="font-medium">Unidade de Negócio:</span>
                          <p className="text-slate-600 dark:text-slate-400">{businessUnits.find(u => u.id === String(transactionDetails.id_un_negocio))?.name || transactionDetails.id_un_negocio}</p>
                        </div>
                      )}

                      {transactionDetails?.id_porto && !transaction.operationId && (
                        <div>
                          <span className="font-medium">Porto:</span>
                          <p className="text-slate-600 dark:text-slate-400">{ports.find(p => p.id === String(transactionDetails.id_porto))?.name || transactionDetails.id_porto}</p>
                        </div>
                      )}

                      {transactionDetails?.id_navio && !transaction.operationId && (
                        <div>
                          <span className="font-medium">Navio:</span>
                          <p className="text-slate-600 dark:text-slate-400">{ships.find(s => s.id === String(transactionDetails.id_navio))?.shipName || transactionDetails.id_navio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-lg">
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmPayment} 
                  disabled={loading} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  Confirmar Pagamento
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showInterestDialog} onOpenChange={setShowInterestDialog}>
        <AlertDialogContent className="sm:max-w-[450px] p-0 border-0 shadow-xl">
          <div className="bg-white dark:bg-slate-900 rounded-lg">
            <AlertDialogHeader className="px-6 py-4 border-b border-red-200 dark:border-red-800">
              <AlertDialogTitle className="flex items-center text-lg text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                Valor acima do esperado
              </AlertDialogTitle>
            </AlertDialogHeader>
            
            <div className="px-6 py-4 space-y-4">
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">Valor original:</span>
                    <span className="font-semibold text-red-900 dark:text-red-100">{formatCurrency(transaction.value)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">Valor a pagar:</span>
                    <span className="font-semibold text-red-900 dark:text-red-100">{formatCurrency(extractNumericValue(paymentValue))}</span>
                  </div>
                  <hr className="border-red-300 dark:border-red-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">Juros/Multa:</span>
                    <span className="font-bold text-red-700 dark:text-red-300 text-lg">+{formatCurrency(interestValue)}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                O sistema criará automaticamente um lançamento de <strong>juros/multa</strong> para registrar a diferença. Deseja continuar?
              </p>
            </div>
            
            <AlertDialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-lg">
              <div className="flex gap-3 w-full">
                <AlertDialogCancel className="flex-1 border-slate-300 dark:border-slate-600">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handlePaymentWithInterest()} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmar pagamento
                </AlertDialogAction>
              </div>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPartialPaymentDialog} onOpenChange={setShowPartialPaymentDialog}>
        <AlertDialogContent className="sm:max-w-[450px] p-0 border-0 shadow-xl">
          <div className="bg-white dark:bg-slate-900 rounded-lg">
            <AlertDialogHeader className="px-6 py-4 border-b border-orange-200 dark:border-orange-800">
              <AlertDialogTitle className="flex items-center text-lg text-orange-600 dark:text-orange-400">
                <Info className="h-5 w-5 text-orange-500 mr-3" />
                Valor abaixo do esperado
              </AlertDialogTitle>
            </AlertDialogHeader>
            
            <div className="px-6 py-4 space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Valor original:</span>
                    <span className="font-semibold text-orange-900 dark:text-orange-100">{formatCurrency(transaction.value)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Valor recebido:</span>
                    <span className="font-semibold text-orange-900 dark:text-orange-100">{formatCurrency(extractNumericValue(paymentValue))}</span>
                  </div>
                  <hr className="border-orange-300 dark:border-orange-700" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Diferença:</span>
                    <span className="font-bold text-red-600 dark:text-red-400 text-lg">-{formatCurrency(remainingValue)}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Escolha como tratar a diferença:
              </p>
            </div>

            <AlertDialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-lg">
              <div className="flex gap-3 w-full">
                <AlertDialogCancel className="flex-1 border-slate-300 dark:border-slate-600">
                  Cancelar
                </AlertDialogCancel>
                <Button
                  variant="default"
                  onClick={() => {
                    if (!selectedAccount) {
                      customToast.error("Selecione uma conta caixa")
                      return
                    }
                    if (!paymentMethod) {
                      customToast.error("Selecione um método de pagamento")
                      return
                    }
                    setShowPartialPaymentDialog(false)
                    processPayment(extractNumericValue(paymentValue))
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  Dar desconto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!selectedAccount) {
                      customToast.error("Selecione uma conta caixa")
                      return
                    }
                    if (!paymentMethod) {
                      customToast.error("Selecione um método de pagamento")
                      return
                    }
                    setShowPartialPaymentDialog(false)
                    handlePartialPayment()
                  }}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 flex-1"
                >
                  Baixa parcial
                </Button>
              </div>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
