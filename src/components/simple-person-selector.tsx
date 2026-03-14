"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Person } from "@/types/types"

interface SimplePersonSelectorProps {
  people: Person[]
  selectedPerson: Person | null
  onPersonSelect: (person: Person | null) => void
  placeholder?: string
  disabled?: boolean
}

export function SimplePersonSelector({
  people,
  selectedPerson,
  onPersonSelect,
  placeholder = "Selecione uma pessoa",
  disabled = false
}: SimplePersonSelectorProps) {
  
  return (
    <Select
      value={selectedPerson?.id?.toString() || ""}
      onValueChange={(value) => {
        if (value === "") {
          onPersonSelect(null)
        } else {
          const person = people.find(p => p.id?.toString() === value)
          onPersonSelect(person || null)
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Todos</SelectItem>
        {people.map((person) => (
          <SelectItem key={person.id} value={person.id?.toString() || ""}>
            {person.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}