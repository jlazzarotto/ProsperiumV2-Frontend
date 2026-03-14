"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getAllPeople } from "@/app/services/person-api-service"
import type { Person } from "@/types/types"
import { Check, ChevronDown, X, Loader2, Users, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import customToast from "@/components/ui/custom-toast"

interface PersonSelectorProps {
  selectedPersonIds: string[]
  onSelectionChange: (personIds: string[]) => void
  disabled?: boolean
}

export function PersonSelector({ selectedPersonIds, onSelectionChange, disabled }: PersonSelectorProps) {
  const [open, setOpen] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPeople()
  }, [])

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadPeople = async () => {
    setLoading(true)
    try {
      const data = await getAllPeople(1, 500)
      setPeople(data)
    } catch (error) {
      console.error("Error loading people:", error)
      customToast.error("Erro ao carregar pessoas")
    } finally {
      setLoading(false)
    }
  }

  const selectedPeople = useMemo(() => {
    return people.filter((person) => person.id && selectedPersonIds.includes(person.id))
  }, [people, selectedPersonIds])

  const filteredPeople = useMemo(() => {
    if (!searchTerm.trim()) return people
    const search = searchTerm.toLowerCase()
    return people.filter(
      (person) =>
        person.name?.toLowerCase().includes(search) ||
        person.documentId?.toLowerCase().includes(search) ||
        person.code?.toLowerCase().includes(search)
    )
  }, [people, searchTerm])

  const togglePerson = (personId: string) => {
    const newSelection = selectedPersonIds.includes(personId)
      ? selectedPersonIds.filter((id) => id !== personId)
      : [...selectedPersonIds, personId]
    onSelectionChange(newSelection)
  }

  const removePerson = (personId: string) => {
    onSelectionChange(selectedPersonIds.filter((id) => id !== personId))
  }

  const formatDocument = (doc: string) => {
    if (!doc) return ""
    const cleaned = doc.replace(/\D/g, "")
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    } else if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return doc
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => !disabled && setOpen(!open)}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {selectedPeople.length > 0
                ? `${selectedPeople.length} pessoa(s) selecionada(s)`
                : "Selecionar pessoas..."}
            </span>
          </div>
          <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
        </Button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-600">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou documento..."
                  className="w-full pl-8 pr-3 py-1 text-sm"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPeople.length === 0 ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Nenhuma pessoa encontrada.
                </div>
              ) : (
                filteredPeople.map((person) => {
                  const isSelected = person.id ? selectedPersonIds.includes(person.id) : false
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => person.id && togglePerson(person.id)}
                      className={cn(
                        "w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors",
                        "focus:outline-none focus:bg-gray-100 dark:focus:bg-slate-700",
                        isSelected && "bg-blue-50 dark:bg-blue-950"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{person.name}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {person.registrationType}
                            </Badge>
                          </div>
                          {person.documentId && (
                            <span className="text-xs text-muted-foreground">
                              {formatDocument(person.documentId)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPeople.map((person) => (
            <Badge key={person.id} variant="secondary" className="px-3 py-1.5 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="font-medium">{person.name}</span>
                  {person.documentId && (
                    <span className="text-xs text-muted-foreground">{formatDocument(person.documentId)}</span>
                  )}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => person.id && removePerson(person.id)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
