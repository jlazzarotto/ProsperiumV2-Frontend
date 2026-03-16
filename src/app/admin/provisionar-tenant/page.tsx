"use client"

import { useEffect, useState } from "react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, DatabaseZap, Info, Loader2, XCircle } from "lucide-react"
import { motion } from "framer-motion"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"
import {
  getTenantOptions,
  provisionTenantDatabase,
  type TenantOption,
  type TenantProvisionResult,
} from "@/app/services/core-saas-service"

type ProvisionStatus = "idle" | "running" | "success" | "already_applied" | "failure"

export default function ProvisionarTenantPage() {
  const { user } = useAuth()
  const isRoot = user?.role === "ROLE_ROOT"

  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [selectedKey, setSelectedKey] = useState("")
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [status, setStatus] = useState<ProvisionStatus>("idle")
  const [result, setResult] = useState<TenantProvisionResult | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const options = await getTenantOptions()
        setTenants(options)
      } catch {
        customToast.error("Erro ao carregar tenants disponíveis")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleProvision = async () => {
    if (!selectedKey) {
      customToast.error("Selecione um tenant para provisionar")
      return
    }

    setProvisioning(true)
    setStatus("running")
    setResult(null)
    setErrorMessage("")

    try {
      const res = await provisionTenantDatabase(selectedKey)
      setResult(res)
      setStatus(res.status === "success" ? "success" : res.status === "already_applied" ? "already_applied" : "failure")

      if (res.status === "success") {
        customToast.success(res.message)
      } else if (res.status === "already_applied") {
        customToast.info(res.message)
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: TenantProvisionResult & { message?: string } } }; message?: string }
      const errorData = err?.response?.data?.error
      const msg = errorData?.message || err?.message || "Erro ao provisionar tenant"

      setStatus("failure")
      setErrorMessage(msg)

      if (errorData && errorData.errors) {
        setResult(errorData as unknown as TenantProvisionResult)
      }

      customToast.error(msg)
    } finally {
      setProvisioning(false)
    }
  }

  if (!isRoot) {
    return (
      <>
        <MainHeader />
        <div className="bg-slate-50 min-h-screen dark:bg-slate-950 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="py-10 text-center text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium">Acesso restrito</p>
              <p className="text-sm mt-1">Apenas usuários ROLE_ROOT podem acessar esta página.</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  }

  const selectedTenant = tenants.find((t) => t.key === selectedKey)

  return (
    <>
      <MainHeader />
      <div className="bg-slate-50 min-h-screen dark:bg-slate-950">
        <motion.div className="px-6 lg:px-10 py-6 max-w-3xl mx-auto" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={cardVariants}>
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="px-6 py-4">
                <CardTitle className="flex items-center text-indigo-600">
                  <DatabaseZap className="mr-2 w-8 h-8" />
                  <span className="text-2xl font-medium">Provisionar Tenant</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Cria o schema operacional (tabelas do ERP) em um banco de dados tenant configurado.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Seletor de tenant */}
                <div className="space-y-2">
                  <label className="text-sm font-medium block">Database Key do Tenant</label>
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando tenants...
                    </div>
                  ) : tenants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum tenant configurado em tenants.yaml</p>
                  ) : (
                    <Select value={selectedKey} onValueChange={(v) => { setSelectedKey(v); setStatus("idle"); setResult(null) }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.key} value={tenant.key}>
                            <span className="flex items-center gap-2">
                              {tenant.key}
                              <Badge variant="outline" className="text-xs ml-1">
                                {tenant.type}
                              </Badge>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Info do tenant selecionado */}
                {selectedTenant && (
                  <div className="rounded-md border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant={selectedTenant.type === "dedicated" ? "default" : "secondary"}>
                        {selectedTenant.type}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Botão provisionar */}
                <Button
                  onClick={handleProvision}
                  disabled={!selectedKey || provisioning}
                  className="bg-indigo-600 hover:bg-indigo-700 w-full"
                  size="lg"
                >
                  {provisioning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Provisionando...
                    </>
                  ) : (
                    <>
                      <DatabaseZap className="h-4 w-4 mr-2" />
                      Provisionar
                    </>
                  )}
                </Button>

                {/* Resultado */}
                {status !== "idle" && status !== "running" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-md border px-4 py-4 space-y-3 ${
                      status === "success"
                        ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
                        : status === "already_applied"
                          ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                          : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
                    }`}
                  >
                    {/* Status header */}
                    <div className="flex items-center gap-2">
                      {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {status === "already_applied" && <Info className="h-5 w-5 text-blue-600" />}
                      {status === "failure" && <AlertCircle className="h-5 w-5 text-red-600" />}
                      <span className={`font-medium ${
                        status === "success"
                          ? "text-green-800 dark:text-green-200"
                          : status === "already_applied"
                            ? "text-blue-800 dark:text-blue-200"
                            : "text-red-800 dark:text-red-200"
                      }`}>
                        {status === "success" && "Sucesso"}
                        {status === "already_applied" && "Já provisionado"}
                        {status === "failure" && "Falha"}
                      </span>
                    </div>

                    {/* Mensagem */}
                    <p className="text-sm">
                      {result?.message || errorMessage}
                    </p>

                    {/* Detalhes */}
                    {result && (
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p>Database Key: <span className="font-mono">{result.databaseKey}</span></p>
                        <p>Schema Version: <span className="font-mono">{result.version}</span></p>
                        <p>Statements: {result.statementsExecuted} / {result.statementsTotal} executados</p>
                      </div>
                    )}

                    {/* Erros detalhados */}
                    {result?.errors && result.errors.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">Detalhes do erro:</p>
                        {result.errors.map((err, i) => (
                          <div key={i} className="text-xs font-mono bg-red-100 dark:bg-red-900/50 rounded px-3 py-2 break-all">
                            <span className="text-red-600 dark:text-red-400">Statement {err.statement}:</span>{" "}
                            {err.error}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
