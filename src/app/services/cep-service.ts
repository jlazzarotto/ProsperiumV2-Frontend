/**
 * Serviço de integração com API ViaCEP
 * https://viacep.com.br/
 */

export interface CEPData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

export interface CEPError {
  erro: boolean
}

/**
 * Busca dados de endereço através do CEP usando a API ViaCEP
 * @param cep CEP a ser consultado (com ou sem máscara)
 * @returns Dados do endereço ou null se não encontrado
 */
export const fetchCEPData = async (cep: string): Promise<CEPData | null> => {
  try {
    // Remove caracteres não numéricos do CEP
    const cleanCEP = cep.replace(/\D/g, '')

    // Valida se o CEP tem 8 dígitos
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos')
    }

    // Faz a requisição para a API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)

    if (!response.ok) {
      throw new Error('Erro ao buscar CEP')
    }

    const data: CEPData | CEPError = await response.json()

    // Verifica se a API retornou erro
    if ('erro' in data && data.erro) {
      return null
    }

    return data as CEPData
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    throw error
  }
}

/**
 * Valida se um CEP é válido (formato e existência)
 * @param cep CEP a ser validado
 * @returns true se o CEP é válido
 */
export const validateCEP = async (cep: string): Promise<boolean> => {
  try {
    const data = await fetchCEPData(cep)
    return data !== null
  } catch {
    return false
  }
}

/**
 * Busca CEP de forma otimista (não lança erros)
 * @param cep CEP a ser consultado
 * @returns Dados do endereço ou null em caso de erro
 */
export const fetchCEPDataSafe = async (cep: string): Promise<CEPData | null> => {
  try {
    return await fetchCEPData(cep)
  } catch {
    return null
  }
}
