import { httpClient } from "@/lib/http-client"
import { GlobalToastHttpClient } from "@/lib/global-toast"
import type { ApiPerson, ApiPersonListResponse, CreatePersonDto, UpdatePersonDto } from "@/types/api"
import type { Person, RegistrationType } from "@/types/types"
import { authService } from "./auth-service"

/**
 * Mapa de tipos de cadastro
 */
const REGISTRATION_TYPE_MAP: Record<RegistrationType, number> = {
  Cliente: 2,
  Fornecedor: 3,
  Colaborador: 4,
  Supervisor: 5,
  Coordenador: 6,
  Gerente: 7,
  Diretor: 8,
  Admin: 9,
}

const REGISTRATION_TYPE_REVERSE_MAP: Record<number, RegistrationType> = {
  2: "Cliente",
  3: "Fornecedor",
  4: "Colaborador",
  5: "Supervisor",
  6: "Coordenador",
  7: "Gerente",
  8: "Diretor",
  9: "Admin",
}

/**
 * Converte dados da API para o formato interno da aplicação
 */
const mapApiToPerson = (apiPerson: ApiPerson): Person => {
  // Determinar o tipo de pessoa com base no documento
  let personType: "pf" | "pj" = "pj"
  if (apiPerson.cnpj_cpf) {
    // Remove caracteres não numéricos
    const cleanDoc = apiPerson.cnpj_cpf.replace(/\D/g, "")
    personType = cleanDoc.length === 11 ? "pf" : "pj"
  }

  return {
    id: String(apiPerson.id_pessoa),
    code: String(apiPerson.id_pessoa),
    personType,
    registrationType: REGISTRATION_TYPE_REVERSE_MAP[apiPerson.id_tipo_cadastro] || "Cliente",
    name: apiPerson.nome,
    email: apiPerson.email || "",
    abbreviation: apiPerson.abreviatura || "",
    documentId: apiPerson.cnpj_cpf || "",
    stateRegistration: apiPerson.inscricao_estadual_rg || "",
    municipalRegistration: apiPerson.inscricao_municipal || "",
    postalCode: apiPerson.cep || "",
    city: apiPerson.cidade || "",
    cityId: apiPerson.id_municipio || undefined,
    state: apiPerson.uf || "",
    street: apiPerson.logradouro || "",
    number: apiPerson.numero || "",
    complement: apiPerson.complemento || "",
    neighborhood: apiPerson.bairro || "",
    businessUnitId: "",
    businessUnits: [],
    createdAt: new Date(apiPerson.created_at),
    updatedAt: new Date(apiPerson.updated_at),
  }
}

/**
 * Converte dados internos para o formato da API
 */
const mapPersonToApi = (person: Omit<Person, "id" | "createdAt" | "updatedAt">): CreatePersonDto => {
  return {
    nome: person.name,
    email: person.email || undefined,
    abreviatura: person.abbreviation || undefined,
    id_tipo_pessoa: person.personType === "pf" ? 1 : 2,
    cnpj_cpf: person.documentId || undefined,
    inscricao_estadual_rg: person.stateRegistration || undefined,
    inscricao_municipal: person.municipalRegistration || undefined,
    cep: person.postalCode || undefined,
    cidade: person.city || undefined,
    id_municipio: person.cityId || undefined,
    uf: person.state || undefined,
    logradouro: person.street || undefined,
    numero: person.number || undefined,
    complemento: person.complement || undefined,
    bairro: person.neighborhood || undefined,
    id_tipo_cadastro: REGISTRATION_TYPE_MAP[person.registrationType],
    regime_tributario: undefined, // Não temos esse campo no formulário
    status: true,
  }
}


/**
 * Busca todas as pessoas com paginação
 */
