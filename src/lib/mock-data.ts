import type {
  Person,
  BusinessUnit,
  User,
  Port,
  AccountingAccount,
  Operation,
  TransactionType,
  CashAccount,
  BankAgency,
  Transfer,
  PaymentMethod,
  Ship,
  FinancialTransaction,
  ClientBusinessUnit
} from "@/types/types"

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user1",
    email: "admin@prosperium.com",
    name: "Administrador",
    role: "Admin",
    businessUnitId: "bu1",
    businessUnits: ["bu1", "bu2"],
    isFirstAccess: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "user2",
    email: "gerente@prosperium.com",
    name: "João Silva",
    role: "Gerente",
    businessUnitId: "bu1",
    businessUnits: ["bu1"],
    isFirstAccess: false,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15")
  }
]

// Mock Business Units
export const mockBusinessUnits: BusinessUnit[] = [
  {
    id: "bu1",
    code: "001",
    name: "Prosperium Matriz",
    abbreviation: "PROS-MTZ",
    postalCode: "20040-020",
    city: "Rio de Janeiro",
    state: "RJ",
    street: "Rua da Matriz",
    number: "100",
    complement: "Sala 1001",
    neighborhood: "Centro",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "bu2",
    code: "002",
    name: "Prosperium Filial Santos",
    abbreviation: "PROS-STS",
    postalCode: "11013-560",
    city: "Santos",
    state: "SP",
    street: "Avenida Portuária",
    number: "500",
    complement: "",
    neighborhood: "Porto",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
]

// Mock People
export const mockPeople: Person[] = [
  {
    id: "person1",
    code: "CLI001",
    personType: "pj",
    registrationType: "Cliente",
    name: "Vale S.A.",
    email: "contato@vale.com",
    abbreviation: "VALE",
    documentId: "33.592.510/0001-54",
    stateRegistration: "123456789",
    municipalRegistration: "987654321",
    postalCode: "20231-048",
    city: "Rio de Janeiro",
    state: "RJ",
    street: "Praia de Botafogo",
    number: "186",
    complement: "Torre Oscar Niemeyer",
    neighborhood: "Botafogo",
    businessUnitId: "bu1",
    businessUnits: ["bu1"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "person2",
    code: "CLI002",
    personType: "pj",
    registrationType: "Cliente",
    name: "Petrobras",
    email: "contato@petrobras.com.br",
    abbreviation: "PETR",
    documentId: "33.000.167/0001-01",
    stateRegistration: "987654321",
    municipalRegistration: "123456789",
    postalCode: "20031-912",
    city: "Rio de Janeiro",
    state: "RJ",
    street: "Avenida República do Chile",
    number: "65",
    complement: "",
    neighborhood: "Centro",
    businessUnitId: "bu1",
    businessUnits: ["bu1"],
    createdAt: new Date("2024-01-02"),
    updatedAt: new Date("2024-01-02")
  },
  {
    id: "person3",
    code: "FOR001",
    personType: "pj",
    registrationType: "Fornecedor",
    name: "Combustíveis Marinhos Ltda",
    email: "vendas@combustiveismarinhos.com.br",
    abbreviation: "COMBMAR",
    documentId: "11.222.333/0001-44",
    stateRegistration: "111222333",
    municipalRegistration: "444555666",
    postalCode: "11013-560",
    city: "Santos",
    state: "SP",
    street: "Rua do Porto",
    number: "200",
    complement: "Galpão 5",
    neighborhood: "Porto",
    businessUnitId: "bu2",
    businessUnits: ["bu2"],
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03")
  }
]

// Mock Ports
export const mockPorts: Port[] = [
  {
    id: "port1",
    code: "SANTOS",
    name: "Porto de Santos",
    acronym: "STS",
    state: "SP",
    city: "Santos",
    status: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "port2",
    code: "RIO",
    name: "Porto do Rio de Janeiro",
    acronym: "RIO",
    state: "RJ",
    city: "Rio de Janeiro",
    status: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "port3",
    code: "PARANAGUA",
    name: "Porto de Paranaguá",
    acronym: "PNG",
    state: "PR",
    city: "Paranaguá",
    status: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
]

// Mock Ships
export const mockShips: Ship[] = [
  {
    id: "ship1",
    code: "NAV001",
    shipName: "Ocean Explorer",
    flag: "Brasil",
    status: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "ship2",
    code: "NAV002",
    shipName: "Atlantic Pioneer",
    flag: "Libéria",
    status: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "ship3",
    code: "NAV003",
    shipName: "Maritime Spirit",
    flag: "Panamá",
    status: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
]

// Mock Operations
export const mockOperations: Operation[] = [
  {
    id: "op1",
    code: "OP001",
    voyage: "VG2024001",
    shipId: "ship1",
    shipName: "Ocean Explorer",
    portId: "port1",
    portName: "Porto de Santos",
    clientId: "person1",
    clientName: "Vale S.A.",
    businessUnitId: "bu2",
    businessUnitName: "Prosperium Filial Santos",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-02-05"),
    tonnage: 75000,
    description: "Carregamento de minério de ferro",
    billed: true,
    billedAt: new Date("2024-02-06"),
    closedAt: new Date("2024-02-05"),
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-06")
  },
  {
    id: "op2",
    code: "OP002",
    voyage: "VG2024002",
    shipId: "ship2",
    shipName: "Atlantic Pioneer",
    portId: "port2",
    portName: "Porto do Rio de Janeiro",
    clientId: "person2",
    clientName: "Petrobras",
    businessUnitId: "bu1",
    businessUnitName: "Prosperium Matriz",
    startDate: new Date("2024-02-10"),
    endDate: new Date("2024-02-15"),
    tonnage: 50000,
    description: "Descarga de petróleo",
    billed: false,
    billedAt: null,
    closedAt: null,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01")
  }
]

// Mock Accounting Accounts
export const mockAccountingAccounts: AccountingAccount[] = [
  {
    id: "acc1",
    code: "1.1.01.001",
    description: "Caixa",
    taxRegime: "normal",
    accountType: "analitica",
    accountNature: "devedora",
    isActive: true,
    startDate: new Date("2024-01-01"),
    guidelines: "Conta para movimentação de caixa",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "acc2",
    code: "1.1.02.001",
    description: "Banco Conta Movimento",
    taxRegime: "normal",
    accountType: "analitica",
    accountNature: "devedora",
    isActive: true,
    startDate: new Date("2024-01-01"),
    guidelines: "Conta para movimentação bancária",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
]

// Mock Transaction Types
export const mockTransactionTypes: TransactionType[] = [
  {
    id: "tt1",
    code: "ENT001",
    description: "Receita de Serviços",
    type: "entrada",
    taxRegime: "normal",
    sourceAccountId: "acc2",
    sourceAccountCode: "1.1.02.001",
    targetAccountId: "acc1",
    targetAccountCode: "1.1.01.001",
    isActive: true,
    guidelines: "Para lançamento de receitas de serviços prestados"
  },
  {
    id: "tt2",
    code: "SAI001",
    description: "Despesas Operacionais",
    type: "saida",
    taxRegime: "normal",
    sourceAccountId: "acc1",
    sourceAccountCode: "1.1.01.001",
    targetAccountId: "acc2",
    targetAccountCode: "1.1.02.001",
    isActive: true,
    guidelines: "Para lançamento de despesas operacionais"
  }
]

// Mock Cash Accounts
export const mockCashAccounts: CashAccount[] = [
  {
    id: "ca1",
    code: "CC001",
    account: "Caixa Geral",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-01"),
    value: "10000.00",
    income: 50000,
    expense: 25000,
    currentBalance: 35000,
    accountingAccount: "1.1.01.001",
    showInDashboard: true,
    paymentMethods: ["Dinheiro", "PIX"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "ca2",
    code: "BC001",
    account: "Banco do Brasil - CC 12345-6",
    bankAgencyId: "ba1",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-01"),
    value: "50000.00",
    income: 200000,
    expense: 150000,
    currentBalance: 100000,
    accountingAccount: "1.1.02.001",
    showInDashboard: true,
    paymentMethods: ["Transferência", "DOC", "TED"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
   {
    id: "ca3",
    code: "BC001",
    account: "Banco do Brasil - CC 12345-6",
    bankAgencyId: "ba1",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-01"),
    value: "50000.00",
    income: 200000,
    expense: 150000,
    currentBalance: 100000,
    accountingAccount: "1.1.02.001",
    showInDashboard: true,
    paymentMethods: ["Transferência", "DOC", "TED"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
     {
    id: "ca4",
    code: "BC001",
    account: "Banco do Brasil - CC 12345-6",
    bankAgencyId: "ba1",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-01"),
    value: "50000.00",
    income: 200000,
    expense: 150000,
    currentBalance: 100000,
    accountingAccount: "1.1.02.001",
    showInDashboard: true,
    paymentMethods: ["Transferência", "DOC", "TED"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
     {
    id: "ca5",
    code: "BC001",
    account: "Banco do Brasil - CC 12345-6",
    bankAgencyId: "ba1",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-01"),
    value: "50000.00",
    income: 200000,
    expense: 150000,
    currentBalance: 100000,
    accountingAccount: "1.1.02.001",
    showInDashboard: true,
    paymentMethods: ["Transferência", "DOC", "TED"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
    {
    id: "ca6",
    code: "BC001",
    account: "Banco do Brasil - CC 12345-6",
    bankAgencyId: "ba1",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-01"),
    value: "50000.00",
    income: 200000,
    expense: 150000,
    currentBalance: 100000,
    accountingAccount: "1.1.02.001",
    showInDashboard: true,
    paymentMethods: ["Transferência", "DOC", "TED"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
   {
    id: "ca7",
    code: "BC001",
    account: "Banco do Brasil - CC 12345-6",
    bankAgencyId: "ba1",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-01"),
    value: "50000.00",
    income: 200000,
    expense: 150000,
    currentBalance: 100000,
    accountingAccount: "1.1.02.001",
    showInDashboard: true,
    paymentMethods: ["Transferência", "DOC", "TED"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "ca8",
    code: "BC001",
    account: "Banco do Brasil - CC 12345-6",
    bankAgencyId: "ba1",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-01"),
    value: "50000.00",
    income: 200000,
    expense: 150000,
    currentBalance: 100000,
    accountingAccount: "1.1.02.001",
    showInDashboard: true,
    paymentMethods: ["Transferência", "DOC", "TED"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "ca9",
    code: "BC001",
    account: "Banco do Brasil - CC 12345-6",
    bankAgencyId: "ba1",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-01"),
    value: "50000.00",
    income: 200000,
    expense: 150000,
    currentBalance: 100000,
    accountingAccount: "1.1.02.001",
    showInDashboard: true,
    paymentMethods: ["Transferência", "DOC", "TED"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "ca10",
    code: "IT001",
    account: "Itaú - CC 98765-4",
    bankAgencyId: "ba2",
    businessUnitId: "bu2",
    startDate: new Date("2024-02-01"),
    value: "80000.00",
    income: 250000,
    expense: 180000,
    currentBalance: 150000,
    accountingAccount: "1.1.02.002",
    showInDashboard: true,
    paymentMethods: ["PIX", "TED"],
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-03-01")
  },
  {
    id: "ca11",
    code: "NU001",
    account: "Nubank PJ - CC 11223-4",
    bankAgencyId: "ba3",
    businessUnitId: "bu2",
    startDate: new Date("2024-03-01"),
    value: "120000.00",
    income: 320000,
    expense: 200000,
    currentBalance: 240000,
    accountingAccount: "1.1.02.003",
    showInDashboard: true,
    paymentMethods: ["PIX", "Boleto", "Transferência"],
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-04-01")
  },
  {
    id: "ca12",
    code: "SX001",
    account: "Santander - CC 55667-8",
    bankAgencyId: "ba4",
    businessUnitId: "bu3",
    startDate: new Date("2024-01-15"),
    value: "45000.00",
    income: 180000,
    expense: 120000,
    currentBalance: 105000,
    accountingAccount: "1.1.02.004",
    showInDashboard: false,
    paymentMethods: ["DOC", "TED"],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-15")
  },
  {
    id: "ca13",
    code: "CE001",
    account: "Caixa Econômica - CC 33221-0",
    bankAgencyId: "ba5",
    businessUnitId: "bu1",
    startDate: new Date("2024-01-05"),
    value: "25000.00",
    income: 90000,
    expense: 60000,
    currentBalance: 55000,
    accountingAccount: "1.1.02.005",
    showInDashboard: true,
    paymentMethods: ["Dinheiro", "PIX", "Depósito"],
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-03-05")
  },
  {
    id: "ca14",
    code: "IN001",
    account: "Inter PJ - CC 44332-1",
    bankAgencyId: "ba6",
    businessUnitId: "bu4",
    startDate: new Date("2024-02-10"),
    value: "70000.00",
    income: 210000,
    expense: 150000,
    currentBalance: 130000,
    accountingAccount: "1.1.02.006",
    showInDashboard: true,
    paymentMethods: ["PIX", "TED"],
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-04-10")
  },
  {
    id: "ca15",
    code: "IT002",
    account: "Itaú - Aplicações Financeiras",
    bankAgencyId: "ba2",
    businessUnitId: "bu2",
    startDate: new Date("2024-03-01"),
    value: "100000.00",
    income: 50000,
    expense: 20000,
    currentBalance: 130000,
    accountingAccount: "1.1.03.001",
    showInDashboard: false,
    paymentMethods: ["Transferência"],
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-04-15")
  },
  {
    id: "ca16",
    code: "NE001",
    account: "Neon - CC 77889-0",
    bankAgencyId: "ba7",
    businessUnitId: "bu5",
    startDate: new Date("2024-01-20"),
    value: "20000.00",
    income: 80000,
    expense: 30000,
    currentBalance: 70000,
    accountingAccount: "1.1.02.007",
    showInDashboard: true,
    paymentMethods: ["PIX"],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-20")
  },
  {
    id: "ca17",
    code: "BB002",
    account: "Banco do Brasil - Poupança 65432-1",
    bankAgencyId: "ba1",
    businessUnitId: "bu3",
    startDate: new Date("2024-01-01"),
    value: "30000.00",
    income: 60000,
    expense: 10000,
    currentBalance: 80000,
    accountingAccount: "1.1.02.008",
    showInDashboard: false,
    paymentMethods: ["Depósito"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-03-01")
  },
  {
    id: "ca18",
    code: "PF001",
    account: "Petty Cash - Filial São Paulo",
    businessUnitId: "bu6",
    startDate: new Date("2024-01-01"),
    value: "5000.00",
    income: 20000,
    expense: 15000,
    currentBalance: 10000,
    accountingAccount: "1.1.01.002",
    showInDashboard: true,
    paymentMethods: ["Dinheiro"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01")
  },
  {
    id: "ca19",
    code: "ME001",
    account: "Mercado Pago - Conta PJ",
    bankAgencyId: "ba8",
    businessUnitId: "bu2",
    startDate: new Date("2024-02-15"),
    value: "15000.00",
    income: 90000,
    expense: 60000,
    currentBalance: 45000,
    accountingAccount: "1.1.02.009",
    showInDashboard: true,
    paymentMethods: ["PIX", "Cartão"],
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-03-15")
  },
  {
    id: "ca20",
    code: "ME002",
    account: "Mercado Pago - Investimentos",
    bankAgencyId: "ba8",
    businessUnitId: "bu2",
    startDate: new Date("2024-03-01"),
    value: "10000.00",
    income: 40000,
    expense: 5000,
    currentBalance: 45000,
    accountingAccount: "1.1.03.002",
    showInDashboard: false,
    paymentMethods: ["PIX"],
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-30")
  },
  {
    id: "ca21",
    code: "IT003",
    account: "Itaú - Filial Curitiba",
    bankAgencyId: "ba2",
    businessUnitId: "bu7",
    startDate: new Date("2024-02-10"),
    value: "40000.00",
    income: 150000,
    expense: 110000,
    currentBalance: 80000,
    accountingAccount: "1.1.02.010",
    showInDashboard: true,
    paymentMethods: ["TED", "PIX"],
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-04-01")
  },
  {
    id: "ca22",
    code: "BT001",
    account: "BTG Pactual - Conta Investimento",
    bankAgencyId: "ba9",
    businessUnitId: "bu4",
    startDate: new Date("2024-01-01"),
    value: "150000.00",
    income: 50000,
    expense: 10000,
    currentBalance: 190000,
    accountingAccount: "1.1.03.003",
    showInDashboard: false,
    paymentMethods: ["Transferência"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-03-01")
  },
  {
    id: "ca23",
    code: "BB003",
    account: "Banco do Brasil - CC 99999-9",
    bankAgencyId: "ba1",
    businessUnitId: "bu3",
    startDate: new Date("2024-01-05"),
    value: "20000.00",
    income: 75000,
    expense: 50000,
    currentBalance: 45000,
    accountingAccount: "1.1.02.011",
    showInDashboard: true,
    paymentMethods: ["TED"],
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-03-01")
  },
  {
    id: "ca24",
    code: "NU002",
    account: "Nubank - Reserva Operacional",
    bankAgencyId: "ba3",
    businessUnitId: "bu5",
    startDate: new Date("2024-01-10"),
    value: "10000.00",
    income: 50000,
    expense: 10000,
    currentBalance: 50000,
    accountingAccount: "1.1.03.004",
    showInDashboard: false,
    paymentMethods: ["PIX"],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-03-10")
  },
  {
    id: "ca25",
    code: "SF001",
    account: "Safra - CC 10001-2",
    bankAgencyId: "ba10",
    businessUnitId: "bu6",
    startDate: new Date("2024-02-01"),
    value: "30000.00",
    income: 120000,
    expense: 90000,
    currentBalance: 60000,
    accountingAccount: "1.1.02.012",
    showInDashboard: true,
    paymentMethods: ["TED", "DOC"],
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-03-01")
  },
  {
    id: "ca26",
    code: "IT004",
    account: "Itaú - Fundo Garantido",
    bankAgencyId: "ba2",
    businessUnitId: "bu7",
    startDate: new Date("2024-03-01"),
    value: "90000.00",
    income: 10000,
    expense: 2000,
    currentBalance: 98000,
    accountingAccount: "1.1.03.005",
    showInDashboard: false,
    paymentMethods: ["Transferência"],
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-04-01")
  },
  {
    id: "ca27",
    code: "PI001",
    account: "PicPay - Conta Digital",
    bankAgencyId: "ba11",
    businessUnitId: "bu4",
    startDate: new Date("2024-01-20"),
    value: "7000.00",
    income: 25000,
    expense: 15000,
    currentBalance: 17000,
    accountingAccount: "1.1.02.013",
    showInDashboard: true,
    paymentMethods: ["PIX"],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-20")
  },
  {
    id: "ca28",
    code: "AM001",
    account: "Ame Digital - Conta PJ",
    bankAgencyId: "ba12",
    businessUnitId: "bu2",
    startDate: new Date("2024-02-01"),
    value: "6000.00",
    income: 20000,
    expense: 12000,
    currentBalance: 14000,
    accountingAccount: "1.1.02.014",
    showInDashboard: false,
    paymentMethods: ["PIX", "Cartão"],
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-03-01")
  },
  {
    id: "ca29",
    code: "CE002",
    account: "Caixa Econômica - Poupança 55667-8",
    bankAgencyId: "ba5",
    businessUnitId: "bu3",
    startDate: new Date("2024-01-01"),
    value: "10000.00",
    income: 40000,
    expense: 20000,
    currentBalance: 30000,
    accountingAccount: "1.1.02.015",
    showInDashboard: true,
    paymentMethods: ["Depósito", "PIX"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-03-01")
  }
]

// Mock Bank Agencies
export const mockBankAgencies: BankAgency[] = [
  {
    id: "ba1",
    code: "001-001",
    agencyName: "Agência Centro",
    agencyNumber: "0001",
    bankCode: "001",
    bankName: "Banco do Brasil",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "ba2",
    code: "341-001",
    agencyName: "Agência Santos",
    agencyNumber: "0001",
    bankCode: "341",
    bankName: "Itaú Unibanco",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
]

// Mock Payment Methods
export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm1",
    name: "PIX",
    description: "Pagamento instantâneo",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "pm2",
    name: "TED",
    description: "Transferência Eletrônica Disponível",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  },
  {
    id: "pm3",
    name: "Boleto Bancário",
    description: "Pagamento via boleto bancário",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
]

// Mock Transfers
export const mockTransfers: Transfer[] = [
  {
    id: "tr1",
    code: "TRF001",
    date: new Date("2024-02-15"),
    value: "5000.00",
    originAccountId: "ca2",
    destinationAccountId: "ca1",
    description: "Transferência para caixa",
    businessUnitId: "bu1",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15")
  }
]

// Mock Financial Transactions
export const mockFinancialTransactions: FinancialTransaction[] = [
  {
    id: "ft1",
    code: "FT001",
    date: new Date("2024-02-01"),
    dueDate: new Date("2024-02-01"),
    paymentDate: new Date("2024-02-01"),
    description: "Receita da operação OP001",
    value: 75000,
    paidValue: 75000,
    type: "entrada",
    status: "baixado",
    transactionTypeId: "tt1",
    transactionTypeName: "Receita de Serviços",
    cashAccountId: "ca2",
    cashAccountName: "Banco do Brasil - CC 12345-6",
    clientId: "person1",
    clientName: "Vale S.A.",
    businessUnitId: "bu2",
    businessUnitName: "Prosperium Filial Santos",
    operationId: "op1",
    operationCode: "OP001",
    document: "NF001",
    competence: "2024-02",
    paymentMethod: "TED",
    paymentCashAccountId: "ca2",
    createdAt: new Date("2024-02-01"),
    lastUpdatedAt: new Date("2024-02-01")
  },
  {
    id: "ft2",
    code: "FT002",
    date: new Date("2024-02-15"),
    dueDate: new Date("2024-02-20"),
    paymentDate: null,
    description: "Combustível para operação",
    value: 15000,
    paidValue: 0,
    type: "saida",
    status: "pendente",
    transactionTypeId: "tt2",
    transactionTypeName: "Despesas Operacionais",
    cashAccountId: "ca2",
    cashAccountName: "Banco do Brasil - CC 12345-6",
    clientId: "person3",
    clientName: "Combustíveis Marinhos Ltda",
    businessUnitId: "bu2",
    businessUnitName: "Prosperium Filial Santos",
    operationId: "op1",
    operationCode: "OP001",
    document: "NF002",
    competence: "2024-02",
    createdAt: new Date("2024-02-15"),
    lastUpdatedAt: new Date("2024-02-15")
  }
]

// Mock Client Business Units
export const mockClientBusinessUnits: ClientBusinessUnit[] = [
  {
    id: "cbu1",
    code: "CBU001",
    personId: "person1",
    name: "Vale Matriz",
    abbreviation: "VALE-MTZ",
    documentId: "33.592.510/0001-54",
    stateRegistration: "123456789",
    municipalRegistration: "987654321",
    postalCode: "20231-048",
    city: "Rio de Janeiro",
    state: "RJ",
    street: "Praia de Botafogo",
    number: "186",
    complement: "Torre Oscar Niemeyer",
    neighborhood: "Botafogo",
    isHeadquarters: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01")
  }
]

// Helper function to generate unique IDs
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// Helper function to generate timestamp
export const generateTimestamp = (): Date => {
  return new Date()
}