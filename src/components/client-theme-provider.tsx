"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { useEffect, useState } from "react"

export function ClientThemeProvider({ 
  children,
  ...props 
}: React.ComponentProps<typeof ThemeProvider>) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeProvider {...props}>
      {children}
    </ThemeProvider>
  )
}