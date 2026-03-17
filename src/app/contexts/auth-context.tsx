/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { authService, type User as AuthUser } from "@/app/services/auth-service"
import { useRouter } from "next/navigation"
import customToast from "@/components/ui/custom-toast"

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  isRoot: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasFeature: (modulo: string) => boolean
  hasPermission: (modulo: string, operacao: 'ver' | 'criar_editar' | 'deletar') => boolean
  canAccess: (modulo: string, operacao?: 'ver' | 'criar_editar' | 'deletar') => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = authService.getUser()
    const token = authService.getToken()

    if (storedUser && token) {
      setUser(storedUser)
    }

    setLoading(false)
  }, [])

  const isRoot = Boolean(user?.roles?.includes('ROLE_ROOT'))

  const isAdmin = Boolean(
    user?.roles?.includes('ROLE_ROOT') || user?.roles?.includes('ROLE_ADMIN')
  )

  const hasFeature = useCallback((modulo: string): boolean => {
    if (!user) return false
    if (!user.modulos_habilitados) return true
    return user.modulos_habilitados[modulo] ?? true
  }, [user])

  const hasPermission = useCallback((modulo: string, operacao: 'ver' | 'criar_editar' | 'deletar'): boolean => {
    if (!user) return false
    if (user.roles?.includes('ROLE_ROOT')) return true
    const perm = user.permissoes_modulo?.[modulo]
    if (!perm) return false
    return perm[operacao]
  }, [user])

  const canAccess = useCallback((modulo: string, operacao: 'ver' | 'criar_editar' | 'deletar' = 'ver'): boolean => {
    return hasFeature(modulo) && hasPermission(modulo, operacao)
  }, [hasFeature, hasPermission])

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      const response = await authService.login(email, password)
      setUser(response.user)
      setLoading(false)

      customToast.success(`Bem-vindo(a), ${response.user.nome}!`, {
        position: 'top-right',
        autoClose: 3000
      })

      router.push("/")
    } catch (err: any) {
      console.error("Error signing in:", err)

      let errorMessage = "Falha ao fazer login"

      if (err.response) {
        const status = err.response.status
        switch (status) {
          case 401:
            errorMessage = "Email ou senha incorretos. Verifique suas credenciais."
            break
          case 403:
            errorMessage = "Acesso negado. Entre em contato com o administrador."
            break
          case 500:
            errorMessage = "Erro interno do servidor. Tente novamente em alguns minutos."
            break
          case 503:
            errorMessage = "Servico temporariamente indisponivel. Tente novamente."
            break
          default:
            if (err.response.data?.message || err.response.data?.error) {
              errorMessage = err.response.data.message || err.response.data.error
            }
        }
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)

      customToast.error(errorMessage, {
        position: 'top-right'
      })

      setLoading(false)
      throw new Error(errorMessage)
    }
  }

  const signOut = async () => {
    try {
      authService.logout()
      setUser(null)
      // Clear all company-related sessionStorage on logout
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('prosperium_selected_company_id')
        sessionStorage.removeItem('prosperium_selected_company_name')
        // Clear any empresa-related keys
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('prosperium_') && key.includes('empresa')) {
            sessionStorage.removeItem(key)
          }
        })
      }

      customToast.info("Logout realizado com sucesso!", {
        position: 'top-right',
        autoClose: 2000
      })

      router.push("/login")
    } catch (err: any) {
      console.error("Error signing out:", err)
      setError(err.message || "Falha ao sair")

      customToast.error(err.message || "Falha ao sair", {
        position: 'top-right'
      })
    }
  }

  const value = {
    user,
    loading,
    error,
    isRoot,
    isAdmin,
    signIn,
    signOut,
    hasFeature,
    hasPermission,
    canAccess,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
