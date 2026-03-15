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

export const MODULOS: ModuloDefinition[] = [
  { key: 'admin.coordenar_empresas', label: 'Coordenar Empresas', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'admin.coordenar_unidades', label: 'Coordenar Unidades', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'admin.parametrizacao_sistema', label: 'Parametrizacao do Sistema', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'admin.permissoes', label: 'Permissoes', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'admin.logs_auditoria', label: 'Logs de Auditoria', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'admin.importacao_dados', label: 'Importacao de Dados', category: 'admin', categoryLabel: 'Administrador' },
  { key: 'config.contabilidade', label: 'Contabilidade', category: 'configuracoes', categoryLabel: 'Configuracoes' },
  { key: 'config.dre', label: 'Configurar DRE', category: 'configuracoes', categoryLabel: 'Configuracoes' },
  { key: 'config.centro_custo', label: 'Centro de Custo', category: 'configuracoes', categoryLabel: 'Configuracoes' },
  { key: 'cadastros.agencias_bancarias', label: 'Agencia Bancaria', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.contas_caixa', label: 'Contas Caixa', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.formas_pagamento', label: 'Forma de Pagamento', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'cadastros.pessoas', label: 'Pessoa', category: 'cadastros', categoryLabel: 'Cadastros' },
  { key: 'financeiro.dashboard', label: 'Dashboard', category: 'financeiro', categoryLabel: 'Financeiro' },
  { key: 'financeiro.visao_inicial', label: 'Visao Inicial', category: 'financeiro', categoryLabel: 'Financeiro' },
  { key: 'financeiro.lancamentos', label: 'Lancamentos', category: 'financeiro', categoryLabel: 'Financeiro' },
  { key: 'financeiro.transferencias', label: 'Transferencias entre Contas', category: 'financeiro', categoryLabel: 'Financeiro' },
  { key: 'financeiro.cartoes_credito', label: 'Cartoes de Credito', category: 'financeiro', categoryLabel: 'Financeiro' },
  { key: 'relatorios.dre', label: 'DRE', category: 'relatorios', categoryLabel: 'Relatorios' },
  { key: 'relatorios.movimento_contabilidade', label: 'Movimento Contabilidade', category: 'relatorios', categoryLabel: 'Relatorios' },
  { key: 'relatorios.fluxo_caixa', label: 'Fluxo de Caixa', category: 'relatorios', categoryLabel: 'Relatorios' },
  { key: 'asaas.cobrancas', label: 'Boletos e Cobrancas', category: 'asaas', categoryLabel: 'Asaas' },
  { key: 'asaas.notas_fiscais', label: 'Notas Fiscais', category: 'asaas', categoryLabel: 'Asaas' },
  { key: 'asaas.configuracoes', label: 'Configuracoes Asaas', category: 'asaas', categoryLabel: 'Asaas' },
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
  { path: '/admin/coordenar-empresas', modulo: 'admin.coordenar_empresas', exact: true },
  { path: '/admin/coordenar-unidades', modulo: 'admin.coordenar_unidades', exact: true },
  { path: '/admin/parametrizacao-sistema', modulo: 'admin.parametrizacao_sistema', exact: true },
  { path: '/admin/permissoes', modulo: 'admin.permissoes', exact: true },
  { path: '/cadastros/usuarios', modulo: 'admin.permissoes', exact: true },
  { path: '/admin/logs', modulo: 'admin.logs_auditoria', exact: true },
  { path: '/admin/importacao-dados', modulo: 'admin.importacao_dados', exact: true },
  { path: '/configuracoes/contabilidade', modulo: 'config.contabilidade', exact: true },
  { path: '/configuracoes/dre', modulo: 'config.dre', exact: true },
  { path: '/configuracoes/centro-custo', modulo: 'config.centro_custo', exact: true },
  { path: '/cadastros/agencias-bancarias', modulo: 'cadastros.agencias_bancarias', exact: true },
  { path: '/cadastros/contas-caixa', modulo: 'cadastros.contas_caixa', exact: true },
  { path: '/cadastros/formas-pagamento', modulo: 'cadastros.formas_pagamento', exact: true },
  { path: '/cadastros/pessoas', modulo: 'cadastros.pessoas', exact: true },
  { path: '/', modulo: 'financeiro.dashboard', exact: true },
  { path: '/financeiro', modulo: 'financeiro.visao_inicial', exact: true },
  { path: '/financeiro/lancamentos', modulo: 'financeiro.lancamentos', exact: true },
  { path: '/financeiro/transferencias', modulo: 'financeiro.transferencias', exact: true },
  { path: '/financeiro/cartoes-credito', modulo: 'financeiro.cartoes_credito', exact: true },
  { path: '/relatorios/dre', modulo: 'relatorios.dre', exact: true },
  { path: '/relatorios/movimento-contabilidade', modulo: 'relatorios.movimento_contabilidade', exact: true },
  { path: '/relatorios/fluxo-caixa', modulo: 'relatorios.fluxo_caixa', exact: true },
  { path: '/asaas/cobrancas', modulo: 'asaas.cobrancas', exact: true },
  { path: '/asaas/notas-fiscais', modulo: 'asaas.notas_fiscais', exact: true },
  { path: '/asaas/configuracoes', modulo: 'asaas.configuracoes', exact: true },
]

export function getModuloByPath(pathname: string): string | null {
  const match = ROUTE_MODULO_RULES.find((rule) =>
    rule.exact ? pathname === rule.path : pathname.startsWith(rule.path)
  )

  return match?.modulo ?? null
}
