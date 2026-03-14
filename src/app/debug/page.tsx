"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainHeader } from "@/components/main-header"
import { useAuth } from "@/app/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Building, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BusinessUnitForm } from "@/components/business-unit-form"
import { useBusinessUnits } from "@/app/hooks/use-business-units"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { businessUnits, loading: loadingBusinessUnits } = useBusinessUnits()
  const [showBusinessUnitForm, setShowBusinessUnitForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <>
      <MainHeader />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-semibold">Debug Info:</h3>
            <p>User authenticated: {user ? "Yes" : "No"}</p>
            {/* businessUnitId doesn't exist on User type */}
            {/* <p>User has business unit: {user?.businessUnitId ? "Yes" : "No"}</p> */}
            <p>Business units loading: {loadingBusinessUnits ? "Yes" : "No"}</p>
            <p>Business units count: {businessUnits.length}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Bem-vindo, {user?.nome || "Usuário"}!</CardTitle>
              <CardDescription>
                {/* businessUnitId doesn't exist on User type */}
                {/* {user?.businessUnitId
                  ? "Você está conectado a uma unidade de negócio."
                  : "Selecione ou crie uma unidade de negócio para começar."} */}
                Selecione ou crie uma unidade de negócio para começar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* businessUnitId doesn't exist on User type */}
              {/* {!user?.businessUnitId && ( */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Dialog open={showBusinessUnitForm} onOpenChange={setShowBusinessUnitForm}>
                    <DialogTrigger asChild>
                      <Button className="flex-1">
                        <Building className="mr-2 h-4 w-4" />
                        Criar Unidade de Negócio
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Nova Unidade de Negócio</DialogTitle>
                      </DialogHeader>
                      <BusinessUnitForm onSuccess={() => setShowBusinessUnitForm(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              {/* )} */}
            </CardContent>
          </Card>

          {/* Business Units Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5 text-blue-500" />
                Unidades de Negócio
              </CardTitle>
              <CardDescription>
                {loadingBusinessUnits ? "Carregando unidades..." : `${businessUnits.length} unidade(s) disponível(is)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => router.push("/cadastros/unidades-negocio")}>
                Gerenciar Unidades
              </Button>
            </CardContent>
          </Card>

          {/* People Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-indigo-500" />
                Gestão de Pessoas
              </CardTitle>
              <CardDescription>Cadastre e gerencie pessoas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/cadastros/pessoas")}
              >
                Acessar Cadastros
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

