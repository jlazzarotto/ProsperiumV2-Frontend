"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Send, UserPlus, Mail, User } from "lucide-react"
import { PermissionEditor } from "./permission-editor"
import type { PermissoesModulo } from "@/types/permissions"
import { permissionService } from "@/app/services/permission-service"
import customToast from "@/components/ui/custom-toast"

interface InviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InviteModal({ open, onOpenChange, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")
  const [permissoes, setPermissoes] = useState<PermissoesModulo>({})
  const [sending, setSending] = useState(false)

  const isValid = email.trim() && nome.trim() && email.includes("@")

  const handleSubmit = async () => {
    if (!isValid) return

    setSending(true)
    try {
      await permissionService.createInvite({
        email: email.trim(),
        nome: nome.trim(),
        permissoes,
      })

      customToast.success(`Convite enviado para ${email}!`)

      // Reset form
      setEmail("")
      setNome("")
      setPermissoes({})
      onOpenChange(false)
      onSuccess()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao enviar convite"
      customToast.error(message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 backdrop-blur-sm rounded-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogHeader className="p-0 space-y-0">
                <DialogTitle className="text-lg font-semibold text-white">
                  Convidar Novo Usuario
                </DialogTitle>
                <DialogDescription className="text-blue-100/80 text-sm mt-0.5">
                  O usuario recebera um email com link para definir a senha
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-5">
          {/* Dados basicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-nome" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Nome
              </Label>
              <Input
                id="invite-nome"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={sending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="usuario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sending}
              />
            </div>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Permissoes de acesso</span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
          </div>

          {/* Permissoes */}
          <PermissionEditor
            permissoes={permissoes}
            onChange={setPermissoes}
            showSaveButton={false}
          />

          {/* Botao enviar */}
          <Button
            onClick={handleSubmit}
            disabled={sending || !isValid}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando convite...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Convite
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
