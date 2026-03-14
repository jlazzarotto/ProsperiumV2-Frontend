import { httpClient } from "@/lib/http-client";

// Tipos para Asaas
export interface AsaasUnidadeNegocio {
  id: number;
  id_asaas_unidade_negocio: number;
  id_pessoa: number;
  asaas_api_key: string;
  asaas_environment: 'sandbox' | 'production';
  asaas_wallet_id?: string;
  descricao?: string;
  webhook_url?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  pessoa?: {
    id_pessoa: number;
    apelido: string;
    cnpj?: string;
  };
}

export interface AsaasCliente {
  id: number;
  id_asaas_cliente: number;
  id_asaas_unidade_negocio: number;
  id_pessoa: number;
  asaas_customer_id: string;
  nome: string;
  email?: string;
  telefone?: string;
  telefone_celular?: string;
  cpf_cnpj?: string;
  tipo_pessoa: 'FISICA' | 'JURIDICA';
  cep?: string;
  endereco?: string;
  endereco_numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status: boolean;
  created_at: string;
}

export interface AsaasCobranca {
  id: number;
  id_asaas_cobranca: number;
  id_asaas_unidade_negocio: number;
  id_asaas_cliente: number;
  asaas_payment_id: string;
  invoice_url?: string;
  bank_slip_url?: string;
  valor: number;
  valor_liquido?: number;
  descricao: string;
  data_vencimento: string;
  data_pagamento?: string;
  forma_pagamento: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'DEPOSIT';
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  nosso_numero?: string;
  codigo_barras?: string;
  linha_digitavel?: string;
  pix_qr_code?: string;
  pix_copy_paste?: string;
  discount_value?: number;
  discount_due_date?: string;
  fine_value?: number;
  interest_value?: number;
  external_reference?: string;
  observacoes?: string;
  created_at: string;
  cliente?: AsaasCliente;
}

export interface CreateAsaasUnidadeNegocioDto {
  id_pessoa: number;
  asaas_api_key: string;
  asaas_environment?: 'sandbox' | 'production';
  descricao?: string;
  webhook_url?: string;
}

export interface UpdateAsaasUnidadeNegocioDto {
  asaas_api_key?: string;
  asaas_environment?: 'sandbox' | 'production';
  descricao?: string;
  webhook_url?: string;
  status?: boolean;
}

export interface CreateAsaasCobrancaDto {
  id_asaas_unidade_negocio: number;
  id_pessoa: number;
  valor: number;
  descricao: string;
  data_vencimento: string;
  forma_pagamento: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
  discount_value?: number;
  discount_due_date?: string;
  fine_value?: number;
  interest_value?: number;
  external_reference?: string;
  observacoes?: string;
  id_lancamento?: number;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_cpf_cnpj?: string;
  cliente_telefone?: string;
  cliente_telefone_celular?: string;
  cliente_tipo_pessoa?: 'fisica' | 'juridica';
}

