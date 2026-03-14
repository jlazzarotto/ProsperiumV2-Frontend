/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock document snapshot type
export type DocumentSnapshot = {
  id: string
  data: () => any
  exists: () => boolean
}

export type RegistrationType =
  | "Cliente"
  | "Fornecedor"
  | "Colaborador"
  | "Supervisor"
  | "Coordenador"
  | "Gerente"
  | "Diretor"
  | "Admin"

export type PersonType = "pf" | "pj"


export interface Person {
  id?: string
  code: string
  personType: PersonType
  registrationType: RegistrationType
  name: string
  email: string // Adicionado campo de email
  abbreviation: string
  documentId: string
  stateRegistration: string
  municipalRegistration: string
  postalCode: string
  city: string
  cityId?: number
  state: string
  street: string
  number: string
  complement: string
  neighborhood: string
  businessUnitId: string // Reference to the primary business unit
  businessUnits?: string[] // Array of associated business unit IDs
  createdAt?: Date
  updatedAt?: Date
}

export interface CNPJResponse {
  cnpj: string
  razao_social: string
  nome_fantasia: string
  email: string
  telefone: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
}

export interface BusinessUnit {
  id?: string
  code: string
  name: string
  abbreviation: string
  description?: string
  postalCode: string
  city: string
  state: string
  street: string
  number: string
  complement: string
  neighborhood: string
  createdAt?: Date
  updatedAt?: Date
}

