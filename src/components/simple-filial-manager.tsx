"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Plus, Trash, Loader2, Pencil } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { httpClient } from "@/lib/http-client"

interface SimpleFilialManagerProps {
  personId: string
}

interface Filial {
  id: string
  code: string
  name: string
  abbreviation: string
  documentId: string
  city: string
  state: string
  isPrimary: boolean
}

// Máscaras simples sem libraries pesadas
const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18)
}

const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9)
}

// Lista de estados
const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

export function SimpleFilialManager({ personId }: SimpleFilialManagerProps) {
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null)

  // Formulário completo com todos os campos
  const [form, setForm] = useState({
    code: "",
    name: "",
    abbreviation: "",
    documentId: "",
    stateRegistration: "",
    municipalRegistration: "",
    postalCode: "",
    city: "",
    state: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Carregar dados
  useEffect(() => {
    if (personId) {
      loadFiliais()
    }
  }, [personId])

  const loadFiliais = async () => {
    setLoading(true)
    try {
      console.log('Carregando filiais para pessoa:', personId)
      
      // Usar httpClient que já tem Authorization
      const response = await httpClient.get(`pessoas/${personId}/vinculos-unidades-negocio`)
      console.log('Resposta completa da API:', response)
      console.log('Tipo da resposta:', typeof response)
      console.log('É array?', Array.isArray(response))
      
      // A API pode retornar { data: [] } ou diretamente []
      let data = response
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data
        console.log('Dados extraídos de response.data:', data)
      }
      
      // Verificar se agora temos um array
      if (!Array.isArray(data)) {
        console.error('Dados não são um array:', data)
        setFiliais([])
        return
      }
      
      console.log('Array de dados:', data)
      
      // Pegar todos os vínculos de unidades de negócio
      const filiaisData = data || []
      console.log('Filiais filtradas:', filiaisData)
      
      // Mapear para o formato correto
      const filiaisMapeadas = filiaisData.map((item: any, index: number) => {
        console.log(`Processando item ${index}:`, item)
        const mapped = {
          id: item.id_un_negocio?.toString(),
          code: item.unidade?.abreviatura || '',
          name: item.unidade?.apelido || '',
          abbreviation: item.unidade?.abreviatura || '',
          documentId: item.unidade?.cnpj || '',
          city: item.unidade?.cidade || '',
          state: item.unidade?.uf || '',
          isPrimary: item.is_own_unit || false
        }
        console.log(`Item mapeado ${index}:`, mapped)
        return mapped
      })
      
      console.log('Filiais mapeadas:', filiaisMapeadas)
      setFiliais(filiaisMapeadas)
    } catch (error) {
      console.error('Erro ao carregar filiais:', error)
      setFiliais([])
      // Force loading to false on error
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!form.code.trim()) newErrors.code = "Código é obrigatório"
    if (!form.name.trim()) newErrors.name = "Nome é obrigatório"
    if (!form.abbreviation.trim()) newErrors.abbreviation = "Abreviação é obrigatória"
    if (form.documentId && form.documentId.replace(/\D/g, '').length > 0) {
      const cleanDoc = form.documentId.replace(/\D/g, '')
      if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
        newErrors.documentId = "CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos"
      }
    }
    if (form.postalCode && form.postalCode.length < 8) newErrors.postalCode = "CEP deve ter 8 dígitos"
    if (!form.city.trim()) newErrors.city = "Cidade é obrigatória"
    if (!form.state.trim()) newErrors.state = "Estado é obrigatório"
    if (!form.street.trim()) newErrors.street = "Logradouro é obrigatório"
    if (!form.number.trim()) newErrors.number = "Número é obrigatório"
    if (!form.neighborhood.trim()) newErrors.neighborhood = "Bairro é obrigatório"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      console.log('Criando filial:', form)
      
      // Dados no formato que a API espera
      // Só envia CNPJ se tiver 14 dígitos, senão envia vazio
      const cleanedDoc = form.documentId.replace(/\D/g, '')
      const payload = {
        apelido: form.name,
        abreviatura: form.abbreviation,
        cnpj: cleanedDoc.length === 14 ? cleanedDoc : "", // Só envia se for CNPJ válido
        cidade: form.city,
        uf: form.state,
        logradouro: form.street,
        nr: form.number,
        complemento: form.complement,
        bairro: form.neighborhood,
        cep: form.postalCode,
        ie: form.stateRegistration,
        im: form.municipalRegistration
      }
      
      console.log('Payload enviado:', payload)
      
      if (editingFilial) {
        // EDITAR filial existente
        await httpClient.put(`un-negocios/${editingFilial.id}`, payload)
        console.log('Filial atualizada:', editingFilial.id)
      } else {
        // CRIAR nova filial
        const novaFilial = await httpClient.post('un-negocios', payload)
        console.log('Filial criada:', novaFilial)
        
        // Agora vincular a filial à pessoa
        await httpClient.post(`pessoas/${personId}/vinculos-unidades-negocio`, {
          id_un_negocio: (novaFilial as any).id,
          is_own_unit: true,
          is_primary: filiais.length === 0 // Primeira filial é principal
        })
      }
      
      setForm({
        code: "",
        name: "",
        abbreviation: "",
        documentId: "",
        stateRegistration: "",
        municipalRegistration: "",
        postalCode: "",
        city: "",
        state: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
      })
      setShowForm(false)
      setEditingFilial(null)
      loadFiliais()
      alert(editingFilial ? "Filial atualizada com sucesso!" : "Filial criada com sucesso!")
    } catch (error) {
      console.error('Erro:', error)
      alert("Erro ao criar filial: " + error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (filial: Filial) => {
    setEditingFilial(filial)
    setSaving(true)
    
    try {
      console.log('🔧 Carregando dados completos da filial para edição:', filial.id)
      
      // Buscar dados completos da unidade de negócio usando o endpoint correto
      const fullData = await httpClient.get(`/unidades-negocio/${filial.id}`) as any
      console.log('📋 Dados completos recebidos da API:', fullData)
      
      // Preencher formulário com TODOS os dados
      setForm({
        code: fullData.abreviatura || filial.code || "",
        name: fullData.apelido || filial.name || "",
        abbreviation: fullData.abreviatura || filial.abbreviation || "",
        documentId: fullData.cnpj || filial.documentId || "",
        stateRegistration: fullData.ie || "",
        municipalRegistration: fullData.im || "",
        postalCode: fullData.cep || "",
        city: fullData.cidade || filial.city || "",
        state: fullData.uf || filial.state || "",
        street: fullData.logradouro || "",
        number: fullData.nr || "",
        complement: fullData.complemento || "",
        neighborhood: fullData.bairro || "",
      })
      
      console.log('✅ Formulário preenchido com dados completos')
    } catch (error) {
      console.error('❌ Erro ao carregar dados da filial:', error)
      // Fallback para dados básicos se der erro
      setForm({
        code: filial.code,
        name: filial.name,
        abbreviation: filial.abbreviation,
        documentId: filial.documentId,
        stateRegistration: "",
        municipalRegistration: "",
        postalCode: "",
        city: filial.city,
        state: filial.state,
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
      })
    } finally {
      setSaving(false)
    }
    
    setShowForm(true)
  }

  const handleSetAsPrimary = async (filialId: string) => {
    if (!confirm("Definir esta filial como principal?")) return

    try {
      console.log('Definindo filial como principal:', filialId)
      // Implementar endpoint para definir como principal
      // await httpClient.put(`pessoas/${personId}/filial-principal/${filialId}`)
      alert("Filial definida como principal!")
      loadFiliais()
    } catch (error) {
      console.error('Erro:', error)
      alert("Erro ao definir filial como principal: " + error)
    }
  }

  const handleDelete = async (filialId: string) => {
    if (!confirm("Deseja realmente excluir esta filial?")) return

    try {
      console.log('Deletando filial:', filialId)
      
      // Deletar a unidade de negócio usando httpClient
      await httpClient.delete(`un-negocios/${filialId}`)
      
      loadFiliais()
      alert("Filial removida com sucesso!")
    } catch (error) {
      console.error('Erro:', error)
      alert("Erro ao remover filial: " + error)
    }
  }

  const handleCancelEdit = () => {
    setEditingFilial(null)
    setShowForm(false)
    setForm({
      code: "",
      name: "",
      abbreviation: "",
      documentId: "",
      stateRegistration: "",
      municipalRegistration: "",
      postalCode: "",
      city: "",
      state: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
    })
  }

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value
    
    if (field === 'documentId') {
      // Usar máscara dinâmica que detecta CPF ou CNPJ
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length <= 11) {
        // Máscara para CPF: 000.000.000-00
        processedValue = cleaned.replace(/(\d{3})(\d)/, '$1.$2')
                                 .replace(/(\d{3})(\d)/, '$1.$2')
                                 .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                                 .replace(/(-\d{2})\d+?$/, '$1')
      } else {
        // Máscara para CNPJ
        processedValue = maskCNPJ(value)
      }
    } else if (field === 'postalCode') {
      processedValue = maskCEP(value)
    }
    
    setForm(prev => ({ ...prev, [field]: processedValue }))
    
    // Limpar erro quando usuário digita
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando filiais...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Building className="mr-2 text-blue-500" />
          Filiais ({filiais.length})
        </CardTitle>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          {showForm ? "Cancelar" : "Nova Filial"}
        </Button>
      </CardHeader>

      <CardContent>
        {/* FORMULÁRIO SIMPLES */}
        {showForm && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="font-semibold text-green-800 mb-4">
                  {editingFilial ? `Editar Filial: ${editingFilial.name}` : "Criar Nova Filial"}
                </h4>
                
                {/* Dados Básicos */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-green-700">📋 Dados Básicos</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Input 
                        placeholder="Código *" 
                        value={form.code} 
                        onChange={(e) => handleInputChange('code', e.target.value)}
                        className={errors.code ? "border-red-300" : (!form.code ? "border-orange-300" : "border-green-300")}
                      />
                      {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                    </div>
                    <div>
                      <Input 
                        placeholder="Nome da Filial *" 
                        value={form.name} 
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={errors.name ? "border-red-300" : (!form.name ? "border-orange-300" : "border-green-300")}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Input 
                        placeholder="Abreviação *" 
                        value={form.abbreviation} 
                        onChange={(e) => handleInputChange('abbreviation', e.target.value)}
                        className={errors.abbreviation ? "border-red-300" : (!form.abbreviation ? "border-orange-300" : "border-green-300")}
                      />
                      {errors.abbreviation && <p className="text-red-500 text-xs mt-1">{errors.abbreviation}</p>}
                    </div>
                  </div>
                </div>

                {/* Documentos */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-green-700">📄 Documentos</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Input 
                        placeholder="CPF/CNPJ (000.000.000-00 ou 00.000.000/0000-00)" 
                        value={form.documentId} 
                        onChange={(e) => handleInputChange('documentId', e.target.value)}
                        maxLength={18}
                        className={errors.documentId ? "border-red-300" : ""}
                      />
                      {errors.documentId && <p className="text-red-500 text-xs mt-1">{errors.documentId}</p>}
                    </div>
                    <div>
                      <Input 
                        placeholder="Inscrição Estadual" 
                        value={form.stateRegistration} 
                        onChange={(e) => handleInputChange('stateRegistration', e.target.value)} 
                      />
                    </div>
                    <div>
                      <Input 
                        placeholder="Inscrição Municipal" 
                        value={form.municipalRegistration} 
                        onChange={(e) => handleInputChange('municipalRegistration', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-3">
                  <h5 className="text-sm font-semibold text-green-700">📍 Endereço</h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Input 
                        placeholder="CEP (00000-000)" 
                        value={form.postalCode} 
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        maxLength={9}
                        className={errors.postalCode ? "border-red-300" : ""}
                      />
                      {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                    </div>
                    <div>
                      <Input 
                        placeholder="Cidade *" 
                        value={form.city} 
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={errors.city ? "border-red-300" : (!form.city ? "border-orange-300" : "")}
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <select 
                        value={form.state} 
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background ${errors.state ? "border-red-300" : (!form.state ? "border-orange-300" : "")}`}
                      >
                        <option value="">Estado *</option>
                        {states.map(state => (
                          <option key={state} value={state.toLowerCase()}>{state}</option>
                        ))}
                      </select>
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <Input 
                        placeholder="Bairro *" 
                        value={form.neighborhood} 
                        onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                        className={errors.neighborhood ? "border-red-300" : (!form.neighborhood ? "border-orange-300" : "")}
                      />
                      {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <Input 
                        placeholder="Logradouro *" 
                        value={form.street} 
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        className={errors.street ? "border-red-300" : (!form.street ? "border-orange-300" : "")}
                      />
                      {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                    </div>
                    <div>
                      <Input 
                        placeholder="Número *" 
                        value={form.number} 
                        onChange={(e) => handleInputChange('number', e.target.value)}
                        className={errors.number ? "border-red-300" : (!form.number ? "border-orange-300" : "")}
                      />
                      {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                    </div>
                    <div>
                      <Input 
                        placeholder="Complemento" 
                        value={form.complement} 
                        onChange={(e) => handleInputChange('complement', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saving} className="bg-green-600">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingFilial ? "Salvando..." : "Criando..."}
                      </>
                    ) : (
                      <>
                        {editingFilial ? (
                          <><Pencil className="mr-2 h-4 w-4" />Salvar Alterações</>
                        ) : (
                          <><Plus className="mr-2 h-4 w-4" />Criar Filial</>
                        )}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* LISTA DE FILIAIS */}
        {filiais.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma filial cadastrada</h3>
            <p className="text-sm text-gray-500 mb-4">Crie filiais para expandir as operações da empresa</p>
            <Button onClick={() => setShowForm(true)} className="bg-green-600">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Filial
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filiais.map((filial) => (
                <TableRow key={filial.id}>
                  <TableCell className="font-medium">{filial.code}</TableCell>
                  <TableCell>{filial.name}</TableCell>
                  <TableCell>{filial.documentId}</TableCell>
                  <TableCell>{filial.city}</TableCell>
                  <TableCell>{filial.state?.toUpperCase()}</TableCell>
                  <TableCell>
                    {filial.isPrimary ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Principal
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetAsPrimary(filial.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Definir como Principal
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(filial)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700"
                        title="Editar filial"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(filial.id)}
                        disabled={filial.isPrimary}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        title={filial.isPrimary ? "Não é possível remover a unidade principal" : "Remover filial"}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}