import type { CNPJResponse } from "@/types/types"

// URL base da API
const API_BASE_URL = "https://brasilapi.com.br/api/cnpj/v1/"

// Função para buscar dados de CNPJ
export const fetchCNPJData = async (cnpj: string): Promise<CNPJResponse | null> => {
  try {
    // Remover caracteres não numéricos do CNPJ
    const cleanCNPJ = cnpj.replace(/\D/g, "")

    if (cleanCNPJ.length !== 14) {
      throw new Error("CNPJ inválido. Deve conter 14 dígitos.")
    }

    const response = await fetch(`${API_BASE_URL}${cleanCNPJ}`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("CNPJ não encontrado.")
      }
      throw new Error(`Erro ao buscar CNPJ: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      cnpj: data.cnpj,
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia || "",
      email: data.email || "",
      telefone: data.ddd_telefone_1 || "",
      cep: data.cep || "",
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      municipio: data.municipio || "",
      uf: data.uf || "",
    }
  } catch (error) {
    console.error("Erro ao buscar dados do CNPJ:", error)
    throw error
  }
}

