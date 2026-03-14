"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Paintbrush } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const themes = [
  {
    name: "Azul",
    value: "blue",
    primaryColor: "#3b82f6",
    variable: "--blue-600",
  },
  {
    name: "Verde",
    value: "green",
    primaryColor: "#10b981",
    variable: "--green-600",
  },
  {
    name: "Roxo",
    value: "purple",
    primaryColor: "#8b5cf6",
    variable: "--purple-600",
  },
  {
    name: "Vermelho",
    value: "red",
    primaryColor: "#ef4444",
    variable: "--red-600",
  },
  {
    name: "Laranja",
    value: "orange",
    primaryColor: "#f97316",
    variable: "--orange-600",
  },
]

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const [currentTheme, setCurrentTheme] = useState("blue")

  useEffect(() => {
    setMounted(true)

    // Get the current theme from localStorage or default to blue
    const savedTheme = localStorage.getItem("color-theme") || "blue"
    setCurrentTheme(savedTheme)

    // Apply the theme
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (theme: string) => {
    const selectedTheme = themes.find((t) => t.value === theme)

    if (selectedTheme) {
      document.documentElement.style.setProperty("--primary", selectedTheme.primaryColor)
      document.documentElement.style.setProperty("--theme-color", selectedTheme.primaryColor)
      document.documentElement.setAttribute("data-theme", theme)
      localStorage.setItem("color-theme", theme)
      setCurrentTheme(theme)
    }
  }

  if (!mounted) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Mudar tema de cores</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => applyTheme(theme.value)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
            <span>{theme.name}</span>
            {currentTheme === theme.value && <span className="ml-auto text-xs text-blue-600">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

