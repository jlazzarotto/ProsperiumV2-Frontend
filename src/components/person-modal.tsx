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
import type { Person } from "@/types/types"
import { personServiceWithToasts } from "@/app/services/person-api-service"
import { fetchCEPData } from "@/app/services/cep-service"
import { fetchEstados, fetchMunicipiosByUF, type Estado, type Municipio } from "@/app/services/location-service"
import { maskCPFOrCNPJ, unmaskCPFOrCNPJ, maskCEP, validateCPFOrCNPJ } from "@/lib/masks"
import { Loader2 } from "lucide-react"
import customToast from "./ui/custom-toast"
import { handleError } from "@/lib/error-handler"

const formSchema = z.object({
  code: z.string().optional(),
  personType: z.enum(["pf", "pj"]),
  registrationType: z.enum([
    "Cliente",
    "Fornecedor",
    "Colaborador",
    "Supervisor",
    "Coordenador",
    "Gerente",
    "Diretor",
    "Admin",
  ]),
  name: z.string().min(1, "Nome é obrigatório"),
  abbreviation: z.string().optional(),
  // Documento não é mais obrigatório, mas deve ser válido se preenchido
  documentId: z.string().optional(),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  // Endereço não é obrigatório para criar o cadastro
  postalCode: z.string().optional(),
  city: z.string().optional(),
  cityId: z.number().optional(),
  state: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  businessUnitId: z.string().optional(),
  businessUnits: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (!data.documentId || data.documentId.trim() === '') return
  if (!validateCPFOrCNPJ(data.documentId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CPF/CNPJ inválido", path: ["documentId"] })
    return
  }
  const digits = data.documentId.replace(/\D/g, '')
  if (data.personType === 'pj' && digits.length !== 14) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pessoa Jurídica deve ter CNPJ (14 dígitos)", path: ["documentId"] })
  }
  if (data.personType === 'pf' && digits.length !== 11) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pessoa Física deve ter CPF (11 dígitos)", path: ["documentId"] })
  }
})

interface PersonModalProps {
  person: Person | null
  onClose: (saved: boolean, personId?: number) => void
  defaultBusinessUnitId?: string // Para vincular automaticamente à unidade de negócio
}

