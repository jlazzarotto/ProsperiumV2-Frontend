"use client"

import { useAuth } from "@/app/contexts/auth-context"
import { HomeDashboard } from "@/components/home-dashboard"
import { LoginShell } from "@/components/login-shell"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginShell />
  }

  return <HomeDashboard />
}
