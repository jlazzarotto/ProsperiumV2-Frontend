"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Ban,
  RotateCw,
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
  getAsaasNotasFiscais,
  getAsaasNotaFiscalById,
  createAsaasNotaFiscal,
  cancelAsaasNotaFiscal,
  syncAsaasNotaFiscal,
  getAsaasConfigByPessoa,
  getAsaasCobrancas,
  getNfStatusLabel,
  getNfStatusColor,
  type AsaasNotaFiscal,
  type AsaasCobranca,
  type CreateAsaasNotaFiscalDto,
  type AsaasUnidadeNegocio,
} from "@/services/asaas-service"
import type { Tipo8BusinessUnit, Cliente } from "@/services/business-unit-service"
import type { BusinessUnit } from "@/types/types"

export default function AsaasNotasFiscaisPage() {
  const { hasPermission } = useAuth()
  const [notasFiscais, setNotasFiscais] = useState<AsaasNotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [currentNota, setCurrentNota] = useState<AsaasNotaFiscal | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hasAsaasConfig, setHasAsaasConfig] = useState<boolean | null>(null)
  const [asaasConfig, setAsaasConfig] = useState<AsaasUnidadeNegocio | null>(null)
  const [cancelMotivo, setCancelMotivo] = useState("")

  // Triple Selector state
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState("")
  const [selectedPersonId, setSelectedPersonId] = useState("")
  const [selectedUnitId, setSelectedUnitId] = useState("")
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<Tipo8BusinessUnit | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Cliente | null>(null)

  // Cobrancas para vincular
  const [cobrancas, setCobrancas] = useState<AsaasCobranca[]>([])
  const [loadingCobrancas, setLoadingCobrancas] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    regime_especial_tributacao: 'TRIBUTADA_NO_MUNICIPIO',
    descricao_servico: '',
    valor_servicos: 0,
    data_competencia: format(new Date(), 'yyyy-MM-dd'),
    codigo_servico_municipio: '',
    aliquota_iss: 0,
    valor_pis: 0,
    aliquota_pis: 0,
    valor_cofins: 0,
    aliquota_cofins: 0,
    valor_inss: 0,
    aliquota_inss: 0,
    valor_ir: 0,
    aliquota_ir: 0,
    valor_csll: 0,
    aliquota_csll: 0,
    iss_retido_fonte: false,
    observacoes: '',
    id_asaas_cobranca: undefined as number | undefined,
  })

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("")

  // Pagination
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })

  const fetchNotasFiscais = useCallback(async (page = 1, limit = 10) => {
    setLoading(true)
    try {
      const filters: Record<string, any> = {}
      if (filterStatus && filterStatus !== 'all') filters.status = filterStatus

      const response = await getAsaasNotasFiscais(page, limit, filters)
      setNotasFiscais(response.data || [])
      setPaginationInfo({
        currentPage: response.pagination?.page || 1,
        totalPages: response.pagination?.pages || 1,
        totalItems: response.pagination?.total || 0,
        itemsPerPage: response.pagination?.limit || 10
      })
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error)
      customToast.error('Erro ao carregar notas fiscais')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    fetchNotasFiscais()
  }, [fetchNotasFiscais])

  const checkAsaasConfig = async (idUnNegocio: number) => {
    try {
      const config = await getAsaasConfigByPessoa(idUnNegocio)
      setAsaasConfig(config)
      setHasAsaasConfig(!!config && config.status)
      return !!config && config.status
    } catch {
      setAsaasConfig(null)
      setHasAsaasConfig(false)
      return false
    }
  }

  const fetchCobrancasUnidade = async (idUnNegocio: number) => {
    setLoadingCobrancas(true)
    try {
      const response = await getAsaasCobrancas(1, 100, { id_asaas_unidade_negocio: idUnNegocio })
      setCobrancas(response.data || [])
    } catch {
      setCobrancas([])
    } finally {
      setLoadingCobrancas(false)
    }
  }

  const handleBusinessUnitChange = async (businessUnitId: string, businessUnit: Tipo8BusinessUnit | null) => {
    setSelectedBusinessUnitId(businessUnitId)
    setSelectedBusinessUnit(businessUnit)
    setSelectedPersonId("")
    setSelectedPerson(null)
    setHasAsaasConfig(null)
    setCobrancas([])

    if (businessUnit) {
      await checkAsaasConfig(businessUnit.id_pessoa)
      await fetchCobrancasUnidade(businessUnit.id_pessoa)
    }
  }

  const handlePersonChange = (personId: string, person: Cliente | null) => {
    setSelectedPersonId(personId)
    setSelectedPerson(person)
  }

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId)
  }

  const handleOpenModal = () => {
    setFormData({
      regime_especial_tributacao: 'TRIBUTADA_NO_MUNICIPIO',
      descricao_servico: '',
      valor_servicos: 0,
      data_competencia: format(new Date(), 'yyyy-MM-dd'),
      codigo_servico_municipio: '',
      aliquota_iss: 0,
      valor_pis: 0,
      aliquota_pis: 0,
      valor_cofins: 0,
      aliquota_cofins: 0,
      valor_inss: 0,
      aliquota_inss: 0,
      valor_ir: 0,
      aliquota_ir: 0,
      valor_csll: 0,
      aliquota_csll: 0,
      iss_retido_fonte: false,
      observacoes: '',
      id_asaas_cobranca: undefined,
    })
    setSelectedBusinessUnitId("")
    setSelectedPersonId("")
    setSelectedUnitId("")
    setSelectedBusinessUnit(null)
    setSelectedPerson(null)
    setHasAsaasConfig(null)
    setCobrancas([])
    setIsModalOpen(true)
  }

  const handleViewDetails = async (nf: AsaasNotaFiscal) => {
    try {
      const detail = await getAsaasNotaFiscalById(nf.id_asaas_nota_fiscal)
      setCurrentNota(detail)
      setIsDetailModalOpen(true)
    } catch {
      customToast.error('Erro ao carregar detalhes da nota fiscal')
    }
  }

  const handleSync = async (nf: AsaasNotaFiscal) => {
    try {
      await syncAsaasNotaFiscal(nf.id_asaas_nota_fiscal)
      customToast.success('Nota fiscal sincronizada!')
      fetchNotasFiscais(paginationInfo.currentPage, paginationInfo.itemsPerPage)
    } catch {
      customToast.error('Erro ao sincronizar nota fiscal')
    }
  }

  const handleOpenCancelModal = (nf: AsaasNotaFiscal) => {
    setCurrentNota(nf)
    setCancelMotivo("")
    setIsCancelModalOpen(true)
  }

  const handleCancelNota = async () => {
    if (!currentNota) return
    if (!cancelMotivo.trim()) {
      customToast.error('Informe o motivo do cancelamento')
      return
    }

    setSubmitting(true)
    try {
      await cancelAsaasNotaFiscal(currentNota.id_asaas_nota_fiscal, cancelMotivo)
      customToast.success('Nota fiscal cancelada com sucesso!')
      setIsCancelModalOpen(false)
      fetchNotasFiscais(paginationInfo.currentPage, paginationInfo.itemsPerPage)
    } catch (error: any) {
      customToast.error(error.response?.data?.message || 'Erro ao cancelar nota fiscal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedBusinessUnit || !selectedPerson) {
      customToast.error('Selecione a unidade de negocio e o cliente')
      return
    }

    if (!formData.valor_servicos || formData.valor_servicos <= 0) {
      customToast.error('Informe o valor dos servicos')
      return
    }

    if (!formData.descricao_servico) {
      customToast.error('Informe a descricao do servico')
      return
    }

    if (!hasAsaasConfig) {
      customToast.error('Esta unidade nao possui configuracao do Asaas.')
      return
    }

    setSubmitting(true)
    try {
      // tipo_operacao é definido automaticamente: se tem cobrança vinculada = WITH_EXISTING_PAYMENT, senão = WITHOUT_PAYMENT
      const tipoOperacao = formData.id_asaas_cobranca ? 'WITH_EXISTING_PAYMENT' : 'WITHOUT_PAYMENT'

      const payload: CreateAsaasNotaFiscalDto = {
        id_asaas_unidade_negocio: asaasConfig!.id_asaas_unidade_negocio,
        id_pessoa: selectedPerson.id_pessoa,
        tipo_operacao: tipoOperacao,
        descricao_servico: formData.descricao_servico,
        valor_servicos: formData.valor_servicos,
        data_competencia: formData.data_competencia,
        regime_especial_tributacao: formData.regime_especial_tributacao || undefined,
        codigo_servico_municipio: formData.codigo_servico_municipio || undefined,
        aliquota_iss: formData.aliquota_iss || undefined,
        valor_pis: formData.valor_pis || undefined,
        aliquota_pis: formData.aliquota_pis || undefined,
        valor_cofins: formData.valor_cofins || undefined,
        aliquota_cofins: formData.aliquota_cofins || undefined,
        valor_inss: formData.valor_inss || undefined,
        aliquota_inss: formData.aliquota_inss || undefined,
        valor_ir: formData.valor_ir || undefined,
        aliquota_ir: formData.aliquota_ir || undefined,
        valor_csll: formData.valor_csll || undefined,
        aliquota_csll: formData.aliquota_csll || undefined,
        iss_retido_fonte: formData.iss_retido_fonte || undefined,
        observacoes: formData.observacoes || undefined,
        id_asaas_cobranca: formData.id_asaas_cobranca,
        cliente_nome: selectedPerson.nome,
        cliente_email: selectedPerson.email || undefined,
        cliente_cpf_cnpj: selectedPerson.cpf_cnpj || undefined,
        cliente_tipo_pessoa: selectedPerson.tipo_pessoa || undefined,
        cliente_telefone: selectedPerson.telefone || undefined,
        cliente_telefone_celular: selectedPerson.celular || undefined,
        cliente_cep: selectedPerson.cep || undefined,
        cliente_endereco: selectedPerson.endereco || undefined,
        cliente_endereco_numero: selectedPerson.numero || undefined,
        cliente_complemento: selectedPerson.complemento || undefined,
        cliente_bairro: selectedPerson.bairro || undefined,
        cliente_cidade: selectedPerson.cidade || undefined,
        cliente_estado: selectedPerson.uf || undefined,
      }

      await createAsaasNotaFiscal(payload)
      customToast.success('Nota fiscal criada com sucesso!')
      setIsModalOpen(false)
      fetchNotasFiscais(paginationInfo.currentPage, paginationInfo.itemsPerPage)
    } catch (error: any) {
      console.error('Erro ao criar nota fiscal:', error)
      customToast.error(error.response?.data?.message || 'Erro ao criar nota fiscal')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return <Clock className="h-4 w-4" />
      case 'SCHEDULED':
        return <Clock className="h-4 w-4" />
      case 'AUTHORIZED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
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
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent">
                        Notas Fiscais
                      </CardTitle>
                      <CardDescription>
                        Emita e gerencie notas fiscais de servico via Asaas
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchNotasFiscais(paginationInfo.currentPage, paginationInfo.itemsPerPage)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {hasPermission('asaas.notas_fiscais', 'criar_editar') && (
                      <Button
                        onClick={handleOpenModal}
                        className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Nota Fiscal
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-500">Status:</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="PROCESSING">Processando</SelectItem>
                        <SelectItem value="AUTHORIZED">Autorizada</SelectItem>
                        <SelectItem value="CANCELLED">Cancelada</SelectItem>
                        <SelectItem value="SCHEDULED">Agendada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : notasFiscais.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma nota fiscal encontrada</p>
                    <p className="text-sm mt-1">Clique em &quot;Nova Nota Fiscal&quot; para emitir</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800">
                            <TableHead>Numero</TableHead>
                            <TableHead>Descricao</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">Competencia</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Acoes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {notasFiscais.map((nf) => (
                            <TableRow key={nf.id_asaas_nota_fiscal}>
                              <TableCell>
                                <span className="font-medium">
                                  {nf.numero_nota || `#${nf.id_asaas_nota_fiscal}`}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-[250px] truncate" title={nf.descricao_servico}>
                                {nf.descricao_servico}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(Number(nf.valor_servicos))}
                              </TableCell>
                              <TableCell className="text-center">
                                {format(new Date(nf.data_competencia + 'T00:00:00'), "MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={getNfStatusColor(nf.status)}>
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(nf.status)}
                                    {getNfStatusLabel(nf.status)}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleViewDetails(nf)}
                                    title="Ver detalhes"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleSync(nf)}
                                    title="Sincronizar"
                                  >
                                    <RotateCw className="h-4 w-4" />
                                  </Button>
                                  {nf.pdf_url && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => window.open(nf.pdf_url!, '_blank')}
                                      title="Baixar PDF"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {nf.xml_url && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => window.open(nf.xml_url!, '_blank')}
                                      title="Baixar XML"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {nf.status === 'AUTHORIZED' && hasPermission('asaas.notas_fiscais', 'deletar') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-700"
                                      onClick={() => handleOpenCancelModal(nf)}
                                      title="Cancelar NF"
                                    >
                                      <Ban className="h-4 w-4" />
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
                          onPageChange={(page) => fetchNotasFiscais(page, paginationInfo.itemsPerPage)}
                          onItemsPerPageChange={(limit) => fetchNotasFiscais(1, limit)}
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

      {/* Modal de Nova Nota Fiscal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Emitir Nova Nota Fiscal
            </DialogTitle>
            <DialogDescription>
              Selecione a unidade emissora e o tomador do servico
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
                label="Selecione a unidade emissora e o tomador"
                personLabel="Tomador do Servico"
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

            {/* Vincular a cobranca existente */}
            {cobrancas.length > 0 && (
              <div className="space-y-2">
                <Label>Vincular a cobranca (opcional)</Label>
                <Select
                  value={formData.id_asaas_cobranca?.toString() || "none"}
                  onValueChange={(v) => setFormData({ ...formData, id_asaas_cobranca: v === "none" ? undefined : Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma - NF standalone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma - NF standalone</SelectItem>
                    {cobrancas.map((c) => (
                      <SelectItem key={c.id_asaas_cobranca} value={c.id_asaas_cobranca.toString()}>
                        {c.descricao} - {formatCurrency(c.valor)} ({c.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dados do Servico */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor_servicos">Valor dos Servicos *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="valor_servicos"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    placeholder="0,00"
                    value={formData.valor_servicos || ''}
                    onChange={(e) => setFormData({ ...formData, valor_servicos: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_competencia">Data de Competencia *</Label>
                <Input
                  id="data_competencia"
                  type="date"
                  value={formData.data_competencia}
                  onChange={(e) => setFormData({ ...formData, data_competencia: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_servico">Descricao do Servico *</Label>
              <Textarea
                id="descricao_servico"
                placeholder="Descreva o servico prestado..."
                value={formData.descricao_servico}
                onChange={(e) => setFormData({ ...formData, descricao_servico: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regime_especial_tributacao">Regime de Tributacao</Label>
                <Select
                  value={formData.regime_especial_tributacao}
                  onValueChange={(value) => setFormData({ ...formData, regime_especial_tributacao: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIBUTADA_NO_MUNICIPIO">Tributada no municipio</SelectItem>
                    <SelectItem value="TRIBUTADA_FORA_DO_MUNICIPIO">Tributada fora do municipio</SelectItem>
                    <SelectItem value="ISENTA">Isenta</SelectItem>
                    <SelectItem value="IMUNE">Imune</SelectItem>
                    <SelectItem value="SUSPENSA_DECISAO_JUDICIAL">Suspensa por decisao judicial</SelectItem>
                    <SelectItem value="SUSPENSA_PROCEDIMENTO_ADMINISTRATIVO">Suspensa por procedimento admin.</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo_servico_municipio">Codigo Servico Municipal</Label>
                <Input
                  id="codigo_servico_municipio"
                  placeholder="Ex: 01.01"
                  value={formData.codigo_servico_municipio}
                  onChange={(e) => setFormData({ ...formData, codigo_servico_municipio: e.target.value })}
                />
              </div>
            </div>

            {/* Impostos */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-gray-500">Impostos</Label>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="aliquota_iss" className="text-xs">ISS (%)</Label>
                  <Input
                    id="aliquota_iss"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.aliquota_iss || ''}
                    onChange={(e) => setFormData({ ...formData, aliquota_iss: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquota_pis" className="text-xs">PIS (%)</Label>
                  <Input
                    id="aliquota_pis"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.aliquota_pis || ''}
                    onChange={(e) => setFormData({ ...formData, aliquota_pis: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquota_cofins" className="text-xs">COFINS (%)</Label>
                  <Input
                    id="aliquota_cofins"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.aliquota_cofins || ''}
                    onChange={(e) => setFormData({ ...formData, aliquota_cofins: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquota_inss" className="text-xs">INSS (%)</Label>
                  <Input
                    id="aliquota_inss"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.aliquota_inss || ''}
                    onChange={(e) => setFormData({ ...formData, aliquota_inss: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquota_ir" className="text-xs">IR (%)</Label>
                  <Input
                    id="aliquota_ir"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.aliquota_ir || ''}
                    onChange={(e) => setFormData({ ...formData, aliquota_ir: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliquota_csll" className="text-xs">CSLL (%)</Label>
                  <Input
                    id="aliquota_csll"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.aliquota_csll || ''}
                    onChange={(e) => setFormData({ ...formData, aliquota_csll: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Checkbox
                  id="iss_retido"
                  checked={formData.iss_retido_fonte}
                  onCheckedChange={(checked) => setFormData({ ...formData, iss_retido_fonte: checked === true })}
                />
                <Label htmlFor="iss_retido" className="text-sm">Reter ISS na fonte</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes_nf">Observacoes</Label>
              <Textarea
                id="observacoes_nf"
                placeholder="Observacoes adicionais para a nota fiscal..."
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
              className="bg-gradient-to-r from-purple-600 to-indigo-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Emitir Nota Fiscal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Detalhes da Nota Fiscal
            </DialogTitle>
          </DialogHeader>

          {currentNota && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-500">Status:</span>
                  <Badge className={getNfStatusColor(currentNota.status)}>
                    {getStatusIcon(currentNota.status)}
                    <span className="ml-1">{getNfStatusLabel(currentNota.status)}</span>
                  </Badge>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Valor dos Servicos:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(Number(currentNota.valor_servicos))}
                  </span>
                </div>
                {currentNota.numero_nota && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Numero da Nota:</span>
                    <span className="font-medium">{currentNota.numero_nota}</span>
                  </div>
                )}
                {currentNota.chave_acesso && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Chave de Acesso:</span>
                    <span className="font-mono text-xs">{currentNota.chave_acesso}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Competencia:</span>
                  <span className="font-medium">
                    {format(new Date(currentNota.data_competencia + 'T00:00:00'), "MM/yyyy")}
                  </span>
                </div>
                {currentNota.data_emissao && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Data Emissao:</span>
                    <span className="font-medium">
                      {format(new Date(currentNota.data_emissao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Descricao do Servico</Label>
                <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  {currentNota.descricao_servico}
                </p>
              </div>

              {/* Impostos breakdown */}
              <div className="border rounded-lg p-4">
                <Label className="text-sm font-medium text-gray-500 mb-3 block">Tributos</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Number(currentNota.valor_iss) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">ISS:</span>
                      <span>{formatCurrency(Number(currentNota.valor_iss))}</span>
                    </div>
                  )}
                  {Number(currentNota.valor_pis) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">PIS:</span>
                      <span>{formatCurrency(Number(currentNota.valor_pis))}</span>
                    </div>
                  )}
                  {Number(currentNota.valor_cofins) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">COFINS:</span>
                      <span>{formatCurrency(Number(currentNota.valor_cofins))}</span>
                    </div>
                  )}
                  {Number(currentNota.valor_inss) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">INSS:</span>
                      <span>{formatCurrency(Number(currentNota.valor_inss))}</span>
                    </div>
                  )}
                  {Number(currentNota.valor_ir) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">IR:</span>
                      <span>{formatCurrency(Number(currentNota.valor_ir))}</span>
                    </div>
                  )}
                  {Number(currentNota.valor_csll) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">CSLL:</span>
                      <span>{formatCurrency(Number(currentNota.valor_csll))}</span>
                    </div>
                  )}
                  {currentNota.valor_total_tributos !== undefined && Number(currentNota.valor_total_tributos) > 0 && (
                    <div className="flex justify-between col-span-2 border-t pt-2 mt-2 font-medium">
                      <span>Total Tributos:</span>
                      <span>{formatCurrency(Number(currentNota.valor_total_tributos))}</span>
                    </div>
                  )}
                  {currentNota.valor_liquido !== undefined && (
                    <div className="flex justify-between col-span-2 font-bold text-green-600">
                      <span>Valor Liquido:</span>
                      <span>{formatCurrency(Number(currentNota.valor_liquido))}</span>
                    </div>
                  )}
                </div>
              </div>

              {currentNota.observacoes && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Observacoes</Label>
                  <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                    {currentNota.observacoes}
                  </p>
                </div>
              )}

              {currentNota.motivo_cancelamento && (
                <div className="space-y-2">
                  <Label className="text-sm text-red-500">Motivo do Cancelamento</Label>
                  <p className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-700">
                    {currentNota.motivo_cancelamento}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {currentNota.pdf_url && (
                  <Button
                    className="flex-1"
                    onClick={() => window.open(currentNota.pdf_url!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                )}
                {currentNota.xml_url && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(currentNota.xml_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Baixar XML
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cancelamento */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Cancelar Nota Fiscal
            </DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento. Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo_cancelamento">Motivo *</Label>
              <Textarea
                id="motivo_cancelamento"
                placeholder="Informe o motivo do cancelamento..."
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} disabled={submitting}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelNota}
              disabled={submitting || !cancelMotivo.trim()}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
