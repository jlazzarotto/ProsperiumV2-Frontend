"use client"

import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ArrowLeftRight,
  BadgeDollarSign,
  BookOpenText,
  Building,
  Building2,
  ChartColumn,
  ChartNoAxesCombined,
  CreditCard,
  DatabaseZap,
  FileText,
  Landmark,
  LayoutGrid,
  LineChart,
  PanelTop,
  Receipt,
  ScrollText,
  Settings2,
  Shield,
  SlidersHorizontal,
  Users,
  Wallet,
  Waypoints,
} from "lucide-react"
import type { NavigationCategory } from "@/types/navigation"

const iconMap: Record<string, LucideIcon> = {
  activity: Activity,
  "arrow-left-right": ArrowLeftRight,
  "badge-dollar-sign": BadgeDollarSign,
  "book-open-text": BookOpenText,
  building: Building,
  "building-2": Building2,
  "chart-column": ChartColumn,
  "chart-no-axes-combined": ChartNoAxesCombined,
  "credit-card": CreditCard,
  "database-zap": DatabaseZap,
  "file-text": FileText,
  landmark: Landmark,
  "layout-grid": LayoutGrid,
  "line-chart": LineChart,
  "panel-top": PanelTop,
  receipt: Receipt,
  "scroll-text": ScrollText,
  "settings-2": Settings2,
  shield: Shield,
  "sliders-horizontal": SlidersHorizontal,
  users: Users,
  wallet: Wallet,
  waypoints: Waypoints,
}

export const DEFAULT_NAVIGATION: NavigationCategory[] = [
  {
    code: "admin",
    label: "Administrador",
    items: [
      { label: "Coordenar Empresas", href: "/admin/coordenar-empresas", iconKey: "building-2", permissionKey: "admin.coordenar_empresas" },
      { label: "Coordenar Unidades", href: "/admin/coordenar-unidades", iconKey: "building", permissionKey: "admin.coordenar_unidades" },
      { label: "Parametrização do sistema", href: "/admin/parametrizacao-sistema", iconKey: "sliders-horizontal", permissionKey: "admin.parametrizacao_sistema" },
      // { label: "Permissões", href: "/admin/permissoes", iconKey: "shield", permissionKey: "admin.permissoes" },
      // { label: "Logs de Auditoria", href: "/admin/logs", iconKey: "activity", permissionKey: "admin.logs_auditoria" },
      // { label: "Porto Sem Papel (PSP)", href: "/admin/importacao-dados", iconKey: "database-zap", permissionKey: "admin.importacao_dados" },
    ],
  },
  {
    code: "configuracoes",
    label: "Configurações",
    items: [
      { label: "Contabilidade", href: "/configuracoes/contabilidade", iconKey: "book-open-text", permissionKey: "config.contabilidade" },
      { label: "Configurar DRE", href: "/configuracoes/dre", iconKey: "line-chart", permissionKey: "config.dre" },
      { label: "Centro de Custo", href: "/configuracoes/centro-custo", iconKey: "waypoints", permissionKey: "config.centro_custo" },
    ],
  },
  {
    code: "cadastros",
    label: "Cadastros",
    items: [
      { label: "Contas Financeiras", href: "/cadastros/contas-financeiras", iconKey: "wallet", permissionKey: "cadastros.contas_financeiras" },
      { label: "Forma de Pagamento", href: "/cadastros/formas-pagamento", iconKey: "credit-card", permissionKey: "cadastros.formas_pagamento" },
      { label: "Pessoa", href: "/cadastros/pessoas", iconKey: "users", permissionKey: "cadastros.pessoas" },
    ],
  },
  {
    code: "financeiro",
    label: "Financeiro",
    items: [
      { label: "Dashboard", href: "/", iconKey: "layout-grid", permissionKey: "financeiro.dashboard" },
      { label: "Visão inicial", href: "/financeiro", iconKey: "panel-top", permissionKey: "financeiro.visao_inicial" },
      { label: "Lançamentos", href: "/financeiro/lancamentos", iconKey: "receipt", permissionKey: "financeiro.lancamentos" },
      { label: "Transf. entre contas", href: "/financeiro/transferencias", iconKey: "arrow-left-right", permissionKey: "financeiro.transferencias" },
      { label: "Cartões de Crédito", href: "/financeiro/cartoes-credito", iconKey: "credit-card", permissionKey: "financeiro.cartoes_credito" },
    ],
  },
  {
    code: "relatorios",
    label: "Relatórios",
    items: [
      { label: "DRE", href: "/relatorios/dre", iconKey: "chart-column", permissionKey: "relatorios.dre" },
      { label: "Movimento contabilidade", href: "/relatorios/movimento-contabilidade", iconKey: "scroll-text", permissionKey: "relatorios.movimento_contabilidade" },
      { label: "Fluxo de caixa", href: "/relatorios/fluxo-caixa", iconKey: "chart-no-axes-combined", permissionKey: "relatorios.fluxo_caixa" },
    ],
  },
  {
    code: "asaas",
    label: "Asaas",
    items: [
      { label: "Boletos e Cobranças", href: "/asaas/cobrancas", iconKey: "badge-dollar-sign", permissionKey: "asaas.cobrancas" },
      { label: "Notas Fiscais", href: "/asaas/notas-fiscais", iconKey: "file-text", permissionKey: "asaas.notas_fiscais" },
      { label: "Configurações", href: "/asaas/configuracoes", iconKey: "settings-2", permissionKey: "asaas.configuracoes" },
    ],
  },
]

export function getNavigationCatalog(menu?: NavigationCategory[]): NavigationCategory[] {
  return menu && menu.length > 0 ? menu : DEFAULT_NAVIGATION
}

export function resolveNavigationIcon(iconKey?: string | null, fallback: LucideIcon = LayoutGrid): LucideIcon {
  if (!iconKey) {
    return fallback
  }

  return iconMap[iconKey] ?? fallback
}
