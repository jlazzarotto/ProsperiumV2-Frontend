"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Filter } from "lucide-react"

// Form schema for filters
const filterFormSchema = z.object({
  dataInicio: z.date().optional(),
  dataFim: z.date().optional(),
  pesquisarPor: z.string().optional(),
  competencia: z.string().optional(),
  natureza: z.string().optional(),
  tipoLancamento: z.string().optional(),
  contaCaixa: z.string().optional(),
  negocio: z.string().optional(),
  unidadeNegocio: z.string().optional(),
  operacao: z.string().optional(),
  situacao: z.string().optional(),
})

type FilterDrawerProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: z.infer<typeof filterFormSchema>) => void
}

export function FilterDrawer({ isOpen, onClose, onSubmit }: FilterDrawerProps) {
  // Form for filters
  const filterForm = useForm<z.infer<typeof filterFormSchema>>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      dataInicio: new Date("1970-01-01"),
      dataFim: new Date("2025-04-17"),
      pesquisarPor: "Data de vencimento",
      competencia: "--",
      natureza: "Entrada",
      tipoLancamento: "todos",
      contaCaixa: "--",
      negocio: "--",
      unidadeNegocio: "--",
      operacao: "--",
      situacao: "Em aberto",
    },
  })

  const handleSubmit = (values: z.infer<typeof filterFormSchema>) => {
    onSubmit(values)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full overflow-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Form {...filterForm}>
          <form onSubmit={filterForm.handleSubmit(handleSubmit)} className="p-4 space-y-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <FormLabel>De:</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DatePicker date={field.value} setDate={(date) => field.onChange(date)} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Até:</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="dataFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DatePicker date={field.value} setDate={(date) => field.onChange(date)} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Pesquisar por</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="pesquisarPor"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Data de vencimento">Data de vencimento</SelectItem>
                          <SelectItem value="Data de emissão">Data de emissão</SelectItem>
                          <SelectItem value="Data de pagamento">Data de pagamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Competência</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="competencia"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="--">--</SelectItem>
                          <SelectItem value="202401">202401</SelectItem>
                          <SelectItem value="202402">202402</SelectItem>
                          <SelectItem value="202403">202403</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Natureza</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="natureza"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Entrada">Entrada</SelectItem>
                          <SelectItem value="Saída">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Tipo lançamento</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="tipoLancamento"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="Locação de maquina">Locação de maquina</SelectItem>
                          <SelectItem value="Operação(locação de material de estiva)">
                            Operação(locação de material de estiva)
                          </SelectItem>
                          <SelectItem value="Prancha (caminhão)">Prancha (caminhão)</SelectItem>
                          <SelectItem value="Take or Pay">Take or Pay</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Conta caixa</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="contaCaixa"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="--">--</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Negócio</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="negocio"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="--">--</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Unidade de negócio</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="unidadeNegocio"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="--">--</SelectItem>
                          <SelectItem value="SERBCN">SERBCN</SelectItem>
                          <SelectItem value="SERSTM">SERSTM</SelectItem>
                          <SelectItem value="LOCSFS">LOCSFS</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Operação</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="operacao"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="--">--</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <FormLabel>Situação</FormLabel>
                <FormField
                  control={filterForm.control}
                  name="situacao"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Em aberto">Em aberto</SelectItem>
                          <SelectItem value="Pago">Pago</SelectItem>
                          <SelectItem value="Todos">Todos</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="sticky bottom-0 pt-4 pb-2 bg-white dark:bg-slate-900 border-t mt-4 flex justify-between gap-4">
              <Button type="button" variant="outline" onClick={() => filterForm.reset()}>
                Limpar filtros
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Pesquisar
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

