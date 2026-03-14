/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Bank } from "@/types/types"
import { httpClient } from "@/lib/http-client"

// Cache para armazenar os bancos já buscados da API
let banksCache: Bank[] = []

// Função para limpar o cache (útil após atualizações)
export const clearBanksCache = () => {
  banksCache = []
}

interface ApiBanco {
  id_banco: number
  nome: string
  cod: number
  site: string
  status: boolean
  created_at: string
  updated_at: string
}

interface ApiBancosResponse {
  data: ApiBanco[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Função para buscar bancos da API do backend
export const fetchBanksFromAPI = async (): Promise<Bank[]> => {
  try {
    if (banksCache.length > 0) {
      return banksCache
    }

    // Buscar todos os bancos
    const response = await httpClient.get<ApiBancosResponse>("/bancos")

    // httpClient.get já retorna os dados parsed, então response É a ApiBancosResponse
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Resposta vazia ou inválida da API de bancos")
    }

    // Converte os dados para nosso formato e ordena por nome
    const banks: Bank[] = response.data
      .filter((bank: ApiBanco) => bank.status) // Apenas bancos ativos
      .map((bank: ApiBanco) => ({
        id: String(bank.id_banco), // id_banco do banco
        code: String(bank.cod), // código BACEN do banco
        name: bank.nome,
        fullName: bank.nome,
        ispb: "", // API não fornece ISPB
      }))
      .sort((a: Bank, b: Bank) => a.name.localeCompare(b.name))

    // Reordenar por nome
    banks.sort((a: Bank, b: Bank) => a.name.localeCompare(b.name))

    // Armazena em cache para futuras requisições
    banksCache = banks

    console.log(`Carregados ${banks.length} bancos com sucesso`)
    return banks
  } catch (error) {
    console.error("Erro ao buscar bancos:", error)
    // Retorna um array vazio em caso de erro
    return []
  }
}

// Função para buscar países (para bandeiras de navios)
export const fetchCountries = async (): Promise<{ code: string; name: string }[]> => {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2")

    if (!response.ok) {
      throw new Error(`Erro ao buscar países: ${response.status}`)
    }

    const data = await response.json()

    // Converte os dados para nosso formato e ordena por nome
    return data
      .map((country: any) => ({
        code: country.cca2,
        name: country.name.common,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error("Erro ao buscar países:", error)

    // Retorna alguns países comuns em caso de erro
    return [
      { code: "BR", name: "Brasil" },
      { code: "US", name: "Estados Unidos" },
      { code: "CN", name: "China" },
      { code: "JP", name: "Japão" },
      { code: "PA", name: "Panamá" },
      { code: "LR", name: "Libéria" },
      { code: "MH", name: "Ilhas Marshall" },
      { code: "HK", name: "Hong Kong" },
      { code: "SG", name: "Singapura" },
      { code: "MT", name: "Malta" },
    ]
  }
}

