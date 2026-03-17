import { useAuth } from '@/app/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Hook que garante que o user tem um company_id selecionado
 * Se não tiver, redireciona para seletor de company
 * Retorna true quando company está disponível
 */
export function useCompanyRequired(): boolean {
  const { user, isRoot } = useAuth()
  const [companySelected, setCompanySelected] = useState(false)

  useEffect(() => {
    if (!user) return

    // Se não é ROLE_ROOT, sempre tem company_id
    if (!isRoot) {
      setCompanySelected(true)
      return
    }

    // ROLE_ROOT: verificar se tem company selecionado
    const selectedCompanyId = getSelectedCompanyId()
    if (selectedCompanyId) {
      setCompanySelected(true)
    }
  }, [user, isRoot])

  return companySelected
}

/**
 * Obter company_id selecionado do sessionStorage
 */
export function getSelectedCompanyId(): number | null {
  if (typeof sessionStorage === 'undefined') return null
  const stored = sessionStorage.getItem('prosperium_selected_company_id')
  return stored ? parseInt(stored, 10) : null
}

/**
 * Salvar company_id no sessionStorage
 */
export function setSelectedCompanyId(companyId: number): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem('prosperium_selected_company_id', String(companyId))
}

/**
 * Limpar company_id selecionado
 */
export function clearSelectedCompanyId(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem('prosperium_selected_company_id')
}