export function PersonModal({ person, onClose, defaultBusinessUnitId }: PersonModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCEP, setIsFetchingCEP] = useState(false)
  const [states, setStates] = useState<Estado[]>([])
  const [cities, setCities] = useState<Municipio[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: person?.code || "",
      personType: person?.personType || "pj",
      registrationType: person?.registrationType || "Cliente",
      name: person?.name || "",
      abbreviation: person?.abbreviation || "",
      documentId: person?.documentId ? maskCPFOrCNPJ(person.documentId) : "",
      stateRegistration: person?.stateRegistration || "",
      municipalRegistration: person?.municipalRegistration || "",
      postalCode: person?.postalCode ? maskCEP(person.postalCode) : "",
      city: person?.city || "",
      cityId: person?.cityId || undefined,
      state: person?.state || "",
      street: person?.street || "",
      number: person?.number || "",
      complement: person?.complement || "",
      neighborhood: person?.neighborhood || "",
      businessUnitId: person?.businessUnitId || defaultBusinessUnitId || "",
      businessUnits: person?.businessUnits || (defaultBusinessUnitId ? [defaultBusinessUnitId] : []),
    },
  })

  useEffect(() => {
    loadStates()

    // Carregar cidades se houver estado definido
    if (person?.state) {
      loadCitiesByUF(person.state)
    }
  }, [person])

  const loadStates = async () => {
    setLoadingStates(true)
    try {
      const data = await fetchEstados()
      setStates(data)
    } catch (error: any) {
      console.error("Error loading states:", error)
      const errorMessage = error?.message || "Erro ao carregar estados"
      customToast.error(errorMessage, {
        position: "top-right",
      })
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
      const errorMessage = error?.message || "Erro ao carregar cidades"
      customToast.error(errorMessage, {
        position: "top-right",
      })
      return []
    } finally {
      setLoadingCities(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)

      // Remover máscaras e tratar campos opcionais antes de enviar
      const personData: any = {
        ...data,
        // Ao editar: enviar string vazia para limpar o CPF; ao criar: omitir se vazio
        documentId: data.documentId ? unmaskCPFOrCNPJ(data.documentId) : (person ? "" : undefined),
        postalCode: data.postalCode ? data.postalCode.replace(/\D/g, "") : undefined,
        stateRegistration: data.stateRegistration?.trim() || undefined,
        municipalRegistration: data.municipalRegistration?.trim() || undefined,
        abbreviation: data.abbreviation?.trim() || undefined,
        street: data.street?.trim() || undefined,
        number: data.number?.trim() || undefined,
        complement: data.complement?.trim() || undefined,
        neighborhood: data.neighborhood?.trim() || undefined,
        city: data.city?.trim() || undefined,
        state: data.state?.trim() || undefined,
        businessUnitId: data.businessUnitId || defaultBusinessUnitId || undefined,
        businessUnits: data.businessUnits?.length ? data.businessUnits : (defaultBusinessUnitId ? [defaultBusinessUnitId] : undefined),
      }

      if (person?.id) {
        await personServiceWithToasts.update(person.id, personData)
      } else {
        await personServiceWithToasts.create(personData)
      }

      onClose(true)
    } catch (error: any) {
      // Erros HTTP já são exibidos pelo useErrorToast global; apenas logar aqui
      console.error("Erro ao salvar pessoa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchCEP = async () => {
    const cep = form.getValues("postalCode")?.replace(/\D/g, "") || ""
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
        form.setValue("street", cepData.logradouro || "")
        form.setValue("neighborhood", cepData.bairro || "")
        form.setValue("complement", cepData.complemento || "")

        // Definir estado e carregar cidades
        if (cepData.uf) {
          // Primeiro definir o estado
          form.setValue("state", cepData.uf)

          // Carregar cidades do estado e usar o retorno
          const loadedCities = await loadCitiesByUF(cepData.uf)

          // Definir a cidade usando a lista carregada
          if (cepData.localidade) {
            // Buscar o município pelo nome para obter o ID
            const municipio = loadedCities.find(m =>
              m.nome.toLowerCase() === cepData.localidade.toLowerCase()
            )
            if (municipio) {
              form.setValue("city", municipio.nome)
              form.setValue("cityId", municipio.id)
            } else {
              // Se não encontrar o município exato, apenas define o nome
              form.setValue("city", cepData.localidade)
              form.setValue("cityId", undefined)
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
      const errorMessage = error?.message || "Erro ao buscar CEP"
      customToast.error(errorMessage)
    } finally {
      setIsFetchingCEP(false)
    }
  }

  const handleStateChange = async (uf: string) => {
    form.setValue("state", uf)
    form.setValue("city", "")
    form.setValue("cityId", undefined)
    setCities([])
    await loadCitiesByUF(uf)
  }

  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
        <DialogHeader className="shrink-0 border-b border-blue-200 dark:border-blue-800 pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-blue-900 dark:text-blue-100">{person ? "Editar Pessoa" : "Nova Pessoa"}</div>
              {person && <div className="text-sm font-normal text-blue-600 dark:text-blue-400">{person.name}</div>}
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
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Dados Básicos
                  </TabsTrigger>
                  <TabsTrigger
                    value="address"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Endereço
                  </TabsTrigger>
                </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    Informações de Identificação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Gerado automaticamente" disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="personType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Pessoa</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pf">Pessoa Física</SelectItem>
                            <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cadastro</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Cliente">Cliente</SelectItem>
                            <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                            <SelectItem value="Colaborador">Colaborador</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="Coordenador">Coordenador</SelectItem>
                            <SelectItem value="Gerente">Gerente</SelectItem>
                            <SelectItem value="Diretor">Diretor</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-800 dark:text-blue-200">Nome/Razão Social</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite o nome completo ou razão social" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="abbreviation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Fantasia/Abreviação</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome fantasia ou abreviação" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Documentação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="documentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-800 dark:text-blue-200">
                          {form.watch("personType") === "pf" ? "CPF" : "CNPJ"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              const masked = maskCPFOrCNPJ(e.target.value)
                              field.onChange(masked)
                            }}
                            placeholder={form.watch("personType") === "pf" ? "000.000.000-00" : "00.000.000/0000-00"}
                            maxLength={form.watch("personType") === "pf" ? 14 : 18}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stateRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch("personType") === "pf" ? "RG" : "Inscrição Estadual"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={form.watch("personType") === "pf" ? "Digite o RG" : "Digite a inscrição estadual"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="municipalRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch("personType") === "pf" ? "CNH" : "Inscrição Municipal"}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={form.watch("personType") === "pf" ? "Digite a CNH" : "Digite a inscrição municipal"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4 mt-6">
                <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Localização
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              const masked = maskCEP(e.target.value)
                              field.onChange(masked)

                              const onlyNumbers = e.target.value.replace(/\D/g, "")
                              if (onlyNumbers.length === 8) {
                                // Buscar CEP automaticamente quando tiver 8 dígitos
                                handleFetchCEP()
                              } else if (onlyNumbers.length === 0) {
                                // Limpar campos de endereço quando CEP é apagado
                                form.setValue("street", "")
                                form.setValue("neighborhood", "")
                                form.setValue("complement", "")
                                form.setValue("state", "")
                                form.setValue("city", "")
                                form.setValue("cityId", undefined)
                                setCities([])
                              }
                            }}
                            placeholder="00000-000"
                            maxLength={9}
                            disabled={isFetchingCEP}
                          />
                        </FormControl>
                        {isFetchingCEP && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Buscando endereço...</span>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            handleStateChange(value)
                          }}
                          disabled={loadingStates || isFetchingCEP}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingStates ? "Carregando..." : "Selecione..."} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {states.map((state) => (
                              <SelectItem key={state.id} value={state.sigla}>
                                {state.sigla} - {state.nome}
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
                    name="city"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={[
                              { value: "", label: "-- Selecione a cidade --" },
                              ...cities.map(cityItem => ({
                                value: cityItem.id.toString(),
                                label: cityItem.nome
                              }))
                            ]}
                            value={form.watch("cityId")?.toString() || ""}
                            onValueChange={(value) => {
                              const selectedCity = cities.find(c => c.id.toString() === value)
                              if (selectedCity) {
                                field.onChange(selectedCity.nome)
                                form.setValue("cityId", selectedCity.id)
                              } else {
                                field.onChange("")
                                form.setValue("cityId", undefined)
                              }
                            }}
                            placeholder={
                              !form.watch("state")
                                ? "Selecione um estado primeiro"
                                : loadingCities
                                ? "Carregando..."
                                : "Selecione a cidade..."
                            }
                            disabled={!form.watch("state") || loadingCities || isFetchingCEP}
                            loading={loadingCities}
                            searchPlaceholder="Buscar cidade..."
                            emptyMessage="Nenhuma cidade encontrada"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Detalhes do Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-800 dark:text-blue-200">Rua</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome da rua" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nº" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Apto, sala..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-800 dark:text-blue-200">Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome do bairro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t border-blue-200 dark:border-blue-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            onClick={form.handleSubmit(onSubmit)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {person ? "Atualizar Pessoa" : "Criar Pessoa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

