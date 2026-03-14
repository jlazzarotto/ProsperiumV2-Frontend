"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, Loader2, Plus, Settings2, X } from "lucide-react"
import { motion } from "framer-motion"
import customToast from "@/components/ui/custom-toast"
import { ConfigParam, getConfigParams, saveConfigParam, updateConfigParamRestrict, updateConfigParamStatus } from "@/app/services/config-params-service"
import { ClientModule, getClientModules, updateClientModule } from "@/app/services/client-modules-service"
import { getAnalyticAccountingAccounts } from "@/app/services/accounting-account-service"
import { getTiposLancamentoAtivos } from "@/app/services/tipo-lancamento-service"

export default function ParametrizacaoSistemaPage() {
  const NEW_TYPE_OPTION = "__new_type__"
  const ACCOUNTING_CODE_TYPES = ["Conta contábil", "Contas contábeis"]
  const ACCOUNTING_ID_TYPES = ["ID Conta contábil", "IDs Conta contábil"]
  const TRANSACTION_TYPE_TYPES = ["Tipo de lançamento", "Tipos de lançamento"]
  const [params, setParams] = useState<ConfigParam[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [clientModules, setClientModules] = useState<ClientModule[]>([])
  const [accountingAccounts, setAccountingAccounts] = useState<Array<{
    id: string
    code: string
    description: string
    accountType: "sintetica" | "analitica"
  }>>([])
  const [transactionTypeOptions, setTransactionTypeOptions] = useState<Array<{ value: string; label: string }>>([])
  const [loadingAccountingOptions, setLoadingAccountingOptions] = useState(false)
  const [loadingTransactionTypeOptions, setLoadingTransactionTypeOptions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [moduleLoadingKey, setModuleLoadingKey] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusLoadingName, setStatusLoadingName] = useState<string | null>(null)
  const [restrictLoadingName, setRestrictLoadingName] = useState<string | null>(null)

  const [parametro, setParametro] = useState("")
  const [tipo, setTipo] = useState("")
  const [isCreatingType, setIsCreatingType] = useState(false)
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [originalName, setOriginalName] = useState<string | null>(null)

  const isEditing = useMemo(() => originalName !== null, [originalName])
  const isAccountingCodeType = useMemo(() => ACCOUNTING_CODE_TYPES.includes(tipo.trim()), [tipo])
  const isAccountingIdType = useMemo(() => ACCOUNTING_ID_TYPES.includes(tipo.trim()), [tipo])
  const isAccountingType = useMemo(() => isAccountingCodeType || isAccountingIdType, [isAccountingCodeType, isAccountingIdType])
  const isTransactionType = useMemo(() => TRANSACTION_TYPE_TYPES.includes(tipo.trim()), [tipo])
  const accountingOptions = useMemo(() => {
    return accountingAccounts
      .map((account) => ({
        value: isAccountingIdType ? account.id : account.code,
        label: isAccountingIdType
          ? account.description
          : `${account.code} - ${account.description} (${account.accountType === "sintetica" ? "S" : "A"})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
  }, [accountingAccounts, isAccountingIdType])
  const typeOptions = useMemo(() => {
    const normalizedTypes = types
      .map((item) => item.trim())
      .filter(Boolean)

    if (tipo.trim() && !normalizedTypes.includes(tipo.trim())) {
      normalizedTypes.push(tipo.trim())
    }

    return normalizedTypes.sort((a, b) => a.localeCompare(b))
  }, [tipo, types])

  useEffect(() => {
    if (!isModalOpen || !isAccountingType || accountingAccounts.length > 0) {
      return
    }

    const loadAccountingOptions = async () => {
      setLoadingAccountingOptions(true)
      try {
        const accounts = await getAnalyticAccountingAccounts()
        const options = accounts
          .map((account) => ({
            id: String(account.id ?? ""),
            code: account.code,
            description: account.description,
            accountType: account.accountType,
          }))

        setAccountingAccounts(options)
      } catch {
        customToast.error("Erro ao carregar contas contábeis")
      } finally {
        setLoadingAccountingOptions(false)
      }
    }

    loadAccountingOptions()
  }, [accountingAccounts.length, isAccountingType, isModalOpen])

  useEffect(() => {
    if (!isModalOpen || !isTransactionType || transactionTypeOptions.length > 0) {
      return
    }

    const loadTransactionTypeOptions = async () => {
      setLoadingTransactionTypeOptions(true)
      try {
        const items = await getTiposLancamentoAtivos()
        const options = items
          .map((item) => ({
            value: String(item.id),
            label: `${item.nome} (${item.natureza === 1 ? "E" : "S"})`,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))

        setTransactionTypeOptions(options)
      } catch {
        customToast.error("Erro ao carregar tipos de lançamento")
      } finally {
        setLoadingTransactionTypeOptions(false)
      }
    }

    loadTransactionTypeOptions()
  }, [isModalOpen, isTransactionType, transactionTypeOptions.length])

  const loadParams = useCallback(async () => {
    setLoading(true)
    try {
      const [response, modules] = await Promise.all([getConfigParams(), getClientModules()])
      const derivedTypes = Array.from(
        new Set(
          response.data
            .map((item) => item.type.trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b))

      setParams(response.data)
      setTypes((response.types && response.types.length > 0) ? response.types : derivedTypes)
      setClientModules(modules)
    } catch {
      customToast.error("Erro ao carregar parametrização")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadParams()
  }, [loadParams])

  const resetForm = () => {
    setParametro("")
    setTipo("")
    setIsCreatingType(false)
    setValor("")
    setDescricao("")
    setOriginalName(null)
  }

  const handleOpenCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const handleSelectParam = (item: ConfigParam) => {
    setParametro(item.name)
    setTipo(item.type || "")
    setIsCreatingType(false)
    setValor(item.value)
    setDescricao(item.description || "")
    setOriginalName(item.name)
    setIsModalOpen(true)
  }

  const handleTypeChange = (value: string) => {
    if (value === NEW_TYPE_OPTION) {
      setTipo("")
      setIsCreatingType(true)
      return
    }

    setTipo(value)
    setIsCreatingType(false)
  }

  const handleSave = async () => {
    if (!parametro.trim() || !tipo.trim() || !valor.trim()) {
      customToast.error("Informe os campos Parametro, Tipo e Valor")
      return
    }

    setSaving(true)
    try {
      await saveConfigParam({
        name: parametro.trim(),
        type: tipo.trim(),
        value: valor.trim(),
        description: descricao.trim(),
        original_name: originalName || undefined,
      })

      customToast.success(isEditing ? "Parâmetro atualizado com sucesso" : "Parâmetro criado com sucesso")
      resetForm()
      setIsModalOpen(false)
      await loadParams()
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Erro ao gravar parâmetro"
      customToast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (item: ConfigParam) => {
    const nextStatus = item.status === 1 ? 2 : 1
    setStatusLoadingName(item.name)

    try {
      await updateConfigParamStatus({ name: item.name, status: nextStatus })
      setParams((prev) =>
        prev.map((param) => (param.name === item.name ? { ...param, status: nextStatus } : param))
      )
      customToast.success(nextStatus === 1 ? "Parâmetro ativado com sucesso" : "Parâmetro desativado com sucesso")
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Erro ao atualizar status do parâmetro"
      customToast.error(msg)
    } finally {
      setStatusLoadingName(null)
    }
  }

  const handleToggleRestrict = async (item: ConfigParam) => {
    const nextRestrict = item.restrict === 1 ? 2 : 1
    setRestrictLoadingName(item.name)

    try {
      await updateConfigParamRestrict({ name: item.name, restrict: nextRestrict })
      setParams((prev) =>
        prev.map((param) => (param.name === item.name ? { ...param, restrict: nextRestrict } : param))
      )
      customToast.success(nextRestrict === 1 ? "Parâmetro marcado como restrito" : "Parâmetro sem restrição")
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Erro ao atualizar restrição do parâmetro"
      customToast.error(msg)
    } finally {
      setRestrictLoadingName(null)
    }
  }

  const handleToggleClientModule = async (item: ClientModule, enabled: boolean) => {
    setModuleLoadingKey(item.key)

    try {
      await updateClientModule({ modulo: item.key, enabled })
      setClientModules((prev) =>
        prev.map((module) => (module.key === item.key ? { ...module, enabled } : module))
      )
      customToast.success(enabled ? "Modulo habilitado com sucesso" : "Modulo desabilitado com sucesso")
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || "Erro ao atualizar modulo"
      customToast.error(msg)
    } finally {
      setModuleLoadingKey(null)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  }

  return (
    <>
      <MainHeader />
      <div className="bg-slate-50 min-h-screen dark:bg-slate-950">
        <motion.div className="px-6 lg:px-10 py-6" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={cardVariants}>
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="px-6 py-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center text-indigo-600">
                    <Settings2 className="mr-2 w-8 h-8" />
                    <span className="text-2xl font-medium">Parametrização do sistema</span>
                  </CardTitle>

                  <Button onClick={handleOpenCreateModal} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Parâmetro
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parâmetro</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead className="w-24 text-center">Restrito</TableHead>
                        <TableHead className="w-24 text-center">Ativado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center">
                            <div className="inline-flex items-center gap-2 text-slate-500">
                              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                              Carregando parâmetros...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : params.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                            Nenhum parâmetro cadastrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        params.map((item) => (
                          <TableRow key={`${item.name}-${item.value}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => handleSelectParam(item)}
                                className="font-medium text-left text-indigo-700 hover:underline"
                              >
                                {item.name}
                              </button>
                              {item.description?.trim() && (
                                <div className="text-[90%] text-gray-500 mt-1 leading-tight">
                                  {item.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{item.type || "-"}</TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                title={item.restrict === 1 ? "Restrito" : "Sem restrição"}
                                onClick={() => handleToggleRestrict(item)}
                                disabled={restrictLoadingName === item.name}
                                className="inline-flex items-center justify-center min-h-5 min-w-5 disabled:opacity-60"
                              >
                                {restrictLoadingName === item.name ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mx-auto" />
                                ) : item.restrict === 1 ? (
                                  <AlertCircle className="h-5 w-5 text-red-600 mx-auto" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-gray-400 mx-auto" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                type="button"
                                title={item.status === 1 ? "Desativar" : "Ativar"}
                                onClick={() => handleToggleStatus(item)}
                                disabled={statusLoadingName === item.name}
                                className="inline-flex items-center justify-center disabled:opacity-60"
                              >
                                {statusLoadingName === item.name ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mx-auto" />
                                ) : item.status === 1 ? (
                                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-red-600 mx-auto" />
                                )}
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Módulos habilitados para este cliente</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Este controle vale para todo o banco atual. Se um módulo estiver desabilitado, ele some do menu e a rota deixa de ser acessível.
                    </p>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Módulo</TableHead>
                          <TableHead className="w-[140px] text-right">Habilitado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientModules.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                              {loading ? "Carregando módulos..." : "Nenhum módulo encontrado."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          clientModules.map((module) => (
                            <TableRow key={module.key}>
                              <TableCell>{module.categoryLabel}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{module.label}</span>
                                  <span className="text-xs text-muted-foreground">{module.key}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end">
                                  <Switch
                                    checked={module.enabled}
                                    disabled={moduleLoadingKey === module.key}
                                    onCheckedChange={(enabled) => handleToggleClientModule(module, enabled)}
                                    aria-label={`Alternar módulo ${module.label}`}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Atualizar Parâmetro" : "Novo Parâmetro"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Parâmetro</label>
              <Input
                value={parametro}
                onChange={(e) => setParametro(e.target.value)}
                placeholder="Informe o parâmetro"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              {isCreatingType ? (
                <Input
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  placeholder="Informe o novo tipo"
                />
              ) : (
                <Select value={tipo} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NEW_TYPE_OPTION} className="font-medium text-blue-600">
                      Criar novo parâmetro
                    </SelectItem>
                    {typeOptions.map((itemType) => (
                      <SelectItem key={itemType} value={itemType}>
                        {itemType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Valor</label>
              {isAccountingType ? (
                <Select value={valor} onValueChange={setValor} disabled={loadingAccountingOptions}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingAccountingOptions
                          ? "Carregando contas contábeis..."
                          : isAccountingIdType
                            ? "Selecione uma conta contábil pelo ID"
                            : "Selecione uma conta contábil"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {accountingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : isTransactionType ? (
                <Select value={valor} onValueChange={setValor} disabled={loadingTransactionTypeOptions}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingTransactionTypeOptions ? "Carregando tipos de lançamento..." : "Selecione um tipo de lançamento"} />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Informe o valor"
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Informe a descrição"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm() }} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 min-w-[96px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gravar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