export interface AsaasNotaFiscal {
  id: number;
  id_asaas_nota_fiscal: number;
  id_asaas_unidade_negocio: number;
  id_asaas_cliente: number;
  id_asaas_cobranca?: number;
  asaas_invoice_id: string;
  numero_nota?: string;
  serie_nota?: string;
  chave_acesso?: string;
  numero_rps?: string;
  serie_rps?: string;
  tipo_operacao: string;
  regime_especial_tributacao?: string;
  valor_servicos: number;
  valor_pis?: number;
  valor_cofins?: number;
  valor_inss?: number;
  valor_ir?: number;
  valor_csll?: number;
  valor_iss?: number;
  valor_iss_retido?: number;
  aliquota_iss?: number;
  descricao_servico: string;
  codigo_servico_municipio?: string;
  codigo_cnae?: string;
  municipio_prestacao_servico?: number;
  status: 'PROCESSING' | 'SCHEDULED' | 'AUTHORIZED' | 'CANCELLED' | 'PROCESSING_CANCELLATION' | 'SYNCHRONIZATION_ERROR';
  data_competencia: string;
  data_emissao?: string;
  data_processamento?: string;
  pdf_url?: string;
  xml_url?: string;
  codigo_verificacao?: string;
  observacoes?: string;
  motivo_cancelamento?: string;
  data_cancelamento?: string;
  valor_liquido?: number;
  valor_total_tributos?: number;
  sincronizado_em?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAsaasNotaFiscalDto {
  id_asaas_unidade_negocio: number;
  id_pessoa: number;
  id_asaas_cobranca?: number;
  tipo_operacao: string;
  descricao_servico: string;
  valor_servicos: number;
  data_competencia: string;
  regime_especial_tributacao?: string;
  codigo_servico_municipio?: string;
  codigo_cnae?: string;
  municipio_prestacao_servico?: number;
  aliquota_iss?: number;
  valor_iss?: number;
  valor_iss_retido?: number;
  valor_pis?: number;
  aliquota_pis?: number;
  valor_cofins?: number;
  aliquota_cofins?: number;
  valor_inss?: number;
  aliquota_inss?: number;
  valor_ir?: number;
  aliquota_ir?: number;
  valor_csll?: number;
  aliquota_csll?: number;
  iss_retido_fonte?: boolean;
  observacoes?: string;
  // Dados do cliente (auto-criacao)
  cliente_nome?: string;
  cliente_email?: string;
  cliente_cpf_cnpj?: string;
  cliente_tipo_pessoa?: string;
  cliente_telefone?: string;
  cliente_telefone_celular?: string;
  cliente_cep?: string;
  cliente_endereco?: string;
  cliente_endereco_numero?: string;
  cliente_complemento?: string;
  cliente_bairro?: string;
  cliente_cidade?: string;
  cliente_estado?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================
// ASAAS UNIDADE NEGOCIO ENDPOINTS
// ============================================

// Listar todas as configuracoes Asaas
export const getAsaasUnidadesNegocio = async (page = 1, limit = 25): Promise<PaginatedResponse<AsaasUnidadeNegocio>> => {
  try {
    const response = await httpClient.get<PaginatedResponse<AsaasUnidadeNegocio>>(
      `asaas-unidades-negocio?page=${page}&limit=${limit}`
    );
    return response;
  } catch (error) {
    console.error('Erro ao buscar configuracoes Asaas:', error);
    throw error;
  }
};

// Buscar configuracao Asaas por ID
export const getAsaasUnidadeNegocioById = async (id: number): Promise<AsaasUnidadeNegocio> => {
  try {
    const response = await httpClient.get<AsaasUnidadeNegocio>(`asaas-unidades-negocio/${id}`);
    return response;
  } catch (error) {
    console.error('Erro ao buscar configuracao Asaas:', error);
    throw error;
  }
};

// Buscar configuracao Asaas por Pessoa
export const getAsaasConfigByPessoa = async (idPessoa: number): Promise<AsaasUnidadeNegocio | null> => {
  try {
    const response = await httpClient.get<AsaasUnidadeNegocio>(`asaas-unidades-negocio/por-pessoa/${idPessoa}`);
    return response;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn(`Config Asaas nao encontrada para id_pessoa=${idPessoa}`, error.response?.data);
      return null;
    }
    console.error('Erro ao buscar configuracao Asaas por pessoa:', error);
    throw error;
  }
};

// Criar nova configuracao Asaas
export const createAsaasUnidadeNegocio = async (data: CreateAsaasUnidadeNegocioDto): Promise<AsaasUnidadeNegocio> => {
  try {
    const response = await httpClient.post<AsaasUnidadeNegocio>('asaas-unidades-negocio', data);
    return response;
  } catch (error) {
    console.error('Erro ao criar configuracao Asaas:', error);
    throw error;
  }
};

// Atualizar configuracao Asaas
export const updateAsaasUnidadeNegocio = async (id: number, data: UpdateAsaasUnidadeNegocioDto): Promise<AsaasUnidadeNegocio> => {
  try {
    const response = await httpClient.put<AsaasUnidadeNegocio>(`asaas-unidades-negocio/${id}`, data);
    return response;
  } catch (error) {
    console.error('Erro ao atualizar configuracao Asaas:', error);
    throw error;
  }
};

// Deletar configuracao Asaas
export const deleteAsaasUnidadeNegocio = async (id: number): Promise<void> => {
  try {
    await httpClient.delete(`asaas-unidades-negocio/${id}`);
  } catch (error) {
    console.error('Erro ao deletar configuracao Asaas:', error);
    throw error;
  }
};

// ============================================
// ASAAS FISCAL INFO ENDPOINTS
// ============================================

export interface AsaasFiscalInfo {
  email?: string;
  municipalInscription?: string;
  simplesNacional?: boolean;
  cnae?: string;
  specialTaxRegime?: string;
  serviceListItem?: string;
  rpsSerie?: string;
  rpsNumber?: number;
  lpiSerie?: string;
  lpiNumber?: number;
  username?: string;
  password?: string;
  accessToken?: string;
  certificateFile?: string;
  certificatePassword?: string;
}

export const getAsaasFiscalInfo = async (idAsaasUnidadeNegocio: number): Promise<AsaasFiscalInfo> => {
  try {
    const response = await httpClient.get<{ data: AsaasFiscalInfo }>(
      `asaas-unidades-negocio/fiscal-info/${idAsaasUnidadeNegocio}`
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao obter info fiscal:', error);
    throw error;
  }
};

export const getAsaasMunicipalOptions = async (idAsaasUnidadeNegocio: number): Promise<any> => {
  try {
    const response = await httpClient.get<{ data: any }>(
      `asaas-unidades-negocio/municipal-options/${idAsaasUnidadeNegocio}`
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao obter opcoes municipais:', error);
    throw error;
  }
};

export const saveAsaasFiscalInfo = async (idAsaasUnidadeNegocio: number, data: AsaasFiscalInfo): Promise<any> => {
  try {
    const response = await httpClient.post<any>(
      `asaas-unidades-negocio/fiscal-info/${idAsaasUnidadeNegocio}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Erro ao salvar info fiscal:', error);
    throw error;
  }
};

// ============================================
// ASAAS COBRANCA ENDPOINTS
// ============================================

// Listar todas as cobrancas
export const getAsaasCobrancas = async (
  page = 1,
  limit = 25,
  filters?: {
    id_asaas_unidade_negocio?: number;
    id_lancamento?: number;
    status?: string;
    forma_pagamento?: string;
    data_inicio?: string;
    data_fim?: string;
  }
): Promise<PaginatedResponse<AsaasCobranca>> => {
  try {
    let url = `asaas-cobrancas?page=${page}&limit=${limit}`;

    if (filters) {
      if (filters.id_asaas_unidade_negocio) url += `&id_asaas_unidade_negocio=${filters.id_asaas_unidade_negocio}`;
      if (filters.id_lancamento) url += `&id_lancamento=${filters.id_lancamento}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.forma_pagamento) url += `&forma_pagamento=${filters.forma_pagamento}`;
      if (filters.data_inicio) url += `&data_inicio=${filters.data_inicio}`;
      if (filters.data_fim) url += `&data_fim=${filters.data_fim}`;
    }

    const response = await httpClient.get<PaginatedResponse<AsaasCobranca>>(url);
    return response;
  } catch (error) {
    console.error('Erro ao buscar cobrancas:', error);
    throw error;
  }
};

// Buscar cobranca por ID
export const getAsaasCobrancaById = async (id: number): Promise<AsaasCobranca> => {
  try {
    const response = await httpClient.get<AsaasCobranca>(`asaas-cobrancas/${id}`);
    return response;
  } catch (error) {
    console.error('Erro ao buscar cobranca:', error);
    throw error;
  }
};

// Criar nova cobranca (emitir boleto)
export const createAsaasCobranca = async (data: CreateAsaasCobrancaDto): Promise<AsaasCobranca> => {
  try {
    const response = await httpClient.post<AsaasCobranca>('asaas-cobrancas', data);
    return response;
  } catch (error) {
    console.error('Erro ao criar cobranca:', error);
    throw error;
  }
};

// Cancelar cobranca
export const cancelAsaasCobranca = async (id: number): Promise<void> => {
  try {
    await httpClient.delete(`asaas-cobrancas/${id}`);
  } catch (error) {
    console.error('Erro ao cancelar cobranca:', error);
    throw error;
  }
};

// ============================================
// ASAAS CLIENTE ENDPOINTS
// ============================================

// Listar clientes Asaas
export const getAsaasClientes = async (
  page = 1,
  limit = 25,
  filters?: {
    id_asaas_unidade_negocio?: number;
    search?: string;
  }
): Promise<PaginatedResponse<AsaasCliente>> => {
  try {
    let url = `asaas-clientes?page=${page}&limit=${limit}`;

    if (filters) {
      if (filters.id_asaas_unidade_negocio) url += `&id_asaas_unidade_negocio=${filters.id_asaas_unidade_negocio}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    }

    const response = await httpClient.get<PaginatedResponse<AsaasCliente>>(url);
    return response;
  } catch (error) {
    console.error('Erro ao buscar clientes Asaas:', error);
    throw error;
  }
};

// Buscar ou criar cliente no Asaas (para emissao de boleto)
export const syncClienteAsaas = async (idAsaasUnidade: number, idPessoa: number): Promise<AsaasCliente> => {
  try {
    const response = await httpClient.post<AsaasCliente>('asaas-clientes/sync', {
      id_asaas_unidade_negocio: idAsaasUnidade,
      id_pessoa: idPessoa
    });
    return response;
  } catch (error) {
    console.error('Erro ao sincronizar cliente Asaas:', error);
    throw error;
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Obter status em portugues
export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Pendente',
    'RECEIVED': 'Recebido',
    'CONFIRMED': 'Confirmado',
    'OVERDUE': 'Vencido',
    'REFUNDED': 'Estornado',
    'RECEIVED_IN_CASH': 'Recebido em dinheiro',
    'REFUND_REQUESTED': 'Estorno solicitado',
    'CHARGEBACK_REQUESTED': 'Chargeback solicitado',
    'CHARGEBACK_DISPUTE': 'Disputa de chargeback',
    'AWAITING_CHARGEBACK_REVERSAL': 'Aguardando reversao',
    'DUNNING_REQUESTED': 'Negativacao solicitada',
    'DUNNING_RECEIVED': 'Negativado',
    'AWAITING_RISK_ANALYSIS': 'Analise de risco',
  };
  return statusMap[status] || status;
};

// Obter cor do status
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'RECEIVED': 'bg-green-100 text-green-800',
    'CONFIRMED': 'bg-green-100 text-green-800',
    'OVERDUE': 'bg-red-100 text-red-800',
    'REFUNDED': 'bg-gray-100 text-gray-800',
    'RECEIVED_IN_CASH': 'bg-green-100 text-green-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

// Obter label da forma de pagamento
export const getFormaPagamentoLabel = (forma: string): string => {
  const formaMap: Record<string, string> = {
    'BOLETO': 'Boleto',
    'PIX': 'PIX',
    'CREDIT_CARD': 'Cartao de Credito',
    'DEBIT_CARD': 'Cartao de Debito',
    'TRANSFER': 'Transferencia',
    'DEPOSIT': 'Deposito',
  };
  return formaMap[forma] || forma;
};

// ============================================
// ASAAS NOTA FISCAL ENDPOINTS
// ============================================

// Listar notas fiscais
export const getAsaasNotasFiscais = async (
  page = 1,
  limit = 25,
  filters?: {
    id_asaas_unidade_negocio?: number;
    status?: string;
    data_competencia_inicio?: string;
    data_competencia_fim?: string;
  }
): Promise<PaginatedResponse<AsaasNotaFiscal>> => {
  try {
    let url = `asaas-notas-fiscais?page=${page}&limit=${limit}`;

    if (filters) {
      if (filters.id_asaas_unidade_negocio) url += `&id_asaas_unidade_negocio=${filters.id_asaas_unidade_negocio}`;
      if (filters.status) url += `&status=${filters.status}`;
      if (filters.data_competencia_inicio) url += `&data_competencia_inicio=${filters.data_competencia_inicio}`;
      if (filters.data_competencia_fim) url += `&data_competencia_fim=${filters.data_competencia_fim}`;
    }

    const response = await httpClient.get<PaginatedResponse<AsaasNotaFiscal>>(url);
    return response;
  } catch (error) {
    console.error('Erro ao buscar notas fiscais:', error);
    throw error;
  }
};

// Buscar nota fiscal por ID
export const getAsaasNotaFiscalById = async (id: number): Promise<AsaasNotaFiscal> => {
  try {
    const response = await httpClient.get<AsaasNotaFiscal>(`asaas-notas-fiscais/${id}`);
    return response;
  } catch (error) {
    console.error('Erro ao buscar nota fiscal:', error);
    throw error;
  }
};

// Criar nota fiscal
export const createAsaasNotaFiscal = async (data: CreateAsaasNotaFiscalDto): Promise<AsaasNotaFiscal> => {
  try {
    const response = await httpClient.post<AsaasNotaFiscal>('asaas-notas-fiscais', data);
    return response;
  } catch (error) {
    console.error('Erro ao criar nota fiscal:', error);
    throw error;
  }
};

// Cancelar nota fiscal
export const cancelAsaasNotaFiscal = async (id: number, motivo: string): Promise<void> => {
  try {
    await httpClient.put(`asaas-notas-fiscais/cancelar/${id}`, { motivo });
  } catch (error) {
    console.error('Erro ao cancelar nota fiscal:', error);
    throw error;
  }
};

// Sincronizar cobranca com Asaas
export const syncAsaasCobranca = async (id: number): Promise<void> => {
  try {
    await httpClient.put(`asaas-cobrancas/sincronizar/${id}`, {});
  } catch (error) {
    console.error('Erro ao sincronizar cobranca:', error);
    throw error;
  }
};

// Sincronizar nota fiscal com Asaas
export const syncAsaasNotaFiscal = async (id: number): Promise<void> => {
  try {
    await httpClient.put(`asaas-notas-fiscais/sincronizar/${id}`, {});
  } catch (error) {
    console.error('Erro ao sincronizar nota fiscal:', error);
    throw error;
  }
};

// ============================================
// NF HELPER FUNCTIONS
// ============================================

// Obter status NF em portugues
export const getNfStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PROCESSING': 'Processando',
    'SCHEDULED': 'Agendada',
    'AUTHORIZED': 'Autorizada',
    'CANCELLED': 'Cancelada',
    'PROCESSING_CANCELLATION': 'Cancelando',
    'SYNCHRONIZATION_ERROR': 'Erro de sincronizacao',
  };
  return statusMap[status] || status;
};

// Obter cor do status NF
export const getNfStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'PROCESSING': 'bg-blue-100 text-blue-800',
    'SCHEDULED': 'bg-yellow-100 text-yellow-800',
    'AUTHORIZED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'PROCESSING_CANCELLATION': 'bg-orange-100 text-orange-800',
    'SYNCHRONIZATION_ERROR': 'bg-red-100 text-red-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};
