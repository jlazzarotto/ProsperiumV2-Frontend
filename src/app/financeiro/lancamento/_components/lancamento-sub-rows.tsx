"use client"

import React from "react"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  CreditCard,
  Plus,
  Minus,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import type { FinancialTransaction } from "@/types/types"
import { formatDate } from "../_lib/lancamento-utils"
import { formatCurrency } from "@/lib/utils"

interface SubRowsProps {
  transaction: FinancialTransaction
  colSpan: number
  expandedAdjustments: Set<string>
  expandedParcelas: Set<string>
  expandedFaturas: Set<string>
  faturaItemsCache: Record<string, Array<{
    id_item_fatura?: number
    id_lcto: number
    descricao?: string
    data_compra?: string
    numero_documento?: string
    parcela_num: number
    parcela_total: number
    valor: string | number
    status: string
  }>>
  loadingFaturaItems: Set<string>
  onViewDetails: (transaction: FinancialTransaction) => void
}

export function LancamentoSubRows({
  transaction,
  colSpan,
  expandedAdjustments,
  expandedParcelas,
  expandedFaturas,
  faturaItemsCache,
  loadingFaturaItems,
  onViewDetails,
}: SubRowsProps) {
  return (
    <>
      {/* Parcelas agrupadas (cartão parcelado) */}
      {transaction.parcelasAgrupadas && transaction.parcelasAgrupadas.length > 0 && expandedParcelas.has(transaction.id || '') && (
        transaction.parcelasAgrupadas.map((parcela) => (
          <TableRow
            key={`parcela-${parcela.id}`}
            className="bg-violet-50/60 dark:bg-violet-500/5 hover:bg-violet-100 dark:hover:bg-violet-500/10 border-l-3 border-violet-300 dark:border-violet-500/40"
          >
            <TableCell className="w-12">
              <div className="w-3 h-3 rounded-sm bg-violet-300" />
            </TableCell>
            <TableCell className="w-[70px] p-1 text-xs text-slate-500">
              {parcela.empresaAbbreviation || '-'}
            </TableCell>
            <TableCell className="w-[200px] p-1 pl-4">
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate block" title={parcela.clientName}>
                {parcela.clientName ? (parcela.clientName.length > 20 ? `${parcela.clientName.substring(0, 20)}...` : parcela.clientName) : "-"}
              </span>
            </TableCell>
            <TableCell className="w-[70px] p-1 text-xs">{parcela.competence}</TableCell>
            <TableCell className="w-[100px] p-1 text-xs text-slate-500">{parcela.document || '-'}</TableCell>
            <TableCell className="w-[250px] p-1">
              <div className="flex items-center gap-1">
                <Badge className="bg-violet-500 text-white text-xs px-1.5 py-0 font-medium rounded-full">
                  {parcela.parcelaNum}/{(transaction.parcelasAgrupadas?.length || 0) + 1}
                </Badge>
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate" title={parcela.description}>
                  {parcela.description.length > 25 ? `${parcela.description.substring(0, 25)}...` : parcela.description}
                </span>
              </div>
            </TableCell>
            <TableCell className="w-[100px] p-3 text-center">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${parcela.type === "entrada"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
              }`}>
                {parcela.type === "entrada" ? "+ ENT" : "- SAI"}
              </span>
            </TableCell>
            <TableCell className="w-[140px] p-1 text-xs text-slate-500">{parcela.transactionTypeName?.substring(0, 16) || '-'}</TableCell>
            <TableCell className={`w-[140px] p-1 text-xs text-slate-500 ${parcela.cashAccountName === '-' ? 'text-center' : ''}`}>{parcela.cashAccountName?.substring(0, 16) || '-'}</TableCell>
            <TableCell className="w-[100px] p-1 text-xs text-slate-500 text-center">
              {formatDate(parcela.dueDate)}
            </TableCell>
            <TableCell className="w-[100px] p-1 text-xs text-center">
              {parcela.paymentDate ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {formatDate(parcela.paymentDate)}
                </span>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </TableCell>
            <TableCell className="w-[120px] text-right font-medium p-3">
              <span className={`text-xs font-semibold ${parcela.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(parcela.value)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <FileText className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewDetails(parcela)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))
      )}

      {/* Ajustes juros/desconto */}
      {transaction.jurosDescontoAssociados && transaction.jurosDescontoAssociados.length > 0 && expandedAdjustments.has(transaction.id || '') && (
        transaction.jurosDescontoAssociados.map((jd) => (
          <TableRow
            key={`jd-${jd.id}`}
            className={`${jd.natureza === 'entrada'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 border-l-3 border-emerald-300 dark:border-emerald-500/40'
              : 'bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/15 border-l-3 border-rose-300 dark:border-rose-500/40'
            }`}
          >
            <TableCell className="w-12">
              <div className={`w-3 h-3 rounded-sm ${jd.natureza === 'entrada' ? 'bg-green-400' : 'bg-red-400'}`} />
            </TableCell>
            <TableCell className="w-[300px] p-1 pl-4">
              <div className="flex items-center gap-2 w-full">
                <Badge className={`${jd.natureza === 'entrada' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} text-xs px-2 py-0.5 font-medium flex items-center gap-1 text-center min-w-[80px] max-w-[100px] rounded-full`}>
                  {jd.tipo === 'juros' ? (
                    <><Plus className="h-2.5 w-2.5" /><span>JUROS</span></>
                  ) : (
                    <><Minus className="h-2.5 w-2.5" /><span>DESC</span></>
                  )}
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400 italic whitespace-nowrap">
                  automático
                </span>
              </div>
            </TableCell>
            <TableCell className="w-[70px] p-1 text-xs text-slate-400 dark:text-slate-500">-</TableCell>
            <TableCell className="w-[100px] p-1 text-xs text-slate-400 dark:text-slate-500">-</TableCell>
            <TableCell className="w-[250px] p-1">
              <div className="flex flex-col">
                <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {jd.tipo === 'juros' ? 'Juros' : 'Desconto'}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {jd.tipo === 'juros' ? 'Cobrança de juros' : 'Desconto aplicado'}
                </span>
              </div>
            </TableCell>
            <TableCell className="w-[100px] p-3 text-center">
              <div className="flex justify-center">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 min-w-[70px] justify-center ${jd.natureza === 'entrada'
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                  : "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
                }`}>
                  {jd.natureza === 'entrada' ? (
                    <><Plus className="h-3 w-3" /><span>ENT</span></>
                  ) : (
                    <><Minus className="h-3 w-3" /><span>SAI</span></>
                  )}
                </span>
              </div>
            </TableCell>
            <TableCell className="w-[120px] p-1 text-xs text-slate-400 dark:text-slate-500">-</TableCell>
            <TableCell className="w-[80px] p-1">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {formatDate(jd.data_pagamento)}
              </span>
            </TableCell>
            <TableCell className="w-[80px] p-1">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {formatDate(jd.data_pagamento)}
              </span>
            </TableCell>
            <TableCell className="w-[120px] text-right p-3">
              <div className="flex flex-col items-end">
                <span className={`text-xs font-semibold flex items-center gap-1 ${jd.natureza === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {jd.natureza === 'entrada' ? (
                    <><Plus className="h-3 w-3" /><span>{formatCurrency(Number(jd.valor))}</span></>
                  ) : (
                    <><Minus className="h-3 w-3" /><span>{formatCurrency(Number(jd.valor))}</span></>
                  )}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-center p-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                #{jd.id}
              </span>
            </TableCell>
          </TableRow>
        ))
      )}

      {/* Itens da fatura (cache-based) */}
      {transaction.idFatura && !transaction.idCartao && expandedFaturas.has(transaction.id || '') && (
        loadingFaturaItems.has(transaction.id || '') ? (
          <TableRow className="bg-violet-50 dark:bg-violet-500/10">
            <TableCell colSpan={colSpan} className="text-center py-3">
              <div className="flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Carregando itens da fatura...</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (faturaItemsCache[String(transaction.idFatura)] || []).length > 0 ? (
          (faturaItemsCache[String(transaction.idFatura)] || []).map((item, idx) => (
            <TableRow
              key={`fatura-item-${item.id_item_fatura || idx}`}
              className="bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/15 border-l-3 border-violet-300 dark:border-violet-500/40"
            >
              <TableCell className="w-12">
                <div className="w-3 h-3 rounded-sm bg-violet-400" />
              </TableCell>
              <TableCell className="w-[70px] p-1 text-xs text-slate-400">-</TableCell>
              <TableCell className="w-[200px] p-1 pl-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-violet-500 text-white text-xs px-2 py-0.5 font-medium rounded-full">
                    {item.parcela_num}/{item.parcela_total}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                    #{item.id_lcto}
                  </span>
                </div>
              </TableCell>
              <TableCell className="w-[70px] p-1 text-xs text-slate-400">-</TableCell>
              <TableCell className="w-[100px] p-1 text-xs text-slate-500">
                {item.numero_documento || '-'}
              </TableCell>
              <TableCell className="w-[250px] p-1">
                <span className="text-xs text-slate-700 dark:text-slate-300" title={item.descricao || ''}>
                  {(item.descricao || 'Item da fatura').length > 40
                    ? `${(item.descricao || 'Item da fatura').substring(0, 40)}...`
                    : (item.descricao || 'Item da fatura')}
                </span>
              </TableCell>
              <TableCell className="w-[100px] p-3 text-center">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  item.status === 'estornado'
                    ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                    : item.status === 'conciliado'
                    ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                    : 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400'
                }`}>
                  {item.status}
                </span>
              </TableCell>
              <TableCell className="w-[140px] p-1 text-xs text-slate-400">-</TableCell>
              <TableCell className="w-[140px] p-1 text-xs text-slate-400">-</TableCell>
              <TableCell className="w-[100px] p-1 text-xs text-slate-500 text-center">
                {item.data_compra ? formatDate(item.data_compra) : '-'}
              </TableCell>
              <TableCell className="w-[100px] p-1 text-xs text-slate-400 text-center">-</TableCell>
              <TableCell className="w-[120px] text-right p-3">
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                  {formatCurrency(Number(item.valor))}
                </span>
              </TableCell>
              <TableCell className="text-center p-1">
                <span className="text-xs text-slate-400 font-mono">
                  #{item.id_item_fatura}
                </span>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow className="bg-violet-50 dark:bg-violet-500/10">
            <TableCell colSpan={colSpan} className="text-center py-3">
              <span className="text-xs text-violet-500">Nenhum item encontrado nesta fatura</span>
            </TableCell>
          </TableRow>
        )
      )}

      {/* Fatura compras (embedded in itensFatura) */}
      {transaction.isFaturaRow && transaction.itensFatura && transaction.itensFatura.length > 0 && expandedFaturas.has(transaction.id || '') && (
        transaction.itensFatura.map((compra) => (
          <TableRow
            key={`fatura-compra-${compra.id}`}
            className="bg-violet-50/60 dark:bg-violet-500/5 hover:bg-violet-100 dark:hover:bg-violet-500/10 border-l-3 border-violet-300 dark:border-violet-500/40"
          >
            <TableCell className="w-12">
              <div className="w-3 h-3 rounded-sm bg-violet-300" />
            </TableCell>
            <TableCell className="w-[70px] p-1 text-xs text-slate-500">
              {compra.empresaAbbreviation || '-'}
            </TableCell>
            <TableCell className="w-[200px] p-1 pl-4">
              <span className="text-xs text-slate-600 dark:text-slate-400 truncate block" title={compra.clientName}>
                {compra.clientName ? (compra.clientName.length > 20 ? `${compra.clientName.substring(0, 20)}...` : compra.clientName) : "-"}
              </span>
            </TableCell>
            <TableCell className="w-[70px] p-1 text-xs">{compra.competence}</TableCell>
            <TableCell className="w-[100px] p-1 text-xs text-slate-500">{compra.document || '-'}</TableCell>
            <TableCell className="w-[250px] p-1">
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-violet-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate" title={compra.description}>
                  {compra.description.length > 30 ? `${compra.description.substring(0, 30)}...` : compra.description}
                </span>
                {compra.parcelaNum && (
                  <Badge className="bg-violet-500 text-white text-xs px-1.5 py-0 font-medium rounded-full">
                    {compra.parcelaNum}x
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="w-[100px] p-3 text-center">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                <Minus className="h-3 w-3 inline" /> SAI
              </span>
            </TableCell>
            <TableCell className="w-[140px] p-1 text-xs text-slate-500">{compra.transactionTypeName?.substring(0, 16) || '-'}</TableCell>
            <TableCell className={`w-[140px] p-1 text-xs text-slate-500 ${compra.cashAccountName === '-' ? 'text-center' : ''}`}>{compra.cashAccountName?.substring(0, 16) || '-'}</TableCell>
            <TableCell className="w-[100px] p-1 text-xs text-slate-500 text-center">
              {formatDate(compra.dueDate)}
            </TableCell>
            <TableCell className="w-[100px] p-1 text-xs text-center">
              {compra.paymentDate ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                  {formatDate(compra.paymentDate)}
                </span>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </TableCell>
            <TableCell className="w-[120px] text-right font-medium p-3">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {formatCurrency(compra.value)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <FileText className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewDetails(compra)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))
      )}
    </>
  )
}
