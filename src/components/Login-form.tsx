/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Facebook, Globe, Instagram, Mail, Youtube, Eye, EyeOff, LogIn } from 'lucide-react'
import Link from "next/link"
import { useAuth } from "@/app/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <LoginForm />
    </div>
  )
}

function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const { signIn } = useAuth()

  const [alertMessage, setAlertMessage] = useState<{
    title: string
    description: string
    variant?: "default" | "destructive"
  } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (err: any) {
      setError(err.message || "Falha ao fazer login")
      setPassword("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25 mb-5">
          <LogIn className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Bem-vindo de volta
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Acesse sua conta para continuar
        </p>
      </div>

      {alertMessage && (
        <Alert
          variant={alertMessage.variant || "default"}
          className="mb-6 animate-fadeIn rounded-xl"
          onMouseDown={() => setAlertMessage(null)}
        >
          <AlertTitle>{alertMessage.title}</AlertTitle>
          <AlertDescription>{alertMessage.description}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white dark:placeholder-slate-500 rounded-xl transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Senha
              </Label>
              <Button
                variant="link"
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-sm text-blue-600 dark:text-blue-400 p-0 h-auto hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Esqueceu?
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white dark:placeholder-slate-500 rounded-xl transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-200 dark:border-rose-500/20 flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-700/30 text-white font-semibold rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Entrando...</span>
              </div>
            ) : (
              "Entrar"
            )}
          </Button>
        </div>
      </form>

      {/* Reset password dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Redefinir Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="resetEmail" className="text-slate-700 dark:text-slate-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Digite seu email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowResetPassword(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={resetLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl"
              >
                {resetLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Enviando...</span>
                  </div>
                ) : (
                  "Enviar Email"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <div className="text-center mt-10 space-y-4">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} Prosperium Soluções e Tecnologia LTDA
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="https://www.instagram.com/prosperiumbrasil"
            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            target="_blank"
          >
            <Instagram className="w-4 h-4" />
          </Link>
          <Link
            href="https://www.youtube.com/@prosperium1109"
            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            target="_blank"
          >
            <Youtube className="w-4 h-4" />
          </Link>
          <Link
            href="https://www.facebook.com/prosperiumbrasil"
            className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            target="_blank"
          >
            <Facebook className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
