"use client"

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Hook personalizado para monitorar mudanças nos parâmetros da URL
 * e forçar requisições quando os filtros mudarem
 */
export function useUrlParamsWatcher(onParamsChange: (params: URLSearchParams) => void) {
  const searchParams = useSearchParams()
  const previousParamsRef = useRef<string>('')

  useEffect(() => {
    const currentParamsString = searchParams.toString()
    const previousParamsString = previousParamsRef.current

    // Se os parâmetros mudaram, dispara a função callback
    if (currentParamsString !== previousParamsString) {
      console.log('🔄 [URL Watcher] Parâmetros da URL mudaram!')
      console.log('🔄 [URL Watcher] Anterior:', previousParamsString)
      console.log('🔄 [URL Watcher] Atual:', currentParamsString)
      
      // Disparar callback com os novos parâmetros
      onParamsChange(searchParams)
      
      // Atualizar referência
      previousParamsRef.current = currentParamsString
    }
  }, [searchParams, onParamsChange])

  return searchParams
}