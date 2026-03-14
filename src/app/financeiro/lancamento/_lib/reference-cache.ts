"use client"

/**
 * Cache de sessão para dados de referência (pessoas, unidades, contas caixa, formas de pagamento).
 * Esses dados mudam raramente — armazenamos em memória para evitar re-fetches a cada busca.
 * O cache expira após 5 minutos ou quando a página é recarregada.
 */

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const store = new Map<string, CacheEntry<unknown>>()

function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() - entry.timestamp > CACHE_TTL_MS
}

export async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = store.get(key)
  if (existing && !isExpired(existing)) {
    return existing.data as T
  }
  const data = await fetcher()
  store.set(key, { data, timestamp: Date.now() })
  return data
}

export function invalidateCache(key?: string): void {
  if (key) {
    store.delete(key)
  } else {
    store.clear()
  }
}
