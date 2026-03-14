"use client"

import React from "react"
import { type Table as TanstackTable, type Row, flexRender } from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import type { ReactNode } from "react"

interface DataTableProps<TData> {
  table: TanstackTable<TData>
  loading?: boolean
  /** Quando true, mostra dados existentes com overlay sutil em vez de spinner de bloqueio */
  refreshing?: boolean
  error?: string | null
  emptyMessage?: string
  /** Renders extra rows below each data row (e.g. expandable sub-rows) */
  renderSubRow?: (row: Row<TData>) => ReactNode
  /** Returns a custom className for each <TableRow> based on row data */
  getRowClassName?: (row: Row<TData>) => string | undefined
  /**
   * Optionally override the entire row rendering for special rows (e.g. group headers).
   * Return a ReactNode to replace the default rendering, or null/undefined to use default.
   */
  renderCustomRow?: (row: Row<TData>, colCount: number) => ReactNode | null | undefined
  /** Sticky duplicate header that appears on scroll */
  stickyHeader?: boolean
  isScrolled?: boolean
  /** Extra content rendered at the end of <TableBody> (e.g. "loading more…") */
  footerContent?: ReactNode
}

export function DataTable<TData>({
  table,
  loading,
  refreshing,
  error,
  emptyMessage = "Nenhum registro encontrado.",
  renderSubRow,
  getRowClassName,
  renderCustomRow,
  stickyHeader,
  isScrolled,
  footerContent,
}: DataTableProps<TData>) {
  const colCount = table.getVisibleFlatColumns().length

  const headerGroups = table.getHeaderGroups()

  const renderHeaders = () =>
    headerGroups.map((headerGroup) => (
      <TableRow key={headerGroup.id}>
        {headerGroup.headers.map((header) => (
          <TableHead
            key={header.id}
            style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
          </TableHead>
        ))}
      </TableRow>
    ))

  return (
    <>
      {/* Sticky header duplicate (appears on scroll) */}
      {stickyHeader && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isScrolled ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <Table className="min-w-full">
            <TableHeader className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              {renderHeaders()}
            </TableHeader>
          </Table>
        </div>
      )}

      {/* Main table */}
      <div className="relative rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm overflow-x-auto">
        {/* Overlay de atualização — mantém dados visíveis, apenas dimeia */}
        {refreshing && (
          <div className="absolute inset-0 z-10 bg-white/60 dark:bg-slate-900/60 flex items-start justify-end pointer-events-none">
            <div className="flex items-center gap-1.5 m-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-xs font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Atualizando...</span>
            </div>
          </div>
        )}
        <Table className="min-w-full">
          <TableHeader>{renderHeaders()}</TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <span>Carregando...</span>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-10 text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-10 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                // Allow consumer to override rendering for special rows
                const customRow = renderCustomRow?.(row, colCount)
                if (customRow) return <React.Fragment key={row.id}>{customRow}</React.Fragment>

                return (
                  <React.Fragment key={row.id}>
                    <TableRow className={getRowClassName?.(row)}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {renderSubRow?.(row)}
                  </React.Fragment>
                )
              })
            )}
            {footerContent}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
