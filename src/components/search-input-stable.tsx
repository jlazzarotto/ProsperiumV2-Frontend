"use client"

import React, { useCallback } from "react"
import { Search, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchInputStableProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onClear: () => void
  className?: string
}

export const SearchInputStable = React.memo(function SearchInputStable({
  placeholder = "Pesquisar",
  value,
  onChange,
  onClear,
  className = ""
}: SearchInputStableProps) {

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClear()
  }, [onClear])

  return (
    <div className={`relative ${className}`}>
      {!value && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        </div>
      )}
      <Input
        type="text"
        placeholder=" "
        value={value}
        onChange={handleInputChange}
        className="w-full border-0 bg-slate-200 dark:bg-slate-800 px-10 text-center focus:ring-2 focus:ring-blue-500"
      />
      {value && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-6 w-6 p-0"
          >
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}
    </div>
  )
})