import { httpClient } from '@/lib/http-client'
import { GlobalToastHttpClient } from '@/lib/global-toast'
import type {
  Lancamento,
  LancamentoListResponse,
  LancamentoFilter,
  BaixaLancamento,
  LancamentoStats,
  ExtratoFinanceiro
} from '@/types/types'
import type { ApiTransactionType } from '@/types/api'

// Cache para lançamentos completos
let fullLancamentosCache: LancamentoListResponse | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Busca lançamentos com filtros e paginação backend
 * GET /lancamentos
 * Adicionado cache busting para garantir dados sempre atualizados
 */
export const getAllLancamentos = async (filters?: LancamentoFilter, forceRefresh: boolean = false): Promise<LancamentoListResponse> => {
  try {
    let url = '/lancamentos'
    const queryParams: string[] = []

    if (filters) {
      // Criar uma cópia dos filtros para modificar
      const cleanFilters = { ...filters }
      
      // Se tipoData estiver definido com data_inicio/data_fim, limpar conflitos
      if (cleanFilters.tipoData && cleanFilters.data_inicio && cleanFilters.data_fim) {
        switch (cleanFilters.tipoData) {
          case 'data_pagamento':
            // Quando usa data de pagamento, mapear para data_pagamento_inicio/fim
            cleanFilters.data_pagamento_inicio = cleanFilters.data_inicio
            cleanFilters.data_pagamento_fim = cleanFilters.data_fim
            // Remover outros tipos de data
            delete cleanFilters.data_inicio
            delete cleanFilters.data_fim
            delete cleanFilters.data_vencimento_inicio
            delete cleanFilters.data_vencimento_fim
            break
          case 'data_vencimento':
            // Quando usa data de vencimento, mapear para data_vencimento_inicio/fim
            cleanFilters.data_vencimento_inicio = cleanFilters.data_inicio
            cleanFilters.data_vencimento_fim = cleanFilters.data_fim
            // Remover outros tipos de data
            delete cleanFilters.data_inicio
            delete cleanFilters.data_fim
            delete cleanFilters.data_pagamento_inicio
            delete cleanFilters.data_pagamento_fim
            break
          default: // data_emissao
            // Para data de emissão, manter data_inicio/data_fim e remover outros
            delete cleanFilters.data_vencimento_inicio
            delete cleanFilters.data_vencimento_fim
            delete cleanFilters.data_pagamento_inicio
            delete cleanFilters.data_pagamento_fim
            break
        }
      }
      
      Object.entries(cleanFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.push(`${key}=${encodeURIComponent(String(value))}`)
        }
      })
    }

    // Usar paginação backend por padrão - apenas se não tiver limit definido
    // limit=-1 significa "trazer TODOS" - enviar limit= vazio para a API
    if (filters?.limit === -1) {
      queryParams.push('limit=') // Sem limite - traz todos os registros
    } else if (!filters?.limit) {
      queryParams.push('limit=25') // Limite padrão para performance
    }
    
    // Página padrão apenas se não estiver definida
    if (!filters?.page) {
      queryParams.push('page=1') // Página padrão  
    }

    // Cache busting para garantir dados atualizados quando filtros mudarem
    if (forceRefresh) {
      queryParams.push(`_t=${Date.now()}`)
    }

    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&')
    }

    const response = await httpClient.get<LancamentoListResponse>(url)
    return response
  } catch (error) {
    console.error('❌ Erro ao buscar lançamentos:', error)
    throw error
  }
}

/**
 * Busca lançamentos com paginação backend inteligente
 * Esta função substitui getAllLancamentosComplete para usar paginação do backend
 */
export const getAllLancamentosWithPagination = async (
  page: number = 1, 
  limit: number = 25, 
  filters?: Omit<LancamentoFilter, 'page' | 'limit'>
): Promise<LancamentoListResponse> => {
  try {
    let url = '/lancamentos'
    const queryParams: string[] = []

    // Adicionar parâmetros de paginação
    queryParams.push(`page=${page}`)
    queryParams.push(`limit=${limit}`)

    // Adicionar outros filtros
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.push(`${key}=${encodeURIComponent(String(value))}`)
        }
      })
    }

    url += '?' + queryParams.join('&')

    const response = await httpClient.get<LancamentoListResponse>(url)
    return response
  } catch (error) {
    console.error('❌ Erro ao buscar lançamentos com paginação:', error)
    throw error
  }
}

