"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Building, MapPin, FileText } from "lucide-react"
import type { BusinessUnitSummary } from "@/app/services/business-unit-summary-service"
import { businessUnitSummaryServiceWithToasts } from "@/app/services/business-unit-summary-service"
import { fetchCEPData } from "@/app/services/cep-service"
import { fetchEstados, fetchMunicipiosByUF, type Estado, type Municipio } from "@/app/services/location-service"
import { maskCEP } from "@/lib/masks"
import customToast from "./ui/custom-toast"
import { handleError } from "@/lib/error-handler"

const formSchema = z.object({
  apelido: z.string().min(1, "Nome é obrigatório"),
  abreviatura: z.string().max(50, "Máximo 50 caracteres").optional(),
  descricao: z.string().max(1000, "Máximo 1.000 caracteres").optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  nr: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  uf: z.string().optional(),
  cidade: z.string().optional(),
  idMunicipio: z.number().optional(),
})

interface BusinessUnitModalProps {
  unidade: BusinessUnitSummary | null
  onClose: (saved: boolean) => void
}

export function BusinessUnitModal({ unidade, onClose }: BusinessUnitModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [isFetchingCEP, setIsFetchingCEP] = useState(false)
  const [states, setStates] = useState<Estado[]>([])
  const [cities, setCities] = useState<Municipio[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apelido: "", abreviatura: "", descricao: "",
      cep: "", logradouro: "", nr: "", complemento: "", bairro: "",
      uf: "", cidade: "", idMunicipio: undefined,
    },
  })

  useEffect(() => {
    loadStates()
    if (unidade?.id) {
      loadUnidadeData()
    }
  }, [unidade])

  const loadStates = async () => {
    setLoadingStates(true)
    try { setStates(await fetchEstados()) }
    catch (e) { console.error(e) }
    finally { setLoadingStates(false) }
  }

  const loadUnidadeData = async () => {
    if (!unidade?.id) return
    setIsLoadingData(true)
    try {
      const { httpClient } = await import("@/lib/http-client")
      const fullData = await httpClient.get<any>(`/unidades-negocio/${unidade.id}`)
      form.reset({
        apelido: fullData.apelido || "",
        abreviatura: fullData.abreviatura || "",
        descricao: fullData.descricao || "",
        cep: fullData.cep ? maskCEP(String(fullData.cep)) : "",
        logradouro: fullData.logradouro || "",
        nr: fullData.nr || "",
        complemento: fullData.complemento || "",
        bairro: fullData.bairro || "",
        uf: fullData.uf || "",
        cidade: fullData.cidade || "",
        idMunicipio: fullData.id_municipio || undefined,
      })
      if (fullData.uf) await loadCitiesByUF(fullData.uf)
    } catch (e) {
      console.error("Erro ao carregar unidade:", e)
      customToast.error("Erro ao carregar dados da unidade")
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadCitiesByUF = async (uf: string): Promise<Municipio[]> => {
    setLoadingCities(true)
    try {
      const data = await fetchMunicipiosByUF(uf)
      setCities(data)
      return data
    } catch { return [] }
    finally { setLoadingCities(false) }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      const payload = {
        apelido: data.apelido,
        abreviatura: data.abreviatura?.trim() || undefined,
        descricao: data.descricao?.trim() || undefined,
        cep: data.cep ? data.cep.replace(/\D/g, "") : undefined,
        logradouro: data.logradouro?.trim() || undefined,
        nr: data.nr?.trim() || undefined,
        complemento: data.complemento?.trim() || undefined,
        bairro: data.bairro?.trim() || undefined,
        uf: data.uf?.trim() || undefined,
        cidade: data.cidade?.trim() || undefined,
        idMunicipio: data.idMunicipio || undefined,
      }
      if (unidade?.id) {
        await businessUnitSummaryServiceWithToasts.update(unidade.id, payload)
      } else {
        await businessUnitSummaryServiceWithToasts.create(payload)
      }
      onClose(true)
    } catch (error: any) {
      handleError(error, "salvar unidade")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchCEP = async () => {
    const cep = form.getValues("cep")?.replace(/\D/g, "") || ""
    if (!cep || cep.length !== 8) { customToast.info("CEP inválido. Digite os 8 dígitos."); return }
    try {
      setIsFetchingCEP(true)
      const cepData = await fetchCEPData(cep)
      if (cepData) {
        form.setValue("logradouro", cepData.logradouro || "")
        form.setValue("bairro", cepData.bairro || "")
        form.setValue("complemento", cepData.complemento || "")
        if (cepData.uf) {
          form.setValue("uf", cepData.uf)
          const loadedCities = await loadCitiesByUF(cepData.uf)
          if (cepData.localidade) {
            const municipio = loadedCities.find((m) => m.nome.toLowerCase() === cepData.localidade.toLowerCase())
            if (municipio) {
              form.setValue("cidade", municipio.nome)
              form.setValue("idMunicipio", municipio.id)
            } else {
              form.setValue("cidade", cepData.localidade)
              form.setValue("idMunicipio", undefined)
            }
          }
        }
        customToast.success("Endereço preenchido com sucesso")
      } else {
        customToast.error("CEP não encontrado")
      }
    } catch {
      customToast.error("Erro ao buscar CEP")
    } finally {
      setIsFetchingCEP(false)
    }
  }

  const handleStateChange = async (uf: string) => {
    form.setValue("uf", uf)
    form.setValue("cidade", "")
    form.setValue("idMunicipio", undefined)
    setCities([])
    await loadCitiesByUF(uf)
  }

  if (isLoadingData) {
    return (
      <Dialog open onOpenChange={() => onClose(false)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Carregando unidade</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-slate-600">Carregando dados...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-slate-900">
        <DialogHeader className="shrink-0 border-b border-green-200 dark:border-green-800 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-green-600 rounded-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-green-900 dark:text-green-100">
                {unidade ? "Editar Unidade" : "Nova Unidade"}
              </div>
              {unidade && <div className="text-sm font-normal text-green-600 dark:text-green-400">{unidade.apelido}</div>}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic">
                <TabsList className="grid w-full grid-cols-2 bg-green-100 dark:bg-green-900 p-1">
                  <TabsTrigger value="basic" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white">
                    <Building className="h-4 w-4 mr-2" />
                    Dados Básicos
                  </TabsTrigger>
                  <TabsTrigger value="address" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white">
                    <MapPin className="h-4 w-4 mr-2" />
                    Endereço
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-6">
                  <div className="bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                      <Building className="h-5 w-5 text-green-600" />
                      Identificação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="apelido" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-green-800 dark:text-green-200">Nome *</FormLabel>
                          <FormControl><Input {...field} placeholder="Nome da unidade" autoFocus /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="abreviatura" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Abreviatura</FormLabel>
                          <FormControl><Input {...field} placeholder="Abreviatura (máx. 50)" maxLength={50} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Descrição
                    </h3>
                    <FormField control={form.control} name="descricao" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Texto livre até 1.000 caracteres" maxLength={1000} rows={4} className="resize-none" />
                        </FormControl>
                        <div className="text-xs text-muted-foreground text-right">{(field.value || "").length}/1.000</div>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-4 mt-6">
                  <div className="bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Localização
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="cep" render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} onChange={(e) => field.onChange(maskCEP(e.target.value))} placeholder="00000-000" maxLength={9} />
                            </FormControl>
                            <Button type="button" variant="outline" size="icon" onClick={handleFetchCEP} disabled={isFetchingCEP}>
                              {isFetchingCEP ? <Loader2 className="h-4 w-4 animate-spin" /> : "🔍"}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="uf" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select onValueChange={handleStateChange} value={field.value} disabled={loadingStates}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={loadingStates ? "Carregando..." : "Selecione..."} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {states.map((s) => <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="cidade" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <SearchableSelect
                            value={field.value || ""}
                            onValueChange={(value) => {
                              field.onChange(value)
                              const city = cities.find((c) => c.nome === value)
                              if (city) form.setValue("idMunicipio", city.id)
                            }}
                            options={cities.map((c) => ({ value: c.nome, label: c.nome }))}
                            placeholder={loadingCities ? "Carregando..." : "Selecione a cidade"}
                            disabled={loadingCities || !form.getValues("uf")}
                          />
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">Detalhes do Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <FormField control={form.control} name="logradouro" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl><Input {...field} placeholder="Rua, Avenida, etc." /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="nr" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl><Input {...field} placeholder="Nº" maxLength={15} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="complemento" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl><Input {...field} placeholder="Apto, Sala, etc." /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="mt-4">
                      <FormField control={form.control} name="bairro" render={({ field }) => (
                        <FormItem className="max-w-sm">
                          <FormLabel>Bairro</FormLabel>
                          <FormControl><Input {...field} placeholder="Bairro" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t border-green-200 dark:border-green-800">
          <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {unidade ? "Atualizar" : "Criar"} Unidade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
