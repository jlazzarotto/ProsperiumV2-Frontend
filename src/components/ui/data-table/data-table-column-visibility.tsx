"use client"

import React, { useState, useRef } from "react"
import { type Table } from "@tanstack/react-table"
import { GripVertical, SlidersHorizontal, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"

interface DataTableColumnVisibilityProps<TData> {
  table: Table<TData>
  columnLabels?: Record<string, string>
}

export function DataTableColumnVisibility<TData>({
  table,
  columnLabels = {},
}: DataTableColumnVisibilityProps<TData>) {
  const [open, setOpen] = useState(false)
  const draggedIdRef = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const hideableColumns = table.getAllColumns().filter(col => col.getCanHide())
  const fixedStart = table.getAllColumns().filter(col => !col.getCanHide() && table.getAllColumns().indexOf(col) < table.getAllColumns().findIndex(c => c.getCanHide()))
  const fixedEnd = table.getAllColumns().filter(col => !col.getCanHide() && table.getAllColumns().indexOf(col) > table.getAllColumns().reduce((last, c, i) => c.getCanHide() ? i : last, -1))

  const handleDragStart = (e: React.DragEvent, id: string) => {
    draggedIdRef.current = id
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverId(id)
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = draggedIdRef.current
    if (!sourceId || sourceId === targetId) {
      setDragOverId(null)
      draggedIdRef.current = null
      return
    }

    const currentOrder = hideableColumns.map(c => c.id)
    const fromIdx = currentOrder.indexOf(sourceId)
    const toIdx = currentOrder.indexOf(targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const newHideableOrder = [...currentOrder]
    newHideableOrder.splice(fromIdx, 1)
    newHideableOrder.splice(toIdx, 0, sourceId)

    const fullOrder = [
      ...fixedStart.map(c => c.id),
      ...newHideableOrder,
      ...fixedEnd.map(c => c.id),
    ]
    table.setColumnOrder(fullOrder)

    draggedIdRef.current = null
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    draggedIdRef.current = null
    setDragOverId(null)
  }

  const visibleCount = hideableColumns.filter(c => c.getIsVisible()).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <SlidersHorizontal className="h-4 w-4" />
          Colunas
          {visibleCount < hideableColumns.length && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-1">
              {visibleCount}/{hideableColumns.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2" onInteractOutside={() => setOpen(false)}>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 pb-2">
          Arraste para reordenar · toggle para exibir
        </p>
        <div className="space-y-0.5">
          {hideableColumns.map(column => {
            const label = columnLabels[column.id] || column.id
            const isVisible = column.getIsVisible()
            const isDragOver = dragOverId === column.id

            return (
              <div
                key={column.id}
                draggable
                onDragStart={e => handleDragStart(e, column.id)}
                onDragOver={e => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, column.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing select-none transition-colors ${
                  isDragOver
                    ? "bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-400 dark:border-blue-600"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <GripVertical className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className={`flex-1 text-sm truncate ${isVisible ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
                  {label}
                </span>
                <Switch
                  checked={isVisible}
                  onCheckedChange={val => column.toggleVisibility(val)}
                  className="scale-75 flex-shrink-0"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )
          })}
        </div>
        {hideableColumns.some(c => !c.getIsVisible()) && (
          <div className="border-t border-slate-100 dark:border-slate-700 mt-2 pt-2 px-2">
            <button
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline w-full text-left"
              onClick={() => {
                hideableColumns.forEach(c => c.toggleVisibility(true))
              }}
            >
              Mostrar todas
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