/**
 * Busca TODOS os lançamentos com cache inteligente
 * Esta função é otimizada para carregar todos os registros uma vez e cachear
 */
export const getAllLancamentosComplete = async (forceRefresh = false): Promise<LancamentoListResponse> => {
  try {
    // Verificar cache se não forçar refresh
    const now = Date.now()
    const isCacheValid = fullLancamentosCache && (now - cacheTimestamp) < CACHE_DURATION

    if (!forceRefresh && isCacheValid) {
      return fullLancamentosCache!
    }

    const url = '/lancamentos?limit='

    const response = await httpClient.get<LancamentoListResponse>(url)

    // Atualizar cache
    fullLancamentosCache = response
    cacheTimestamp = now

    return response
  } catch (error) {
    console.error('❌ Erro ao buscar todos os lançamentos:', error)
    throw error
  }
}

/**
 * Limpa o cache de lançamentos (usar após criar/editar/deletar)
 */
export const clearLancamentosCache = () => {
  fullLancamentosCache = null
  cacheTimestamp = 0
}

/**
 * Busca lançamento por ID
 * GET /lancamentos/{id}
 */
export const getLancamentoById = async (id: number): Promise<Lancamento> => {
  try {
    const response = await httpClient.get<Lancamento>(`/lancamentos/${id}`)
    return response
  } catch (error) {
    console.error('Erro ao buscar lançamento:', error)
    throw error
  }
}

/**
 * Cria novo lançamento
 * POST /lancamentos
 */
export const createLancamento = async (lancamento: Partial<Lancamento>): Promise<{ message: string; id: number }> => {
  try {
    const response = await httpClient.post<{ message: string; id: number }>('/lancamentos', lancamento)
    return response
  } catch (error) {
    console.error('Erro ao criar lançamento:', error)
    throw error
  }
}

/**
 * Atualiza lançamento
 * PUT /lancamentos/{id}
 */
export const updateLancamento = async (id: number, lancamento: Partial<Lancamento>): Promise<{ message: string }> => {
  try {
    const response = await httpClient.put<{ message: string }>(`/lancamentos/${id}`, lancamento)
    return response
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error)
    throw error
  }
}

