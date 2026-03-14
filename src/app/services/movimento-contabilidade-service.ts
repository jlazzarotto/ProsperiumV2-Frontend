import { httpClient } from '@/lib/http-client'

export interface MovimentoContabilidadeParams {
  id_empresa?: number | number[]
  id_un_negocio?: number | number[]
  data_inicio: string
  data_fim: string
}

export interface MovimentoContabilidadeItem {
  numero_sequencial: string
  arquivo: string
  data: string
  conta_debito: string
  conta_credito: string
  tipo: string
  historico: string
  numero_documento: string
  pessoa: string
  data_pagamento: string
  conta_bancaria: string
  valor: string
  arquivo_download_url: string
  arquivo_id: string
}

export interface MovimentoContabilidadeResponse {
  periodo: {
    data_inicio: string
    data_fim: string
  }
  total_movimentos: number
  movimentos: MovimentoContabilidadeItem[]
}

function resolveIds(params: MovimentoContabilidadeParams): number | number[] {
  const ids = params.id_empresa ?? params.id_un_negocio

  if (ids === undefined) {
    throw new Error('Nenhuma empresa foi informada para o relatório')
  }

  return ids
}

function formatIds(ids: number | number[]): string {
  return Array.isArray(ids) ? ids.join(',') : String(ids)
}

function parseBrazilianNumber(value: string): number {
  return Number(value.replace(/\./g, '').replace(',', '.'))
}

/**
 * Busca dados para o relatório de Movimento Contabilidade usando o novo endpoint otimizado
 */
export async function getMovimentoContabilidadeData(params: MovimentoContabilidadeParams): Promise<MovimentoContabilidadeResponse> {
  try {
    const resolvedIds = resolveIds(params)
    console.log('🔍 Buscando dados do movimento contabilidade:', params)

    const response = await httpClient.get<MovimentoContabilidadeResponse>(
      '/lancamentos/relatorio/movimento-contabilidade',
      {
        params: {
          data_inicio: params.data_inicio,
          data_fim: params.data_fim,
          id_empresa: formatIds(resolvedIds)
        }
      }
    )

    console.log('✅ Dados recebidos:', {
      total_movimentos: response.total_movimentos,
      periodo: response.periodo
    })

    return response
  } catch (error) {
    console.error('❌ Erro ao buscar dados do movimento contabilidade:', error)
    throw error
  }
}

/**
 * Gera e baixa o ZIP com XLSX + arquivos anexados
 */
export async function getMovimentoContabilidade(params: MovimentoContabilidadeParams): Promise<Blob> {
  try {
    console.log('🚀 Iniciando geração do ZIP:', params)

    // Buscar dados do relatório
    const data = await getMovimentoContabilidadeData(params)

    console.log('📊 Dados recebidos:', {
      total_movimentos: data.total_movimentos,
      total_com_arquivo: data.movimentos.filter(m => m.arquivo && m.numero_sequencial).length
    })

    if (data.total_movimentos === 0) {
      throw new Error('Nenhum dado encontrado para o período selecionado')
    }

    // Importar JSZip dinamicamente
    const { default: JSZip } = await import('jszip')
    const XLSX = await import('xlsx')
    const zip = new JSZip()

    const worksheetData = data.movimentos.map((movimento) => ({
      ARQUIVO: movimento.numero_sequencial && movimento.arquivo
        ? `${parseInt(movimento.numero_sequencial, 10)}-${movimento.arquivo}`
        : '',
      DATA: movimento.data,
      'CONTA DEBITO': movimento.conta_debito,
      'CONTA CREDITO': movimento.conta_credito,
      TIPO: movimento.tipo,
      HISTORICO: movimento.historico,
      'NUMERO DOCUMENTO': movimento.numero_documento,
      PESSOA: movimento.pessoa,
      'DATA PAGAMENTO': movimento.data_pagamento,
      'CONTA BANCARIA': movimento.conta_bancaria,
      VALOR: parseBrazilianNumber(movimento.valor),
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, {
      header: [
        'ARQUIVO',
        'DATA',
        'CONTA DEBITO',
        'CONTA CREDITO',
        'TIPO',
        'HISTORICO',
        'NUMERO DOCUMENTO',
        'PESSOA',
        'DATA PAGAMENTO',
        'CONTA BANCARIA',
        'VALOR',
      ],
      skipHeader: false,
    })

    worksheet['!cols'] = [
      { wch: 40 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 40 },
      { wch: 18 },
      { wch: 35 },
      { wch: 16 },
      { wch: 20 },
      { wch: 14 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatorio')

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 10 })
      const cell = worksheet[cellRef]
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n'
        cell.z = '#,##0.00'
      }
    }

    const workbookBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    zip.file('Relatorio.xlsx', workbookBuffer)

    // Baixar e adicionar arquivos diretamente na raiz do ZIP (como no legado)
    const downloadPromises: Promise<void>[] = []

    for (const movimento of data.movimentos) {
      // Só baixar se tem arquivo e URL de download
      if (movimento.arquivo && movimento.arquivo_download_url && movimento.numero_sequencial) {
        console.log('📥 Adicionando para download:', movimento.numero_sequencial, movimento.arquivo)
        const downloadPromise = downloadAndAddToZip(
          zip, // Arquivos na raiz, não em subpasta
          movimento.arquivo_download_url,
          movimento.numero_sequencial,
          movimento.arquivo
        )
        downloadPromises.push(downloadPromise)
      }
    }

    // Aguardar todos os downloads
    console.log(`📥 Baixando ${downloadPromises.length} arquivos...`)
    await Promise.all(downloadPromises)

    // Gerar o ZIP
    console.log('📦 Gerando arquivo ZIP...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    console.log('✅ ZIP gerado com sucesso:', {
      total_movimentos: data.total_movimentos,
      total_arquivos: downloadPromises.length,
      size: zipBlob.size
    })

    return zipBlob
  } catch (error) {
    console.error('❌ Erro ao gerar relatório de movimento contabilidade:', error)
    throw error
  }
}

/**
 * Baixa um arquivo e adiciona ao ZIP com numeração no formato legado: {numero}-{nome_original}
 */
async function downloadAndAddToZip(
  folder: any,
  url: string,
  numero: string,
  nomeOriginal: string
): Promise<void> {
  try {
    // Fazer a requisição através do proxy para manter autenticação
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`/api/proxy${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      console.warn(`⚠️ Erro ao baixar arquivo ${nomeOriginal}: ${response.status}`)
      return
    }

    const arrayBuffer = await response.arrayBuffer()

    // Gerar nome no formato legado: {numero}-{nome_original}
    // Remove zeros à esquerda do número (0001 -> 1)
    const numeroSemZeros = parseInt(numero, 10).toString()
    const nomeNumerado = `${numeroSemZeros}-${nomeOriginal}`

    folder.file(nomeNumerado, arrayBuffer)
    console.log(`✅ Arquivo adicionado: ${nomeNumerado}`)
  } catch (error) {
    console.error(`❌ Erro ao baixar arquivo ${nomeOriginal}:`, error)
  }
}
