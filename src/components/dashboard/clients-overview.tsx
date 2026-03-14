"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, Building2, Anchor, FileText } from 'lucide-react'
import { ResponsivePie } from "@nivo/pie"
import { formatCurrency } from "@/lib/utils"
import type { Person, ClientBusinessUnit, Operation, FinancialTransaction } from "@/types/types"

interface ClientsOverviewProps {
  loading: boolean
  clients: Person[]
  businessUnits: ClientBusinessUnit[]
  operations: Operation[]
  transactions: FinancialTransaction[]
}

export function ClientsOverview({ loading, clients, businessUnits, operations, transactions }: ClientsOverviewProps) {
  // Calcular transações por cliente
  const clientTransactions = clients.map(client => {
    const clientOps = operations.filter(op => op.clientId === client.id)
    const clientTxs = transactions.filter(tx => tx.clientId === client.id)
    
    const totalIncome = clientTxs
      .filter(t => t.type === "entrada" && t.status !== "cancelado")
      .reduce((sum, t) => sum + t.value, 0)
      
    const totalExpense = clientTxs
      .filter(t => t.type === "saida" && t.status !== "cancelado")
      .reduce((sum, t) => sum + t.value, 0)
      
    return {
      ...client,
      operations: clientOps.length,
      transactions: clientTxs.length,
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense
    }
  }).sort((a, b) => b.income - a.income)
  
  // Dados para o gráfico de pizza
  const getPieData = () => {
    // Pegar os 5 principais clientes por receita
    const topClients = [...clientTransactions]
      .sort((a, b) => b.income - a.income)
      .slice(0, 5)
    
    // Calcular o total para "Outros"
    const othersIncome = clientTransactions
      .filter(c => !topClients.find(tc => tc.id === c.id))
      .reduce((sum, c) => sum + c.income, 0)
    
    const data = topClients.map(client => ({
      id: client.name,
      label: client.name,
      value: client.income
    }))
    
    if (othersIncome > 0) {
      data.push({
        id: "Outros",
        label: "Outros",
        value: othersIncome
      })
    }
    
    return data
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Principais Clientes</CardTitle>
          <CardDescription>Clientes por volume financeiro</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-800">
                    <th className="h-10 px-4 text-left font-medium">Cliente</th>
                    <th className="h-10 px-4 text-left font-medium">Operações</th>
                    <th className="h-10 px-4 text-left font-medium">Transações</th>
                    <th className="h-10 px-4 text-left font-medium">Receitas</th>
                    <th className="h-10 px-4 text-left font-medium">Despesas</th>
                    <th className="h-10 px-4 text-left font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {clientTransactions.slice(0, 5).map((client) => (
                    <tr key={client.id} className="border-b">
                      <td className="p-4 align-middle font-medium">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          {client.name}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                          {client.operations}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950">
                          {client.transactions}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(client.income)}
                      </td>
                      <td className="p-4 align-middle font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(client.expense)}
                      </td>
                      <td className={`p-4 align-middle font-medium ${
                        client.balance >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(client.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Distribuição de Receitas</CardTitle>
          <CardDescription>Receitas por cliente</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px]">
              <ResponsivePie
                data={getPieData()}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 56,
                    itemsSpacing: 0,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: '#999',
                    itemDirection: 'left-to-right',
                    itemOpacity: 1,
                    symbolSize: 18,
                    symbolShape: 'circle',
                  }
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-3 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle>Unidades de Negócio</CardTitle>
          <CardDescription>Distribuição por unidade de negócio</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : businessUnits.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Nenhuma unidade de negócio encontrada
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessUnits.map((unit) => {
                const unitOps = operations.filter(op => op.businessUnitId === unit.id)
                const unitTxs = transactions.filter(tx => tx.businessUnitId === unit.id)
                
                const totalIncome = unitTxs
                  .filter(t => t.type === "entrada" && t.status !== "cancelado")
                  .reduce((sum, t) => sum + t.value, 0)
                  
                const totalExpense = unitTxs
                  .filter(t => t.type === "saida" && t.status !== "cancelado")
                  .reduce((sum, t) => sum + t.value, 0)
                  
                const balance = totalIncome - totalExpense
                
                return (
                  <div 
                    key={unit.id}
                    className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-medium">{unit.name}</h3>
                      </div>
                      <Badge className={`${
                        balance >= 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {formatCurrency(balance)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Anchor className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                        {unitOps.length} operações
                      </div>
                      
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <FileText className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                        {unitTxs.length} transações
                      </div>
                      
                      <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                        Receitas: {formatCurrency(totalIncome)}
                      </div>
                      
                      <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                        Despesas: {formatCurrency(totalExpense)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
