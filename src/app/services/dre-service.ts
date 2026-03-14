import { httpClient } from '@/lib/http-client';

export interface DreData {
  linhas: Array<{
    id: number;
    descricao: string;
    valores: Record<string, number>;
  }>;
}

export interface DreItem {
  id: number;
  ordem: number;
  grupo: number;
  nome: string;
  descricao: string;
  formula: string | null;
  multi: boolean;
  valores: { [key: string]: number };
  tipo?: 'grupo' | 'detalhe';
  codigo?: string;
}

export interface DreRelatorio {
  linhas: DreItem[];
  colunas: Array<{
    mes: string;
    ano: string;
    competencia: number;
    label: string;
  }>;
  unidades: Array<{
    id_un_negocio: number;
    apelido: string;
    abreviatura: string;
  }>;
  filtros: {
    comp_inicio: string;
    comp_fim: string;
  };
  periodo: string;
}

export interface DreConfig {
  id: number;
  id_conta_contabil: string;
  grupo: number;
  descricao: string;
  ordem: number;
  multi: boolean;
  nome: string;
  consolidado: boolean;
  formula: string | null;
}

export interface CreateDreConfigDto {
  grupo: number;
  descricao: string;
  ordem: number;
  id_conta_contabil?: string;
  nome?: string;
  multi?: number;
  consolidado?: number;
  formula?: string | null;
}

export interface BulkSaveConfigDto {
  items: CreateDreConfigDto[];
}

export const dreService = {
  async getRelatorio(
    compInicio: string,
    compFim: string,
    idPessoa?: string,
    idUnidadeNegocio?: string
  ): Promise<DreRelatorio> {
    const params = new URLSearchParams({
      comp_inicio: compInicio,
      comp_fim: compFim
    });

    if (idPessoa) params.append('id_pessoa', idPessoa);
    if (idUnidadeNegocio) params.append('id_unidade_negocio', idUnidadeNegocio);

    const response = await httpClient.get<DreRelatorio>(`/dre/relatorio?${params.toString()}`);

    if (!(response as any).data && (response as any).linhas) {
      return response as DreRelatorio;
    }

    return (response as any).data || response;
  },

  async getConfig(): Promise<{ data: DreConfig[] }> {
    const response = await httpClient.get<{ data: DreConfig[] }>('/dre/config');
    return response;
  },

  async createConfig(data: CreateDreConfigDto): Promise<{ data: DreConfig }> {
    const response = await httpClient.post<{ data: DreConfig }>('/dre/config', data);
    return response;
  },

  async updateConfig(id: number, data: Partial<CreateDreConfigDto>): Promise<{ data: DreConfig }> {
    const response = await httpClient.put<{ data: DreConfig }>(`/dre/config/${id}`, data);
    return response;
  },

  async deleteConfig(id: number): Promise<void> {
    await httpClient.delete(`/dre/config/${id}`);
  },

  async bulkSaveConfig(items: CreateDreConfigDto[]): Promise<{ data: DreConfig[] }> {
    const response = await httpClient.post<{ data: DreConfig[] }>('/dre/config/bulk', { items });
    return response;
  }
};