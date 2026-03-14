"use client"

import { useState } from "react"
import { useDreStore } from "@/lib/dre-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, BarChart2, Calendar, Building, FileText, Trash2, Edit } from "lucide-react"
import { motion } from "framer-motion"
import { DreConfigWizard } from "@/components/dre-config-wizard"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { v4 as uuidv4 } from "uuid"
import { formatMonthDisplay } from "@/lib/utils"
import type { DreData } from "../types/types" // Adjust the path based on the actual location of the 'types' file

interface DreListProps {
  onSelectDre: (dreId: string) => void
}

export function DreList({ onSelectDre }: DreListProps) {
  const { dres, deleteDre, addDre } = useDreStore()
  const [showNewDreWizard, setShowNewDreWizard] = useState(false)

  // Adicionar função para criar novo DRE com estrutura padrão
  const createNewDre = () => {
    const newDreId = uuidv4()
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const prevMonth = now.getMonth().toString().padStart(2, "0")
    const prevPrevMonth = (now.getMonth() - 1).toString().padStart(2, "0")

    // Criar estrutura padrão similar à do sistema original
    const newDre: DreData = {
      id: newDreId,
      name: `DRE ${formatMonthDisplay(`${year}${prevPrevMonth}`)} a ${formatMonthDisplay(`${year}${month}`)}`,
      company: "Minha Empresa",
      cnpj: "00.000.000/0001-00",
      period: `${formatMonthDisplay(`${year}${prevPrevMonth}`)} a ${formatMonthDisplay(`${year}${month}`)}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      data: {
        rec_oper: {
          multi: "1",
          title_group: "(+) RECEITA OPERACIONAL BRUTA",
          "Vendas de Mercadorias": {
            [`${year}${prevPrevMonth}`]: "0",
            [`${year}${prevMonth}`]: "0",
            [`${year}${month}`]: "0",
          },
          "Prestação de Serviços": {
            [`${year}${prevPrevMonth}`]: "0",
            [`${year}${prevMonth}`]: "0",
            [`${year}${month}`]: "0",
          },
        },
        deducoes: {
          multi: "1",
          title_group: "(-) DEDUÇÕES DA RECEITA BRUTA",
          "Impostos sobre Vendas": {
            [`${year}${prevPrevMonth}`]: "0",
            [`${year}${prevMonth}`]: "0",
            [`${year}${month}`]: "0",
          },
        },
        rec_liq: {
          multi: "0",
          title_group: "(=) RECEITA OPERACIONAL LÍQUIDA",
          formula: "(subtracao);rec_oper;deducoes",
        },
        cpr: {
          multi: "1",
          title_group: "(-) CUSTO DOS PRODUTOS/SERVIÇOS",
          "Custo das Mercadorias Vendidas": {
            [`${year}${prevPrevMonth}`]: "0",
            [`${year}${prevMonth}`]: "0",
            [`${year}${month}`]: "0",
          },
        },
        lucro_bruto: {
          multi: "0",
          title_group: "(=) LUCRO BRUTO",
          formula: "(subtracao);rec_liq;cpr",
        },
        desp_oper: {
          multi: "1",
          title_group: "(-) DESPESAS OPERACIONAIS",
          "Despesas Administrativas": {
            [`${year}${prevPrevMonth}`]: "0",
            [`${year}${prevMonth}`]: "0",
            [`${year}${month}`]: "0",
          },
          "Despesas com Vendas": {
            [`${year}${prevPrevMonth}`]: "0",
            [`${year}${prevMonth}`]: "0",
            [`${year}${month}`]: "0",
          },
        },
        lucro_liq: {
          multi: "0",
          title_group: "(=) LUCRO/PREJUÍZO LÍQUIDO DO EXERCÍCIO",
          formula: "(subtracao);lucro_bruto;desp_oper",
        },
      },
    }

    addDre(newDre)
    return newDreId
  }

  // Atualizar o handleCreateNewDre para usar a nova função
  const handleCreateNewDre = () => {
    const newDreId = createNewDre()
    onSelectDre(newDreId)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch {
      return "Data desconhecida"
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Meus DREs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Selecione um DRE para visualizar ou crie um novo</p>
        </div>
        <Button onClick={handleCreateNewDre} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Novo DRE
        </Button>
      </div>

      {dres.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-6 mb-4">
            <BarChart2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum DRE encontrado</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Você ainda não possui nenhum Demonstrativo de Resultado do Exercício. Crie seu primeiro DRE para começar a
            análise financeira.
          </p>
          <Button onClick={handleCreateNewDre} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Criar meu primeiro DRE
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dres.map((dre, index) => (
            <motion.div
              key={dre.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-lg font-semibold line-clamp-2">{dre.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir DRE</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o DRE &quot;{dre.name}&quot;? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDre(dre.id)} className="bg-red-600 hover:bg-red-700">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardTitle>
                  <CardDescription className="line-clamp-1">{dre.company}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2 flex-grow">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Building className="h-4 w-4 mr-2" />
                      <span className="line-clamp-1">{dre.cnpj}</span>
                    </div>
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="line-clamp-1">{dre.period}</span>
                    </div>
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="line-clamp-1">Atualizado {formatDate(dre.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between">
                  <Button variant="outline" size="sm" className="w-[48%]">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    className="w-[48%] bg-blue-600 hover:bg-blue-700"
                    onClick={() => onSelectDre(dre.id)}
                  >
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {showNewDreWizard && (
        <DreConfigWizard
          open={showNewDreWizard}
          onOpenChange={setShowNewDreWizard}
          onComplete={(dreId) => {
            setShowNewDreWizard(false)
            if (dreId) {
              onSelectDre(dreId)
            }
          } } buttonText={""} buttonVariant={""}        />
      )}
    </div>
  )
}

