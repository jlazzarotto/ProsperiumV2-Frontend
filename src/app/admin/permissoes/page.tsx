"use client"

import { useState, useEffect } from "react"
import { MainHeader } from "@/components/main-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Loader2, UserPlus, Search, Shield, X, Save, RefreshCw,
  MoreHorizontal, UserX, Trash2, Ban, Power, XCircle
} from "lucide-react"
import { permissionService } from "@/app/services/permission-service"
import { PermissionEditor } from "./components/permission-editor"
import { InviteModal } from "./components/invite-modal"
import type { OperadorWithPermissions, PermissoesModulo } from "@/types/permissions"
import customToast from "@/components/ui/custom-toast"
import { useAuth } from "@/app/contexts/auth-context"

type ConfirmAction = {
  type: 'inactivate' | 'activate' | 'delete' | 'cancel_invite'
  operador: OperadorWithPermissions
} | null

export default function PermissoesPage() {
  const { user } = useAuth()
  const [operadores, setOperadores] = useState<OperadorWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedOperador, setSelectedOperador] = useState<OperadorWithPermissions | null>(null)
  const [editPermissoes, setEditPermissoes] = useState<PermissoesModulo>({})
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeMenu, setActiveMenu] = useState<number | null>(null)

  const loadOperadores = async () => {
    try {
      setLoading(true)
      const data = await permissionService.getOperadores()
      setOperadores(data)
    } catch (error) {
      console.error("Erro ao carregar operadores:", error)
      customToast.error("Erro ao carregar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOperadores()
  }, [])

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClick = () => setActiveMenu(null)
    if (activeMenu !== null) {
      document.addEventListener("click", handleClick)
      return () => document.removeEventListener("click", handleClick)
    }
  }, [activeMenu])

  const filteredOperadores = operadores.filter(op =>
    op.nome.toLowerCase().includes(search.toLowerCase()) ||
    op.email.toLowerCase().includes(search.toLowerCase())
  )

  const selectOperador = async (op: OperadorWithPermissions) => {
    if (selectedOperador?.id === op.id) {
      setSelectedOperador(null)
      return
    }
    setSelectedOperador(op)
    try {
      const perms = await permissionService.getOperadorPermissoes(op.id)
      setEditPermissoes(perms)
    } catch {
      setEditPermissoes(op.permissoes_modulo || {})
    }
  }

  const handleSavePermissoes = async () => {
    if (!selectedOperador) return
    setSaving(true)
    try {
      await permissionService.saveOperadorPermissoes(selectedOperador.id, editPermissoes)
      customToast.success("Permissoes salvas com sucesso!")
      await loadOperadores()
    } catch (error) {
      console.error("Erro ao salvar permissoes:", error)
      customToast.error("Erro ao salvar permissoes")
    } finally {
      setSaving(false)
    }
  }

  const handleResendInvite = async (op: OperadorWithPermissions) => {
    if (!op.convite_id) {
      customToast.error("Convite nao encontrado para este usuario")
      return
    }
    try {
      customToast.info("Reenviando convite...")
      await permissionService.resendInvite(op.convite_id)
      customToast.success("Convite reenviado com sucesso!")
      await loadOperadores()
    } catch {
      customToast.error("Erro ao reenviar convite")
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    try {
      const { type, operador } = confirmAction

      switch (type) {
        case 'inactivate':
          await permissionService.toggleOperadorStatus(operador.id, false)
          customToast.success(`${operador.nome} foi inativado`)
          break
        case 'activate':
          await permissionService.toggleOperadorStatus(operador.id, true)
          customToast.success(`${operador.nome} foi ativado`)
          break
        case 'delete':
          await permissionService.deleteOperador(operador.id)
          customToast.success(`${operador.nome} foi removido`)
          if (selectedOperador?.id === operador.id) {
            setSelectedOperador(null)
          }
          break
        case 'cancel_invite':
          if (operador.convite_id) {
            await permissionService.cancelInvite(operador.convite_id)
            await permissionService.deleteOperador(operador.id)
            customToast.success(`Convite de ${operador.nome} cancelado`)
            if (selectedOperador?.id === operador.id) {
              setSelectedOperador(null)
            }
          }
          break
      }

      await loadOperadores()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao executar acao"
      customToast.error(message)
    } finally {
      setActionLoading(false)
      setConfirmAction(null)
    }
  }

  const getStatusBadge = (op: OperadorWithPermissions) => {
    if (op.status) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400 border border-green-200 dark:border-green-800">
          Ativo
        </span>
      )
    }
    if (op.invite_status === 'pendente') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          Convite Pendente
        </span>
      )
    }
    if (op.invite_status === 'expirado') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800">
          Expirado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        Inativo
      </span>
    )
  }

  const isCurrentUser = (op: OperadorWithPermissions) => user?.id === op.id
  const isAdmin = (op: OperadorWithPermissions) => op.roles?.includes('ROLE_ROOT') || op.roles?.includes('ROLE_ADMIN')

  const getConfirmDialogContent = () => {
    if (!confirmAction) return { title: '', description: '', actionLabel: '', variant: 'default' as const }

    const { type, operador } = confirmAction

    switch (type) {
      case 'inactivate':
        return {
          title: `Inativar ${operador.nome}?`,
          description: `O usuario ${operador.nome} (${operador.email}) nao conseguira mais acessar o sistema. Voce pode reativar a qualquer momento.`,
          actionLabel: 'Inativar',
        }
      case 'activate':
        return {
          title: `Reativar ${operador.nome}?`,
          description: `O usuario ${operador.nome} (${operador.email}) podera acessar o sistema novamente com as permissoes configuradas.`,
          actionLabel: 'Reativar',
        }
      case 'delete':
        return {
          title: `Remover ${operador.nome}?`,
          description: `O usuario ${operador.nome} (${operador.email}) sera removido permanentemente do sistema, incluindo todas as suas permissoes. Essa acao nao pode ser desfeita.`,
          actionLabel: 'Remover',
        }
      case 'cancel_invite':
        return {
          title: `Cancelar convite de ${operador.nome}?`,
          description: `O convite enviado para ${operador.email} sera cancelado e o usuario sera removido. O link de ativacao deixara de funcionar.`,
          actionLabel: 'Cancelar Convite',
        }
    }
  }

  const dialogContent = getConfirmDialogContent()
  const isDestructive = confirmAction?.type === 'delete' || confirmAction?.type === 'cancel_invite' || confirmAction?.type === 'inactivate'

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="px-6 lg:px-10 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center text-blue-600">
              <Shield className="mr-2 w-8 h-8" />
              <div>
                <span className="text-3xl font-medium">Usuários e Permissões</span>
              </div>
            </div>

            <Button
              onClick={() => setInviteOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar Usuario
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de usuarios */}
            <div className={`${selectedOperador ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg`}>
              {/* Search */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              {/* Lista */}
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-16 text-slate-400">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Carregando usuarios...
                  </div>
                ) : filteredOperadores.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                    Nenhum usuario encontrado
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOperadores.map(op => {
                      const isSelected = selectedOperador?.id === op.id
                      return (
                        <div
                          key={op.id}
                          className={`relative flex items-center justify-between px-4 py-3.5 transition-colors ${isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-blue-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-l-transparent'
                            }`}
                        >
                          <button
                            onClick={() => selectOperador(op)}
                            className="flex items-center min-w-0 flex-1 text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${!op.status && !op.invite_status
                                ? 'bg-slate-300 dark:bg-slate-600'
                                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                }`}>
                                <span className="text-xs font-bold text-white">
                                  {op.nome.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${!op.status && !op.invite_status
                                  ? 'text-slate-400 dark:text-slate-500'
                                  : 'text-slate-700 dark:text-slate-200'
                                  }`}>
                                  {op.nome}
                                  {isCurrentUser(op) && (
                                    <span className="ml-1.5 text-xs text-blue-500">(voce)</span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                  {op.email}
                                </p>
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {getStatusBadge(op)}

                            {/* Menu de acoes */}
                            {!isCurrentUser(op) && !isAdmin(op) && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenu(activeMenu === op.id ? null : op.id)
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {activeMenu === op.id && (
                                  <div className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
                                    {/* Ativar/Inativar */}
                                    {op.status ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setActiveMenu(null)
                                          setConfirmAction({ type: 'inactivate', operador: op })
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                        Inativar conta
                                      </button>
                                    ) : op.invite_status === 'pendente' || op.invite_status === 'expirado' ? (
                                      <>
                                        {op.invite_status === 'pendente' && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setActiveMenu(null)
                                              handleResendInvite(op)
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                          >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            Reenviar convite
                                          </button>
                                        )}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setActiveMenu(null)
                                            setConfirmAction({ type: 'cancel_invite', operador: op })
                                          }}
                                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                        >
                                          <XCircle className="w-3.5 h-3.5" />
                                          Cancelar convite
                                        </button>
                                      </>
                                    ) : (
                                      // Inativo (sem convite pendente) - pode reativar
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setActiveMenu(null)
                                          setConfirmAction({ type: 'activate', operador: op })
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                                      >
                                        <Power className="w-3.5 h-3.5" />
                                        Reativar conta
                                      </button>
                                    )}

                                    {/* Separador */}
                                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

                                    {/* Deletar */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveMenu(null)
                                        setConfirmAction({ type: 'delete', operador: op })
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Remover usuario
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Painel de permissoes */}
            {selectedOperador && (
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                {/* Header do painel */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {selectedOperador.nome}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedOperador.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedOperador.status && selectedOperador.invite_status === 'pendente' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(selectedOperador)}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Reenviar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOperador(null)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Editor de permissoes */}
                <div className="p-5 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {selectedOperador.roles?.includes('ROLE_ROOT') || selectedOperador.roles?.includes('ROLE_ADMIN') ? (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Administrador</p>
                        <p className="text-xs text-blue-500 dark:text-blue-400">Este usuario tem acesso total ao sistema</p>
                      </div>
                    </div>
                  ) : (
                    <PermissionEditor
                      permissoes={editPermissoes}
                      onChange={setEditPermissoes}
                      onSave={handleSavePermissoes}
                      saving={saving}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <InviteModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={loadOperadores}
      />

      {/* Dialog de confirmacao */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                dialogContent.actionLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
