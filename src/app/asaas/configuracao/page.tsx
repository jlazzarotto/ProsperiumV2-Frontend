"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Switch } from "@/components/ui/switch"
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Key,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { useAuth } from "@/app/contexts/auth-context"
import { Pagination } from "@/components/ui/pagination"
import customToast from "@/components/ui/custom-toast"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  getAsaasUnidadesNegocio,
  createAsaasUnidadeNegocio,
  updateAsaasUnidadeNegocio,
  deleteAsaasUnidadeNegocio,
  getAsaasFiscalInfo,
  saveAsaasFiscalInfo,
  type AsaasUnidadeNegocio,
  type AsaasFiscalInfo,
  type CreateAsaasUnidadeNegocioDto,
  type UpdateAsaasUnidadeNegocioDto,
} from "@/services/asaas-service"
import { getTipo8BusinessUnits, type Tipo8BusinessUnit } from "@/services/business-unit-service"

export default function AsaasConfigPage() {
  const { hasPermission } = useAuth()
  const [configs, setConfigs] = useState<AsaasUnidadeNegocio[]>([])
  const [unidadesNegocio, setUnidadesNegocio] = useState<Tipo8BusinessUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<AsaasUnidadeNegocio | null>(null)
  const [showApiKey, setShowApiKey] = useState<Record<number, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fiscal Info modal state
  const [isFiscalModalOpen, setIsFiscalModalOpen] = useState(false)
  const [fiscalConfig, setFiscalConfig] = useState<AsaasUnidadeNegocio | null>(null)
  const [fiscalLoading, setFiscalLoading] = useState(false)
  const [fiscalSubmitting, setFiscalSubmitting] = useState(false)
  const [fiscalData, setFiscalData] = useState<AsaasFiscalInfo>({
    email: '',
    municipalInscription: '',
    simplesNacional: true,
    cnae: '',
    specialTaxRegime: '',
    serviceListItem: '',
    rpsSerie: '1',
    rpsNumber: 1,
    username: '',
    password: '',
  })

  // Form state
  const [formData, setFormData] = useState<CreateAsaasUnidadeNegocioDto>({
    id_pessoa: 0,
    asaas_api_key: '',
    asaas_environment: 'sandbox',
    descricao: '',
    webhook_url: '',
  })

  // Pagination
  const [paginationInfo, setPaginationInfo] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  })

  const fetchConfigs = useCallback(async (page = 1, limit = 10) => {
    setLoading(true)
    try {
      const response = await getAsaasUnidadesNegocio(page, limit)
      setConfigs(response.data || [])
      setPaginationInfo({
        currentPage: response.pagination?.page || 1,
        totalPages: response.pagination?.pages || 1,
        totalItems: response.pagination?.total || 0,
        itemsPerPage: response.pagination?.limit || 10
      })
    } catch (error) {
      console.error('Erro ao buscar configuracoes:', error)
      customToast.error('Erro ao carregar configuracoes do Asaas')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnidadesNegocio = useCallback(async () => {
    try {
      const units = await getTipo8BusinessUnits()
      setUnidadesNegocio(units)
    } catch (error) {
      console.error('Erro ao buscar unidades de negocio:', error)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
    fetchUnidadesNegocio()
  }, [fetchConfigs, fetchUnidadesNegocio])

  const handleOpenModal = (config?: AsaasUnidadeNegocio) => {
    if (config) {
      setCurrentConfig(config)
      setFormData({
        id_pessoa: config.id_pessoa,
        asaas_api_key: config.asaas_api_key,
        asaas_environment: config.asaas_environment,
        descricao: config.descricao || '',
        webhook_url: config.webhook_url || '',
      })
    } else {
      setCurrentConfig(null)
      setFormData({
        id_pessoa: 0,
        asaas_api_key: '',
        asaas_environment: 'sandbox',
        descricao: '',
        webhook_url: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.id_pessoa || !formData.asaas_api_key) {
      customToast.error('Preencha todos os campos obrigatorios')
      return
    }

    setSubmitting(true)
    try {
      if (currentConfig) {
        await updateAsaasUnidadeNegocio(currentConfig.id_asaas_unidade_negocio, {
          asaas_api_key: formData.asaas_api_key,
          asaas_environment: formData.asaas_environment,
          descricao: formData.descricao,
          webhook_url: formData.webhook_url,
        })
        customToast.success('Configuracao atualizada com sucesso!')
      } else {
        await createAsaasUnidadeNegocio(formData)
        customToast.success('Configuracao criada com sucesso!')
      }
      setIsModalOpen(false)
      fetchConfigs(paginationInfo.currentPage, paginationInfo.itemsPerPage)
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      customToast.error(error.response?.data?.message || 'Erro ao salvar configuracao')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentConfig) return

    setSubmitting(true)
    try {
      await deleteAsaasUnidadeNegocio(currentConfig.id_asaas_unidade_negocio)
      customToast.success('Configuracao removida com sucesso!')
      setIsDeleteDialogOpen(false)
      fetchConfigs(paginationInfo.currentPage, paginationInfo.itemsPerPage)
    } catch (error: any) {
      console.error('Erro ao deletar:', error)
      customToast.error(error.response?.data?.message || 'Erro ao remover configuracao')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (config: AsaasUnidadeNegocio) => {
    try {
      await updateAsaasUnidadeNegocio(config.id_asaas_unidade_negocio, {
        status: !config.status
      })
      customToast.success(config.status ? 'Configuracao desativada' : 'Configuracao ativada')
      fetchConfigs(paginationInfo.currentPage, paginationInfo.itemsPerPage)
    } catch (error) {
      customToast.error('Erro ao alterar status')
    }
  }

  const toggleShowApiKey = (id: number) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const maskApiKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return '********'
    return key.substring(0, 4) + '****' + key.substring(key.length - 4)
  }

  const getUnidadeNome = (idPessoa: number) => {
    const unidade = unidadesNegocio.find(u => u.id_pessoa === idPessoa)
    return unidade?.apelido || `Empresa ${idPessoa}`
  }

  const handleOpenFiscalModal = async (config: AsaasUnidadeNegocio) => {
    setFiscalConfig(config)
    setFiscalLoading(true)
    setIsFiscalModalOpen(true)

    try {
      const info = await getAsaasFiscalInfo(config.id_asaas_unidade_negocio)
      setFiscalData({
        email: info.email || '',
        municipalInscription: info.municipalInscription || '',
        simplesNacional: info.simplesNacional ?? true,
        cnae: info.cnae || '',
        specialTaxRegime: info.specialTaxRegime || '',
        serviceListItem: info.serviceListItem || '',
        rpsSerie: info.rpsSerie || '1',
        rpsNumber: info.rpsNumber || 1,
        username: info.username || '',
        password: '',
      })
    } catch {
      // Nao tem config ainda, deixar formulario vazio
      setFiscalData({
        email: '',
        municipalInscription: '',
        simplesNacional: true,
        cnae: '',
        specialTaxRegime: '',
        serviceListItem: '',
        rpsSerie: '1',
        rpsNumber: 1,
        username: '',
        password: '',
      })
    } finally {
      setFiscalLoading(false)
    }
  }

  const handleSaveFiscalInfo = async () => {
    if (!fiscalConfig) return

    setFiscalSubmitting(true)
    try {
      await saveAsaasFiscalInfo(fiscalConfig.id_asaas_unidade_negocio, fiscalData)
      customToast.success('Informacoes fiscais salvas com sucesso!')
      setIsFiscalModalOpen(false)
    } catch (error: any) {
      console.error('Erro ao salvar info fiscal:', error)
      customToast.error(error.response?.data?.error || 'Erro ao salvar informacoes fiscais')
    } finally {
      setFiscalSubmitting(false)
    }
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
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                      <Key className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                        Configuracao Asaas
                      </CardTitle>
                      <CardDescription>
                        Configure as chaves de API do Asaas para cada unidade de negocio
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchConfigs(paginationInfo.currentPage, paginationInfo.itemsPerPage)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {hasPermission('asaas.configuracao', 'criar_editar') && (
                      <Button
                        onClick={() => handleOpenModal()}
                        className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Configuracao
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  </div>
                ) : configs.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma configuracao encontrada</p>
                    <p className="text-sm mt-1">Clique em &quot;Nova Configuracao&quot; para adicionar</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800">
                            <TableHead>Unidade de Negocio</TableHead>
                            <TableHead>Descricao</TableHead>
                            <TableHead>Ambiente</TableHead>
                            <TableHead>Chave API</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Criado em</TableHead>
                            <TableHead className="text-right">Acoes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {configs.map((config) => (
                            <TableRow key={config.id_asaas_unidade_negocio}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">
                                    {config.pessoa?.apelido || getUnidadeNome(config.id_pessoa)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{config.descricao || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={config.asaas_environment === 'production' ? 'default' : 'secondary'}>
                                  {config.asaas_environment === 'production' ? 'Producao' : 'Sandbox'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                    {showApiKey[config.id_asaas_unidade_negocio]
                                      ? config.asaas_api_key
                                      : maskApiKey(config.asaas_api_key)}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleShowApiKey(config.id_asaas_unidade_negocio)}
                                  >
                                    {showApiKey[config.id_asaas_unidade_negocio] ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={config.status}
                                  onCheckedChange={() => handleToggleStatus(config)}
                                />
                              </TableCell>
                              <TableCell className="text-center text-sm text-gray-500">
                                {config.created_at
                                  ? format(new Date(config.created_at), "dd/MM/yyyy", { locale: ptBR })
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {hasPermission('asaas.configuracao', 'criar_editar') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleOpenFiscalModal(config)}
                                      title="Config Fiscal (NF)"
                                    >
                                      <FileText className="h-4 w-4 text-purple-500" />
                                    </Button>
                                  )}
                                  {hasPermission('asaas.configuracao', 'criar_editar') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleOpenModal(config)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {hasPermission('asaas.configuracao', 'deletar') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-700"
                                      onClick={() => {
                                        setCurrentConfig(config)
                                        setIsDeleteDialogOpen(true)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
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
                          onPageChange={(page) => fetchConfigs(page, paginationInfo.itemsPerPage)}
                          onItemsPerPageChange={(limit) => fetchConfigs(1, limit)}
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

      {/* Modal de Criacao/Edicao */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-green-600" />
              {currentConfig ? 'Editar Configuracao' : 'Nova Configuracao'}
            </DialogTitle>
            <DialogDescription>
              Configure a chave API do Asaas para uma unidade de negocio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unidade">Empresa *</Label>
              <Select
                value={String(formData.id_pessoa)}
                onValueChange={(value) => setFormData({ ...formData, id_pessoa: Number(value) })}
                disabled={!!currentConfig}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {unidadesNegocio.map((un) => (
                    <SelectItem key={un.id_pessoa} value={String(un.id_pessoa)}>
                      {un.apelido} ({un.abreviatura})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">Chave API Asaas *</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="$aact_..."
                value={formData.asaas_api_key}
                onChange={(e) => setFormData({ ...formData, asaas_api_key: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Obtenha sua chave em: Asaas &gt; Configuracoes &gt; Integracao &gt; API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Ambiente</Label>
              <Select
                value={formData.asaas_environment}
                onValueChange={(value: 'sandbox' | 'production') =>
                  setFormData({ ...formData, asaas_environment: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                  <SelectItem value="production">Producao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descricao</Label>
              <Input
                id="descricao"
                placeholder="Ex: Conta principal"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook">URL do Webhook (opcional)</Label>
              <Input
                id="webhook"
                placeholder="https://..."
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            {hasPermission('asaas.configuracao', 'criar_editar') && (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-to-r from-green-600 to-emerald-700"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {currentConfig ? 'Salvar' : 'Criar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmacao de Exclusao */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar exclusao
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a configuracao do Asaas para{' '}
              <strong>
                {currentConfig?.pessoa?.apelido || getUnidadeNome(currentConfig?.id_pessoa || 0)}
              </strong>
              ? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            {hasPermission('asaas.configuracao', 'deletar') && (
              <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Excluir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuracao Fiscal (NF) */}
      <Dialog open={isFiscalModalOpen} onOpenChange={setIsFiscalModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Configuracao Fiscal - {fiscalConfig?.pessoa?.apelido || getUnidadeNome(fiscalConfig?.id_pessoa || 0)}
            </DialogTitle>
            <DialogDescription>
              Configure as informacoes fiscais para emissao de notas fiscais de servico
            </DialogDescription>
          </DialogHeader>

          {fiscalLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fiscal_email">E-mail para NF</Label>
                  <Input
                    id="fiscal_email"
                    type="email"
                    placeholder="email@empresa.com"
                    value={fiscalData.email}
                    onChange={(e) => setFiscalData({ ...fiscalData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal_im">Inscricao Municipal</Label>
                  <Input
                    id="fiscal_im"
                    placeholder="Ex: 21779501"
                    value={fiscalData.municipalInscription}
                    onChange={(e) => setFiscalData({ ...fiscalData, municipalInscription: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fiscal_cnae">CNAE</Label>
                  <Input
                    id="fiscal_cnae"
                    placeholder="Ex: 6209100"
                    value={fiscalData.cnae}
                    onChange={(e) => setFiscalData({ ...fiscalData, cnae: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal_simples">Simples Nacional</Label>
                  <Select
                    value={fiscalData.simplesNacional ? 'true' : 'false'}
                    onValueChange={(v) => setFiscalData({ ...fiscalData, simplesNacional: v === 'true' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Nao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fiscal_regime">Regime Especial Tributacao</Label>
                  <Input
                    id="fiscal_regime"
                    placeholder="Ex: MICROEMPRESA_MUNICIPAL"
                    value={fiscalData.specialTaxRegime}
                    onChange={(e) => setFiscalData({ ...fiscalData, specialTaxRegime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal_service_item">Item Lista Servico</Label>
                  <Input
                    id="fiscal_service_item"
                    placeholder="Ex: 01.01"
                    value={fiscalData.serviceListItem}
                    onChange={(e) => setFiscalData({ ...fiscalData, serviceListItem: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fiscal_rps_serie">Serie RPS</Label>
                  <Input
                    id="fiscal_rps_serie"
                    placeholder="1"
                    value={fiscalData.rpsSerie}
                    onChange={(e) => setFiscalData({ ...fiscalData, rpsSerie: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscal_rps_number">Numero RPS</Label>
                  <Input
                    id="fiscal_rps_number"
                    type="number"
                    min="1"
                    value={fiscalData.rpsNumber || ''}
                    onChange={(e) => setFiscalData({ ...fiscalData, rpsNumber: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-500 mb-3 block">
                  Credenciais do Portal da Prefeitura (se necessario)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal_username">Usuario</Label>
                    <Input
                      id="fiscal_username"
                      placeholder="Login do portal"
                      value={fiscalData.username}
                      onChange={(e) => setFiscalData({ ...fiscalData, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscal_password">Senha</Label>
                    <Input
                      id="fiscal_password"
                      type="password"
                      placeholder="Senha do portal"
                      value={fiscalData.password}
                      onChange={(e) => setFiscalData({ ...fiscalData, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFiscalModalOpen(false)} disabled={fiscalSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveFiscalInfo}
              disabled={fiscalSubmitting || fiscalLoading}
              className="bg-gradient-to-r from-purple-600 to-indigo-700"
            >
              {fiscalSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Salvar Config Fiscal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
