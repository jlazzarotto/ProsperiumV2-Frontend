/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BusinessUnitType8 } from "@/types/types"
import { businessUnitType8ServiceWithToasts, getBusinessUnitType8ById } from "@/app/services/business-unit-type8-service"
import { fetchCEPData } from "@/app/services/cep-service"
import { fetchEstados, fetchMunicipiosByUF, type Estado, type Municipio } from "@/app/services/location-service"
import { maskCEP, maskCPFOrCNPJ, validateCPFOrCNPJ } from "@/lib/masks"
import { Loader2, Building2, MapPin, FileText } from "lucide-react"
import customToast from "./ui/custom-toast"
import { handleError } from "@/lib/error-handler"

const formSchema = z.object({
  nome: z.string().min(1, "Razão social é obrigatória"),
  apelido: z.string().min(1, "Apelido é obrigatório"),
  cnpj: z.string().optional().refine((value) => {
    if (!value || value.trim() === "") return true
    return validateCPFOrCNPJ(value)
  }, {
    message: "CPF/CNPJ inválido"
  }),
  ie: z.string().optional(),
  im: z.string().optional(),
  abreviatura: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  nr: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  uf: z.string().optional(),
  cidade: z.string().optional(),
  idMunicipio: z.number().optional(),
})

interface BusinessUnitType8ModalProps {
  unit: BusinessUnitType8 | null
  onClose: (saved: boolean) => void
}

