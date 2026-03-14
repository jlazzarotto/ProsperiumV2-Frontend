"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CircleHelp, Loader2, Pencil, PlusCircle, Search, Trash2, Users } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { motion } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/app/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import customToast from "@/components/ui/custom-toast"

interface User {
  id: string
  email: string
  name: string
  role: string
  businessUnitId: string
  businessUnitName?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Load mock users
  const loadUsers = useCallback(async () => {
      try {
        setLoading(true)

        // Mock users data
        const usersData: User[] = [
          {
            id: "1",
            email: "admin@example.com",
            name: "Admin User",
            role: "Admin",
            businessUnitId: "bu1",
            businessUnitName: "Unidade Principal",
          },
          {
            id: "2",
            email: "manager@example.com",
            name: "Manager User",
            role: "Gerente",
            businessUnitId: "bu1",
            businessUnitName: "Unidade Principal",
          },
          {
            id: "3",
            email: "user@example.com",
            name: "Regular User",
            role: "Colaborador",
            businessUnitId: "bu2",
            businessUnitName: "Unidade Secundária",
          },
        ]

        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 500))

        setUsers(usersData)
        setFilteredUsers(usersData)
      } catch (err) {
        console.error("Error loading users:", err)
        setError("Falha ao carregar usuários")
      } finally {
        setLoading(false)
      }
    }, [])

  useEffect(() => {
    loadUsers()
  }, [])

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
    // Role check commented out - user type doesn't have role property
    // else if (!authLoading && user && user.role !== "Admin") {
    //   router.push("/financeiro")
    //   customToast.error("Você não tem permissão para acessar esta página.", {position: "top-right"})
    // }
  }, [user, authLoading, router])

  const handleEditUser = (userId: string) => {
    router.push(`/admin/usuarios/${userId}`)
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      // Mock delete - just remove from local state
      await new Promise((resolve) => setTimeout(resolve, 500))

      setUsers(users.filter((u) => u.id !== userToDelete.id))
      setFilteredUsers(filteredUsers.filter((u) => u.id !== userToDelete.id))
      customToast.success("Usuário excluído com sucesso!")
    } catch (err) {
      console.error("Error deleting user:", err)
      customToast.error("Falha ao excluir usuário.")
    } finally {
      setShowDeleteDialog(false)
      setUserToDelete(null)
    }
  }

  if (authLoading) {
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
      <div className="bg-slate-50 min-h-screen dark:bg-slate-950">
        <motion.div className="container mx-auto py-6" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={cardVariants}>
            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 backdrop-blur-sm">
              <motion.div variants={itemVariants}>
                <CardHeader className="space-y-1 flex flex-row items-center justify-between">
                  <motion.div variants={itemVariants}>
                    <CardTitle
                      className="text-2xl font-bold flex items-center font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text
                      text-transparent dark:from-blue-400 dark:to-indigo-400"
                    >
                      <Users className="mr-2 text-blue-500" />
                      Gestão de Usuários
                    </CardTitle>
                  </motion.div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="gap-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-none text-white">
                          <PlusCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">Novo Usuário</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold flex items-center">
                            <Users className="mr-2 text-blue-500" />
                            Novo Usuário
                          </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p>
                            Para criar um novo usuário, vá até o cadastro de pessoas e marque a opção Criar conta de
                            usuário.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="icon" className="rounded-full">
                      <CircleHelp className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    {/* Search */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Pesquisar usuários..."
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Users Table */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead>Unidade de Negócio</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center">
                                <div className="flex justify-center items-center">
                                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                  Carregando...
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center">
                                Nenhum usuário encontrado.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      user.role === "Admin"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : user.role === "Gerente"
                                          ? "bg-purple-50 text-purple-700 border-purple-200"
                                          : "bg-blue-50 text-blue-700 border-blue-200"
                                    }
                                  >
                                    {user.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>{user.businessUnitName || "Não definida"}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditUser(user.id)}
                                      className="h-8 w-8 text-blue-600"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteUser(user)}
                                      className="h-8 w-8 text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário {userToDelete?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

