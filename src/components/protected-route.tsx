"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/auth-context"
import { getModuloByPath } from "@/types/permissions"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, canAccess } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const modulo = getModuloByPath(pathname)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
      return
    }

    if (!loading && user && modulo && !canAccess(modulo, 'ver')) {
      router.push("/financeiro")
    }
  }, [user, loading, router, modulo, canAccess])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado, não renderizar nada (vai redirecionar)
  if (!user) {
    return null
  }

  if (modulo && !canAccess(modulo, 'ver')) {
    return null
  }

  // Se estiver autenticado, renderizar o conteúdo
  return <>{children}</>
}
