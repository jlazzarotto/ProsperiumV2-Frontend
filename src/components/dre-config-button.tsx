"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DreConfigForm } from "@/components/dre-config-form"

export function DreConfigButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Configurar DRE
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração do DRE</DialogTitle>
          <DialogDescription>
            Configure a estrutura e os dados do seu Demonstrativo de Resultado do Exercício.
          </DialogDescription>
        </DialogHeader>
        <DreConfigForm />
      </DialogContent>
    </Dialog>
  )
}

