/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { MainHeader } from "@/components/main-header"
import { ChevronRight, CircleDollarSign, Download, FileText, Filter, Printer, RefreshCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/date-picker"
import { FilterDrawer } from "@/components/filter-drawer"
import { BankAccountsDrawer } from "@/components/bank-accounts-drawer"

import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

const financialEntries = [
  {
    id: 1,
    unidade: "MATRIZ",
    comp: "202408",
    devedorCredor: "UNI-Z - EDLOG & ZPORT OPERAÇÕES PORTUARIAS LTDA",
    doc: "2017",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Locação de maquina (movimentação funil)",
    vencimento: "22/08/2024",
    pagamento: "-",
    valor: 55000.0,
    codigo: "20278",
    dataEmissao: "08/08/2024",
    unidadeNegocio: "SERVIÇOS/BCN [SERBCN]",
    docNr: "2017",
    operacao: "Ahsoka | OP000",
    descricao: "TONS: 25.021,297",
  },
  {
    id: 2,
    unidade: "SERBCN",
    comp: "202409",
    devedorCredor: "UNI-Z - EDLOG & ZPORT OPERAÇÕES PORTUARIAS LTDA",
    doc: "2039",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Locação de maquina (movimentação funil)",
    vencimento: "17/09/2024",
    pagamento: "-",
    valor: 29686.12,
  },
  {
    id: 3,
    unidade: "SERBCN",
    comp: "202409",
    devedorCredor: "UNI-Z - EDLOG & ZPORT OPERAÇÕES PORTUARIAS LTDA",
    doc: "2041",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Prancha (caminhão)",
    vencimento: "17/09/2024",
    pagamento: "-",
    valor: 4000.0,
  },
  {
    id: 4,
    unidade: "SERBCN",
    comp: "202409",
    devedorCredor: "UNI-Z - EDLOG & ZPORT OPERAÇÕES PORTUARIAS LTDA",
    doc: "2040",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Operação(locação de material de estiva)",
    vencimento: "17/09/2024",
    pagamento: "-",
    valor: 18144.27,
  },
  {
    id: 5,
    unidade: "LOCSFS",
    comp: "202409",
    devedorCredor: "ZPORT - ELEVA QUIMICA LTDA",
    doc: "2055",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Operação(locação de material de estiva)",
    vencimento: "20/09/2024",
    pagamento: "-",
    valor: 110000.0,
  },
  {
    id: 6,
    unidade: "SERSTM",
    comp: "202409",
    devedorCredor: "BANCO DO BRASIL",
    doc: "NULL",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Rendimentos Aplicações Financeiras",
    vencimento: "29/09/2024",
    pagamento: "-",
    valor: 6.68,
  },
  {
    id: 7,
    unidade: "SERSTM",
    comp: "202409",
    devedorCredor: "M A F ANGELO LTDA P7 CARNES",
    doc: "2053",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Adiantamento de clientes",
    vencimento: "30/09/2024",
    pagamento: "-",
    valor: 13048.21,
  },
  {
    id: 8,
    unidade: "SERSTM",
    comp: "202409",
    devedorCredor: "MASTER OPERAÇÕES PORTUÁRIAS LTDA (STM)",
    doc: "2060",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Operação(locação de material de estiva)",
    vencimento: "03/10/2024",
    pagamento: "-",
    valor: 20999.66,
  },
  {
    id: 9,
    unidade: "SERSTM",
    comp: "202409",
    devedorCredor: "MASTER OPERAÇÕES PORTUÁRIAS LTDA (STM)",
    doc: "2059",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Locação de maquina (movimentação funil)",
    vencimento: "03/10/2024",
    pagamento: "-",
    valor: 45315.06,
  },
  {
    id: 10,
    unidade: "SERBCN",
    comp: "202410",
    devedorCredor: "UNI-Z - EDLOG & ZPORT OPERAÇÕES PORTUARIAS LTDA",
    doc: "NULL",
    conta: "-",
    natureza: "Entrada",
    tipoLancamento: "Take or Pay",
    vencimento: "15/10/2024",
    pagamento: "-",
    valor: 55000.0,
  },
]

// Mock data for bank accounts
const bankAccounts = [
  {
    id: 1,
    bank: "Banco do Brasil",
    agency: "0102-3",
    account: "89.408-7",
    balance: 281914.74,
    icon: "/placeholder.svg?height=48&width=48",
  },
  {
    id: 2,
    bank: "Banco do Brasil",
    agency: "0102-3",
    account: "86.210-0",
    balance: 330518.44,
    icon: "/placeholder.svg?height=48&width=48",
  },
  {
    id: 3,
    bank: "Caixa",
    agency: "0466-9",
    account: "26092-4",
    balance: 52140.63,
    icon: "/placeholder.svg?height=48&width=48",
  },
  {
    id: 4,
    bank: "Tesouraria",
    agency: "0000",
    account: "Tesouraria",
    balance: 0,
    icon: "/placeholder.svg?height=48&width=48",
  },
  {
    id: 5,
    bank: "Tesouraria",
    agency: "0000",
    account: "Tesouraria",
    balance: 0,
    icon: "/placeholder.svg?height=48&width=48",
  },
  {
    id: 6,
    bank: "Sicredi",
    agency: "2602",
    account: "67055-5",
    balance: 7906.96,
    icon: "/placeholder.svg?height=48&width=48",
  },
  {
    id: 7,
    bank: "Sicredi",
    agency: "2602",
    account: "14361-5",
    balance: 63181.74,
    icon: "/placeholder.svg?height=48&width=48",
  },
  {
    id: 8,
    bank: "Sicredi",
    agency: "2602",
    account: "16393-9",
    balance: 57140.4,
    icon: "/placeholder.svg?height=48&width=48",
  },
  {
    id: 9,
    bank: "Banco do Brasil",
    agency: "0102-3",
    account: "Cartão de Crédito",
    balance: 0,
    icon: "/placeholder.svg?height=48&width=48",
  },
  {
    id: 10,
    bank: "Banco do Brasil",
    agency: "0102-3",
    account: "Aplicação Automática",
    balance: 28354.96,
    icon: "/placeholder.svg?height=48&width=48",
  },
]

// Form schema for editing an entry
const editFormSchema = z.object({
  codigo: z.string(),
  dataEmissao: z.date(),
  dataVencimento: z.date(),
  unidadeNegocio: z.string(),
  natureza: z.string(),
  tipoLancamento: z.string(),
  devedorCredor: z.string(),
  unidade: z.string(),
  valor: z.string(),
  docNr: z.string(),
  operacao: z.string(),
  descricao: z.string(),
})

// Add these functions before the FinancialReport component
function exportToExcel(data: typeof financialEntries, fileName: string) {
  // Convert data to worksheet format
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((entry) => ({
      UNIDADE: entry.unidade,
      COMPETÊNCIA: entry.comp,
      "DEVEDOR/CREDOR": entry.devedorCredor,
      DOCUMENTO: entry.doc,
      CONTA: entry.conta,
      NATUREZA: entry.natureza,
      "TIPO LANÇAMENTO": entry.tipoLancamento,
      VENCIMENTO: entry.vencimento,
      PAGAMENTO: entry.pagamento || "-",
      "VALOR R$": entry.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    })),
  )

  // Set column widths
  const wscols = [
    { wch: 10 }, // UNIDADE
    { wch: 10 }, // COMPETÊNCIA
    { wch: 40 }, // DEVEDOR/CREDOR
    { wch: 10 }, // DOCUMENTO
    { wch: 10 }, // CONTA
    { wch: 10 }, // NATUREZA
    { wch: 30 }, // TIPO LANÇAMENTO
    { wch: 15 }, // VENCIMENTO
    { wch: 15 }, // PAGAMENTO
    { wch: 15 }, // VALOR R$
  ]
  worksheet["!cols"] = wscols

  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Lançamentos")

  // Generate Excel file and save
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const data_blob = new Blob([excelBuffer], { type: "application/octet-stream" })
  saveAs(data_blob, `${fileName}.xlsx`)
}

