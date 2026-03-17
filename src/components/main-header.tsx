"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  User,
  CircleHelp,
  LogOut,
  Users,
  CreditCard,
  Lock,
  Search,
  Command,
  Activity,
  LayoutGrid,
  Shield,
  Building2,
} from "lucide-react"
import Image from "next/image"
import { ModeToggle } from "./ModeToggle"
import LogoDarkTheme from "../app/assets/img/Logo-branco.png"
import Link from "next/link"
import { useAuth } from "@/app/contexts/auth-context"
import { CommandPalette } from "./command-palette"
import { getNavigationCatalog, resolveNavigationIcon } from "@/lib/navigation-catalog"
import type { NavigationCategory } from "@/types/navigation"
import { ChangeCompanyModal } from "./change-company-modal"
import { useCompany } from "@/app/contexts/company-context"
import { Badge } from "@/components/ui/badge"
import { useSelectedCompanyName } from "@/hooks/use-selected-company-name"

export function MainHeader() {
  const { signOut, user, canAccess, isRoot } = useAuth()
  const { selectedCompanyId } = useCompany()
  const [companyModalOpen, setCompanyModalOpen] = React.useState(false)
  const selectedCompanyName = useSelectedCompanyName()

  const navigationCatalog = React.useMemo(
    () => getNavigationCatalog(user?.menu as NavigationCategory[] | undefined),
    [user?.menu]
  )

  const openCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))
  }

  // Filtrar menu por permissoes e injetar item "Mudar Company" para ROLE_ROOT
  const filteredMenuItems = navigationCatalog
    .map(category => {
      const filteredItems = category.items.filter(item => {
        if (item.locked) return true // Itens locked sempre aparecem (desabilitados)
        if (!item.permissionKey) return true // Sem permissionKey = sempre visivel
        return canAccess(item.permissionKey, 'ver')
      }).map(item => ({
        ...item,
        icon: React.createElement(resolveNavigationIcon(item.iconKey), { size: 16, className: "mr-2 text-slate-500" }),
      }))

      // Injetar "Mudar Company" no início do menu Administrador para ROLE_ROOT
      if (isRoot && category.code === "admin") {
        return {
          ...category,
          icon: resolveCategoryIcon(category.code),
          items: [
            {
              label: selectedCompanyId ? "Mudar Company" : "Selecionar Company",
              icon: <Building2 size={16} className="mr-2 text-blue-500" />,
              onClick: () => setCompanyModalOpen(true),
            },
            ...filteredItems,
          ],
        }
      }

      return {
        ...category,
        icon: resolveCategoryIcon(category.code),
        items: filteredItems,
      }
    })
    .filter(category => category.items.length > 0)

  return (
    <>
      <CommandPalette />
      <ChangeCompanyModal open={companyModalOpen} onClose={() => setCompanyModalOpen(false)} />

      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center h-14 w-full px-4 md:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/">
              <div className="flex items-center gap-2.5 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-xl shadow-sm">
                    <Image
                      src={LogoDarkTheme || "/placeholder.svg"}
                      alt="Prosperium Logo"
                      style={{ width: "auto", height: 24 }}
                      className="rounded"
                    />
                  </div>
                </div>
                <span className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent hidden sm:inline">
                  Prosperium
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-4">
            <nav className="flex items-center gap-0.5">
              {filteredMenuItems.map((item) => (
                <NavDropdown
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  items={item.items}
                />
              ))}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto lg:ml-0">
            {/* Search / Ctrl+K button */}
            <button
              onClick={openCommandPalette}
              className="hidden sm:flex items-center gap-2 h-8 px-3 text-sm text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-lg transition-all cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Buscar...</span>
              <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-slate-400 dark:text-slate-500">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            <div className="hidden lg:flex items-center gap-1">
              <div className="border-l border-slate-200/60 dark:border-slate-700/50 h-5 mx-1.5" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-lg"
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {user?.nome?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <span className="max-w-[120px] truncate text-sm">{user?.nome || "Sua Conta"}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="rounded-lg text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-lg"
              >
                <CircleHelp className="h-4 w-4" />
              </Button>

              <div className="border-l border-slate-200/60 dark:border-slate-700/50 h-5 mx-1" />

              <ModeToggle />
            </div>

            {/* Mobile: search icon + hamburger */}
            <button
              onClick={openCommandPalette}
              className="sm:hidden flex items-center justify-center h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>

            <div className="lg:hidden ml-0.5">
              <MobileMenu menuItems={navigationCatalog} onOpenCompanyModal={() => setCompanyModalOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* Company Status Banner para ROLE_ROOT - Exibido abaixo do menu */}
      {isRoot && (
        <div className={`border-b ${
          selectedCompanyId
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
            : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
        }`}>
          <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-10">
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-semibold ${
                selectedCompanyId
                  ? "text-emerald-900 dark:text-emerald-200"
                  : "text-amber-900 dark:text-amber-200"
              }`}>
                {selectedCompanyId ? (selectedCompanyName || "Grupo Econômico selecionado") : "⚠️ Nenhum Grupo Econômico selecionado!"}
              </span>
            </div>
            {selectedCompanyId && (
              <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                Ativo
              </Badge>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function resolveCategoryIcon(categoryCode?: string) {
  switch (categoryCode) {
    case "admin":
      return <Shield size={16} className="text-indigo-500" />
    case "configuracoes":
      return <CreditCard size={16} className="text-cyan-500" />
    case "cadastros":
      return <Users size={16} className="text-blue-500" />
    case "relatorios":
      return <Activity size={16} className="text-emerald-500" />
    case "asaas":
      return <CreditCard size={16} className="text-amber-500" />
    default:
      return <LayoutGrid size={16} className="text-amber-500" />
  }
}

interface NavDropdownItem {
  label: string
  color?: string
  href?: string
  icon: React.ReactNode
  locked?: boolean
  onClick?: () => void
}

interface NavDropdownProps {
  icon: React.ReactNode
  label: string
  items: NavDropdownItem[]
  locked?: boolean
}

function NavDropdown({ icon, label, items, locked = false }: NavDropdownProps) {
  if (locked) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="gap-1.5 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50 rounded-lg"
      >
        {icon}
        {label}
        <Lock className="h-3 w-3 ml-0.5" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-lg transition-all"
        >
          {icon}
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60 border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-slate-200/20 dark:shadow-black/20 rounded-xl p-1.5"
      >
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            {index === 1 && items[0].onClick && (
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            )}
            <DropdownMenuItem
              disabled={item.locked}
              className={`rounded-lg my-0.5 text-sm font-medium py-2.5 ${
                item.locked
                  ? "cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-600"
                  : `cursor-pointer ${item.color ? item.color : "text-slate-700 dark:text-slate-300"}`
              }`}
              asChild={!item.locked && !item.onClick}
              onClick={item.onClick}
            >
              {item.locked ? (
                <div className="flex items-center w-full justify-between">
                  <span className="flex items-center">
                    {item.icon}
                    {item.label}
                  </span>
                  <Lock className="h-3 w-3 text-slate-400" />
                </div>
              ) : item.onClick ? (
                <div className="flex items-center w-full">
                  {item.icon}
                  {item.label}
                </div>
              ) : "href" in item && item.href ? (
                <Link href={item.href} className="flex items-center w-full">
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <div className="flex items-center w-full">
                  {item.icon}
                  {item.label}
                </div>
              )}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileMenu({ menuItems, onOpenCompanyModal }: { menuItems: NavigationCategory[]; onOpenCompanyModal: () => void }) {
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    Administrador: true,
    Configurações: true,
    Cadastros: true,
    Financeiro: true,
  })
  const { signOut, canAccess, isRoot } = useAuth()
  const { selectedCompanyId } = useCompany()

  const filteredMenuItems = menuItems
    .map(category => {
      const filteredItems = category.items.filter(item => {
        if (item.locked) return true
        if (!item.permissionKey) return true
        return canAccess(item.permissionKey, 'ver')
      }).map(item => ({
        ...item,
        icon: React.createElement(resolveNavigationIcon(item.iconKey), { size: 16, className: "mr-2 text-slate-500" }),
      }))

      if (isRoot && category.code === "admin") {
        return {
          ...category,
          icon: resolveCategoryIcon(category.code),
          items: [
            {
              label: selectedCompanyId ? "Mudar Company" : "Selecionar Company",
              icon: <Building2 size={16} className="mr-2 text-blue-500" />,
              onClick: onOpenCompanyModal,
            },
            ...filteredItems,
          ],
        }
      }

      return {
        ...category,
        icon: resolveCategoryIcon(category.code),
        items: filteredItems,
      }
    })
    .filter(category => category.items.length > 0)

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12"></line>
            <line x1="4" x2="20" y1="6" y2="6"></line>
            <line x1="4" x2="20" y1="18" y2="18"></line>
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 mt-2 border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl rounded-xl p-2 max-h-[80vh] overflow-y-auto"
      >
        {filteredMenuItems.map((category) => {
          const isLocked = false
          return (
            <div key={category.label} className="mb-3">
              <button
                onClick={() => !isLocked && toggleCategory(category.label)}
                disabled={isLocked}
                className={`flex items-center justify-between w-full px-2 py-1.5 text-sm font-medium rounded-lg ${isLocked
                    ? "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  {category.icon}
                  {category.label}
                  {isLocked && <Lock className="h-3.5 w-3.5 ml-1" />}
                </div>
                {!isLocked && (
                  <ChevronDown
                    className={`h-3.5 w-3.5 opacity-70 transition-transform ${expandedCategories[category.label] ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {!isLocked && expandedCategories[category.label] && (
                <div className="pl-4 mt-1 space-y-1">
                  {category.items.map((item, index) => (
                    <React.Fragment key={item.label}>
                      {index === 1 && (item as NavDropdownItem).onClick && (
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      )}
                      <DropdownMenuItem
                        disabled={item.locked}
                        className={`rounded-lg my-0.5 text-sm font-medium ${
                          item.locked
                            ? "cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-600"
                            : "cursor-pointer text-slate-700 dark:text-slate-300"
                        }`}
                        asChild={!item.locked && !(item as NavDropdownItem).onClick}
                        onClick={(item as NavDropdownItem).onClick}
                      >
                        {item.locked ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="flex items-center">
                              {item.icon}
                              {item.label}
                            </span>
                            <Lock className="h-3 w-3 text-slate-400" />
                          </div>
                        ) : (item as NavDropdownItem).onClick ? (
                          <div className="flex items-center">
                            {item.icon}
                            {item.label}
                          </div>
                        ) : "href" in item && item.href ? (
                          <Link href={item.href} className="flex items-center">
                            {item.icon}
                            {item.label}
                          </Link>
                        ) : (
                          <div className="flex items-center">
                            {item.icon}
                            {item.label}
                          </div>
                        )}
                      </DropdownMenuItem>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div className="border-t border-slate-200 dark:border-slate-800 mt-1 pt-2">
          <DropdownMenuItem className="cursor-pointer rounded-lg my-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <User className="h-4 w-4 mr-2" />
            Sua Conta
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer rounded-lg my-0.5 text-sm font-medium text-red-500 dark:text-red-400"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 mt-1 pt-2 flex justify-between items-center px-2">
          <CircleHelp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <ModeToggle />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
