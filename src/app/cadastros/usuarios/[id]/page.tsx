"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Save, User } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/app/contexts/auth-context"
import { useBusinessUnits } from "@/app/hooks/use-business-units"
import customToast from "@/components/ui/custom-toast"

// Form schema for user
const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.string().min(1, "Selecione um perfil"),
  businessUnitId: z.string().optional(),
})

interface UserData {
  id: string
  name: string
  email: string
  role: string
  businessUnitId?: string
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { businessUnits, loading: loadingBusinessUnits } = useBusinessUnits()

  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  const userId = typeof params.id === "string" ? params.id : params.id?.[0]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      businessUnitId: "",
    },
  })

  // Load mock user data
  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return

      try {
        setLoading(true)

        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Mock user data
        const mockUsers: Record<string, UserData> = {
          "1": {
            id: "1",
            email: "admin@example.com",
            name: "Admin User",
            role: "Admin",
            businessUnitId: "bu1",
          },
          "2": {
            id: "2",
            email: "manager@example.com",
            name: "Manager User",
            role: "Gerente",
            businessUnitId: "bu1",
          },
          "3": {
            id: "3",
            email: "user@example.com",
            name: "Regular User",
            role: "Colaborador",
            businessUnitId: "bu2",
          },
        }

        const fetchedUser = mockUsers[userId]

        if (fetchedUser) {
          setUserData(fetchedUser)
          form.reset({
            name: fetchedUser.name ?? "",
            email: fetchedUser.email ?? "",
            role: fetchedUser.role ?? "",
            businessUnitId: fetchedUser.businessUnitId ?? "",
          })
        } else {
          setError("Usuário não encontrado")
        }
      } catch (err) {
        console.error("Erro ao buscar usuário:", err)
        setError("Falha ao carregar dados do usuário")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [userId, form])

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
    // Role check commented out - user type doesn't have role property
    // else if (!authLoading && user && user.role !== "Admin") {
    //   router.push("/financeiro")
    //   customToast.error("Você não tem permissão para acessar esta página.", {position: "top-right"})
    // }
  }, [user, authLoading, router])

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) return

    try {
      setSaving(true)

      // Mock update - simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update local state
      setUserData((prev) => (prev ? { ...prev, ...values } : null))

      customToast.success("As informações do usuário foram atualizadas com sucesso.", {
        position: "top-right",
      })
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err)
      setError("Falha ao atualizar usuário")

      customToast.error("Falha ao atualizar usuário", {
        position: "top-right",
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading ?? loading) {
    return (
      <>
        <MainHeader />
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-2">Carregando...</span>
          </div>
        </div>
      </>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (error && !userData) {
    return (
      <>
        <MainHeader />
        <div className="container mx-auto py-8">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/admin/usuarios")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Usuários
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <MainHeader />
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="outline" onClick={() => router.push("/admin/usuarios")} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold flex items-center">
              <User className="mr-2 text-blue-500" />
              {userData?.name ?? "Detalhes do Usuário"}
            </h1>
          </div>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 text-blue-500" />
                  Informações do Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Perfil</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Admin">Administrador</SelectItem>
                                <SelectItem value="Gerente">Gerente</SelectItem>
                                <SelectItem value="Coordenador">Coordenador</SelectItem>
                                <SelectItem value="Supervisor">Supervisor</SelectItem>
                                <SelectItem value="Colaborador">Colaborador</SelectItem>
                                <SelectItem value="Cliente">Cliente</SelectItem>
                                <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessUnitId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade de Negócio</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Nenhuma</SelectItem>
                                {loadingBusinessUnits ? (
                                  <SelectItem value="loading" disabled>
                                    Carregando...
                                  </SelectItem>
                                ) : (
                                  businessUnits.map((bu) => (
                                    <SelectItem key={bu.id} value={bu.id!}>
                                      {bu.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 text-blue-500" />
                  Permissões do Usuário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertDescription>
                    As permissões são baseadas no perfil do usuário. Para gerenciar permissões específicas, acesse a
                    tela de Controle de Permissões.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => router.push("/admin/permissoes")}>Ir para Controle de Permissões</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

