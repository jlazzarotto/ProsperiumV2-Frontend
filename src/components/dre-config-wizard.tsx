"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useDreStore, type DreData } from "@/lib/dre-store"
import { ChevronRight, ChevronLeft, Save, BarChart2, Table, Plus } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { v4 as uuidv4 } from "uuid"

// Wizard steps
import { DreWizardStepInfo } from "@/components/wizard/dre-wizard-step-info"
import { DreWizardStepStructure } from "@/components/wizard/dre-wizard-step-structure"
import { DreWizardStepData } from "@/components/wizard/dre-wizard-step-data"
import { DreWizardStepFormulas } from "@/components/wizard/dre-wizard-step-formulas"
import { DreWizardStepReview } from "@/components/wizard/dre-wizard-step-review"

interface DreConfigWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dreId?: string
  onComplete: (dreId?: string) => void
  buttonText: string; // Add this line
  buttonVariant: string;
  className?: string;
}


export function DreConfigWizard({ open, onOpenChange, dreId, onComplete }: DreConfigWizardProps) {
  const { getDreById, addDre, updateDre } = useDreStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Form data
  const [formData, setFormData] = useState<Partial<DreData>>({
    id: "",
    name: "",
    company: "",
    cnpj: "",
    period: "",
    data: {},
  })

  // Load existing DRE data if editing
  useEffect(() => {
    if (dreId) {
      const existingDre = getDreById(dreId)
      if (existingDre) {
        setFormData(existingDre)
      }
    } else {
      // Reset form for new DRE
      setFormData({
        id: uuidv4(),
        name: "",
        company: "",
        cnpj: "",
        period: "",
        data: {},
      })
    }
  }, [dreId, getDreById])

  const steps = [
    { title: "Informações", icon: <FileText className="h-5 w-5" /> },
    { title: "Estrutura", icon: <Table className="h-5 w-5" /> },
    { title: "Dados", icon: <BarChart2 className="h-5 w-5" /> },
    { title: "Fórmulas", icon: <Plus className="h-5 w-5" /> },
    { title: "Revisão", icon: <Save className="h-5 w-5" /> },
  ]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleSave = () => {
    setSaving(true)

    // Prepare data for saving
    const dreToSave: DreData = {
      ...(formData as DreData),
      updatedAt: new Date().toISOString(),
      createdAt: formData.createdAt || new Date().toISOString(),
    }

    // Save to store
    if (dreId) {
      updateDre(dreId, dreToSave)
    } else {
      addDre(dreToSave)
    }

    // Simulate saving process
    setTimeout(() => {
      setSaving(false)
      onComplete(dreToSave.id)
    }, 1000)
  }

  const updateFormData = (data: Partial<DreData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const getStepContent = () => {
    switch (step) {
      case 0:
        return <DreWizardStepInfo data={formData} updateData={updateFormData} />
      case 1:
        return <DreWizardStepStructure data={formData.data || {}} updateData={(data) => updateFormData({ data })} />
      case 2:
        return <DreWizardStepData data={formData.data || {}} updateData={(data) => updateFormData({ data })} />
      case 3:
        return <DreWizardStepFormulas data={formData.data || {}} updateData={(data) => updateFormData({ data })} />
      case 4:
        return <DreWizardStepReview data={formData} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl text-blue-600 flex items-center">
            <BarChart2 className="mr-2 h-6 w-6" />
            {dreId ? "Editar DRE" : "Novo DRE"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6 mt-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-center ${i > 0 ? "ml-2" : ""}`}>
                {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />}
                <div
                  className={`
                    flex items-center justify-center rounded-full p-1.5
                    ${
                      i === step
                        ? "bg-blue-600 text-white"
                        : i < step
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-muted text-muted-foreground"
                    }
                    cursor-pointer transition-colors
                  `}
                  onClick={() => i <= step && setStep(i)}
                >
                  {s.icon}
                </div>
                <span
                  className={`
                    ml-1.5 text-sm font-medium hidden sm:inline-block
                    ${i === step ? "text-foreground" : "text-muted-foreground"}
                  `}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            Passo {step + 1} de {steps.length}
          </span>
        </div>

        <Progress value={((step + 1) / steps.length) * 100} className="h-1 mb-6 bg-slate-200 dark:bg-slate-700">
          <div className="h-full bg-blue-600 rounded-full" />
        </Progress>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full overflow-auto pr-2"
            >
              {getStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <DialogFooter className="flex justify-between mt-6 gap-2">
          <div>
            {step > 0 && (
              <Button variant="outline" onClick={handlePrev}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Finalizar
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Import for FileText icon
import { FileText } from "lucide-react"

