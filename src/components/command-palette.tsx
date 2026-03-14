"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/auth-context"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Building2,
  Building,
  Settings,
  Database,
  Landmark,
  Wallet,
  CreditCard,
  Ship,
  Briefcase,
  Users,
  Anchor,
  Newspaper,
  PieChart,
  Receipt,
  Barcode,
  Key,
  LayoutGrid,
  Lock,
  type LucideIcon,
} from "lucide-react"

type NavigationItem = {
  label: string
  href: string
  icon: LucideIcon
  permissionKey?: string
  locked?: boolean
}

type NavigationGroup = {
  category: string
  items: NavigationItem[]
}

const navigationItems: NavigationGroup[] = [
  {
    category: "Administrador",
    items: [
      { label: "Coordenar Empresas", href: "/admin/coordenar-empresas", icon: Building2, permissionKey: "admin.coordenar_unidades" },
      { label: "Coordenar Unidades", href: "/admin/coordenar-unidades", icon: Building, permissionKey: "admin.coordenar_unidades" },
      { label: "Parametrização do sistema", href: "/admin/parametrizacao-sistema", icon: Settings, permissionKey: "admin.coordenar_unidades" },
      { label: "Permissões", href: "/admin/permissoes", icon: Settings, permissionKey: "admin.permissoes" },
      { label: "Importação de dados", href: "/admin/importacao", icon: Database, permissionKey: "admin.importacao", locked: true },
    ],
  },
  {
    category: "Configurações",
    items: [
      { label: "Contabilidade", href: "/contabilidade", icon: Landmark, permissionKey: "configuracoes.contabilidade" },
    ],
  },
  {
    category: "Cadastros",
    items: [
      { label: "Agências bancárias", href: "/cadastros/agencias-bancarias", icon: Landmark, permissionKey: "cadastros.agencias_bancarias" },
      { label: "Contas caixa", href: "/cadastros/contas-caixa", icon: Wallet, permissionKey: "cadastros.contas_caixa" },
      { label: "Formas de pagamento", href: "/cadastros/formas-pagamento", icon: CreditCard, permissionKey: "cadastros.formas_pagamento" },
      { label: "Navios", href: "/cadastros/navios", icon: Ship, permissionKey: "cadastros.navios" },
      { label: "Operações", href: "/cadastros/operacoes", icon: Briefcase, permissionKey: "cadastros.operacoes" },
      { label: "Pessoas", href: "/cadastros/pessoas", icon: Users, permissionKey: "cadastros.pessoas" },
      { label: "Portos", href: "/cadastros/portos", icon: Anchor, permissionKey: "cadastros.portos" },
    ],
  },
  {
    category: "Financeiro",
    items: [
      { label: "Dashboard", href: "/financeiro", icon: LayoutGrid },
      { label: "Novo lançamento", href: "/financeiro/lancamento", icon: Newspaper, permissionKey: "financeiro.novo_lancamento" },
      { label: "Transf. entre contas", href: "/financeiro/transferencia", icon: Wallet, permissionKey: "financeiro.transferencia" },
    ],
  },
  {
    category: "Relatórios",
    items: [
      { label: "DRE", href: "/contabeis/dre", icon: PieChart, permissionKey: "relatorios.dre" },
      { label: "Resultado por Navio", href: "/relatorios/resultado-navio", icon: Ship, permissionKey: "relatorios.resultado_navio" },
      { label: "Movimento Contabilidade", href: "/movimento/contabilidade", icon: Receipt, permissionKey: "relatorios.movimento_contabilidade" },
    ],
  },
  {
    category: "Asaas",
    items: [
      { label: "Boletos e Cobranças", href: "/asaas/boletos", icon: Barcode, permissionKey: "asaas.boletos" },
      { label: "Configuração Asaas", href: "/asaas/configuracao", icon: Key, permissionKey: "asaas.configuracao" },
    ],
  },
]

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { canAccess } = useAuth()

  const filteredItems = React.useMemo(() => (
    navigationItems
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.locked) return true
          if (!item.permissionKey) return true
          return canAccess(item.permissionKey, "ver")
        }),
      }))
      .filter((group) => group.items.length > 0)
  ), [canAccess])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar módulo, tela ou ação..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {filteredItems.map((group, idx) => (
          <React.Fragment key={group.category}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={group.category}>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.href}
                    value={`${group.category} ${item.label}`}
                    onSelect={() => !item.locked && handleSelect(item.href)}
                    disabled={item.locked}
                    className="gap-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{group.category}</span>
                    </div>
                    {item.locked && <Lock className="ml-auto h-3.5 w-3.5 text-slate-400" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

export function useCommandPalette() {
  return {
    open: () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
    },
  }
}
