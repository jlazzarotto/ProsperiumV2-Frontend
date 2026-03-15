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
import { LayoutGrid, type LucideIcon } from "lucide-react"
import { getNavigationCatalog, resolveNavigationIcon } from "@/lib/navigation-catalog"
import type { NavigationCategory } from "@/types/navigation"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { canAccess, user } = useAuth()

  const navigationItems = React.useMemo(() => getNavigationCatalog(user?.menu as NavigationCategory[] | undefined), [user?.menu])

  const filteredItems = React.useMemo(() => (
    navigationItems
      .map((group) => ({
        category: group.label,
        items: group.items.filter((item) => {
          if (item.locked) return true
          if (!item.permissionKey) return true
          return canAccess(item.permissionKey, "ver")
        }),
      }))
      .filter((group) => group.items.length > 0)
  ), [canAccess, navigationItems])

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
                const Icon = resolveNavigationIcon(item.iconKey, LayoutGrid) as LucideIcon
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
