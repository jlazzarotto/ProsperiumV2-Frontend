/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, ArrowUpDown, Edit, Copy } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon as InfoCircle } from "lucide-react"

interface DreWizardStepStructureProps {
  data: any
  updateData: (data: any) => void
}

interface SortableItemProps {
  id: string
  title: string
  isMulti: boolean
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function SortableItem({ id, title, isMulti, onEdit, onDelete, onDuplicate }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="mb-3"
    >
      <Card className="border shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <button
              className="cursor-grab touch-none p-1 rounded-md hover:bg-muted transition-colors"
              {...attributes}
              {...listeners}
            >
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </button>
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            <Badge variant={isMulti ? "default" : "outline"} className="text-xs">
              {isMulti ? "Múltiplos itens" : "Item único"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  )
}

export function DreWizardStepStructure({ data, updateData }: DreWizardStepStructureProps) {
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [groupTitle, setGroupTitle] = useState("")
  const [isMulti, setIsMulti] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleAddGroup = () => {
    const newGroupId = `group_${Date.now()}`
    const newData = { ...data }

    newData[newGroupId] = {
      multi: "0",
      title_group: "Novo Grupo",
    }

    updateData(newData)
    setEditingGroup(newGroupId)
    setGroupTitle("Novo Grupo")
    setIsMulti(false)
  }

  const handleEditGroup = (groupId: string) => {
    setEditingGroup(groupId)
    setGroupTitle(data[groupId].title_group || "")
    setIsMulti(data[groupId].multi === "1")
  }

  const handleSaveGroup = () => {
    if (!editingGroup) return

    const newData = { ...data }
    newData[editingGroup].title_group = groupTitle
    newData[editingGroup].multi = isMulti ? "1" : "0"

    updateData(newData)
    setEditingGroup(null)
  }

  const handleCancelEdit = () => {
    setEditingGroup(null)
  }

  const handleDeleteGroup = (groupId: string) => {
    const newData = { ...data }
    delete newData[groupId]
    updateData(newData)
  }

  const handleDuplicateGroup = (groupId: string) => {
    const newGroupId = `group_${Date.now()}`
    const newData = { ...data }

    newData[newGroupId] = JSON.parse(JSON.stringify(data[groupId]))
    newData[newGroupId].title_group = `${data[groupId].title_group} (Cópia)`

    updateData(newData)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = Object.keys(data).indexOf(active.id as string)
      const newIndex = Object.keys(data).indexOf(over.id as string)

      const orderedKeys = arrayMove(Object.keys(data), oldIndex, newIndex)
      const newData: Record<string, any> = {}

      orderedKeys.forEach((key) => {
        newData[key] = data[key]
      })

      updateData(newData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Estrutura do DRE</h3>
        <Button onClick={handleAddGroup} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Grupo
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
        <InfoCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-400">Dica de uso</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-500">
          Comece criando os grupos principais do seu DRE, como Receitas, Despesas, Custos, etc. Você pode reorganizá-los
          arrastando e soltando na ordem desejada.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ScrollArea className="h-[500px] pr-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={Object.keys(data)} strategy={verticalListSortingStrategy}>
                <AnimatePresence>
                  {Object.entries(data).map(([groupId, group]: [string, any]) => (
                    <SortableItem
                      key={groupId}
                      id={groupId}
                      title={group.title_group || "Sem título"}
                      isMulti={group.multi === "1"}
                      onEdit={() => handleEditGroup(groupId)}
                      onDelete={() => handleDeleteGroup(groupId)}
                      onDuplicate={() => handleDuplicateGroup(groupId)}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
            </DndContext>

            {Object.keys(data).length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                <p className="text-muted-foreground">Nenhum grupo criado. Clique em &quot;Adicionar Grupo&quot; para começar.</p>
              </div>
            )}
          </ScrollArea>
        </div>

        <div>
          {editingGroup ? (
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Editar Grupo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-title">Título do Grupo</Label>
                  <Input
                    id="group-title"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder="Ex: (+) RECEITA OPERACIONAL BRUTA"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="multi-switch" checked={isMulti} onCheckedChange={setIsMulti} />
                  <Label htmlFor="multi-switch">Grupo com múltiplos itens</Label>
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveGroup} className="bg-blue-600 hover:bg-blue-700">
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4 mb-4">
                <Edit className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Editar Grupo</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione um grupo da lista para editar suas propriedades ou adicione um novo grupo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

