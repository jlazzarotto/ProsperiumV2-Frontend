"use client"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { ModeToggle } from "@/components/mode-toggle"
import { BarChart2 } from "lucide-react"
import { motion } from "framer-motion"

export function MainHeader() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
      <div className="w-full py-3 px-4">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <BarChart2 className="h-6 w-6 mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-600">EasyDRE</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <ThemeSwitcher />
            <ModeToggle />
          </motion.div>
        </div>
      </div>
    </header>
  )
}

