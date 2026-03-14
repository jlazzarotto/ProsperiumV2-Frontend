"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Lock } from "lucide-react"
import LogoDarkTheme from "../assets/img/Logo-branco.png"
import { permissionService } from "@/app/services/permission-service"
import { useAuth } from "@/app/contexts/auth-context"

function DefinirSenhaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signIn } = useAuth()
  const token = searchParams.get("token") || ""

  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [reason, setReason] = useState("")
  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Validar token ao montar
  useEffect(() => {
    if (!token) {
      setValidating(false)
      setValid(false)
      setReason("not_found")
      return
    }

    const validate = async () => {
      try {
        const result = await permissionService.validateToken(token)
        setValid(result.valid)
        if (result.valid) {
          setEmail(result.email || "")
          setNome(result.nome || "")
        } else {
          setReason(result.reason || "not_found")
        }
      } catch {
        setValid(false)
        setReason("error")
      } finally {
        setValidating(false)
      }
    }

    validate()
  }, [token])

  const passwordRules = {
    length: password.length >= 8,
    match: password === confirmPassword && confirmPassword.length > 0,
  }

  const canSubmit = passwordRules.length && passwordRules.match && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const result = await permissionService.setPassword(token, password)
      setSuccess(true)

      // Login automatico apos 1s
      setTimeout(async () => {
        try {
          await signIn(result.email, password)
        } catch {
          router.push("/")
        }
      }, 1500)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao definir senha"
      setReason("error")
      setValid(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Estado de carregamento
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500">Validando convite...</p>
        </div>
      </div>
    )
  }

  // Estado de sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Senha definida!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Entrando no sistema...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    )
  }

  // Estado invalido
  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
            {reason === "expired" ? (
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {reason === "expired" ? "Convite expirado" : reason === "used" ? "Convite ja utilizado" : "Convite invalido"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {reason === "expired"
              ? "Este link de convite expirou. Solicite um novo convite ao administrador."
              : reason === "used"
                ? "Este convite ja foi utilizado para criar uma conta."
                : "O link de convite nao e valido. Verifique o link ou solicite um novo convite."}
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            Ir para o Login
          </Button>
        </div>
      </div>
    )
  }

  // Formulario
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTM2IDIydi0ySDB2MmgzNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/25 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 backdrop-blur-sm rounded-xl">
              <Image
                src={LogoDarkTheme}
                alt="Prosperium Logo"
                width={32}
                height={32}
                className="rounded"
                priority
              />
            </div>
            <span className="text-2xl font-light text-white/90 tracking-tight">
              Prosperium
            </span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Bem-vindo ao
              <br />
              <span className="text-blue-200">Prosperium</span>
            </h1>
            <p className="text-lg text-blue-100/80 leading-relaxed">
              Voce foi convidado para acessar o sistema. Defina sua senha para comecar.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 max-w-sm">
            <div className="p-2 bg-white/15 rounded-lg">
              <Lock className="h-5 w-5 text-blue-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Acesso seguro</p>
              <p className="text-xs text-blue-200/70">Sua senha e criptografada e protegida</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Image src={LogoDarkTheme} alt="Logo" width={28} height={28} className="rounded" />
            </div>
            <span className="text-xl font-semibold text-slate-900 dark:text-slate-100">Prosperium</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              Definir senha
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Ola <span className="font-medium text-slate-700 dark:text-slate-300">{nome}</span>, escolha sua senha para acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (readonly) */}
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-600 dark:text-slate-400">Email</Label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-slate-100 dark:bg-slate-800 text-slate-500"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-slate-600 dark:text-slate-400">
                Nova senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar senha */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm text-slate-600 dark:text-slate-400">
                Confirmar senha
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Digite novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Regras */}
            {password.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <div className={`flex items-center gap-2 ${passwordRules.length ? 'text-green-600' : 'text-slate-400'}`}>
                  {passwordRules.length ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  Minimo 8 caracteres
                </div>
                {confirmPassword.length > 0 && (
                  <div className={`flex items-center gap-2 ${passwordRules.match ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordRules.match ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    Senhas coincidem
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Definindo senha...
                </>
              ) : (
                "Definir Senha e Acessar"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function DefinirSenhaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <DefinirSenhaContent />
    </Suspense>
  )
}
