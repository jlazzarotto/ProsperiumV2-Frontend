import { httpClient } from '@/lib/http-client';

export interface OperacaoNavio {
  id_operacao: number;
  descricao: string;
  viagem: string;
  navio: string;
  cliente: string;
  unidade_negocio: string;
  porto: string;
  dt_inicio: string;
  dt_final: string;
  tons: number;
  receita_total: number;
  custo_total: number;
  despesa_total: number;
  saldo: number;
  margem_percentual: number;
}

export interface TotaisNavio {
  receita_total: number;
  custo_total: number;
  despesa_total: number;
  saldo_total: number;
  tons_total: number;
  operacoes_count: number;
}

export interface FinanceiroOperacao {
  receita_total: number;
  custo_total: number;
  despesa_total: number;
  resultado: number;
  margem_percentual: number;
}

export interface LancamentoOperacao {
  id: number;
  descricao: string;
  valor: number;
  tipo_lancamento: string;
  dt_competencia: string;
  conta_contabil_nome: string;
  conta_contabil_codigo: string;
}

export interface DetalhesOperacao {
  operacao: {
    id_operacao: number;
    descricao: string;
    viagem: string;
    navio: string;
    cliente: string;
    unidade_negocio: string;
    porto: string;
    dt_inicio: string;
    dt_final: string;
    tons: number;
    status: boolean;
  };
  financeiro: FinanceiroOperacao;
  lancamentos: LancamentoOperacao[];
}

export interface ResultadoNavioResponse {
  data: OperacaoNavio[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  totais: TotaisNavio;
  filtros: {
    id_pessoa?: number;
    id_unidade_negocio?: number;
    data_inicio?: string;
    data_fim?: string;
    search?: string;
  };
}

export interface ResultadoNavioParams {
  page?: number;
  limit?: number;
  search?: string;
  id_pessoa?: number;
  id_unidade_negocio?: number;
  data_inicio?: string;
  data_fim?: string;
}

export const resultadoNavioService = {
  async getResultados(params: ResultadoNavioParams = {}): Promise<ResultadoNavioResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.id_pessoa) searchParams.append('id_pessoa', params.id_pessoa.toString());
    if (params.id_unidade_negocio) searchParams.append('id_unidade_negocio', params.id_unidade_negocio.toString());
    if (params.data_inicio) searchParams.append('data_inicio', params.data_inicio);
    if (params.data_fim) searchParams.append('data_fim', params.data_fim);

    const response = await httpClient.get<ResultadoNavioResponse>(`/resultado-navio?${searchParams.toString()}`);
    console.log('🔧 Response resultado-navio RAW:', response);
    
    // O backend retorna { data: [], pagination: {}, totais: {}, filtros: {} }
    // httpClient já faz response.data automaticamente, então response já é o objeto correto
    return response;
  },

  async getDetalhes(id: number): Promise<DetalhesOperacao> {
    const response = await httpClient.get<DetalhesOperacao>(`/resultado-navio/${id}`);
    console.log('🔧 Response detalhes RAW:', response);
    return response;
  }
};