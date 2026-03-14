"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ContextFieldDef } from "@/lib/xlsx-importer/types"

interface XlsxContextFieldsProps {
  fields: ContextFieldDef[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
}

export function XlsxContextFields({ fields, values, onChange }: XlsxContextFieldsProps) {
  if (!fields || fields.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>

          {field.type === "select" && field.options ? (
            <Select
              value={values[field.key] || ""}
              onValueChange={(v) => onChange(field.key, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === "date" ? (
            <Input
              type="date"
              value={values[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          ) : (
            <Input
              type="text"
              value={values[field.key] || ""}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.label}
            />
          )}
        </div>
      ))}
    </div>
  )
}
