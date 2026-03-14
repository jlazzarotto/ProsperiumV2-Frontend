export interface ModuloPermissao {
  ver: boolean
  criar_editar: boolean
  deletar: boolean
}

export type PermissoesModulo = Record<string, ModuloPermissao>
export type ModulosHabilitados = Record<string, boolean>

export interface ModuloDefinition {
  key: string
  label: string
  category: string
  categoryLabel: string
}

export interface OperadorWithPermissions {
  id: number
  email: string
  nome: string
  status: boolean
  roles: string[]
  invite_status: 'pendente' | 'expirado' | 'usado' | null
  convite_id: number | null
  permissoes_modulo: PermissoesModulo
  created_at: string
}

export const MODULOS: ModuloDefinition[] = [
  { key: 'admin.coordenar_unidades', label: 'Coordenar Unidades de Negocio', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'admin.permissoes', label: 'Permissoes', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'admin.logs', label: 'Logs de Auditoria', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'admin.importacao', label: 'Importacao de dados', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'configuracoes.contabilidade', label: 'Contabilidade', category: 'configuracoes', categoryLabel: 'Configuracoes' },
  { key: 'configuracoes.dre', label: 'Configurar DRE', category: 'configuracoes', categoryLabel: 'Configuracoes' },
  { key: 'cadastros.agencias_bancarias', label: 'Agencias bancarias', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.contas_caixa', label: 'Contas caixa', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.formas_pagamento', label: 'Formas de pagamento', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.navios', label: 'Navios', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.operacoes', label: 'Operacoes', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.pessoas', label: 'Pessoas', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.portos', label: 'Portos', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.cartoes', label: 'Cartoes', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'financeiro.novo_lancamento', label: 'Novo lancamento', category: 'financeiro', categoryLabel: 'Financeiro' },
  { key: 'financeiro.transferencia', label: 'Transf. entre contas', category: 'financeiro', categoryLabel: 'Financeiro' },
  { key: 'financeiro.custeio', label: 'Custeio', category: 'financeiro', categoryLabel: 'Financeiro' },
  { key: 'relatorios.dre', label: 'DRE', category: 'relatorios', categoryLabel: 'Relatorios' },
  { key: 'relatorios.resultado_navio', label: 'Resultado por Navio', category: 'relatorios', categoryLabel: 'Relatorios' },
  { key: 'relatorios.custeio', label: 'Relatorio de Custeio', category: 'relatorios', categoryLabel: 'Relatorios' },
  { key: 'relatorios.movimento_contabilidade', label: 'Movimento Contabilidade', category: 'relatorios', categoryLabel: 'Relatorios' },
  { key: 'asaas.boletos', label: 'Boletos e Cobrancas', category: 'asaas', categoryLabel: 'Asaas' },
  { key: 'asaas.notas_fiscais', label: 'Notas Fiscais', category: 'asaas', categoryLabel: 'Asaas' },
  { key: 'asaas.configuracao', label: 'Configuracao', category: 'asaas', categoryLabel: 'Asaas' },
]

export const MODULOS_BY_CATEGORY = MODULOS.reduce((acc, modulo) => {
  if (!acc[modulo.category]) {
    acc[modulo.category] = {
      label: modulo.categoryLabel,
      modulos: [],
    }
  }
  acc[modulo.category].modulos.push(modulo)
  return acc
}, {} as Record<string, { label: string; modulos: ModuloDefinition[] }>)

const ROUTE_MODULO_RULES: Array<{ path: string; modulo: string; exact?: boolean }> = [
  { path: '/admin/coordenar-empresas', modulo: 'admin.coordenar_unidades', exact: true },
  { path: '/admin/coordenar-unidades', modulo: 'admin.coordenar_unidades', exact: true },
  { path: '/admin/parametrizacao-sistema', modulo: 'admin.coordenar_unidades', exact: true },
  { path: '/admin/permissoes', modulo: 'admin.permissoes', exact: true },
  { path: '/admin/logs', modulo: 'admin.logs', exact: true },
  { path: '/admin/importacao', modulo: 'admin.importacao', exact: true },
  { path: '/contabeis/dre/configuracao', modulo: 'configuracoes.dre', exact: true },
  { path: '/contabilidade', modulo: 'configuracoes.contabilidade', exact: true },
  { path: '/cadastros/agencias-bancarias', modulo: 'cadastros.agencias_bancarias', exact: true },
  { path: '/cadastros/contas-caixa', modulo: 'cadastros.contas_caixa', exact: true },
  { path: '/cadastros/formas-pagamento', modulo: 'cadastros.formas_pagamento', exact: true },
  { path: '/cadastros/navios', modulo: 'cadastros.navios', exact: true },
  { path: '/cadastros/operacoes', modulo: 'cadastros.operacoes', exact: true },
  { path: '/cadastros/pessoas', modulo: 'cadastros.pessoas', exact: true },
  { path: '/cadastros/portos', modulo: 'cadastros.portos', exact: true },
  { path: '/cadastros/cartoes', modulo: 'cadastros.cartoes', exact: true },
  { path: '/financeiro/lancamento', modulo: 'financeiro.novo_lancamento', exact: true },
  { path: '/financeiro/transferencia', modulo: 'financeiro.transferencia', exact: true },
  { path: '/financeiro/cartao', modulo: 'cadastros.cartoes', exact: true },
  { path: '/contabeis/dre', modulo: 'relatorios.dre', exact: true },
  { path: '/relatorios/resultado-navio', modulo: 'relatorios.resultado_navio', exact: true },
  { path: '/relatorios/custeio', modulo: 'relatorios.custeio', exact: true },
  { path: '/movimento/contabilidade', modulo: 'relatorios.movimento_contabilidade', exact: true },
  { path: '/asaas/boletos', modulo: 'asaas.boletos', exact: true },
  { path: '/asaas/notas-fiscais', modulo: 'asaas.notas_fiscais', exact: true },
  { path: '/asaas/configuracao', modulo: 'asaas.configuracao', exact: true },
]

export function getModuloByPath(pathname: string): string | null {
  const match = ROUTE_MODULO_RULES.find((rule) =>
    rule.exact ? pathname === rule.path : pathname.startsWith(rule.path)
  )

  return match?.modulo ?? null
}
