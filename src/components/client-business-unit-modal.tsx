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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import type { ClientBusinessUnit } from "@/types/types"
import { createClientBusinessUnit, updateClientBusinessUnit } from "@/app/services/client-business-unit-service"
import { fetchEstados, fetchMunicipiosByUF, type Estado, type Municipio } from "@/app/services/location-service"
import { fetchCEPData } from "@/app/services/cep-service"
import { maskCPFOrCNPJ, unmaskCPFOrCNPJ, maskCEP } from "@/lib/masks"
import customToast from "./ui/custom-toast"

const formSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  abbreviation: z.string().optional(),
  documentId: z.string().min(1, "Documento é obrigatório"),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  postalCode: z.string().min(1, "CEP é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  isHeadquarters: z.boolean().default(false),
})

interface ClientBusinessUnitModalProps {
  clientBusinessUnit: ClientBusinessUnit | null
  personId: string
  onClose: (saved: boolean) => void
}

export function ClientBusinessUnitModal({ clientBusinessUnit, personId, onClose }: ClientBusinessUnitModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCEP, setIsFetchingCEP] = useState(false)
  const [states, setStates] = useState<Estado[]>([])
  const [cities, setCities] = useState<Municipio[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: clientBusinessUnit?.code ?? "",
      name: clientBusinessUnit?.name ?? "",
      abbreviation: clientBusinessUnit?.abbreviation ?? "",
      documentId: clientBusinessUnit?.documentId ?? "",
      stateRegistration: clientBusinessUnit?.stateRegistration ?? "",
      municipalRegistration: clientBusinessUnit?.municipalRegistration ?? "",
      postalCode: clientBusinessUnit?.postalCode ?? "",
      city: clientBusinessUnit?.city ?? "",
      state: clientBusinessUnit?.state ?? "",
      street: clientBusinessUnit?.street ?? "",
      number: clientBusinessUnit?.number ?? "",
      complement: clientBusinessUnit?.complement ?? "",
      neighborhood: clientBusinessUnit?.neighborhood ?? "",
      isHeadquarters: clientBusinessUnit?.isHeadquarters ?? false,
    },
  })

  useEffect(() => {
    loadStates()
    // Carregar cidades se houver estado definido
    if (clientBusinessUnit?.state) {
      loadCitiesByUF(clientBusinessUnit.state)
    }
  }, [clientBusinessUnit])

  const loadStates = async () => {
    setLoadingStates(true)
    try {
      const data = await fetchEstados()
      setStates(data)
    } catch (error: unknown) {
      console.error("Error loading states:", error)
      const errorMessage = (error as Error)?.message || "Erro ao carregar estados"
      customToast.error(errorMessage)
    } finally {
      setLoadingStates(false)
    }
  }

  const loadCitiesByUF = async (uf: string) => {
    setLoadingCities(true)
    try {
      const data = await fetchMunicipiosByUF(uf)
      setCities(data)
    } catch (error: unknown) {
      console.error("Error loading cities:", error)
      const errorMessage = (error as Error)?.message || "Erro ao carregar cidades"
      customToast.error(errorMessage)
    } finally {
      setLoadingCities(false)
    }
  }

  const handleStateChange = async (uf: string) => {
    form.setValue("state", uf)
    form.setValue("city", "")
    setCities([])
    await loadCitiesByUF(uf)
  }

  const handleFetchCEP = async () => {
    const cep = form.getValues("postalCode")?.replace(/\D/g, "") || ""
    if (!cep || cep.length !== 8) {
      customToast.info("CEP inválido. Digite os 8 dígitos.")
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
          await handleStateChange(cepData.uf)

          // Aguardar um momento para as cidades serem carregadas
          if (cepData.localidade) {
            setTimeout(() => {
              form.setValue("city", cepData.localidade)
            }, 100)
          }
        }

        customToast.success("Endereço preenchido com sucesso")
      } else {
        customToast.error("CEP não encontrado")
      }
    } catch (error: unknown) {
      console.error("Error fetching CEP:", error)
      const errorMessage = (error as Error)?.message || "Erro ao buscar CEP"
      customToast.error(errorMessage)
    } finally {
      setIsFetchingCEP(false)
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)

      const businessUnitData = {
        ...data,
        personId,
        documentId: unmaskCPFOrCNPJ(data.documentId),
        postalCode: data.postalCode.replace(/\D/g, ""),
      }

      if (clientBusinessUnit?.id) {
        await updateClientBusinessUnit(clientBusinessUnit.id, businessUnitData)
        customToast.success("Unidade de negócio atualizada com sucesso")
      } else {
        await createClientBusinessUnit(businessUnitData)
        customToast.success("Unidade de negócio criada com sucesso")
      }

      onClose(true)
    } catch (error: unknown) {
      console.error("Error saving client business unit:", error)
      const errorMessage = (error as Error)?.message || "Erro ao salvar unidade de negócio"
      customToast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{clientBusinessUnit ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isHeadquarters"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Matriz</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Abreviação</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="documentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            onChange={(e) => {
                              const masked = maskCPFOrCNPJ(e.target.value)
                              field.onChange(masked)
                            }}
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
                    name="stateRegistration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inscrição Estadual</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Inscrição Municipal</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
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
                              
                              // Buscar CEP automaticamente quando tiver 8 dígitos
                              const onlyNumbers = e.target.value.replace(/\D/g, "")
                              if (onlyNumbers.length === 8) {
                                handleFetchCEP()
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
                          disabled={loadingStates}
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
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!form.watch("state") || loadingCities}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  !form.watch("state")
                                    ? "Selecione um estado primeiro"
                                    : loadingCities
                                    ? "Carregando..."
                                    : "Selecione..."
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.nome}>
                                {city.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                            <Input {...field} />
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
                            <Input {...field} />
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
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {clientBusinessUnit ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

