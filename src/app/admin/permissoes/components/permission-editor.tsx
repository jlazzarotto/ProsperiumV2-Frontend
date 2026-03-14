"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Loader2, Save, ChevronDown, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react"
import { MODULOS_BY_CATEGORY } from "@/types/permissions"
import type { PermissoesModulo } from "@/types/permissions"

interface PermissionEditorProps {
  permissoes: PermissoesModulo
  onChange: (permissoes: PermissoesModulo) => void
  onSave?: () => void
  saving?: boolean
  showSaveButton?: boolean
}

export function PermissionEditor({ permissoes, onChange, onSave, saving = false, showSaveButton = true }: PermissionEditorProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const allModuloKeys = Object.values(MODULOS_BY_CATEGORY).flatMap(cat => cat.modulos.map(m => m.key))

  const isAllChecked = allModuloKeys.every(key => {
    const p = permissoes[key]
    return p?.ver && p?.criar_editar && p?.deletar
  })

  const isAllVerChecked = allModuloKeys.every(key => permissoes[key]?.ver)
  const isAllCriarChecked = allModuloKeys.every(key => permissoes[key]?.criar_editar)
  const isAllDeletarChecked = allModuloKeys.every(key => permissoes[key]?.deletar)

  const toggleAll = (checked: boolean) => {
    const newPerms: PermissoesModulo = {}
    for (const key of allModuloKeys) {
      newPerms[key] = { ver: checked, criar_editar: checked, deletar: checked }
    }
    onChange(newPerms)
  }

  const toggleAllField = (field: 'ver' | 'criar_editar' | 'deletar', checked: boolean) => {
    const newPerms: PermissoesModulo = { ...permissoes }
    for (const key of allModuloKeys) {
      const current = newPerms[key] || { ver: false, criar_editar: false, deletar: false }
      newPerms[key] = { ...current, [field]: checked }

      // Se desmarcar "ver", desmarca tudo
      if (field === 'ver' && !checked) {
        newPerms[key].criar_editar = false
        newPerms[key].deletar = false
      }
      // Se marcar criar/deletar, marca "ver" automaticamente
      if ((field === 'criar_editar' || field === 'deletar') && checked) {
        newPerms[key].ver = true
      }
    }
    onChange(newPerms)
  }

  const toggleModuloField = (key: string, field: 'ver' | 'criar_editar' | 'deletar', checked: boolean) => {
    const current = permissoes[key] || { ver: false, criar_editar: false, deletar: false }
    const updated = { ...current, [field]: checked }

    // Se desmarcar "ver", desmarca tudo
    if (field === 'ver' && !checked) {
      updated.criar_editar = false
      updated.deletar = false
    }
    // Se marcar criar/deletar, marca "ver" automaticamente
    if ((field === 'criar_editar' || field === 'deletar') && checked) {
      updated.ver = true
    }

    onChange({ ...permissoes, [key]: updated })
  }

  const toggleCategory = (categoryKey: string) => {
    setCollapsed(prev => ({ ...prev, [categoryKey]: !prev[categoryKey] }))
  }

  return (
    <div className="space-y-4">
      {/* Toggle todas */}
      <label className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg cursor-pointer">
        <Checkbox
          checked={isAllChecked}
          onCheckedChange={(checked) => toggleAll(!!checked)}
        />
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          Todas as permissoes
        </span>
      </label>

      {/* Atalhos por tipo */}
      <div className="grid grid-cols-3 gap-2">
        <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Checkbox
            checked={isAllVerChecked}
            onCheckedChange={(checked) => toggleAllField('ver', !!checked)}
          />
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Todas View
          </span>
        </label>
        <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Checkbox
            checked={isAllCriarChecked}
            onCheckedChange={(checked) => toggleAllField('criar_editar', !!checked)}
          />
          <Pencil className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Todas Editar
          </span>
        </label>
        <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Checkbox
            checked={isAllDeletarChecked}
            onCheckedChange={(checked) => toggleAllField('deletar', !!checked)}
          />
          <Trash2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Todas Deletar
          </span>
        </label>
      </div>

      {/* Categorias */}
      <div className="space-y-2">
        {Object.entries(MODULOS_BY_CATEGORY).map(([categoryKey, category]) => {
          const isCollapsed = collapsed[categoryKey]

          return (
            <div key={categoryKey} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleCategory(categoryKey)}
                className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {category.label}
                </span>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {!isCollapsed && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Header da tabela */}
                  <div className="grid grid-cols-[1fr_80px_100px_80px] gap-2 px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Modulo</span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Ver</span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Criar/Editar</span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center">Deletar</span>
                  </div>

                  {category.modulos.map(modulo => {
                    const perm = permissoes[modulo.key] || { ver: false, criar_editar: false, deletar: false }

                    return (
                      <div key={modulo.key} className="grid grid-cols-[1fr_80px_100px_80px] gap-2 px-4 py-2.5 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{modulo.label}</span>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={perm.ver}
                            onCheckedChange={(checked) => toggleModuloField(modulo.key, 'ver', !!checked)}
                          />
                        </div>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={perm.criar_editar}
                            onCheckedChange={(checked) => toggleModuloField(modulo.key, 'criar_editar', !!checked)}
                          />
                        </div>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={perm.deletar}
                            onCheckedChange={(checked) => toggleModuloField(modulo.key, 'deletar', !!checked)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showSaveButton && onSave && (
        <Button
          onClick={onSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Permissoes
            </>
          )}
        </Button>
      )}
    </div>
  )
}
