"use client"

import { useState, useEffect } from "react"
import { MainHeader } from "@/components/main-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileSpreadsheet, Loader2, Building2, X, Calendar, Info } from "lucide-react"
import { getMovimentoContabilidade } from "@/app/services/movimento-contabilidade-service"
import customToast from "@/components/ui/custom-toast"
import { getTipo8BusinessUnits } from "@/services/business-unit-service"
import type { Tipo8BusinessUnit } from "@/services/business-unit-service"

export default function MovimentoContabilidadePage() {
  const [loading, setLoading] = useState(false)
  const [businessUnits, setBusinessUnits] = useState<Tipo8BusinessUnit[]>([])
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingUnits(true)
        const units = await getTipo8BusinessUnits()
        setBusinessUnits(units)
      } catch (error) {
        console.error("Erro ao carregar unidades:", error)
        setBusinessUnits([])
      } finally {
        setLoadingUnits(false)
      }
    }
    load()
  }, [])

  const toggleUnit = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === businessUnits.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(businessUnits.map(u => u.id_pessoa))
    }
  }

  const selectedNames = businessUnits
    .filter(u => selectedIds.includes(u.id_pessoa))
    .map(u => u.apelido)

  const isFormValid = selectedIds.length > 0 && dataInicio && dataFim

  const handleGenerateReport = async () => {
    if (selectedIds.length === 0) {
      customToast.error("Selecione ao menos uma empresa")
      return
    }

    if (!dataInicio || !dataFim) {
      customToast.error("Selecione o periodo do relatorio")
      return
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      customToast.error("A data inicial deve ser anterior a data final")
      return
    }

    setLoading(true)
    try {
      const zipBlob = await getMovimentoContabilidade({
        id_empresa: selectedIds,
        data_inicio: dataInicio,
        data_fim: dataFim
      })

      const nomeArquivo = selectedIds.length === 1
        ? `movimento_contabilidade_${selectedNames[0]}_${dataInicio}_${dataFim}.zip`
        : `movimento_contabilidade_${selectedIds.length}_empresas_${dataInicio}_${dataFim}.zip`

      const link = document.createElement('a')
      const url = URL.createObjectURL(zipBlob)
      link.setAttribute('href', url)
      link.setAttribute('download', nomeArquivo)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      customToast.success("Relatorio ZIP gerado com sucesso!")
    } catch (error) {
      console.error("Erro ao gerar relatorio:", error)
      customToast.error(`Erro ao gerar relatorio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="px-6 lg:px-10 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center text-blue-600">
                <FileSpreadsheet className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-blue-600 dark:text-blue-100">
                  Movimento Contabilidade
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Exporta CSV + anexos numerados em ZIP
                </p>
              </div>
            </div>

            {/* Botao no header */}
            <Button
              onClick={handleGenerateReport}
              disabled={loading || !isFormValid}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm disabled:opacity-40 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar Relatorio ZIP
                </>
              )}
            </Button>
          </div>

          {/* Layout em grid - periodo na esquerda, unidades ocupando mais espaco */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna esquerda - Periodo + Info */}
            <div className="space-y-4">
              {/* Periodo */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Periodo de Pagamento
                </Label>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                  Filtra pela data em que o pagamento foi realizado
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dataInicio" className="text-xs text-slate-500">
                      De
                    </Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      disabled={loading}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dataFim" className="text-xs text-slate-500">
                      Ate
                    </Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      disabled={loading}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex gap-3 p-4 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p className="font-medium text-slate-600 dark:text-slate-300">Conteudo do ZIP:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Relatorio.xlsx formatado</li>
                    <li>Anexos numerados sequencialmente</li>
                    <li>Somente lancamentos pagos no periodo</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Coluna direita - Unidades (ocupa 2/3) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Empresas
                  {selectedIds.length > 0 && (
                    <span className="text-xs font-normal text-slate-400">
                      ({selectedIds.length} selecionada{selectedIds.length > 1 ? 's' : ''})
                    </span>
                  )}
                </Label>
                <button
                  type="button"
                  onClick={toggleAll}
                  disabled={loadingUnits || loading}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-50 transition-colors"
                >
                  {selectedIds.length === businessUnits.length ? "Desmarcar todas" : "Selecionar todas"}
                </button>
              </div>

              {/* Selected badges */}
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {businessUnits
                    .filter(u => selectedIds.includes(u.id_pessoa))
                    .map(u => (
                      <span
                        key={u.id_pessoa}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      >
                        {u.apelido}
                        <button
                          type="button"
                          onClick={() => toggleUnit(u.id_pessoa)}
                          className="hover:text-blue-900 dark:hover:text-blue-100 ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}

              {/* Checkbox grid */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                  {loadingUnits ? (
                    <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando empresas...
                    </div>
                  ) : businessUnits.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-sm text-slate-400">
                      Nenhuma empresa encontrada
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 divide-y md:divide-y-0 divide-slate-100 dark:divide-slate-800">
                      {businessUnits.map(unit => {
                        const isSelected = selectedIds.includes(unit.id_pessoa)
                        return (
                          <label
                            key={unit.id_pessoa}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 ${isSelected
                              ? 'bg-blue-50/60 dark:bg-blue-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                              }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleUnit(unit.id_pessoa)}
                              disabled={loading}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block truncate">
                                {unit.apelido}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                {unit.abreviatura}
                              </span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