export interface BusinessUnitType8 {
  id?: string
  nome: string
  apelido: string
  cnpj?: string
  ie?: string
  im?: string
  abreviatura?: string
  logradouro?: string
  nr?: string
  complemento?: string
  bairro?: string
  cep?: string
  cidade?: string
  uf?: string
  idMunicipio?: number
  pessoaProprietaria?: string
  status?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface User {
  id?: string
  email: string
  name: string
  role: RegistrationType
  businessUnitId: string // Default business unit
  businessUnits: string[] // Array of business units the user can access
  personId?: string // Reference to the person record
  isFirstAccess?: boolean // Flag for first access
  createdAt?: Date
  updatedAt?: Date
}


export interface UserPermission {
  id?: string
  userId: string
  businessUnitId: string
  permissions: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Port {
  id?: string
  code: string
  name: string
  acronym: string
  state: string
  city: string
  cityId?: number
  status: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface AccountingAccount {
  id?: string
  code: string
  description: string
  parentAccountId?: string
  parentAccountCode?: string
  taxRegime: "normal" | "simplified" // normal (Lucro real ou presumido) ou simplified (simples nacional ou MEI)
  accountType: "sintetica" | "analitica" // Sintética ou Analítica
  accountNature: "credora" | "devedora" // Credora ou Devedora
  isActive: boolean // Ativo no plano de contas
  startDate: Date // Data de início
  guidelines: string // Orientações
  integrationId?: number | null // ID de integração com sistema externo
  exibirLancamentos?: boolean // Se aparece no dropdown de Conta Contábil em lançamentos/DRE
  createdAt?: Date
  updatedAt?: Date
}

export interface Operation {
  id?: string
  code?: string
  operationLabel?: string
  voyage?: string
  shipId?: string
  shipName?: string
  portId?: string
  portName?: string
  clientId?: string
  clientName?: string
  clientBusinessUnitId?: string // ID da unidade de negócio do cliente
  businessUnitId?: string
  businessUnitName?: string
  startDate?: Date | null
  endDate?: Date | null
  tons?: number // Toneladas da operação
  tonnage?: number // Manter para compatibilidade
  description?: string
  status?: boolean | number // 1 = ativo, 0 = inativo (API espera integer)
  billed?: boolean
  billedAt?: Date | null
  closedAt?: Date | null // Nova propriedade para data de encerramento
  createdAt?: Date
  updatedAt?: Date
}




export interface TransactionType {
  id?: string
  code: string
  description: string
  type: "entrada" | "saida"
  taxRegime: "normal" | "simplified" | "todos"
  sourceAccountId: string
  sourceAccountCode: string
  targetAccountId: string
  targetAccountCode: string
  isActive: boolean
  guidelines: string
}


export interface AccountingEntryType {
  id?: string
  code: string
  description: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}


export interface CashAccount {
  id?: string
  code: string
  account: string
  isSaldoAdmto?: boolean
  isCompensacaoCredito?: boolean
  saldoAdmtoIdOperacao?: number | null
  saldoAdmtoValor?: number | null
  bankAgencyId?: string
  businessUnitId: string
  personName?: string // Nome da pessoa/empresa dona da conta
  startDate: Date
  value: string // Valor inicial
  income?: number // Total de entradas
  expense?: number // Total de saídas
  currentBalance?: number // Saldo atual (value + income - expense)
  accountingAccount: string
  showInDashboard: boolean
  paymentMethods?: string[]
  createdAt?: Date
  updatedAt?: Date
}
// Novas interfaces para os novos CRUDs
export interface Bank {
  id: string
  code: string
  name: string
  fullName: string
  ispb: string
}

// export interface BankAccount {

// }

export interface BankAgency {
  [x: string]: any
  id?: string
  code: string
  agencyName: string
  agencyNumber: string
  bankCode: string
  bankName: string
  createdAt?: Date
  updatedAt?: Date
}

// Adicionando interface para transferências
export interface Transfer {
  id?: string
  code: string
  date: Date
  value: string
  originAccountId: string
  destinationAccountId: string
  description?: string
  transactionTypeId?: string
  businessUnitId?: string
  origem?: string // Banco + Agência + Conta formatado
  destino?: string // Banco + Agência + Conta formatado
  id_lancamento_origem?: string // ID do lançamento de débito
  id_lancamento_destino?: string // ID do lançamento de crédito
  createdAt?: Date
  updatedAt?: Date
}



export type FormaPgtoTipo = 'fatura' | 'liquidacao_bancaria_imediata' | 'titulo_bancario' | 'titulo_proprio' | 'a_vista' | 'cartao_credito'

export interface PaymentMethod {
  id?: string
  idFormaPgto?: string
  name: string
  tipo?: FormaPgtoTipo
  isSaldoAdmto?: boolean
  saldoAdmtoIdOperacao?: number | null
  saldoAdmtoValor?: number | null
  permutadoTipo?: number | null
  description: string
  active: boolean
  // Campos de cartão de crédito/débito
  operadora?: string | null
  dia_fechamento?: number | null
  dia_vencimento?: number | null
  limite_credito?: number | null
  id_conta_caixa_pagamento?: number | null
  createdAt?: Date
  updatedAt?: Date
}

export interface Ship {
  id?: string
  code: string
  shipName: string
  flag: string
  status: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface TransactionFilter {
  startDate?: Date | null
  endDate?: Date | null
  dateField?: string
  searchField?: string
  clientId?: string
  businessUnitId?: string
  cashAccountId?: string
  transactionTypeId?: string
  operationId?: string
  recurrenceSeriesId?: string
  type?: "entrada" | "saida" | "todos"
  status?: "pendente" | "baixado" | "cancelado" | "todos"
  competence?: string
}


export interface FinancialTransaction {
  id?: string
  code?: string
  date: Date
  dueDate: Date
  paymentDate?: Date | null
  description: string
  value: number
  paidValue?: number // Valor efetivamente pago (pode ser diferente do valor original)
  type: "entrada" | "saida"
  status: "pendente" | "baixado" | "cancelado"
  transactionTypeId: string
  transactionTypeName: string
  isAtivoPermuta?: boolean
  cashAccountId: string
  cashAccountName: string
  permutado?: number | boolean
  clientId?: string
  clientName?: string
  businessUnitId?: string
  businessUnitName?: string
  businessUnitAbbreviation?: string
  operationId?: string
  operationCode?: string
  document?: string
  competence?: string
  paymentMethod?: string
  paymentCashAccountId?: string
  paymentDescription?: string
  paidByUserId?: string
  cancelReason?: string
  recurrenceSeriesId?: string
  installmentNumber?: number
  // Novas propriedades de recorrência
  isRecurrent?: boolean
  recurrenceId?: number | null
  isRecurrenceInstallment?: boolean
  currentInstallment?: number | null
  totalInstallments?: number | null
  isJurosMulta?: boolean
  isJurosDesconto?: boolean
  // Informações de juros/desconto
  jurosDescontoAssociados?: Array<{
    id: number
    valor: string
    descricao: string
    data_pagamento: string
    tipo: 'juros' | 'desconto'
    natureza: 'entrada' | 'saida'
  }>
  // Informações de anexos
  totalAnexos?: number
  hasAttachments?: boolean
  empresaId?: string
  empresaName?: string
  empresaAbbreviation?: string
  idCartao?: number | null
  idFatura?: number | null
  idPlanoParcela?: number | null
  parcelaNum?: number | null
  nomeCartao?: string | null
  competenciaFatura?: number | null
  statusFatura?: string | null
  valorTotalFatura?: number | null
  idLctoPagamentoFatura?: number | null
  parcelasAgrupadas?: FinancialTransaction[]
  itensFatura?: FinancialTransaction[]
  isFaturaRow?: boolean
  createdAt?: any
  lastUpdatedAt?: any
  idTpLcto?: number | null
  idTransferencia?: number | null
  isTransferencia?: boolean
}

export interface AccountsReceivable {
  id: string
  businessUnitId: string
  description: string
  amount: number | string
  dueDate: Date
  personId?: string
  personName?: string
  paid: boolean
  paymentDate?: Date
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface RecurrenceSeries {
  id: string
  code: string
  name?: string
  description?: string
  frequency: string
  totalInstallments: number
  createdAt: any
  createdBy?: string
}

export interface ClientBusinessUnit {
  id?: string
  code: string
  personId: string // ID da pessoa (cliente/fornecedor) principal
  name: string
  abbreviation: string
  documentId: string
  stateRegistration: string
  municipalRegistration: string
  postalCode: string
  city: string
  state: string
  street: string
  number: string
  complement: string
  neighborhood: string
  isHeadquarters: boolean // Indica se é a matriz
  createdAt?: Date
  updatedAt?: Date
}

export interface AccountsPayable {
  id: string
  businessUnitId: string
  description: string
  amount: number | string
  dueDate: Date
  supplierId?: string
  supplierName?: string
  paid: boolean
  paymentDate?: Date
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}
// Example definition of DreData
export interface DreData {
  id: string
  name: string
  company: string
  cnpj: string
  period: string
  createdAt: string
  updatedAt: string
  data: Record<string, any> // Adjust this type based on your actual data structure
}

// API Transaction interfaces
export interface ApiTransaction {
  id_lancamento: number
  id_conta_contabil: number
  id_conta_caixa: number | null
  id_pessoa: number
  id_un_negocio: number
  id_porto: number | null
  id_navio: number | null
  numero_documento: string | null
  descricao: string
  valor: string
  data_lancamento: string
  data_vencimento: string
  data_pagamento: string | null
  observacoes: string | null
  anexos: string | null
  status: boolean
  natureza: 'entrada' | 'saida'
  competencia: number
  id_recorrencia: number | null
  created_at: string
  updated_at: string
}


// Lançamentos Financeiros
export interface CostCenterAllocation {
  id: number
  code?: string | null
  name?: string | null
  description?: string | null
  parent_id?: number | null
  is_active?: boolean
  percent: number
  amount?: string | number
}

export interface CostCenterNode {
  id_cost_center: number
  id_empresa: number
  code: string
  name: string
  description?: string | null
  parent_id?: number | null
  is_active: boolean
  is_analytic: boolean
  path: string
  children: CostCenterNode[]
}

export interface Lancamento {
  id_lancamento?: number
  id_tp_lcto?: number | null
  id_conta_contabil: number
  is_ativo_permuta?: boolean
  id_conta_caixa: number
  conta_caixa_nome?: string | null
  id_pessoa: number
  id_emissor?: number
  id_un_negocio: number
  id_empresa?: number | null
  id_porto?: number | null
  id_navio?: number | null
  id_operacao?: number | null
  numero_documento?: string | null
  descricao: string
  valor: string | number
  vlr_pgto?: string | number
  data_lancamento: string
  data_vencimento: string
  data_pagamento?: string | null
  observacoes?: string | null
  anexos?: string | null
  status: boolean | 'pendente' | 'baixado'
  natureza: 'entrada' | 'saida'
  tipo_nome?: string | null
  is_transferencia?: boolean
  id_transferencia?: number | null
  competencia?: number | null
  id_recorrencia?: number | null
  id_juros_desconto?: number | null
  id_forma_pgto_conta_caixa?: number | null
  permutado?: number | boolean
  juros_desconto_associados?: Array<{
    id: number
    valor: string
    descricao: string
    data_pagamento: string
    tipo: 'juros' | 'desconto'
    natureza: 'entrada' | 'saida'
  }>
  custeio?: boolean
  centros_custo?: CostCenterAllocation[]
  id_cartao?: number | null
  id_fatura?: number | null
  id_plano_parcela?: number | null
  parcela_num?: number | null
  nome_cartao?: string | null
  competencia_fatura?: number | null
  status_fatura?: string | null
  valor_total_fatura?: string | number | null
  id_lcto_pagamento_fatura?: number | null
  // Informações de anexos
  total_anexos?: number
  has_attachments?: boolean
  created_at?: string
  updated_at?: string
}

export interface LancamentoListResponse {
  data: Lancamento[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface LancamentoFilter {
  page?: number
  limit?: number
  search?: string
  id_empresa?: number | null
  id_tp_lcto?: number
  id_conta_contabil?: number
  id_conta_caixa?: number
  id_pessoa?: number
  id_un_negocio?: number
  id_porto?: number
  id_navio?: number
  status?: 'baixado' | 'pendente'
  natureza?: 'entrada' | 'saida'
  data_inicio?: string
  data_fim?: string
  competencia?: number
  data_vencimento_inicio?: string
  data_vencimento_fim?: string
  data_pagamento_inicio?: string
  data_pagamento_fim?: string
  tipoData?: string
  valor_min?: number
  valor_max?: number
  valor_reajustado_min?: number
  valor_reajustado_max?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface BaixaLancamento {
  data_pgto: string
  valor: number
  conta_caixa?: number
  forma_pagamento?: number
  descricao: string
  baixa_parcial?: boolean
  id_cartao?: number
  parcelas?: number
  valor_parcela?: number
}

export interface LancamentoStats {
  id_conta_caixa: number
  saldo_atual: string
  estatisticas: Array<{
    status: boolean
    total: string
    quantidade: number
  }>
}

export interface SaldoAdmtoResult {
  id_emissor: number
  id_operacao: number | null
  saldo: string
}

export interface ExtratoFinanceiro {
  relatorio: string
  periodo: {
    data_inicio: string
    data_fim: string
    competencia: number | null
  }
  resumo: {
    total_credito: string
    total_debito: string
    total_pago: string
    total_pendente: string
    saldo: string
  }
  detalhes: Array<{
    id_lancamento: number
    descricao: string
    valor: string
    natureza: 'entrada' | 'saida'
    status: boolean
    data_lancamento: string
    data_vencimento: string
    data_pagamento: string | null
    numero_documento: string | null
    observacoes: string | null
  }>
  total_registros: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Módulo: Cartão de Crédito
// ─────────────────────────────────────────────────────────────────────────────

export type FaturaStatus = 'aberta' | 'fechada' | 'paga' | 'parcial' | 'em_atraso'
export type ItemFaturaStatus = 'registrado' | 'em_fatura' | 'conciliado' | 'estornado'
export type PlanoParcelaStatus = 'ativo' | 'quitado' | 'cancelado'

export interface Cartao {
  id_cartao?: number
  apelido: string
  operadora: string
  dia_fechamento: number
  dia_vencimento: number
  id_conta_caixa_pagamento: number
  conta_caixa_pagamento_nome?: string
  limite_credito: string | number
  id_conta_contabil_passivo: number
  id_un_negocio: number
  status: boolean
  limite_disponivel?: string | number
  total_passivo_aberto?: string | number
  created_at?: string
  updated_at?: string
}

export interface FaturaCartao {
  id_fatura?: number
  id_cartao: number
  cartao_apelido?: string
  cartao_operadora?: string
  competencia: number
  dt_fechamento: string
  dt_vencimento: string
  valor_total: string | number
  valor_pago: string | number
  saldo_restante?: string | number
  status: FaturaStatus
  id_lcto_pagamento?: number | null
  id_un_negocio: number
  itens?: ItemFatura[]
  created_at?: string
  updated_at?: string
}

export interface ItemFatura {
  id_item_fatura?: number
  id_fatura: number
  id_lcto: number
  id_lcto_passivo?: number | null
  parcela_num: number
  parcela_total: number
  valor: string | number
  status: ItemFaturaStatus
  dt_conciliacao?: string | null
  // Campos enriquecidos do lançamento
  descricao?: string
  data_compra?: string
  numero_documento?: string | null
  created_at?: string
}

export interface PlanoParcela {
  id_plano?: number
  id_lcto_origem: number
  id_cartao: number
  qtde_parcelas: number
  descricao?: string | null
  status: PlanoParcelaStatus
  id_un_negocio: number
}

export interface CompraCartaoPayload {
  id_cartao: number
  id_conta_contabil: number
  descricao: string
  valor: number
  data_compra: string
  parcelas?: number
  id_pessoa?: number | null
  id_un_negocio?: number | null
  numero_documento?: string | null
  observacoes?: string | null
}

export interface PagarFaturaPayload {
  valor: number
  data_pgto: string
  id_conta_caixa?: number | null
  id_forma_pgto_conta_caixa?: number | null
  descricao?: string | null
}

export interface FecharFaturaPayload {
  id_cartao: number
  competencia?: number
}

export interface CartaoFilter {
  page?: number
  limit?: number
  search?: string
  id_un_negocio?: number
  status?: boolean
}

export interface FaturaFilter {
  page?: number
  limit?: number
  id_cartao?: number
  status?: FaturaStatus
  competencia?: number
  id_un_negocio?: number
}

export interface ImportResultItem {
  csv: Record<string, string>
  id_item?: number
  id_lcto?: number
  status: string
  motivo?: string
}

export interface ImportResult {
  conciliados: number
  pendentes: number
  divergentes: number
  detalhe: {
    conciliados: ImportResultItem[]
    pendentes: ImportResultItem[]
    divergentes: ImportResultItem[]
  }
}