export function BusinessUnitType8Modal({ unit, onClose }: BusinessUnitType8ModalProps) {
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
      nome: "",
      apelido: "",
      cnpj: "",
      ie: "",
      im: "",
      abreviatura: "",
      cep: "",
      logradouro: "",
      nr: "",
      complemento: "",
      bairro: "",
      uf: "",
      cidade: "",
      idMunicipio: undefined,
    },
  })

  // Carregar dados completos da unidade quando for edição
  useEffect(() => {
    const loadUnitData = async () => {
      if (unit?.id) {
        setIsLoadingData(true)
        try {
          const fullData = await getBusinessUnitType8ById(unit.id)
          if (fullData) {
            form.reset({
              nome: fullData.nome || "",
              apelido: fullData.apelido || "",
              cnpj: fullData.cnpj ? maskCPFOrCNPJ(fullData.cnpj) : "",
              ie: fullData.ie || "",
              im: fullData.im || "",
              abreviatura: fullData.abreviatura || "",
              cep: fullData.cep ? maskCEP(fullData.cep) : "",
              logradouro: fullData.logradouro || "",
              nr: fullData.nr || "",
              complemento: fullData.complemento || "",
              bairro: fullData.bairro || "",
              uf: fullData.uf || "",
              cidade: fullData.cidade || "",
              idMunicipio: fullData.idMunicipio || undefined,
            })

            // Carregar cidades se houver estado
            if (fullData.uf) {
              await loadCitiesByUF(fullData.uf)
            }
          }
        } catch (error) {
          console.error("Erro ao carregar dados da unidade:", error)
          customToast.error("Erro ao carregar dados da unidade")
        } finally {
          setIsLoadingData(false)
        }
      }
    }

    loadStates()
    loadUnitData()
  }, [unit])

  const loadStates = async () => {
    setLoadingStates(true)
    try {
      const data = await fetchEstados()
      setStates(data)
    } catch (error: any) {
      console.error("Error loading states:", error)
    } finally {
      setLoadingStates(false)
    }
  }

  const loadCitiesByUF = async (uf: string): Promise<Municipio[]> => {
    setLoadingCities(true)
    try {
      const data = await fetchMunicipiosByUF(uf)
      setCities(data)
      return data
    } catch (error: any) {
      console.error("Error loading cities:", error)
      return []
    } finally {
      setLoadingCities(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)

      const unitData = {
        nome: data.nome,
        apelido: data.apelido,
        cnpj: data.cnpj ? data.cnpj.replace(/\D/g, "") : undefined,
        ie: data.ie?.trim() || undefined,
        im: data.im?.trim() || undefined,
        abreviatura: data.abreviatura?.trim() || undefined,
        cep: data.cep ? data.cep.replace(/\D/g, "") : undefined,
        logradouro: data.logradouro?.trim() || undefined,
        nr: data.nr?.trim() || undefined,
        complemento: data.complemento?.trim() || undefined,
        bairro: data.bairro?.trim() || undefined,
        uf: data.uf?.trim() || undefined,
        cidade: data.cidade?.trim() || undefined,
        idMunicipio: data.idMunicipio || undefined,
      }

      if (unit?.id) {
        await businessUnitType8ServiceWithToasts.update(unit.id, unitData)
      } else {
        await businessUnitType8ServiceWithToasts.create(unitData)
      }

      onClose(true)
    } catch (error: any) {
      handleError(error, "salvar empresa")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchCEP = async () => {
    const cep = form.getValues("cep")?.replace(/\D/g, "") || ""
    if (!cep || cep.length !== 8) {
      customToast.info("CEP inválido. Digite os 8 dígitos.", {
        position: "top-right",
      })
      return
    }

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
            const municipio = loadedCities.find(m =>
              m.nome.toLowerCase() === cepData.localidade.toLowerCase()
            )
            if (municipio) {
              form.setValue("cidade", municipio.nome)
              form.setValue("idMunicipio", municipio.id)
            } else {
              form.setValue("cidade", cepData.localidade)
              form.setValue("idMunicipio", undefined)
            }
          }
        }

        customToast.success("Endereço preenchido com sucesso", {
          position: "top-right",
        })
      } else {
        customToast.error("CEP não encontrado", {
          position: "top-right",
        })
      }
    } catch (error: any) {
      console.error("Error fetching CEP:", error)
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
          <DialogHeader>
            <DialogTitle>Carregando empresa</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600">Carregando dados...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
        <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-blue-900 dark:text-blue-100">
                {unit ? "Editar Empresa" : "Nova Empresa"}
              </div>
              {unit && <div className="text-sm font-normal text-blue-600 dark:text-blue-400">{unit.apelido}</div>}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic">
                <TabsList className="grid w-full grid-cols-2 bg-blue-100 dark:bg-blue-900 p-1">
                  <TabsTrigger
                    value="basic"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Dados Básicos
                  </TabsTrigger>
                  <TabsTrigger
                    value="address"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Endereço
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-6">
                  {/* Seção Identificação */}
                  <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Identificação
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-800 dark:text-blue-200">Razão Social *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Razão social da empresa" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="apelido"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Apelido *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Apelido da empresa" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abreviatura"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Abreviatura</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Abreviatura (máx. 10)" maxLength={10} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seção Documentação */}
                  <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Documentação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF/CNPJ</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) => field.onChange(maskCPFOrCNPJ(e.target.value))}
                                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                maxLength={18}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ie"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inscrição Estadual</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="IE" maxLength={15} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="im"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inscrição Municipal</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="IM" maxLength={15} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-4 mt-6">
                  {/* Seção Localização */}
                  <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Localização
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  {...field}
                                  onChange={(e) => field.onChange(maskCEP(e.target.value))}
                                  placeholder="00000-000"
                                  maxLength={9}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleFetchCEP}
                                disabled={isFetchingCEP}
                              >
                                {isFetchingCEP ? <Loader2 className="h-4 w-4 animate-spin" /> : "🔍"}
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="uf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                              onValueChange={handleStateChange}
                              value={field.value}
                              disabled={loadingStates}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={loadingStates ? "Carregando..." : "Selecione..."} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {states.map((state) => (
                                  <SelectItem key={state.sigla} value={state.sigla}>
                                    {state.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <SearchableSelect
                              value={field.value || ""}
                              onValueChange={(value) => {
                                field.onChange(value)
                                const selectedCity = cities.find(c => c.nome === value)
                                if (selectedCity) {
                                  form.setValue("idMunicipio", selectedCity.id)
                                }
                              }}
                              options={cities.map(city => ({
                                value: city.nome,
                                label: city.nome,
                              }))}
                              placeholder={loadingCities ? "Carregando..." : "Selecione a cidade"}
                              disabled={loadingCities || !form.getValues("uf")}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção Detalhes do Endereço */}
                  <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                      Detalhes do Endereço
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="logradouro"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Logradouro</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Rua, Avenida, etc." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="nr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Nº" maxLength={15} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="complemento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Apto, Sala, etc." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="bairro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Bairro" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t border-blue-200 dark:border-blue-800">
          <Button type="button" variant="outline" onClick={() => onClose(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            onClick={form.handleSubmit(onSubmit)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {unit ? "Atualizar" : "Criar"} Empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
