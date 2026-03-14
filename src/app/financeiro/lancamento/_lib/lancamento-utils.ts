import { format, isValid, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { FinancialTransaction } from "@/types/types"

export const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return "-"

  try {
    let date: Date

    if (typeof dateString === "object" && dateString !== null && "seconds" in dateString) {
      // @ts-expect-error Firestore timestamp object
      date = new Date(dateString.seconds * 1000)
    } else if (dateString instanceof Date) {
      date = dateString
    } else if (typeof dateString === "string") {
      date = parseISO(dateString)
    } else {
      return "-"
    }

    if (!isValid(date)) return "-"

    return format(date, "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return "-"
  }
}

export const generateCompetenceCode = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return "-"

  try {
    let date: Date

    if (typeof dateString === "object" && dateString !== null && "seconds" in dateString) {
      // @ts-expect-error Firestore timestamp object
      date = new Date(dateString.seconds * 1000)
    } else if (dateString instanceof Date) {
      date = dateString
    } else if (typeof dateString === "string") {
      date = parseISO(dateString)
    } else {
      return "-"
    }

    if (!isValid(date)) return "-"

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    return `${year}${month.toString().padStart(2, "0")}`
  } catch {
    return "-"
  }
}

export const calculateTotalValueWithAdjustments = (transaction: FinancialTransaction): number => {
  const baseValue = transaction.status === 'baixado' ? (transaction.paidValue ?? transaction.value) : transaction.value
  const adjustments = transaction.jurosDescontoAssociados || []

  if (adjustments.length === 0) return baseValue

  return adjustments.reduce((total, adj) => {
    const adjValue = parseFloat(adj.valor.toString())
    if (adj.tipo === 'juros') {
      return total + adjValue
    } else {
      return total - adjValue
    }
  }, baseValue)
}

export const getSortValue = (transaction: FinancialTransaction, field: string): string | number | Date => {
  switch (field) {
    case 'filial':
      return transaction.empresaAbbreviation || ''
    case 'unidade':
      return transaction.businessUnitAbbreviation || ''
    case 'cliente':
      return transaction.clientName || ''
    case 'competencia':
      return transaction.competence || ''
    case 'documento':
      return transaction.document || ''
    case 'descricao':
      return transaction.description || ''
    case 'natureza':
      return transaction.type
    case 'tipo':
      return transaction.transactionTypeName || ''
    case 'conta':
      return transaction.cashAccountName || ''
    case 'vencimento':
      return transaction.dueDate
    case 'pagamento':
      return transaction.paymentDate || new Date('1900-01-01')
    case 'valor': {
      const totalValue = calculateTotalValueWithAdjustments(transaction)
      return transaction.type === 'saida' ? -Math.abs(totalValue) : totalValue
    }
    default:
      return ''
  }
}

export const SORT_FIELD_LABELS: Record<string, string> = {
  filial: 'Empresa',
  cliente: 'Devedor/Credor',
  competencia: 'Competência',
  documento: 'Documento',
  descricao: 'Descrição',
  natureza: 'Natureza',
  tipo: 'Tipo',
  conta: 'Conta',
  vencimento: 'Vencimento',
  pagamento: 'Pagamento',
  valor: 'Valor',
}
