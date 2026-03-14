"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Ship, MapPin } from 'lucide-react'
import type { Operation } from "@/types/types"

interface OperationsMapProps {
  loading: boolean
  operations: Operation[]
}

export function OperationsMap({ loading, operations }: OperationsMapProps) {
  const [selectedPort, setSelectedPort] = useState<string | null>(null)
  
  // Agrupar operações por porto
  const portGroups = operations.reduce((groups, operation) => {
    if (!operation.portId || !operation.portName) return groups
    
    if (!groups[operation.portId]) {
      groups[operation.portId] = {
        id: operation.portId,
        name: operation.portName,
        operations: []
      }
    }
    
    groups[operation.portId].operations.push(operation)
    return groups
  }, {} as Record<string, { id: string, name: string, operations: Operation[] }>)
  
  // Converter para array e ordenar por número de operações
  const portList = Object.values(portGroups).sort((a, b) => b.operations.length - a.operations.length)

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle>Mapa de Operações</CardTitle>
        <CardDescription>Distribuição de operações por porto</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg relative overflow-hidden">
              {/* Aqui seria implementado um mapa real com bibliotecas como Leaflet ou Google Maps */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Mapa de operações
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    (Visualização simulada)
                  </p>
                </div>
              </div>
              
              {/* Pontos simulados no mapa */}
              {portList.map((port, index) => {
                // Posições simuladas para demonstração
                const top = 20 + (index * 50) % 300
                const left = 30 + (index * 70) % 500
                
                return (
                  <div 
                    key={port.id}
                    className={`absolute cursor-pointer transition-all duration-200 ${
                      selectedPort === port.id ? 'scale-125 z-10' : 'hover:scale-110'
                    }`}
                    style={{ top: `${top}px`, left: `${left}px` }}
                    onClick={() => setSelectedPort(selectedPort === port.id ? null : port.id)}
                  >
                    <div className="relative">
                      <div className="bg-blue-600 dark:bg-blue-500 h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {port.operations.length}
                      </div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-600 dark:border-t-blue-500"></div>
                      
                      {selectedPort === port.id && (
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-700 shadow-lg rounded-lg p-2 min-w-[120px] z-20">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{port.name}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {port.operations.length} operações
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Portos com Operações</h3>
              
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                {portList.map((port) => (
                  <div 
                    key={port.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPort === port.id
                        ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                    onClick={() => setSelectedPort(selectedPort === port.id ? null : port.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium">{port.name}</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {port.operations.length}
                      </Badge>
                    </div>
                    
                    {selectedPort === port.id && (
                      <div className="mt-2 space-y-1 pl-6">
                        {port.operations.slice(0, 3).map((operation) => (
                          <div key={operation.id} className="flex items-center text-xs text-slate-600 dark:text-slate-400">
                            <Ship className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-400" />
                            {operation.code} - {operation.shipName}
                          </div>
                        ))}
                        {port.operations.length > 3 && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            + {port.operations.length - 3} mais
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
