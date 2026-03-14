// Tipos de resposta da API

export interface ApiPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface ApiResponse<T> {
  data: T
  pagination?: ApiPagination
}

// Tipos específicos para Agências Bancárias
export interface ApiBankAgency {
  id_agencia_bancaria: number
  id_banco: number | null
  nome: string
  nr: string
  id_operador: number
  created_at: string
  updated_at: string
  status: boolean
}

export interface ApiBankAgencyListResponse {
  data: ApiBankAgency[]
  pagination: ApiPagination
}

// Tipos para criação/atualização
export interface CreateBankAgencyDto {
  id_banco?: number | null
  nome: string
  nr: string
  status?: boolean
}

export interface UpdateBankAgencyDto {
  id_banco?: number | null
  nome?: string
  nr?: string
  status?: boolean
}

// Tipos específicos para Contas Caixa
export interface ApiCashAccount {
  id_conta_caixa: number | string
  conta: string
  id_agencia_bancaria?: number | null
  id_pessoa: number
  nome_pessoa?: string
  id_operador: number
  dt_ini_conc_bco: string
  saldo_inicial: string
  saldo_atual?: string
  dashboard: boolean
  status: boolean
  id_conta_contabil: number
  formas_pagamento?: number[]
  is_saldo_admto?: boolean
  saldo?: string | number
  id_operacao?: number | null
  created_at: string
  updated_at: string
}

export interface ApiCashAccountListResponse {
  data: ApiCashAccount[]
  pagination: ApiPagination
}

// Tipos para criação/atualização
export interface CreateCashAccountDto {
  conta: string
  id_agencia_bancaria?: number | null
  id_pessoa: number
  dt_ini_conc_bco: string
  saldo_inicial: string
  dashboard?: boolean
  status?: boolean
  id_conta_contabil: number
  formas_pagamento?: number[]
}

export interface UpdateCashAccountDto {
  conta?: string
  id_agencia_bancaria?: number | null
  id_pessoa?: number
  dt_ini_conc_bco?: string
  saldo_inicial?: string
  dashboard?: boolean
  status?: boolean
  id_conta_contabil?: number
  formas_pagamento?: number[]
}

// Tipos específicos para Unidades de Negócio
export interface ApiBusinessUnit {
  id_un_negocio: number
  apelido: string
  abreviatura: string
  descricao: string | null
  logradouro: string | null
  nr: string | null
  complemento: string | null
  bairro: string | null
  cep: number | null
  cidade: string | null
  uf: string | null
  id_municipio: number | null
  status: boolean
  created_at: string
  updated_at: string
}

export interface ApiBusinessUnitListResponse {
  data: ApiBusinessUnit[]
  pagination: ApiPagination
}

// Tipos específicos para Formas de Pagamento
export interface ApiPaymentMethod {
  id_forma_pgto: number
  nome: string
  descricao: string | null
  id_operador: number
  status: boolean
  created_at: string
  updated_at: string
}

export interface ApiPaymentMethodListResponse {
  data: ApiPaymentMethod[]
  pagination: ApiPagination
}

// Tipos para criação/atualização
export interface CreatePaymentMethodDto {
  nome: string
  tipo?: string
  descricao?: string
  status?: boolean
  operadora?: string | null
  dia_fechamento?: number | null
  dia_vencimento?: number | null
  limite_credito?: number | null
  id_conta_caixa_pagamento?: number | null
}

export interface UpdatePaymentMethodDto {
  nome?: string
  tipo?: string
  descricao?: string
  status?: boolean
  operadora?: string | null
  dia_fechamento?: number | null
  dia_vencimento?: number | null
  limite_credito?: number | null
  id_conta_caixa_pagamento?: number | null
}

// Tipos específicos para Contas Contábeis
export interface ApiAccountingAccount {
  id_conta_contabil: number
  regime_tributario: number
  codigo: string
  exibicao: string
  descricao: string
  abreviatura: string | null
  dt_ini: string
  dt_fim: string
  tipo: string
  conta_superior: string | null
  nivel: number
  natureza: number
  orientacoes: string
  status: boolean
  exibir_lancamentos: boolean
  id_integracao: number | null
  created_at: string
  updated_at: string
}

