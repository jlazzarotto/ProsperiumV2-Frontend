import { User } from '@/app/services/auth-service'

/**
 * Obter o company_id efetivo do user
 * - Se ROLE_ADMIN: retorna user.companyId
 * - Se ROLE_ROOT: retorna company selecionado em sessionStorage (ou null se não selecionado)
 */
export function getEffectiveCompanyId(user: User | null): number | null {
  if (!user) return null

  const isRoot = user.roles?.includes('ROLE_ROOT')

  // ROLE_ADMIN: usar company_id padrão
  if (!isRoot && user.companyId) {
    return user.companyId
  }

  // ROLE_ROOT: buscar do sessionStorage
  if (isRoot && typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem('prosperium_selected_company_id')
    return stored ? parseInt(stored, 10) : null
  }

  return null
}

/**
 * Verificar se user tem company selecionado
 */
export function hasCompanySelected(user: User | null): boolean {
  return getEffectiveCompanyId(user) !== null
}
