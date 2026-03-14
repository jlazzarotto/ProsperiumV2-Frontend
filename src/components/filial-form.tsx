"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, X } from "lucide-react"
import customToast from "./ui/custom-toast"

const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

interface FilialFormProps {
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function FilialForm({ onSubmit, onCancel }: FilialFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    abbreviation: "",
    documentId: "",
    city: "",
    state: "",
    street: "",
    number: "",
    neighborhood: "",
    postalCode: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!formData.code || !formData.name || !formData.abbreviation) {
      customToast.error("Preencha os campos obrigatórios")
      return
    }

    try {
      setSaving(true)
      await onSubmit(formData)
      customToast.success("Filial criada com sucesso!")
      
      // Reset form
      setFormData({
        code: "",
        name: "",
        abbreviation: "",
        documentId: "",
        city: "",
        state: "",
        street: "",
        number: "",
        neighborhood: "",
        postalCode: "",
      })
    } catch (error) {
      console.error('Erro ao criar filial:', error)
      customToast.error("Erro ao criar filial")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-2 border-green-300 bg-green-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Filial
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Código *</label>
              <Input
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Ex: FIL001"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome da filial"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Abreviação *</label>
              <Input
                value={formData.abbreviation}
                onChange={(e) => handleChange('abbreviation', e.target.value)}
                placeholder="Ex: FIL-JOI"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">CNPJ</label>
              <Input
                value={formData.documentId}
                onChange={(e) => handleChange('documentId', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cidade</label>
              <Input
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Nome da cidade"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Select value={formData.state} onValueChange={(value) => handleChange('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state.toLowerCase()}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Logradouro</label>
              <Input
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="Rua, Av., etc."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Número</label>
              <Input
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                placeholder="123"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bairro</label>
              <Input
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
                placeholder="Nome do bairro"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-green-200">
            <Button 
              type="submit" 
              disabled={saving} 
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Criando..." : "Criar Filial"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}