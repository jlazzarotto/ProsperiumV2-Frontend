/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBusinessUnits } from "@/app/hooks/use-business-units"
import { maskCEP } from "@/lib/masks"
import customToast from "./ui/custom-toast"
// Form schema for business unit
const formSchema = z.object({
  code: z.string(),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  abbreviation: z.string(),
  description: z.string().max(1000, "Descrição deve ter no máximo 1.000 caracteres").optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
})

const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

interface BusinessUnitFormProps {
  onSuccess?: () => void
  editingBusinessUnit?: any
}

export function BusinessUnitForm({ onSuccess, editingBusinessUnit }: BusinessUnitFormProps) {
  const { addBusinessUnit, updateBusinessUnit } = useBusinessUnits()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: editingBusinessUnit?.code || "",
      name: editingBusinessUnit?.name || "",
      abbreviation: editingBusinessUnit?.abbreviation || "",
      description: editingBusinessUnit?.description || "",
      postalCode: editingBusinessUnit?.postalCode ? maskCEP(editingBusinessUnit.postalCode) : "",
      city: editingBusinessUnit?.city || "",
      state: editingBusinessUnit?.state || "",
      street: editingBusinessUnit?.street || "",
      number: editingBusinessUnit?.number || "",
      complement: editingBusinessUnit?.complement || "",
      neighborhood: editingBusinessUnit?.neighborhood || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)

      const businessUnitData = {
        ...values,
        postalCode: values.postalCode?.replace(/\D/g, "") || "",
        city: values.city || "",
        state: values.state || "",
        street: values.street || "",
        number: values.number || "",
        complement: values.complement || "",
        neighborhood: values.neighborhood || "",
        description: values.description || "",
      }

      if (editingBusinessUnit?.id) {
        await updateBusinessUnit(editingBusinessUnit.id, businessUnitData)
      } else {
        await addBusinessUnit(businessUnitData)
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      customToast.error("Erro ao salvar unidade de negócio. Tente novamente.", {position: "bottom-right"})

    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nome da Unidade</FormLabel>
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
                <FormLabel>Abreviatura</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Descrição da unidade de negócio (até 1.000 caracteres)"
                    maxLength={1000}
                    rows={4}
                    className="resize-none"
                  />
                </FormControl>
                <div className="text-xs text-muted-foreground text-right">
                  {(field.value || "").length}/1.000
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </FormControl>
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
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state.toLowerCase()}>
                        {state}
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
            name="street"
            render={({ field }) => (
              <FormItem className="col-span-3">
                <FormLabel>Logradouro</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : editingBusinessUnit ? "Atualizar" : "Criar Unidade"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
