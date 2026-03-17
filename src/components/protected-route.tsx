"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/auth-context"
import { useCompany } from "@/app/contexts/company-context"
import { getModuloByPath } from "@/types/permissions"
import { SelectCompanyGate } from "@/components/select-company-gate"
import { COMPANY_GUARD_EXCLUDED_PREFIXES } from "@/config/company-guard"

interface ProtectedRouteProps {
  children: React.ReactNode
}

// Política: DENY BY DEFAULT
// Retorna true se a rota NÃO está na lista de exclusões → precisa de company
function requiresCompanySelection(pathname: string): boolean {
  return !COMPANY_GUARD_EXCLUDED_PREFIXES.some((excluded) =>
    pathname === excluded || pathname.startsWith(excluded + "/")
  )
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, canAccess, isRoot } = useAuth()
  const { selectedCompanyId } = useCompany()
  const router = useRouter()
  const pathname = usePathname()
  const modulo = getModuloByPath(pathname)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (!loading && user && modulo && !canAccess(modulo, 'ver')) {
      router.push("/")
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

  // Política deny-by-default: ROLE_ROOT deve ter company selecionada em qualquer rota
  // não listada explicitamente em COMPANY_GUARD_EXCLUDED_PREFIXES
  if (isRoot && requiresCompanySelection(pathname) && !selectedCompanyId) {
    return <SelectCompanyGate />
  }

  // Se estiver autenticado, renderizar o conteúdo
  return <>{children}</>
}
