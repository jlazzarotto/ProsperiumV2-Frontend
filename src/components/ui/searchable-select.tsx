"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  value: string
  label: string | null | undefined
  description?: string | null
  keywords?: string[]
}

interface SearchableSelectProps {
  options: Option[]
  value?: string
  placeholder?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  loading?: boolean
  className?: string
  searchPlaceholder?: string
  emptyMessage?: string
  renderOption?: (option: Option) => React.ReactNode
}

export function SearchableSelect({
  options,
  value = "",
  placeholder = "Selecione uma opção...",
  onValueChange,
  disabled = false,
  loading = false,
  className,
  searchPlaceholder = "Pesquisar...",
  emptyMessage = "Nenhuma opção encontrada",
  renderOption,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)

  const normalizeText = (text: string | null | undefined) => (text ?? "").toLowerCase()
  const getSearchTexts = (option: Option) => [
    normalizeText(option.label),
    normalizeText(option.description),
    ...(option.keywords ?? []).map(normalizeText),
  ]

  const selectedOption = options.find(option => option.value === value && option.value !== "")
  
  const normalizedSearchTerm = normalizeText(searchTerm)

  const getMatchScore = (option: Option) => {
    if (!normalizedSearchTerm) return 0

    const texts = getSearchTexts(option).filter(Boolean)

    if (texts.some((text) => text === normalizedSearchTerm)) return 400
    if (texts.some((text) => text.startsWith(normalizedSearchTerm))) return 300

    const wordBoundaryMatch = texts.some((text) =>
      text.split(/\s+/).some((word) => word.startsWith(normalizedSearchTerm))
    )
    if (wordBoundaryMatch) return 200

    if (texts.some((text) => text.includes(normalizedSearchTerm))) return 100
    return -1
  }

  const filteredOptions = options
    .map((option) => ({ option, score: getMatchScore(option) }))
    .filter(({ score }) => normalizedSearchTerm ? score >= 0 : true)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return normalizeText(a.option.label).localeCompare(normalizeText(b.option.label))
    })
    .map(({ option }) => option)

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex].value)
        }
        break
      case "Escape":
        setIsOpen(false)
        setSearchTerm("")
        break
    }
  }

  const selectOption = (optionValue: string) => {
    onValueChange?.(optionValue)
    setIsOpen(false)
    setSearchTerm("")
  }

  const defaultRenderOption = (option: Option) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{option.label || "Sem descricao"}</div>
        {option.description && (
          <div className="text-xs text-gray-500 truncate">{option.description}</div>
        )}
      </div>
      {option.value === value && (
        <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
      )}
    </div>
  )

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={cn(
          "w-full px-3 py-2 text-left border rounded-md bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-600",
          "hover:border-gray-400 dark:hover:border-gray-500 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-blue-500 border-blue-500",
          selectedOption && "border-blue-300 bg-blue-50 dark:bg-blue-950/50"
        )}
      >
        <div className="flex items-center justify-between">
          <span className={cn(
            "block truncate",
            !selectedOption && "text-gray-500 dark:text-gray-400"
          )}>
            {loading ? "Carregando..." : selectedOption?.label || placeholder}
          </span>
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2",
              isOpen && "rotate-180"
            )} 
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div 
            ref={optionsRef}
            className="max-h-48 overflow-y-auto"
          >
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectOption(option.value)}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors",
                    "focus:outline-none focus:bg-gray-100 dark:focus:bg-slate-700",
                    index === highlightedIndex && "bg-gray-100 dark:bg-slate-700",
                    option.value === value && "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  )}
                >
                  {renderOption ? renderOption(option) : defaultRenderOption(option)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