export interface ApiAccountingAccountListResponse {
  data: ApiAccountingAccount[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

// Tipos para criação/atualização
export interface CreateAccountingAccountDto {
  regime_tributario: number
  codigo: string
  descricao: string
  dt_ini: string
  tipo: string
  conta_superior?: string | null
  natureza: number
  orientacoes?: string
  status?: boolean
  id_integracao?: number | null
}

export interface UpdateAccountingAccountDto {
  regime_tributario?: number
  codigo?: string
  descricao?: string
  dt_ini?: string
  tipo?: string
  conta_superior?: string | null
  natureza?: number
  orientacoes?: string
  status?: boolean
  exibir_lancamentos?: boolean
  id_integracao?: number | null
}

// Tipos específicos para Navios
export interface ApiShip {
  id_navio: number
  nome: string
  id_pais: number
  id_operador: number
  status: boolean
  created_at: string
  updated_at: string
}

export interface ApiShipListResponse {
  data: ApiShip[]
  pagination: ApiPagination
}

// Tipos para criação/atualização
export interface CreateShipDto {
  nome: string
  id_pais: number
  status?: boolean
}

export interface UpdateShipDto {
  nome?: string
  id_pais?: number
  status?: boolean
}

// Tipos específicos para Portos
export interface ApiPort {
  id_porto: number
  nome: string
  sigla: string
  id_municipio: number
  id_operador: number
  status: boolean
  created_at: string
  updated_at: string
}

export interface ApiPortListResponse {
  data: ApiPort[]
  pagination: ApiPagination
}

// Tipos para criação/atualização
export interface CreatePortDto {
  nome: string
  sigla: string
  id_municipio: number
  status?: boolean
}

export interface UpdatePortDto {
  nome?: string
  sigla?: string
  id_municipio?: number
  status?: boolean
}

// Tipos específicos para Operações
export interface ApiOperation {
  id_operacao: number
  descricao: string
  id_navio: number
  navio_nome?: string | null
  viagem: string
  operacao_label?: string | null
  id_un_negocio: number
  id_cliente: number
  id_porto: number
  dt_inicio: string
  dt_final: string | null
  encerrada: string | null // Campo para data de encerramento manual
  tons: string | number
  status: boolean
  created_at: string
  updated_at: string
}

export interface ApiOperationListResponse {
  data: ApiOperation[]
  pagination?: ApiPagination
}

// Tipos de Lançamento (tp_lctos table)
export interface ApiTipoLancamento {
  id_tp_lcto: number
  nome: string
  natureza: number // 1 = Entrada, 2 = Saída
  id_conta_contabil: number | null
  id_contra_partida: number | null
  marcador: string | null
  nivel: number | null
  id_plano_conta: number
  id_operador: number
  descricao: string | null
  status: boolean
  created_at: string
  updated_at: string
}

export interface ApiTipoLancamentoListResponse {
  data: ApiTipoLancamento[]
  pagination: ApiPagination
}

export interface CreateTipoLancamentoDto {
  nome: string
  natureza: number // 1 = Entrada, 2 = Saída
  id_conta_contabil?: number | null
  id_contra_partida?: number | null
  marcador?: string | null
  nivel?: number | null
  descricao?: string | null
  status?: boolean
}

export interface UpdateTipoLancamentoDto {
  nome?: string
  natureza?: number
  id_conta_contabil?: number | null
  id_contra_partida?: number | null
  marcador?: string | null
  nivel?: number | null
  descricao?: string | null
  status?: boolean
}

// Legacy aliases kept for backward compatibility
export type ApiTransactionType = ApiTipoLancamento
export type ApiTransactionTypeListResponse = ApiTipoLancamentoListResponse
export type CreateTransactionTypeDto = CreateTipoLancamentoDto
export type UpdateTransactionTypeDto = UpdateTipoLancamentoDto

// Tipos específicos para Pessoas
export interface ApiPerson {
  id_pessoa: number
  nome: string
  email: string | null
  abreviatura: string | null
  id_tipo_pessoa: number | null
  cnpj_cpf: string | null
  inscricao_estadual_rg: string | null
  inscricao_municipal: string | null
  cep: string | null
  cidade: string | null
  id_municipio: number | null
  uf: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  id_tipo_cadastro: number
  regime_tributario: number | null
  id_operador: number
  id_user: number | null
  status: boolean
  created_at: string
  updated_at: string
}

export interface ApiPersonListResponse {
  data: ApiPerson[]
  pagination?: ApiPagination
}

// Tipos para criação/atualização
export interface CreatePersonDto {
  nome: string
  email?: string
  abreviatura?: string
  id_tipo_pessoa?: number
  cnpj_cpf?: string
  inscricao_estadual_rg?: string
  inscricao_municipal?: string
  cep?: string
  cidade?: string
  id_municipio?: number
  uf?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  id_tipo_cadastro: number
  regime_tributario?: number
  status?: boolean
  id_operador?: number
}

export interface UpdatePersonDto {
  nome?: string
  email?: string
  abreviatura?: string
  id_tipo_pessoa?: number
  cnpj_cpf?: string
  inscricao_estadual_rg?: string
  inscricao_municipal?: string
  cep?: string
  cidade?: string
  id_municipio?: number
  uf?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  id_tipo_cadastro?: number
  regime_tributario?: number
  status?: boolean
  id_operador?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Cartão de Crédito
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiCartao {
  id_cartao: number
  apelido: string
  operadora: string
  dia_fechamento: number
  dia_vencimento: number
  id_conta_caixa_pagamento: number
  conta_caixa_pagamento_nome?: string | null
  limite_credito: string
  id_conta_contabil_passivo: number
  id_un_negocio: number
  id_operador: number
  status: boolean
  limite_disponivel?: string | null
  total_passivo_aberto?: string | null
  created_at: string
  updated_at: string
}

export interface ApiCartaoListResponse {
  data: ApiCartao[]
  pagination: ApiPagination
}

export interface ApiItemFatura {
  id_item_fatura: number
  id_fatura: number
  id_lcto: number
  id_lcto_passivo: number | null
  parcela_num: number
  parcela_total: number
  valor: string
  status: string
  dt_conciliacao: string | null
  descricao?: string | null
  data_compra?: string | null
  numero_documento?: string | null
  created_at: string
}

export interface ApiFaturaCartao {
  id_fatura: number
  id_cartao: number
  cartao_apelido: string | null
  cartao_operadora: string | null
  competencia: number
  dt_fechamento: string
  dt_vencimento: string
  valor_total: string
  valor_pago: string
  saldo_restante: string
  status: string
  id_lcto_pagamento: number | null
  id_un_negocio: number
  itens?: ApiItemFatura[]
  created_at: string
  updated_at: string
}

export interface ApiFaturaListResponse {
  data: ApiFaturaCartao[]
  pagination: ApiPagination
}

export interface ApiCostCenterAllocation {
  id: number
  code?: string | null
  name?: string | null
  description?: string | null
  parent_id?: number | null
  is_active?: boolean
  percent: number
  amount?: string
}

export interface ApiCostCenterNode {
  id_cost_center: number
  id_empresa: number
  code: string
  name: string
  description?: string | null
  parent_id?: number | null
  is_active: boolean
  is_analytic: boolean
  path: string
  children: ApiCostCenterNode[]
}

export interface ApiCompraCartaoResult {
  message: string
  id_lcto_origem: number
  id_plano_parcela: number | null
  parcelas: Array<{
    num: number
    id_lcto: number
    competencia: number
    valor: number
  }>
  valor_total: number
}

export interface ApiPagarFaturaResult {
  message: string
  id_lcto_pagamento: number
  valor_pago: number
  saldo_restante: number
  status_fatura: string
  id_lcto_rotativo?: number
  aviso?: string
}
