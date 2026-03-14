"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Building, ChevronDown, Plus } from "lucide-react"
import { useBusinessUnits } from "@/app/hooks/use-business-units"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BusinessUnitForm } from "@/components/business-unit-form"
import customToast from "./ui/custom-toast"

export function BusinessUnitSelector() {
  const { businessUnits, loading } = useBusinessUnits()
  const [currentBusinessUnit, setCurrentBusinessUnitState] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // businessUnitId doesn't exist on User type - commenting out
  // useEffect(() => {
  //   if (user?.businessUnitId) {
  //     console.log(`Setting current business unit from user: ${user.businessUnitId}`)
  //     setCurrentBusinessUnitState(user.businessUnitId)
  //   }
  // }, [user])

  const handleSelectBusinessUnit = async (id: string) => {
    try {
      console.log(`Selecting business unit: ${id}`)
      // setCurrentBusinessUnit doesn't exist on AuthContextType - commenting out
      // await setCurrentBusinessUnit(id)
      setCurrentBusinessUnitState(id)
      console.log(`Business unit selected: ${id}`)
    } catch (error) {
      console.error("Error selecting business unit:", error)
      customToast.error("Erro ao selecionar unidade de negócio. Tente novamente.", {
        position: "bottom-right",
      })
    }
  }

  const getCurrentBusinessUnitName = () => {
    if (!currentBusinessUnit) return "Selecionar Unidade"

    const unit = businessUnits.find((bu) => bu.id === currentBusinessUnit)
    return unit ? unit.name : "Unidade não encontrada"
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Building className="h-4 w-4 text-blue-500" />
            {loading ? "Carregando..." : getCurrentBusinessUnitName()}
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {businessUnits.map((unit) => (
            <DropdownMenuItem
              key={unit.id}
              onClick={() => handleSelectBusinessUnit(unit.id!)}
              className={currentBusinessUnit === unit.id ? "bg-slate-100 dark:bg-slate-800" : ""}
            >
              <Building className="h-4 w-4 mr-2 text-blue-500" />
              {unit.name}
            </DropdownMenuItem>
          ))}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="h-4 w-4 mr-2 text-green-500" />
                Nova Unidade de Negócio
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Nova Unidade de Negócio</DialogTitle>
              </DialogHeader>
              <BusinessUnitForm onSuccess={() => setShowForm(false)} />
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