export const getAllPeople = async (
  page: number = 1,
  perPage?: number
): Promise<Person[]> => {
  try {
    // Se perPage não for passado, usa limit= (sem valor) para puxar todos
    const url = perPage ? `/pessoas?page=${page}&per_page=${perPage}` : `/pessoas?limit=`
    const response = await httpClient.get<ApiPersonListResponse>(url)
    
    // Mapear pessoas diretamente - a API já inclui cidade e UF via município
    const people = response.data.map(mapApiToPerson)
    
    return people
  } catch (error) {
    console.error("Erro ao obter pessoas:", error)
    throw error
  }
}

/**
 * Busca pessoa por ID
 */
export const getPersonById = async (id: string): Promise<Person | null> => {
  try {
    const response = await httpClient.get<ApiPerson>(`/pessoas/${id}`)
    // A resposta já é um objeto ApiPerson diretamente, não está dentro de { data }
    return mapApiToPerson(response)
  } catch (error) {
    console.error("Erro ao obter pessoa:", error)
    throw error
  }
}

/**
 * Adiciona uma nova pessoa
 */
export const addPerson = async (person: Omit<Person, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const dto = mapPersonToApi(person)
    console.log("[addPerson] Enviando:", dto)
    const response = await httpClient.post<ApiPerson>("/pessoas", dto)
    console.log("[addPerson] Resposta recebida:", response)

    // A API pode retornar diretamente o objeto ou dentro de { data }
    const personData = (response as unknown as Record<string, unknown>).data || response
    return String((personData as ApiPerson).id_pessoa)
  } catch (error: unknown) {
    console.error("Erro ao adicionar pessoa:", error)
    
    // Extrair mensagem de erro da API
    let errorMessage = 'Erro ao criar pessoa.'
    
    // @ts-ignore - Temporariamente ignorar erro de tipagem
    if (error?.response?.data?.error) {
      // Erro da API com mensagem específica
      // @ts-ignore
      errorMessage = error.response.data.error
    // @ts-ignore
    } else if (error?.response?.data?.message) {
      // Formato alternativo da mensagem
      // @ts-ignore
      errorMessage = error.response.data.message
    // @ts-ignore
    } else if (error?.message) {
      // Erro genérico
      // @ts-ignore
      errorMessage = error.message
    }
    
    console.log("[addPerson] Mensagem de erro extraída:", errorMessage)
    throw new Error(errorMessage)
  }
}

/**
 * Atualiza uma pessoa existente
 */
export const updatePerson = async (
  id: string,
  person: Partial<Omit<Person, "id" | "createdAt" | "updatedAt">>
): Promise<void> => {
  try {
    const dto: UpdatePersonDto = {}

    // Incluir campos se estão definidos (permitir strings vazias para limpar campos)
    if (person.name !== undefined) dto.nome = person.name
    if (person.email !== undefined) dto.email = person.email || undefined
    if (person.abbreviation !== undefined) dto.abreviatura = person.abbreviation || undefined
    if (person.personType !== undefined) dto.id_tipo_pessoa = person.personType === "pf" ? 1 : 2
    if (person.documentId !== undefined) dto.cnpj_cpf = person.documentId
    if (person.stateRegistration !== undefined) dto.inscricao_estadual_rg = person.stateRegistration || undefined
    if (person.municipalRegistration !== undefined) dto.inscricao_municipal = person.municipalRegistration || undefined
    if (person.postalCode !== undefined) dto.cep = person.postalCode || undefined
    if (person.city !== undefined) dto.cidade = person.city || undefined
    if (person.cityId !== undefined) dto.id_municipio = person.cityId || undefined
    if (person.state !== undefined) dto.uf = person.state || undefined
    if (person.street !== undefined) dto.logradouro = person.street || undefined
    if (person.number !== undefined) dto.numero = person.number || undefined
    if (person.complement !== undefined) dto.complemento = person.complement || undefined
    if (person.neighborhood !== undefined) dto.bairro = person.neighborhood || undefined
    if (person.registrationType !== undefined) dto.id_tipo_cadastro = REGISTRATION_TYPE_MAP[person.registrationType]
    
    // Obter o id do usuário logado
    const user = authService.getUser()
    if (user?.id) {
      dto.id_operador = user.id
    }

    console.log("[updatePerson] Enviando DTO:", dto)
    await httpClient.put(`/pessoas/${id}`, dto)
  } catch (error: unknown) {
    console.error("Erro ao atualizar pessoa:", error)
    
    // Extrair mensagem de erro da API
    let errorMessage = 'Erro ao atualizar pessoa.'
    
    // @ts-ignore - Temporariamente ignorar erro de tipagem
    if (error?.response?.data?.error) {
      // Erro da API com mensagem específica
      // @ts-ignore
      errorMessage = error.response.data.error
    // @ts-ignore
    } else if (error?.response?.data?.message) {
      // Formato alternativo da mensagem
      // @ts-ignore
      errorMessage = error.response.data.message
    // @ts-ignore
    } else if (error?.message) {
      // Erro genérico
      // @ts-ignore
      errorMessage = error.message
    }
    
    console.log("[updatePerson] Mensagem de erro extraída:", errorMessage)
    throw new Error(errorMessage)
  }
}

