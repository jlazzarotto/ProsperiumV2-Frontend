"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { MainHeader } from "@/components/main-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Switch } from "@/components/ui/switch"
import { getTipo8BusinessUnits, type Tipo8BusinessUnit } from "@/services/business-unit-service"
import { createCostCenter, deleteCostCenter, getCostCenters, updateCostCenter } from "@/app/services/cost-center-service"
import type { CostCenterNode } from "@/types/types"
import { Building2, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"
import customToast from "@/components/ui/custom-toast"

interface FlatNode extends CostCenterNode {
  level: number
}

const flattenTree = (nodes: CostCenterNode[], level = 0): FlatNode[] =>
  nodes.flatMap((node) => [{ ...node, level }, ...flattenTree(node.children, level + 1)])

export default function CostCentersPage() {
  const [companies, setCompanies] = useState<Tipo8BusinessUnit[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [tree, setTree] = useState<CostCenterNode[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [currentNode, setCurrentNode] = useState<CostCenterNode | null>(null)
  const [formData, setFormData] = useState({
    id_empresa: "",
    code: "",
    name: "",
    description: "",
    parent_id: "",
    is_active: true,
  })

  const flatNodes = useMemo(() => flattenTree(tree), [tree])

  const loadCompanies = useCallback(async () => {
    try {
      const response = await getTipo8BusinessUnits()
      setCompanies(response)
      if (response.length > 0) {
        setSelectedCompanyId(String(response[0].id_pessoa ?? response[0].id))
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error)
      customToast.error("Não foi possível carregar as empresas.")
    }
  }, [])

  const loadTree = useCallback(async (companyId: string) => {
    if (!companyId) {
      setTree([])
      return
    }

    setLoading(true)
    try {
      const response = await getCostCenters(Number(companyId))
      setTree(response)
      const nextExpanded: Record<number, boolean> = {}
      flattenTree(response).forEach((node) => {
        if (!node.parent_id) nextExpanded[node.id_cost_center] = true
      })
      setExpanded(nextExpanded)
    } catch (error) {
      console.error("Erro ao carregar centros de custo:", error)
      customToast.error("Não foi possível carregar os centros de custo.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCompanies()
  }, [loadCompanies])

  useEffect(() => {
    if (selectedCompanyId) {
      void loadTree(selectedCompanyId)
    }
  }, [loadTree, selectedCompanyId])

  const visibleNodes = useMemo(
    () =>
      flatNodes.filter((node) => {
        let parentId = node.parent_id
        while (parentId) {
          if (!expanded[parentId]) return false
          parentId = flatNodes.find((item) => item.id_cost_center === parentId)?.parent_id ?? null
        }
        return true
      }),
    [expanded, flatNodes]
  )

  const parentOptions = useMemo(
    () =>
      [
        { value: "", label: "Sem centro pai", description: "Raiz da estrutura" },
        ...flatNodes
          .filter((node) => node.id_cost_center !== currentNode?.id_cost_center)
          .map((node) => ({
            value: String(node.id_cost_center),
            label: `${node.code} - ${node.name}`,
            description: node.path,
          })),
      ],
    [currentNode?.id_cost_center, flatNodes]
  )

  const openCreate = () => {
    setCurrentNode(null)
    setFormData({
      id_empresa: selectedCompanyId,
      code: "",
      name: "",
      description: "",
      parent_id: "",
      is_active: true,
    })
    setIsModalOpen(true)
  }

  const openEdit = (node: CostCenterNode) => {
    setCurrentNode(node)
    setFormData({
      id_empresa: String(node.id_empresa),
      code: node.code,
      name: node.name,
      description: node.description ?? "",
      parent_id: node.parent_id ? String(node.parent_id) : "",
      is_active: node.is_active,
    })
    setIsModalOpen(true)
  }

  const save = async () => {
    if (!formData.id_empresa || !formData.code.trim() || !formData.name.trim()) {
      customToast.error("Empresa, código e nome são obrigatórios.")
      return
    }

    const payload = {
      id_empresa: Number(formData.id_empresa),
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      parent_id: formData.parent_id ? Number(formData.parent_id) : null,
      is_active: formData.is_active,
    }

    try {
      if (currentNode) {
        await updateCostCenter(currentNode.id_cost_center, payload)
      } else {
        await createCostCenter(payload)
      }
      setIsModalOpen(false)
      await loadTree(formData.id_empresa)
      customToast.success(`Centro de custo ${currentNode ? "atualizado" : "criado"} com sucesso.`)
    } catch (error) {
      console.error("Erro ao salvar centro de custo:", error)
      customToast.error("Não foi possível salvar o centro de custo.")
    }
  }

  const confirmDelete = async () => {
    if (!currentNode) return

    try {
      await deleteCostCenter(currentNode.id_cost_center)
      setIsDeleteOpen(false)
      await loadTree(selectedCompanyId)
      customToast.success("Centro de custo removido com sucesso.")
    } catch (error) {
      console.error("Erro ao remover centro de custo:", error)
      customToast.error("Não foi possível remover o centro de custo.")
    }
  }

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto py-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Centros de custo</CardTitle>
                <p className="text-sm text-slate-500">Estrutura hierárquica gerencial para rateio de lançamentos.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="min-w-80">
                  <SearchableSelect
                    value={selectedCompanyId}
                    onValueChange={setSelectedCompanyId}
                    placeholder="Selecione a empresa"
                    options={companies.map((company) => ({
                      value: String(company.id_pessoa ?? company.id),
                      label: company.apelido,
                      description: company.abreviatura,
                    }))}
                  />
                </div>
                <Button onClick={openCreate} disabled={!selectedCompanyId}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo centro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-500">Carregando centros de custo...</div>
              ) : visibleNodes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                  Nenhum centro de custo cadastrado para a empresa selecionada.
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleNodes.map((node) => {
                    const hasChildren = node.children.length > 0
                    const isExpanded = expanded[node.id_cost_center] ?? false

                    return (
                      <div key={node.id_cost_center} className="grid grid-cols-[minmax(0,1fr)_140px_120px_96px] items-center gap-3 rounded-lg border bg-white px-4 py-3 dark:bg-slate-900">
                        <div className="flex min-w-0 items-center gap-2" style={{ paddingLeft: node.level * 18 }}>
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => setExpanded((prev) => ({ ...prev, [node.id_cost_center]: !isExpanded }))}
                              className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : (
                            <span className="w-6" />
                          )}
                          <Building2 className={`h-4 w-4 ${node.is_analytic ? "text-emerald-600" : "text-blue-600"}`} />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-800 dark:text-slate-200">{node.code} - {node.name}</div>
                            <div className="truncate text-xs text-slate-500">{node.description || node.path}</div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">{node.is_analytic ? "Analítico" : "Sintético"}</div>
                        <div className={`text-sm font-medium ${node.is_active ? "text-emerald-600" : "text-slate-400"}`}>{node.is_active ? "Ativo" : "Inativo"}</div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(node)}>
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentNode(node)
                              setIsDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentNode ? "Editar centro de custo" : "Novo centro de custo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Empresa</Label>
              <SearchableSelect
                value={formData.id_empresa}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, id_empresa: value, parent_id: "" }))}
                options={companies.map((company) => ({
                  value: String(company.id_pessoa ?? company.id),
                  label: company.apelido,
                  description: company.abreviatura,
                }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código</Label>
                <Input value={formData.code} onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value }))} />
              </div>
              <div>
                <Label>Nome</Label>
                <Input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} />
            </div>
            <div>
              <Label>Centro pai</Label>
              <SearchableSelect
                value={formData.parent_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, parent_id: value }))}
                options={parentOptions}
                placeholder="Sem centro pai"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <div className="text-sm font-medium">Ativo</div>
                <div className="text-xs text-slate-500">Centros inativos não podem ser usados em lançamentos.</div>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir centro de custo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            Remover <strong>{currentNode?.code} - {currentNode?.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
