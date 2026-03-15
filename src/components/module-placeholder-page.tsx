"use client"

import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ModulePlaceholderPage({
  title,
  description,
  moduleKey,
}: {
  title: string
  description: string
  moduleKey: string
}) {
  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50/70 px-4 py-6 dark:bg-slate-950 sm:px-6">
        <div className="mx-auto w-full max-w-7xl">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="outline">{moduleKey}</Badge>
                <Badge variant="secondary">Em estruturação</Badge>
              </div>
              <CardTitle className="text-2xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-300">
              {description}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
