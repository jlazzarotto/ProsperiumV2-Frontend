import { httpClient } from '@/lib/http-client';

export interface Transaction {
  id_lancamento: number;
  id_tp_lcto?: number | null;
  id_conta_contabil: number;
  id_conta_caixa: number | null;
  id_pessoa: number;
  id_un_negocio: number; // id_un_negocio da tabela pessoas_un_negocios
  id_empresa?: number | null; // empresa (pessoa tipo 8)
  id_emissor: number; // id_pessoa_un_negocio (devedor/credor)
  id_pessoa_negocio: number; // unidade específica
  id_porto: number | null;
  id_navio: number | null;
  id_operacao: number | null;
  numero_documento: string | null;
  descricao: string;
  valor: string;
  data_lancamento: string;
  data_vencimento: string;
  data_pagamento: string | null;
  observacoes: string | null;
  anexos: string | null;
  status: boolean;
  natureza: 'entrada' | 'saida';
  competencia: number;
  id_recorrencia: number | null;
  custeio?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionFilters {
  competencia?: number;
  status?: boolean;
  data_inicio?: string;
  data_fim?: string;
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransactionData {
  id_conta_contabil: number;
  id_conta_caixa?: number;
  id_pessoa: number;
  id_un_negocio: number;
  id_porto?: number;
  id_navio?: number;
  numero_documento?: string;
  descricao: string;
  valor: number | string;
  data_lancamento: string;
  data_vencimento: string;
  data_pagamento?: string;
  observacoes?: string;
  natureza: 'entrada' | 'saida';
}

export interface UpdateTransactionData {
  id_conta_contabil?: number;
  id_conta_caixa?: number;
  id_pessoa?: number;
  id_un_negocio?: number;
  id_porto?: number;
  id_navio?: number;
  numero_documento?: string;
  descricao?: string;
  valor?: number | string;
  data_lancamento?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  observacoes?: string;
  status?: boolean;
}

class TransactionService {
  private baseUrl = '/lancamentos';

  async getTransactions(filters?: TransactionFilters) {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.competencia) params.append('competencia', filters.competencia.toString());
      if (filters.status !== undefined) params.append('status', filters.status.toString());
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);
      if (filters.data_vencimento_inicio) params.append('data_vencimento_inicio', filters.data_vencimento_inicio);
      if (filters.data_vencimento_fim) params.append('data_vencimento_fim', filters.data_vencimento_fim);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    return httpClient.get<{ data: Transaction[] }>(url);
  }

  async getTransactionById(id: number) {
    return httpClient.get<Transaction>(`${this.baseUrl}/${id}`);
  }

  async createTransaction(data: CreateTransactionData) {
    return httpClient.post<Transaction>(this.baseUrl, data);
  }

  async updateTransaction(id: number, data: UpdateTransactionData) {
    return httpClient.put<Transaction>(`${this.baseUrl}/${id}`, data);
  }

  async deleteTransaction(id: number) {
    return httpClient.delete(`${this.baseUrl}/${id}`);
  }
}

export default new TransactionService();
