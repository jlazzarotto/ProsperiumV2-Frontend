"use client"

import { MainHeader } from "@/components/main-header"
import { UserAccessManagement } from "@/components/user-access-management"

export default function UsuariosPage() {
  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50/70 px-4 py-6 dark:bg-slate-950 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <UserAccessManagement />
        </div>
      </div>
    </>
  )
}