function exportToPDF(data: typeof financialEntries, fileName: string) {
  // Create new PDF document
  const doc = new jsPDF("landscape")

  // Add title
  doc.setFontSize(18)
  doc.text("Relatório de Lançamentos Financeiros", 14, 22)

  // Add date
  doc.setFontSize(11)
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 30)

  // Prepare table data
  const tableColumn = [
    "UNIDADE",
    "COMP",
    "DEVEDOR/CREDOR",
    "DOC",
    "NATUREZA",
    "TIPO LANÇAMENTO",
    "VENCIMENTO",
    "VALOR R$",
  ]
  const tableRows = data.map((entry) => [
    entry.unidade,
    entry.comp,
    entry.devedorCredor.substring(0, 25) + (entry.devedorCredor.length > 25 ? "..." : ""),
    entry.doc,
    entry.natureza,
    entry.tipoLancamento.substring(0, 20) + (entry.tipoLancamento.length > 20 ? "..." : ""),
    entry.vencimento,
    entry.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
  ])

  // Add table to document
  ;(doc as jsPDF & { autoTable: (options: import("jspdf-autotable").UserOptions) => void }).autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 50 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 50 },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
    },
    headStyles: { fillColor: [66, 139, 202] },
  })

  // Add total at the bottom
  const total = data.reduce((sum, entry) => sum + entry.valor, 0)
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  doc.text(`Total: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 230, finalY)

  // Save the PDF
  doc.save(`${fileName}.pdf`)
}

function printReport() {
  // Store the current document title
  const originalTitle = document.title

  // Change the document title for better print header
  document.title = "Relatório de Lançamentos Financeiros"

  // Create a print-specific stylesheet
  const style = document.createElement("style")
  style.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      .print-section, .print-section * {
        visibility: visible;
      }
      .print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .no-print {
        display: none !important;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
    }
  `
  document.head.appendChild(style)

  // Trigger browser print dialog
  window.print()

  // Clean up
  setTimeout(() => {
    document.head.removeChild(style)
    document.title = originalTitle
  }, 1000)
}

