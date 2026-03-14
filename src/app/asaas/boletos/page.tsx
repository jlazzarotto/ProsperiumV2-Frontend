"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Plus,
  FileText,
  RefreshCw,
  Download,
  ExternalLink,
  QrCode,
  Barcode,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  User,
  Calendar,
  DollarSign,
  Search,
} from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { useAuth } from "@/app/contexts/auth-context"
import { TripleSelector } from "@/components/ui/triple-selector"
import { Pagination } from "@/components/ui/pagination"
import customToast from "@/components/ui/custom-toast"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  getAsaasCobrancas,
  createAsaasCobranca,
  cancelAsaasCobranca,
  getAsaasConfigByPessoa,
  getStatusLabel,
  getStatusColor,
  getFormaPagamentoLabel,
  type AsaasCobranca,
  type AsaasUnidadeNegocio,
  type CreateAsaasCobrancaDto,
} from "@/services/asaas-service"
import type { Tipo8BusinessUnit, Cliente } from "@/services/business-unit-service"
import type { BusinessUnit } from "@/types/types"

export default function AsaasBoletosPage() {
  const { hasPermission } = useAuth()
  const [cobrancas, setCobrancas] = useState<AsaasCobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false)
  const [currentCobranca, setCurrentCobranca] = useState<AsaasCobranca | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hasAsaasConfig, setHasAsaasConfig] = useState<boolean | null>(null)
  const [asaasConfig, setAsaasConfig] = useState<AsaasUnidadeNegocio | null>(null)

  // Triple Selector state
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState("")
  const [selectedPersonId, setSelectedPersonId] = useState("")
  const [selectedUnitId, setSelectedUnitId] = useState("")
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<Tipo8BusinessUnit | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Cliente | null>(null)

  // Form state
  const [formData, setFormData] = useState<Omit<CreateAsaasCobrancaDto, 'id_asaas_unidade_negocio' | 'id_pessoa'>>({
    valor: 0,
    descricao: '',
    data_vencimento: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    forma_pagamento: 'BOLETO',
    discount_value: undefined,
    fine_value: undefined,
    interest_value: undefined,
    observacoes: '',
  })

  // Filters
  const [filterUnidade, setFilterUnidade] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("")

  // Pagination
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })

  const fetchCobrancas = useCallback(async (page = 1, limit = 10) => {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterUnidade) filters.id_asaas_unidade_negocio = Number(filterUnidade)
      if (filterStatus) filters.status = filterStatus

      const response = await getAsaasCobrancas(page, limit, filters)
      setCobrancas(response.data || [])
      setPaginationInfo({
        currentPage: response.pagination?.page || 1,
        totalPages: response.pagination?.pages || 1,
        totalItems: response.pagination?.total || 0,
        itemsPerPage: response.pagination?.limit || 10
      })
    } catch (error) {
      console.error('Erro ao buscar cobrancas:', error)
      customToast.error('Erro ao carregar cobrancas')
    } finally {
      setLoading(false)
    }
  }, [filterUnidade, filterStatus])

  useEffect(() => {
    fetchCobrancas()
  }, [fetchCobrancas])

  // Verificar se a unidade tem config do Asaas
  const checkAsaasConfig = async (idPessoa: number) => {
    try {
      const config = await getAsaasConfigByPessoa(idPessoa)
      setAsaasConfig(config)
      setHasAsaasConfig(!!config && config.status)
      return !!config && config.status
    } catch (error) {
      setAsaasConfig(null)
      setHasAsaasConfig(false)
      return false
    }
  }

  const handleBusinessUnitChange = async (businessUnitId: string, businessUnit: Tipo8BusinessUnit | null) => {
    setSelectedBusinessUnitId(businessUnitId)
    setSelectedBusinessUnit(businessUnit)
    setSelectedPersonId("")
    setSelectedPerson(null)
    setHasAsaasConfig(null)

    if (businessUnit) {
      await checkAsaasConfig(businessUnit.id_pessoa)
    }
  }

  const handlePersonChange = (personId: string, person: Cliente | null) => {
    setSelectedPersonId(personId)
    setSelectedPerson(person)
  }

  const handleUnitChange = (unitId: string, unit: BusinessUnit | null) => {
    setSelectedUnitId(unitId)
  }

  const handleOpenModal = () => {
    setFormData({
      valor: 0,
      descricao: '',
      data_vencimento: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      forma_pagamento: 'BOLETO',
      discount_value: undefined,
      fine_value: undefined,
      interest_value: undefined,
      observacoes: '',
    })
    setSelectedBusinessUnitId("")
    setSelectedPersonId("")
    setSelectedUnitId("")
    setSelectedBusinessUnit(null)
    setSelectedPerson(null)
    setHasAsaasConfig(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedBusinessUnit || !selectedPerson) {
      customToast.error('Selecione a unidade de negocio e a pessoa')
      return
    }

    if (!formData.valor || formData.valor <= 0) {
      customToast.error('Informe um valor valido')
      return
    }

    if (!formData.descricao) {
      customToast.error('Informe a descricao da cobranca')
      return
    }

    if (!hasAsaasConfig) {
      customToast.error('Esta unidade de negocio nao possui configuracao do Asaas. Configure primeiro em Asaas > Configuracao.')
      return
    }

    setSubmitting(true)
    try {
      const cobranca = await createAsaasCobranca({
        ...formData,
        id_asaas_unidade_negocio: asaasConfig!.id_asaas_unidade_negocio,
        id_pessoa: selectedPerson.id_pessoa,
        cliente_nome: selectedPerson.nome || selectedPerson.name,
      })

      customToast.success('Cobranca criada com sucesso!')
      setIsModalOpen(false)
      fetchCobrancas(paginationInfo.currentPage, paginationInfo.itemsPerPage)

      // Se for boleto ou PIX, mostrar os dados
      if (cobranca.forma_pagamento === 'BOLETO' && cobranca.bank_slip_url) {
        setCurrentCobranca(cobranca)
        setIsBoletoModalOpen(true)
      } else if (cobranca.forma_pagamento === 'PIX' && cobranca.pix_qr_code) {
        setCurrentCobranca(cobranca)
        setIsPixModalOpen(true)
      }
    } catch (error: any) {
      console.error('Erro ao criar cobranca:', error)
      customToast.error(error.response?.data?.message || 'Erro ao criar cobranca')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelCobranca = async (cobranca: AsaasCobranca) => {
    if (!confirm('Tem certeza que deseja cancelar esta cobranca?')) return

    try {
      await cancelAsaasCobranca(cobranca.id_asaas_cobranca)
      customToast.success('Cobranca cancelada com sucesso!')
      fetchCobrancas(paginationInfo.currentPage, paginationInfo.itemsPerPage)
    } catch (error: any) {
      customToast.error(error.response?.data?.message || 'Erro ao cancelar cobranca')
    }
  }

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    customToast.success(`${label} copiado!`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'RECEIVED_IN_CASH':
        return <CheckCircle className="h-4 w-4" />
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <XCircle className="h-4 w-4" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  }

  return (
    <>
      <MainHeader />
      <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 min-h-screen dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
        <motion.div className="container mx-auto py-6" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                      <Barcode className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
                        Boletos e Cobrancas
                      </CardTitle>
                      <CardDescription>
                        Emita e gerencie boletos e cobrancas via Asaas
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchCobrancas(paginationInfo.currentPage, paginationInfo.itemsPerPage)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {hasPermission('asaas.boletos', 'criar_editar') && (
                      <Button
                        onClick={handleOpenModal}
                        className="bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Cobranca
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-500">Status:</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="PENDING">Pendente</SelectItem>
                        <SelectItem value="RECEIVED">Recebido</SelectItem>
                        <SelectItem value="OVERDUE">Vencido</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  </div>
                ) : cobrancas.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Barcode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma cobranca encontrada</p>
                    <p className="text-sm mt-1">Clique em &quot;Nova Cobranca&quot; para emitir um boleto</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800">
                            <TableHead>Cliente</TableHead>
                            <TableHead>Descricao</TableHead>
                            <TableHead>Forma Pgto</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">Vencimento</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Acoes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cobrancas.map((cobranca) => (
                            <TableRow key={cobranca.id_asaas_cobranca}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">
                                    {cobranca.cliente?.nome || `Cliente #${cobranca.id_asaas_cliente}`}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate" title={cobranca.descricao}>
                                {cobranca.descricao}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getFormaPagamentoLabel(cobranca.forma_pagamento)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(cobranca.valor)}
                              </TableCell>
                              <TableCell className="text-center">
                                {format(new Date(cobranca.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={getStatusColor(cobranca.status)}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(cobranca.status)}
                                    {getStatusLabel(cobranca.status)}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {cobranca.forma_pagamento === 'BOLETO' && cobranca.bank_slip_url && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setCurrentCobranca(cobranca)
                                        setIsBoletoModalOpen(true)
                                      }}
                                    >
                                      <Barcode className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {cobranca.forma_pagamento === 'PIX' && cobranca.pix_qr_code && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setCurrentCobranca(cobranca)
                                        setIsPixModalOpen(true)
                                      }}
                                    >
                                      <QrCode className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {cobranca.invoice_url && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => window.open(cobranca.invoice_url, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {cobranca.status === 'PENDING' && hasPermission('asaas.boletos', 'deletar') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-700"
                                      onClick={() => handleCancelCobranca(cobranca)}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {paginationInfo.totalPages > 1 && (
                      <div className="mt-4">
                        <Pagination
                          currentPage={paginationInfo.currentPage}
                          totalPages={paginationInfo.totalPages}
                          totalItems={paginationInfo.totalItems}
                          itemsPerPage={paginationInfo.itemsPerPage}
                          onPageChange={(page) => fetchCobrancas(page, paginationInfo.itemsPerPage)}
                          onItemsPerPageChange={(limit) => fetchCobrancas(1, limit)}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Modal de Nova Cobranca */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-orange-600" />
              Emitir Nova Cobranca
            </DialogTitle>
            <DialogDescription>
              Selecione a unidade emissora e o pagador para criar a cobranca
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Triple Selector */}
            <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
              <TripleSelector
                selectedBusinessUnitId={selectedBusinessUnitId}
                selectedPersonId={selectedPersonId}
                selectedUnitId={selectedUnitId}
                onBusinessUnitChange={handleBusinessUnitChange}
                onPersonChange={handlePersonChange}
                onUnitChange={handleUnitChange}
                required={true}
                label="Selecione a unidade emissora e o pagador"
                personLabel="Pagador"
                vertical={true}
                isVisible={isModalOpen}
              />

              {hasAsaasConfig === false && selectedBusinessUnit && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Esta unidade nao possui configuracao do Asaas.
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    Configure a chave API em: Asaas &gt; Configuracao
                  </p>
                </div>
              )}

              {hasAsaasConfig === true && selectedBusinessUnit && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Configuracao Asaas ativa para esta unidade
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Dados da Cobranca */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    placeholder="0,00"
                    value={formData.valor || ''}
                    onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descricao *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o motivo da cobranca..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(value: 'BOLETO' | 'PIX' | 'CREDIT_CARD') =>
                  setFormData({ ...formData, forma_pagamento: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOLETO">Boleto Bancario</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartao de Credito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Configuracoes opcionais */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-gray-500">Configuracoes opcionais</Label>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="discount" className="text-xs">Desconto (R$)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.discount_value || ''}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fine" className="text-xs">Multa (%)</Label>
                  <Input
                    id="fine"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="2,00"
                    value={formData.fine_value || ''}
                    onChange={(e) => setFormData({ ...formData, fine_value: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interest" className="text-xs">Juros (% a.m.)</Label>
                  <Input
                    id="interest"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="1,00"
                    value={formData.interest_value || ''}
                    onChange={(e) => setFormData({ ...formData, interest_value: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observacoes internas</Label>
              <Textarea
                id="observacoes"
                placeholder="Observacoes que nao aparecem no boleto..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !hasAsaasConfig}
              className="bg-gradient-to-r from-orange-600 to-amber-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Barcode className="h-4 w-4 mr-2" />}
              Emitir Cobranca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Boleto */}
      <Dialog open={isBoletoModalOpen} onOpenChange={setIsBoletoModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-orange-600" />
              Dados do Boleto
            </DialogTitle>
          </DialogHeader>

          {currentCobranca && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Valor:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(currentCobranca.valor)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Vencimento:</span>
                  <span className="font-medium">
                    {format(new Date(currentCobranca.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>

              {currentCobranca.linha_digitavel && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Linha Digitavel</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentCobranca.linha_digitavel}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyToClipboard(currentCobranca.linha_digitavel!, 'Linha digitavel')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {currentCobranca.codigo_barras && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Codigo de Barras</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentCobranca.codigo_barras}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyToClipboard(currentCobranca.codigo_barras!, 'Codigo de barras')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {currentCobranca.bank_slip_url && (
                  <Button
                    className="flex-1"
                    onClick={() => window.open(currentCobranca.bank_slip_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                )}
                {currentCobranca.invoice_url && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(currentCobranca.invoice_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Fatura
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de PIX */}
      <Dialog open={isPixModalOpen} onOpenChange={setIsPixModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-green-600" />
              Pagamento via PIX
            </DialogTitle>
          </DialogHeader>

          {currentCobranca && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-center">
                <span className="text-sm text-gray-500">Valor:</span>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(currentCobranca.valor)}
                </p>
              </div>

              {currentCobranca.pix_qr_code && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border">
                    <img
                      src={`data:image/png;base64,${currentCobranca.pix_qr_code}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {currentCobranca.pix_copy_paste && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Copia e Cola</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentCobranca.pix_copy_paste}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyToClipboard(currentCobranca.pix_copy_paste!, 'Codigo PIX')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