/**
 * Exclui uma pessoa
 */
export const deletePerson = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`/pessoas/${id}`)
  } catch (error) {
    console.error("Erro ao excluir pessoa:", error)
    throw error
  }
}

/**
 * Busca pessoas por termo de pesquisa (filtro local)
 */
export const searchPeople = async (searchTerm: string): Promise<Person[]> => {
  try {
    const allPeople = await getAllPeople()
    const lowerSearch = searchTerm.toLowerCase()

    return allPeople.filter(
      (person) =>
        person.name?.toLowerCase().includes(lowerSearch) ||
        person.documentId?.toLowerCase().includes(lowerSearch) ||
        person.code?.toLowerCase().includes(lowerSearch) ||
        person.city?.toLowerCase().includes(lowerSearch) ||
        person.state?.toLowerCase().includes(lowerSearch)
    )
  } catch (error) {
    console.error("Erro ao pesquisar pessoas:", error)
    throw error
  }
}

/**
 * Busca pessoas por tipo de cadastro
 */
export const getPeopleByRegistrationType = async (registrationType: RegistrationType): Promise<Person[]> => {
  try {
    const allPeople = await getAllPeople()
    return allPeople.filter((person) => person.registrationType === registrationType)
  } catch (error) {
    console.error(`Erro ao obter pessoas do tipo ${registrationType}:`, error)
    throw error
  }
}

/**
 * Busca pessoas por unidade de negócio
 */
export const getPeopleByBusinessUnit = async (businessUnitId: string): Promise<Person[]> => {
  try {
    const allPeople = await getAllPeople()
    return allPeople.filter((person) =>
      person.businessUnits?.includes(businessUnitId) || person.businessUnitId === businessUnitId
    )
  } catch (error) {
    console.error(`Erro ao obter pessoas da unidade ${businessUnitId}:`, error)
    throw error
  }
}


/**
 * Busca clientes com paginação
 */
export const getClients = async (
  page: number = 1,
  perPage?: number
): Promise<Person[]> => {
  try {
    // Se perPage não for passado, usa limit= (sem valor) para puxar todos
    const url = perPage ? `/pessoas/clientes?page=${page}&per_page=${perPage}` : `/pessoas/clientes?limit=`
    const response = await httpClient.get<{ data: ApiPerson[] }>(url)
    const responseData = response as { data: ApiPerson[] }
    const clientsArray = responseData.data || []
    return clientsArray.map(mapApiToPerson)
  } catch (error) {
    console.error('[getClients] Erro ao buscar clientes:', error)
    throw error
  }
}


// ========== VERSÕES COM TOASTERS AUTOMÁTICOS ==========

/**
 * Serviço de pessoas com toasters automáticos para erros e sucessos
 */