export default function FinancialReport() {
  const [selectedEntry, setSelectedEntry] = useState<typeof financialEntries[number] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [isBankAccountsDrawerOpen, setIsBankAccountsDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("capa")

  // Form for editing an entry
  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      codigo: "",
      dataEmissao: new Date(),
      dataVencimento: new Date(),
      unidadeNegocio: "",
      natureza: "",
      tipoLancamento: "",
      devedorCredor: "",
      unidade: "",
      valor: "",
      docNr: "",
      operacao: "",
      descricao: "",
    },
  })

  // Handle row click to open modal
  const handleRowClick = (entry: typeof financialEntries[number]) => {
    setSelectedEntry(entry)

    // Set form values
    editForm.setValue("codigo", entry.codigo || "")
    editForm.setValue("dataEmissao", entry.dataEmissao ? new Date(entry.dataEmissao) : new Date())
    editForm.setValue(
      "dataVencimento",
      entry.vencimento ? new Date(entry.vencimento.split("/").reverse().join("-")) : new Date(),
    )
    editForm.setValue("unidadeNegocio", entry.unidadeNegocio || "")
    editForm.setValue("natureza", entry.natureza || "")
    editForm.setValue("tipoLancamento", entry.tipoLancamento || "")
    editForm.setValue("devedorCredor", entry.devedorCredor || "")
    editForm.setValue("unidade", entry.unidade || "")
    editForm.setValue("valor", entry.valor ? entry.valor.toString() : "")
    editForm.setValue("docNr", entry.doc || "")
    editForm.setValue("operacao", entry.operacao || "")
    editForm.setValue("descricao", entry.descricao || "")

    setIsModalOpen(true)
  }

  // Handle filter button click to open drawer
  const handleFilterClick = () => {
    setIsFilterDrawerOpen(true)
  }

  // Handle bank accounts button click to open drawer
  const handleBankAccountsClick = () => {
    setIsBankAccountsDrawerOpen(true)
  }

  // Handle edit form submission
  const onEditSubmit = (values: z.infer<typeof editFormSchema>) => {
    console.log(values)
    setIsModalOpen(false)
  }

  // Handle filter form submission
  const onFilterSubmit = (values: Record<string, unknown>) => {
    console.log(values)
  }


  // Calculate total bank balance
  const totalBankBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0)

  // Add these functions inside the FinancialReport component
  const handleExportExcel = () => {
    try {
      // toast({
      //   title: "Exportando para Excel",
      //   description: "Preparando o arquivo para download...",
      // })
      exportToExcel(financialEntries, "lancamentos-financeiros")
      // toast({
      //   title: "Exportação concluída",
      //   description: "O arquivo Excel foi baixado com sucesso.",
      //   variant: "success",
      // })
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      // toast({
      //   title: "Erro na exportação",
      //   description: "Não foi possível exportar para Excel. Tente novamente.",
      //   variant: "destructive",
      // })
    }
  }

  const handleExportPDF = () => {
    try {
      // toast({
      //   title: "Exportando para PDF",
      //   description: "Preparando o arquivo para download...",
      // })
      exportToPDF(financialEntries, "lancamentos-financeiros")
      // toast({
      //   title: "Exportação concluída",
      //   description: "O arquivo PDF foi baixado com sucesso.",
      //   variant: "success",
      // })
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error)
      // toast({
      //   title: "Erro na exportação",
      //   description: "Não foi possível exportar para PDF. Tente novamente.",
      //   variant: "destructive",
      // })
    }
  }

  const handlePrint = () => {
    try {
      printReport()
    } catch (error) {
      console.error("Erro ao imprimir:", error)
      // toast({
      //   title: "Erro na impressão",
      //   description: "Não foi possível imprimir o relatório. Tente novamente.",
      //   variant: "destructive",
      // })
    }
  }

  // Replace the entire return statement with this improved version that takes up the full screen
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <MainHeader />
      <div className="flex-grow bg-slate-50 dark:bg-slate-950 w-full overflow-auto">
        <div className="p-4 h-full">
          <Card className="border-slate-200 dark:border-slate-800 dark:bg-slate-900 backdrop-blur-sm h-full">
            <CardHeader className="space-y-1 px-4 py-3 lg:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle
                  className="text-xl sm:text-2xl font-bold flex items-center tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text
                text-transparent dark:from-blue-400 dark:to-indigo-400"
                >
                  Relatório de lançamentos financeiros
                </CardTitle>
                {/* Find the buttons in the CardHeader and replace them with: */}
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="flex items-center bg-green-50 rounded-md p-2 border border-green-100 cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={handleBankAccountsClick}
                  >
                   <CircleDollarSign className="mr-3 dark:text-black" />
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Saldo total atualizado</span>
                      <span className="font-semibold dark:text-black">R$ 1.657.833,77</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-8 w-8"
                      onClick={handleExportExcel}
                      title="Exportar para Excel"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-8 w-8"
                      onClick={handleExportPDF}
                      title="Exportar para PDF"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full h-8 w-8" title="Atualizar">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-8 w-8"
                      onClick={handleFilterClick}
                      title="Filtrar"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 lg:px-6 overflow-hidden flex flex-col h-[calc(100%-80px)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-sm font-medium">Pesquisar</span>
                  <Input placeholder="Buscar registros" className="w-full sm:w-64" />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Exibir</span>
                  <Select defaultValue="10">
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">resultados por página</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Subtotal em tela</div>
                  <div className="font-semibold">R$ 351.200,00</div>
                </div>
              </div>

              {/* Find the table container div and add the print-section class: */}
              <div className="flex-grow overflow-auto border rounded-md print-section">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-slate-50 dark:bg-slate-800">
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>UNIDADE</TableHead>
                      <TableHead>COMP</TableHead>
                      <TableHead>DEVEDOR/CREDOR</TableHead>
                      <TableHead>DOC</TableHead>
                      <TableHead>CONTA</TableHead>
                      <TableHead>NATUREZA</TableHead>
                      <TableHead>TIPO LANÇAMENTO</TableHead>
                      <TableHead>VENCIMENTO</TableHead>
                      <TableHead>PAGAMENTO</TableHead>
                      <TableHead className="text-right">VALOR R$</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialEntries.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => handleRowClick(entry)}
                      >
                        <TableCell className="p-2">
                          <ChevronRight className="h-4 w-4" />
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                        </TableCell>
                        <TableCell className="font-medium text-red-600">{entry.unidade}</TableCell>
                        <TableCell>{entry.comp}</TableCell>
                        <TableCell>{entry.devedorCredor}</TableCell>
                        <TableCell>{entry.doc}</TableCell>
                        <TableCell>{entry.conta}</TableCell>
                        <TableCell className="text-red-600">{entry.natureza}</TableCell>
                        <TableCell>{entry.tipoLancamento}</TableCell>
                        <TableCell>{entry.vencimento}</TableCell>
                        <TableCell>{entry.pagamento}</TableCell>
                        <TableCell className="text-right font-medium">
                          {entry.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                {/* Find the buttons at the bottom of the table and replace them with: */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimir">
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleExportPDF} title="Exportar para PDF">
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleExportExcel} title="Exportar para Excel">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Anterior
                  </Button>
                  <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    2
                  </Button>
                  <Button variant="outline" size="sm">
                    Próximo
                  </Button>
                </div>
                <div className="text-sm text-gray-500">Mostrando de 1 até 10 de 14 registros</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal for editing an entry */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">EDITAR LANÇAMENTO</DialogTitle>
          </DialogHeader>
          <div className="border-b mb-4">
            <div className="flex space-x-4">
              <Button
                variant={activeTab === "capa" ? "default" : "ghost"}
                className={activeTab === "capa" ? "bg-blue-600 hover:bg-blue-700" : ""}
                onClick={() => setActiveTab("capa")}
              >
                Capa
              </Button>
              <Button
                variant={activeTab === "detalhes" ? "default" : "ghost"}
                className={activeTab === "detalhes" ? "bg-blue-600 hover:bg-blue-700" : ""}
                onClick={() => setActiveTab("detalhes")}
              >
                Detalhes
              </Button>
            </div>
          </div>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="dataEmissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Emissão</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value} setDate={(date) => field.onChange(date)} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="dataVencimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Vencimento</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value} setDate={(date) => field.onChange(date)} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="unidadeNegocio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Negócio</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="natureza"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Natureza</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="tipoLancamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Lançamento</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="devedorCredor"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Devedor/Credor</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="unidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="docNr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doc nr</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="operacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operação</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-between mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 text-blue-700"
                >
                  (+) Ações
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-none text-white"
                >
                  Gravar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onSubmit={onFilterSubmit}
      />

      {/* Bank Accounts Drawer */}
      <BankAccountsDrawer
        isOpen={isBankAccountsDrawerOpen}
        onClose={() => setIsBankAccountsDrawerOpen(false)}
        totalBalance={totalBankBalance}
        accounts={bankAccounts}
      />
    </div>
  )
}

