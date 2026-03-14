/**
 * Máscaras para formatação de campos de entrada
 */

/**
 * Máscara para número de agência bancária
 * Permite dígitos e hífen, limita a 10 caracteres (VARCHAR(10) no banco)
 */
export const maskBankAgencyNumber = (value: string | undefined | null): string => {
  if (!value) return ''
  const cleaned = String(value).replace(/[^0-9-]/g, '')
  return cleaned.slice(0, 10)
}

/**
 * Remove máscara de número de agência bancária
 * Retorna apenas números
 */
export const unmaskBankAgencyNumber = (value: string | undefined | null): string => {
  if (!value) return ''
  return String(value).replace(/\D/g, '')
}

/**
 * Máscara para número de conta bancária (formato: 00000000-0)
 * Remove todos os caracteres não numéricos, adiciona hífen antes do dígito
 */
export const maskBankAccountNumber = (value: string | undefined | null): string => {
  if (!value) return ''
  const cleaned = String(value).replace(/\D/g, '')

  if (cleaned.length <= 8) {
    return cleaned
  }

  return `${cleaned.slice(0, 8)}-${cleaned.slice(8, 9)}`
}

/**
 * Remove máscara de número de conta bancária
 * Retorna apenas números
 */
export const unmaskBankAccountNumber = (value: string | undefined | null): string => {
  if (!value) return ''
  return String(value).replace(/\D/g, '')
}

/**
 * Máscara genérica para remover todos os caracteres não numéricos
 */
export const unmaskNumbers = (value: string | undefined | null): string => {
  if (!value) return ''
  return String(value).replace(/\D/g, '')
}

/**
 * Máscara para valor monetário (formato: 1.234,56)
 */
export const maskMoney = (value: string | undefined | null): string => {
  if (!value) return '0,00'
  const cleaned = String(value).replace(/\D/g, '')
  const amount = parseFloat(cleaned) / 100

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Remove máscara de valor monetário e retorna número
 */
export const unmaskMoney = (value: string | undefined | null): number => {
  if (!value) return 0
  const cleaned = String(value).replace(/\D/g, '')
  return parseFloat(cleaned) / 100
}

/**
 * Máscara para CPF (formato: 000.000.000-00)
 */
export const maskCPF = (value: string | undefined | null): string => {
  if (!value) return ''
  // Preservar zeros à esquerda convertendo para string explicitamente
  const cleaned = String(value).replace(/\D/g, '').slice(0, 11)

  if (cleaned.length <= 3) return cleaned
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`
}

/**
 * Máscara para CNPJ (formato: 00.000.000/0000-00)
 */
export const maskCNPJ = (value: string | undefined | null): string => {
  if (!value) return ''
  const cleaned = String(value).replace(/\D/g, '')

  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`
}

/**
 * Máscara para CEP (formato: 00000-000)
 */
export const maskCEP = (value: string | undefined | null): string => {
  if (!value) return ''
  const cleaned = String(value).replace(/\D/g, '')

  if (cleaned.length <= 5) return cleaned
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`
}

/**
 * Máscara para telefone (formato: (00) 0000-0000 ou (00) 00000-0000)
 */
export const maskPhone = (value: string | undefined | null): string => {
  if (!value) return ''
  const cleaned = String(value).replace(/\D/g, '')

  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
}

/**
 * Remove todos os caracteres especiais, mantendo apenas números e letras
 */
export const unmaskAlphanumeric = (value: string | undefined | null): string => {
  if (!value) return ''
  return String(value).replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Máscara dinâmica para CPF ou CNPJ
 * Detecta automaticamente baseado no comprimento
 */
export const maskCPFOrCNPJ = (value: string | undefined | null): string => {
  if (!value) return ''
  // Preservar zeros à esquerda convertendo para string explicitamente
  const cleaned = String(value).replace(/\D/g, '')

  if (cleaned.length <= 11) {
    return maskCPF(cleaned)
  }
  return maskCNPJ(cleaned)
}

/**
 * Remove máscara de CPF/CNPJ
 */
export const unmaskCPFOrCNPJ = (value: string | undefined | null): string => {
  if (!value) return ''
  return String(value).replace(/\D/g, '')
}

/**
 * Valida CPF
 */
export const validateCPF = (cpf: string): boolean => {
  if (!cpf) return true // Opcional
  
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length !== 11) return false
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false
  
  // Calcular o primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit === 10 || digit === 11) digit = 0
  if (digit !== parseInt(cleaned.charAt(9))) return false
  
  // Calcular o segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit === 10 || digit === 11) digit = 0
  if (digit !== parseInt(cleaned.charAt(10))) return false
  
  return true
}

/**
 * Valida CNPJ
 */
export const validateCNPJ = (cnpj: string): boolean => {
  if (!cnpj) return true // Opcional
  
  const cleaned = cnpj.replace(/\D/g, '')
  
  if (cleaned.length !== 14) return false
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false
  
  // Calcular o primeiro dígito verificador
  let sum = 0
  let weight = 2
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleaned.charAt(12))) return false
  
  // Calcular o segundo dígito verificador
  sum = 0
  weight = 2
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleaned.charAt(13))) return false
  
  return true
}

/**
 * Valida CPF ou CNPJ dinamicamente
 */
export const validateCPFOrCNPJ = (value: string): boolean => {
  if (!value) return true // Opcional
  
  const cleaned = value.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return validateCPF(value)
  } else if (cleaned.length === 14) {
    return validateCNPJ(value)
  }
  
  return false
}
