"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { getAllPeople } from "@/app/services/person-api-service"
import type { Person } from "@/types/types"
import { Search, X, UserPlus, Users, Loader2 } from "lucide-react"
import customToast from "@/components/ui/custom-toast"
import { cn } from "@/lib/utils"

interface BusinessUnitPeopleManagerProps {
  selectedPersonIds: string[]
  onSelectionChange: (personIds: string[]) => void
  disabled?: boolean
}

export function BusinessUnitPeopleManager({
  selectedPersonIds,
  onSelectionChange,
  disabled,
}: BusinessUnitPeopleManagerProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadPeople()
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

  const availablePeople = useMemo(() => {
    const filtered = people.filter((person) => person.id && !selectedPersonIds.includes(person.id))
    if (!searchTerm.trim()) return filtered
    const search = searchTerm.toLowerCase()
    return filtered.filter(
      (person) =>
        person.name?.toLowerCase().includes(search) ||
        person.documentId?.toLowerCase().includes(search) ||
        person.code?.toLowerCase().includes(search)
    )
  }, [people, selectedPersonIds, searchTerm])

  const addPerson = (personId: string) => {
    onSelectionChange([...selectedPersonIds, personId])
  }

  const removePerson = (personId: string) => {
    onSelectionChange(selectedPersonIds.filter((id) => id !== personId))
  }

  const getInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
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

  const getPersonTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Cliente: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Fornecedor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Colaborador: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Supervisor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Coordenador: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      Gerente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Diretor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Admin: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-4">
      {/* Header com contagem e botão adicionar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Pessoas Vinculadas</h3>
          {selectedPeople.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedPeople.length}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
          disabled={disabled}
          className="gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <UserPlus className="h-4 w-4" />
          Adicionar Pessoa
        </Button>
      </div>

      {/* Lista de pessoas vinculadas */}
      {selectedPeople.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
          <Users className="h-12 w-12 mx-auto mb-2 text-blue-600/50" />
          <p className="text-sm text-muted-foreground">Nenhuma pessoa vinculada</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em &quot;Adicionar Pessoa&quot; para vincular</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {selectedPeople.map((person) => (
            <div
              key={person.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-sm">
                  {getInitials(person.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{person.name}</h4>
                    {person.documentId && (
                      <p className="text-xs text-muted-foreground">{formatDocument(person.documentId)}</p>
                    )}
                  </div>
                  <Badge className={cn("text-xs shrink-0", getPersonTypeColor(person.registrationType))}>
                    {person.registrationType}
                  </Badge>
                </div>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => person.id && removePerson(person.id)}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog para adicionar pessoas */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Adicionar Pessoas</DialogTitle>
          </DialogHeader>

          <div className="shrink-0 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
              <Input
                placeholder="Buscar por nome ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : availablePeople.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Nenhuma pessoa encontrada" : "Todas as pessoas já estão vinculadas"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availablePeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (person.id) {
                        addPerson(person.id)
                        customToast.success(`${person.name} adicionado(a)`)
                      }
                    }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-sm">
                        {getInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{person.name}</h4>
                          {person.documentId && (
                            <p className="text-xs text-muted-foreground">{formatDocument(person.documentId)}</p>
                          )}
                        </div>
                        <Badge className={cn("text-xs shrink-0", getPersonTypeColor(person.registrationType))}>
                          {person.registrationType}
                        </Badge>
                      </div>
                      {(person.city || person.state) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {person.city}
                          {person.city && person.state && " - "}
                          {person.state}
                        </p>
                      )}
                    </div>
                    <UserPlus className="h-5 w-5 text-blue-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 pt-4 border-t">
            <Button type="button" onClick={() => setIsAddDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