export const updateLancamentoWithAttachments = async (
  id: number,
  lancamento: Partial<Lancamento>,
  attachments: Array<{ file: File; documentType?: string; sendToAccounting?: boolean }>,
  accountingConflictResolution?: 'replace' | 'keep'
): Promise<{ message: string }> => {
  try {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(lancamento))
    if (accountingConflictResolution) {
      formData.append('accounting_conflict_resolution', accountingConflictResolution)
    }

    attachments.forEach((attachment, index) => {
      formData.append('arquivos[]', attachment.file)

      if (attachment.documentType) {
        formData.append(`tipos_documento[${index}]`, attachment.documentType)
      }

      if (attachment.sendToAccounting !== undefined) {
        formData.append(`enviar_contabilidade[${index}]`, attachment.sendToAccounting.toString())
      }
    })

    const response = await fetch(`/api/proxy/lancamentos/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao atualizar lançamento com anexos:', error)
    throw error
  }
}

/**
 * Baixa lançamento (marca como pago)
 * POST /lancamentos/{id}/baixar
 */
export const baixarLancamento = async (id: number, dados: BaixaLancamento): Promise<{ message: string }> => {
  try {
    const response = await httpClient.post<{ message: string }>(`/lancamentos/${id}/baixar`, dados)
    return response
  } catch (error) {
    console.error('Erro ao baixar lançamento:', error)
    throw error
  }
}

/**
 * Exclui lançamento (soft delete)
 * DELETE /lancamentos/{id}
 */
export const deleteLancamento = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await httpClient.delete<{ message: string }>(`/lancamentos/${id}`)
    return response
  } catch (error) {
    console.error('Erro ao excluir lançamento:', error)
    throw error
  }
}

/**
 * Busca estatísticas por conta
 * GET /lancamentos/stats/conta-caixa/{id}
 */
export const getStatsByConta = async (idContaCaixa: number): Promise<LancamentoStats> => {
  try {
    const response = await httpClient.get<LancamentoStats>(`/lancamentos/stats/conta-caixa/${idContaCaixa}`)
    return response
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    throw error
  }
}


/**
 * Busca extrato financeiro
 * GET /lancamentos/relatorio/extrato
 */
export const getExtratoFinanceiro = async (filters?: LancamentoFilter): Promise<ExtratoFinanceiro> => {
  try {
    let url = '/lancamentos/relatorio/extrato'
    const queryParams: string[] = []

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.push(`${key}=${encodeURIComponent(String(value))}`)
        }
      })
    }

    // Se não especificar limit, buscar todos (para paginação no frontend)
    if (!filters?.limit && filters?.limit !== 0) {
      queryParams.push('limit=') // Buscar todos os registros
    }

    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&')
    }

    const response = await httpClient.get<ExtratoFinanceiro>(url)
    return response
  } catch (error) {
    console.error('Erro ao buscar extrato financeiro:', error)
    throw error
  }
}

/**
 * Busca posição da conta
 * GET /lancamentos/relatorio/posicao-conta/{id}
 */
export const getPosicaoConta = async (
  idContaCaixa: number,
  dataLimite?: string
): Promise<Record<string, unknown>> => {
  try {
    const queryParams = new URLSearchParams()
    if (dataLimite) {
      queryParams.append('data_limite', dataLimite)
    }

    const url = `/lancamentos/relatorio/posicao-conta/${idContaCaixa}${
      queryParams.toString() ? '?' + queryParams.toString() : ''
    }`
    const response = await httpClient.get<Record<string, unknown>>(url)
    return response
  } catch (error) {
    console.error('Erro ao buscar posição da conta:', error)
    throw error
  }
}

/**
 * Cancela lançamento (marca como cancelado)
 * POST /lancamentos/{id}/cancelar
 */
export const cancelarLancamento = async (id: number, motivo?: string): Promise<{ message: string }> => {
  try {
    const data = motivo ? { motivo } : {}
    const response = await httpClient.post<{ message: string }>(`/lancamentos/${id}/cancelar`, data)
    return response
  } catch (error) {
    console.error('Erro ao cancelar lançamento:', error)
    throw error
  }
}

/**
 * Restaura lançamento cancelado
 * POST /lancamentos/{id}/restaurar
 */
export const restaurarLancamento = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await httpClient.post<{ message: string }>(`/lancamentos/${id}/restaurar`)
    return response
  } catch (error) {
    console.error('Erro ao restaurar lançamento:', error)
    throw error
  }
}

/**
 * Cancela a baixa de um lançamento
 * POST /lancamentos/{id}/cancelar-baixa
 */
export const cancelarBaixaLancamento = async (id: number): Promise<{ message: string }> => {
  try {
    const response = await httpClient.post<{ message: string }>(`/lancamentos/${id}/cancelar-baixa`, {})
    return response
  } catch (error) {
    console.error('Erro ao cancelar baixa do lançamento:', error)
    throw error
  }
}

/**
 * Cria lançamento recorrente (lançamento pai + filhos)
 * POST /lancamentos/recorrente
 */
export const createLancamentoRecorrente = async (
  dados: Partial<Lancamento> & {
    tipo_recorrencia: 'semanal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
    quantidade_parcelas: number
  }
): Promise<{ message: string; id_pai: number; ids_filhos: number[] }> => {
  try {
    const response = await httpClient.post<{ 
      message: string; 
      id_pai: number; 
      ids_filhos: number[] 
    }>('/lancamentos/recorrente', dados)
    return response
  } catch (error) {
    console.error('Erro ao criar lançamento recorrente:', error)
    throw error
  }
}

/**
 * Busca lançamentos filhos de uma recorrência
 * GET /lancamentos/{id}/filhos
 */
export const getLancamentosFilhos = async (idPai: number): Promise<Lancamento[]> => {
  try {
    const response = await httpClient.get<Lancamento[]>(`/lancamentos/${idPai}/filhos`)
    return response
  } catch (error) {
    console.error('Erro ao buscar lançamentos filhos:', error)
    throw error
  }
}

/**
 * Busca todos os lançamentos de uma recorrência pelo ID de recorrência
 * GET /lancamentos?recurrence_id={recurrenceId}
 */
export const getLancamentosByRecurrenceId = async (recurrenceId: number): Promise<Lancamento[]> => {
  try {
    console.log('🔍 Buscando lançamentos da recorrência ID:', recurrenceId)
    const response = await httpClient.get<LancamentoListResponse>(`/lancamentos?id_recorrencia=${recurrenceId}`)
    console.log('📊 Resposta da consulta de recorrência:', response)
    console.log('📝 Lançamentos encontrados:', response.data?.length, response.data)
    return response.data || []
  } catch (error) {
    console.error('Erro ao buscar lançamentos da recorrência:', error)
    throw error
  }
}

/**
 * Busca lançamento pai de uma recorrência
 * GET /lancamentos/{id}/pai
 */
export const getLancamentoPai = async (idFilho: number): Promise<Lancamento | null> => {
  try {
    const response = await httpClient.get<Lancamento>(`/lancamentos/${idFilho}/pai`)
    return response
  } catch (error) {
    console.error('Erro ao buscar lançamento pai:', error)
    // Se não encontrar o pai, retornar null ao invés de erro
    if (error && typeof error === 'object' && 'response' in error && (error as { response?: { status?: number } }).response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Atualiza toda a série de recorrência (pai + filhos)
 * PUT /lancamentos/{id}/recorrencia/atualizar-serie
 */
export const updateSerieRecorrencia = async (
  idPai: number, 
  dados: Partial<Lancamento>,
  atualizarFilhosPendentes: boolean = true
): Promise<{ message: string; atualizados: number }> => {
  try {
    const payload = {
      ...dados,
      atualizar_filhos_pendentes: atualizarFilhosPendentes
    }
    const response = await httpClient.put<{ 
      message: string; 
      atualizados: number 
    }>(`/lancamentos/${idPai}/recorrencia/atualizar-serie`, payload)
    return response
  } catch (error) {
    console.error('Erro ao atualizar série de recorrência:', error)
    throw error
  }
}

/**
 * Cancela toda a série de recorrência (pai + filhos pendentes)
 * POST /lancamentos/{id}/recorrencia/cancelar-serie
 */
export const cancelarSerieRecorrencia = async (
  idPai: number, 
  motivo?: string
): Promise<{ message: string; cancelados: number }> => {
  try {
    const data = motivo ? { motivo } : {}
    const response = await httpClient.post<{ 
      message: string; 
      cancelados: number 
    }>(`/lancamentos/${idPai}/recorrencia/cancelar-serie`, data)
    return response
  } catch (error) {
    console.error('Erro ao cancelar série de recorrência:', error)
    throw error
  }
}

/**
 * Remove toda a série de recorrência (pai + filhos)
 * DELETE /lancamentos/{id}/recorrencia/remover-serie
 */
export const removerSerieRecorrencia = async (idPai: number): Promise<{ message: string; removidos: number }> => {
  try {
    const response = await httpClient.delete<{ 
      message: string; 
      removidos: number 
    }>(`/lancamentos/${idPai}/recorrencia/remover-serie`)
    return response
  } catch (error) {
    console.error('Erro ao remover série de recorrência:', error)
    throw error
  }
}

/**
 * Cria recorrência usando o novo endpoint simples
 * POST /lancamentos/recorrente
 */
export const createRecorrenteLancamento = async (dados: {
  base_lancamento_id: number;
  frequencia: 'mensal' | 'semanal' | 'quinzenal' | 'anual' | 'diaria';
  quantidade: number;
  atualizar_competencia?: boolean;
}): Promise<{ 
  message: string; 
  id_recorrencia: number; 
  lancamento_base_id: number; 
  total_gerados: number;
  lancamentos_gerados: Array<{ id: number; data_vencimento: string; competencia: number }>
}> => {
  try {
    const response = await httpClient.post<{ 
      message: string; 
      id_recorrencia: number; 
      lancamento_base_id: number; 
      total_gerados: number;
      lancamentos_gerados: Array<{ id: number; data_vencimento: string; competencia: number }>
    }>('/lancamentos/recorrente', dados)
    return response
  } catch (error) {
    console.error('Erro ao criar recorrência:', error)
    throw error
  }
}

/**
 * Busca todos os tipos de lançamento ativos (tp_lctos)
 * GET /tipos-lancamento/ativos
 */
export const getTiposLancamento = async (natureza?: 'entrada' | 'saida'): Promise<ApiTransactionType[]> => {
  try {
    const response = await httpClient.get<unknown>('/tipos-lancamento/ativos', {
      params: natureza ? { natureza } : undefined,
    })

    let tipos: Array<Record<string, unknown>> = []
    if (Array.isArray(response)) {
      tipos = response
    } else if (response && Array.isArray((response as { data?: unknown }).data)) {
      tipos = (response as { data: Array<Record<string, unknown>> }).data
    }

    return tipos.map(t => ({
      id_tp_lcto: t.id_tp_lcto as number,
      id_conta_contabil: t.id_conta_contabil as number,
      id_contra_partida: (t.id_contra_partida as number) || 0,
      nome: t.nome as string,
      natureza: t.natureza as number,
      marcador: t.marcador as string | null,
      nivel: (t.nivel as number) || 0,
      id_plano_conta: (t.id_plano_conta as number) || 1,
      id_operador: (t.id_operador as number) || 0,
      descricao: (t.descricao as string) || '',
      status: t.status as boolean,
      created_at: (t.created_at as string) || '',
      updated_at: (t.updated_at as string) || '',
    }))
  } catch (error) {
    console.error('❌ Erro ao buscar tipos de lançamento:', error)
    return []
  }
}

export const getTipoLancamentoById = async (id: number): Promise<ApiTransactionType | null> => {
  try {
    const response = await httpClient.get<Record<string, unknown>>(`/tipos-lancamento/${id}`)

    return {
      id_tp_lcto: response.id_tp_lcto as number,
      id_conta_contabil: response.id_conta_contabil as number,
      id_contra_partida: (response.id_contra_partida as number) || 0,
      nome: response.nome as string,
      natureza: response.natureza as number,
      marcador: response.marcador as string | null,
      nivel: (response.nivel as number) || 0,
      id_plano_conta: (response.id_plano_conta as number) || 1,
      id_operador: (response.id_operador as number) || 0,
      descricao: (response.descricao as string) || '',
      status: response.status as boolean,
      created_at: (response.created_at as string) || '',
      updated_at: (response.updated_at as string) || '',
    }
  } catch (error) {
    console.error('❌ Erro ao buscar tipo de lançamento por ID:', error)
    return null
  }
}

// ========== VERSÕES COM TOASTERS AUTOMÁTICOS ==========

/**
 * Serviço de lançamentos com toasters automáticos para erros e sucessos
 */
export const lancamentoServiceWithToasts = {
  
  /**
   * Cria um lançamento com toast automático
   */
  async create(data: Partial<Lancamento>) {
    return GlobalToastHttpClient.post('/lancamentos', data, {
      customSuccessMessage: 'Lançamento criado com sucesso!',
      customErrorMessage: 'Erro ao criar lançamento'
    })
  },

  /**
   * Atualiza um lançamento com toast automático
   */
  async update(id: number, data: Partial<Lancamento>) {
    return GlobalToastHttpClient.put(`/lancamentos/${id}`, data, {
      customSuccessMessage: 'Lançamento atualizado com sucesso!',
      customErrorMessage: 'Erro ao atualizar lançamento'
    })
  },

  /**
   * Exclui um lançamento com toast automático
   */
  async delete(id: number) {
    return GlobalToastHttpClient.delete(`/lancamentos/${id}`, {
      customSuccessMessage: 'Lançamento excluído com sucesso!',
      customErrorMessage: 'Erro ao excluir lançamento'
    })
  },

  /**
   * Baixa (marca como pago) um lançamento com toast automático
   */
  async baixar(id: number, dadosBaixa: BaixaLancamento) {
    return GlobalToastHttpClient.post(`/lancamentos/${id}/baixar`, dadosBaixa, {
      customSuccessMessage: 'Lançamento baixado com sucesso!',
      customErrorMessage: 'Erro ao baixar lançamento'
    })
  },

  /**
   * Cancela um lançamento com toast automático
   */
  async cancelar(id: number, motivo: string) {
    return GlobalToastHttpClient.put(`/lancamentos/${id}/cancelar`, { motivo }, {
      customSuccessMessage: 'Lançamento cancelado com sucesso!',
      customErrorMessage: 'Erro ao cancelar lançamento'
    })
  },

  /**
   * Remove a baixa de um lançamento com toast automático
   */
  async estornar(id: number) {
    return GlobalToastHttpClient.delete(`/lancamentos/${id}/baixar`, {
      customSuccessMessage: 'Baixa estornada com sucesso!',
      customErrorMessage: 'Erro ao estornar baixa'
    })
  },

  /**
   * Lista lançamentos (sem toast de sucesso, apenas erros)
   */
  async getAll(filters?: LancamentoFilter) {
    return GlobalToastHttpClient.get('/lancamentos', {
      showSuccess: false,
      showErrors: true,
      customErrorMessage: 'Erro ao carregar lançamentos'
    })
  }
}

/**
 * Hook para usar o serviço de lançamentos com toasters
 */
export function useLancamentoServiceWithToasts() {
  return lancamentoServiceWithToasts
}
