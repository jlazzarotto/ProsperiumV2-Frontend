"use client"

import { useEffect } from "react"
import { useAuth } from "@/app/contexts/auth-context"
import { LoginShell } from "@/components/login-shell"
import { useRouter } from "next/navigation"

export default function LoginRoute() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace("/")
    }
  }, [loading, user, router])

  if (loading) {
    return null
  }

  if (user) {
    return null
  }

  return <LoginShell />
}
