"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Construction } from "lucide-react"
import { MainHeader } from "@/components/main-header"
import { motion } from "framer-motion"
import { XlsxImportWizard } from "@/components/xlsx-importer/xlsx-import-wizard"
import { importProfiles } from "@/lib/xlsx-importer/profiles"

const tabs = [
  { id: "planoContas", label: "Plano de Contas", available: true },
  { id: "tpLancamento", label: "Tp Lancamento", available: false },
  { id: "pessoas", label: "Pessoas", available: false },
  { id: "ctCaixa", label: "Ct Caixa", available: false },
  { id: "operacoes", label: "Operacoes", available: false },
  { id: "lancamentos", label: "Lancamentos", available: false },
  { id: "arquivos", label: "Arquivos", available: false },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
}

export default function ImportacaoDados() {
  const [activeTab, setActiveTab] = useState("planoContas")
  const profile = importProfiles[activeTab]
  const currentTab = tabs.find((t) => t.id === activeTab)

  return (
    <>
      <MainHeader />
      <div className="bg-slate-50 min-h-screen dark:bg-slate-950">
        <motion.div
          className="container mx-auto py-6 px-4 sm:px-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={cardVariants}>
            <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="space-y-1 flex flex-row items-center">
                <Database className="mr-2 text-blue-500 h-6 w-6" />
                <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  Importacao de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tabs */}
                <div className="w-full overflow-x-auto pb-2 no-scrollbar">
                  <div className="flex min-w-max gap-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap rounded-md
                          ${
                            activeTab === tab.id
                              ? "bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 shadow-sm"
                              : "bg-gray-100 dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800"
                          }
                          ${!tab.available && activeTab !== tab.id ? "opacity-50" : ""}
                        `}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                {profile && currentTab?.available ? (
                  <XlsxImportWizard key={activeTab} profile={profile} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Construction className="h-12 w-12 mb-4 text-slate-400" />
                    <p className="text-lg font-medium">Em breve</p>
                    <p className="text-sm">
                      A importacao de {currentTab?.label} sera disponibilizada em breve.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
