import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/app/contexts/auth-context'
import { getSelectedCompanyId } from './use-company-required'

/**
 * Hook que gerencia o estado de seleção de company
 *
 * IMPORTANTE: O modal NÃO abre automaticamente na home page.
 * Ele abre apenas quando:
 * 1. Um erro HTTP 400 "grupo econômico" é disparado (user tenta acessar rota tenant)
 * 2. Explicitamente via openModal()
 *
 * Tracking:
 * - companySelected: indica se tem company_id selecionado
 * - showModal: controla visibilidade do seletor
 */
export function useCompanySelector() {
  const { user, isRoot } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [companySelected, setCompanySelected] = useState(false)

  // Verificar estado de company selection (sem abrir modal automaticamente)
  useEffect(() => {
    if (!user) {
      setCompanySelected(false)
      return
    }

    // Se não é ROLE_ROOT, sempre tem company selecionado
    if (!isRoot) {
      setCompanySelected(true)
      return
    }

    // ROLE_ROOT: verificar sessionStorage
    const selectedId = getSelectedCompanyId()
    setCompanySelected(!!selectedId)
  }, [user, isRoot])

  // Escutar por eventos que requerem seleção de company (disparados pelo http-client)
  // Modal abre aqui quando user tenta acessar rota tenant sem company_id
  useEffect(() => {
    const handleRequireCompanySelection = (event: Event) => {
      if (event instanceof CustomEvent) {
        setShowModal(true)
      }
    }

    window.addEventListener('require-company-selection', handleRequireCompanySelection)
    return () => {
      window.removeEventListener('require-company-selection', handleRequireCompanySelection)
    }
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const openModal = useCallback(() => {
    setShowModal(true)
  }, [])

  return {
    companySelected,
    showModal,
    closeModal,
    openModal,
  }
}