export const personServiceWithToasts = {
  
  /**
   * Cria uma pessoa com toast automático
   */
  async create(personData: Partial<Omit<Person, "id" | "createdAt" | "updatedAt">>) {
    // Converter dados para DTO
    const dto: CreatePersonDto = {
      nome: personData.name || '',
      abreviatura: personData.abbreviation || '',
      email: personData.email,
      id_tipo_pessoa: personData.personType === "pf" ? 1 : 2,
      cnpj_cpf: personData.documentId,
      inscricao_estadual_rg: personData.stateRegistration,
      inscricao_municipal: personData.municipalRegistration,
      cep: personData.postalCode,
      cidade: personData.city,
      id_municipio: personData.cityId,
      uf: personData.state,
      logradouro: personData.street,
      numero: personData.number,
      complemento: personData.complement,
      bairro: personData.neighborhood,
      id_tipo_cadastro: personData.registrationType ? REGISTRATION_TYPE_MAP[personData.registrationType] : 1,
    }

    // Obter o id do usuário logado
    const user = authService.getUser()
    if (user?.id) {
      dto.id_operador = user.id
    }

    return GlobalToastHttpClient.post('/pessoas', dto, {
      customSuccessMessage: 'Pessoa cadastrada com sucesso!',
      customErrorMessage: 'Erro ao cadastrar pessoa'
    })
  },

  /**
   * Atualiza uma pessoa com toast automático
   */
  async update(id: string, personData: Partial<Omit<Person, "id" | "createdAt" | "updatedAt">>) {
    const dto: UpdatePersonDto = {}

    // Incluir campos se estão definidos (permitir strings vazias para limpar campos)
    if (personData.name !== undefined) dto.nome = personData.name
    if (personData.email !== undefined) dto.email = personData.email || undefined
    if (personData.abbreviation !== undefined) dto.abreviatura = personData.abbreviation || undefined
    if (personData.personType !== undefined) dto.id_tipo_pessoa = personData.personType === "pf" ? 1 : 2
    // Usar o valor exato (incluindo string vazia para limpar o campo)
    if (personData.documentId !== undefined) dto.cnpj_cpf = personData.documentId
    if (personData.stateRegistration !== undefined) dto.inscricao_estadual_rg = personData.stateRegistration || undefined
    if (personData.municipalRegistration !== undefined) dto.inscricao_municipal = personData.municipalRegistration || undefined
    if (personData.postalCode !== undefined) dto.cep = personData.postalCode || undefined
    if (personData.city !== undefined) dto.cidade = personData.city || undefined
    if (personData.cityId !== undefined) dto.id_municipio = personData.cityId || undefined
    if (personData.state !== undefined) dto.uf = personData.state || undefined
    if (personData.street !== undefined) dto.logradouro = personData.street || undefined
    if (personData.number !== undefined) dto.numero = personData.number || undefined
    if (personData.complement !== undefined) dto.complemento = personData.complement || undefined
    if (personData.neighborhood !== undefined) dto.bairro = personData.neighborhood || undefined
    if (personData.registrationType !== undefined) dto.id_tipo_cadastro = REGISTRATION_TYPE_MAP[personData.registrationType]

    // Obter o id do usuário logado
    const user = authService.getUser()
    if (user?.id) {
      dto.id_operador = user.id
    }

    return GlobalToastHttpClient.put(`/pessoas/${id}`, dto, {
      customSuccessMessage: 'Pessoa atualizada com sucesso!',
      customErrorMessage: 'Erro ao atualizar pessoa'
    })
  },

  /**
   * Exclui uma pessoa com toast automático
   */
  async delete(id: string) {
    return GlobalToastHttpClient.delete(`/pessoas/${id}`, {
      customSuccessMessage: 'Pessoa excluída com sucesso!',
      customErrorMessage: 'Erro ao excluir pessoa'
    })
  },

  /**
   * Lista pessoas (sem toast de sucesso, apenas erros)
   */
  async getAll() {
    return GlobalToastHttpClient.get('/pessoas?limit=', {
      showSuccess: false,
      showErrors: true,
      customErrorMessage: 'Erro ao carregar pessoas'
    })
  }
}

/**
 * Hook para usar o serviço de pessoas com toasters
 */
export function usePersonServiceWithToasts() {
  return personServiceWithToasts
}
