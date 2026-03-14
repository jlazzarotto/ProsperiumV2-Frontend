"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Users, Mail, MapPin, FileText } from "lucide-react"
import type { Person } from "@/types/types"
import { getAllPeople } from "@/app/services/person-api-service"
import customToast from "@/components/ui/custom-toast"

interface BusinessUnitPeopleListProps {
  personIds: string[]
  className?: string
}

export function BusinessUnitPeopleList({ personIds, className }: BusinessUnitPeopleListProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (personIds.length > 0) {
      loadPeople()
    } else {
      setPeople([])
    }
  }, [personIds])

  const loadPeople = async () => {
    setLoading(true)
    try {
      const allPeople = await getAllPeople(1, 500)
      const filteredPeople = allPeople.filter((person) => person.id && personIds.includes(person.id))
      setPeople(filteredPeople)
    } catch (error) {
      console.error("Error loading people:", error)
      customToast.error("Erro ao carregar pessoas")
    } finally {
      setLoading(false)
    }
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

  if (personIds.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pessoas Vinculadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhuma pessoa vinculada a esta unidade</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pessoas Vinculadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Pessoas Vinculadas
          <Badge variant="secondary" className="ml-2">
            {people.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {people.map((person) => (
            <div
              key={person.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(person.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-base">{person.name}</h4>
                    {person.abbreviation && (
                      <p className="text-sm text-muted-foreground">{person.abbreviation}</p>
                    )}
                  </div>
                  <Badge className={getPersonTypeColor(person.registrationType)}>{person.registrationType}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {person.documentId && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{formatDocument(person.documentId)}</span>
                    </div>
                  )}

                  {person.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{person.email}</span>
                    </div>
                  )}

                  {(person.city || person.state) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {person.city}
                        {person.city && person.state && " - "}
                        {person.state}
                      </span>
                    </div>
                  )}

                  {person.code && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium">Código:</span>
                      <span>{person.code}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
