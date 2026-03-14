# Movimento Contabilidade - Relatório

## Descrição
Relatório para gerar arquivo CSV com movimento contábil, incluindo todos os arquivos anexados aos lançamentos financeiros com numeração sequencial.

## Estrutura Criada

### 1. Página Principal
- **Arquivo**: `src/app/movimento/contabilidade/page.tsx`
- **Rota**: `/movimento/contabilidade`
- **Funcionalidades**:
  - Seletor de Unidade de Negócio (Tipo 8)
  - Seletor de período (Data início e fim)
  - Geração e download de arquivo CSV

### 2. Componente de Seleção
- **Arquivo**: `src/components/movimento-business-unit-selector.tsx`
- **Funcionalidades**:
  - Busca automaticamente unidades de negócio tipo 8
  - Interface de busca/filtro
  - Validação de seleção

### 3. Serviço API
- **Arquivo**: `src/app/services/movimento-contabilidade-service.ts`
- **Endpoints**:
  - `GET /movimento-contabilidade` - Busca dados do movimento
  - Geração automática de CSV com dados formatados

### 4. Menu de Navegação
- **Arquivo**: `src/components/main-header.tsx`
- **Localização**: Relatórios > Movimento Contabilidade

## Estrutura do CSV Gerado

O CSV contém as seguintes colunas:
- `ID_LANCAMENTO` - ID do lançamento financeiro
- `DATA_LANCAMENTO` - Data de emissão do lançamento
- `DATA_VENCIMENTO` - Data de vencimento
- `DATA_PAGAMENTO` - Data de pagamento (se pago)
- `DESCRICAO` - Descrição do lançamento
- `VALOR` - Valor formatado (formato brasileiro)
- `NUMERO_DOCUMENTO` - Número do documento
- `TIPO_LANCAMENTO` - Nome do tipo de lançamento
- `NATUREZA` - Crédito ou débito
- `PESSOA_NOME` - Nome da pessoa/cliente
- `CONTA_CAIXA` - Conta caixa utilizada
- `ANEXO_NUMERO` - Número sequencial do anexo
- `ANEXO_NOME` - Nome do arquivo anexado
- `ANEXO_URL` - URL para download do anexo
- `ANEXO_TIPO` - Tipo de documento do anexo
- `ENVIAR_CONTABILIDADE` - Se deve enviar para contabilidade

## Como Usar

1. Acesse **Relatórios > Movimento Contabilidade**
2. Selecione uma **Unidade de Negócio** (tipo 8)
3. Defina o **período** (data início e fim)
4. Clique em **Gerar Relatório CSV**
5. O arquivo será baixado automaticamente

## Notas Técnicas

### Numeração de Arquivos
- Cada arquivo anexado recebe um número sequencial único
- A numeração é feita no backend durante a busca dos dados

### Formato de Dados
- Datas no formato `YYYY-MM-DD`
- Valores no formato brasileiro (`1.234,56`)
- Strings com caracteres especiais são escapadas para CSV

### Validações
- Unidade de negócio obrigatória
- Período obrigatório
- Data início deve ser anterior à data fim

## Backend Required (To Implement)

### Endpoint necessário:
```
GET /movimento-contabilidade?id_un_negocio={id}&data_inicio={date}&data_fim={date}
```

### Response esperado:
```json
{
  "success": true,
  "data": [
    {
      "id_lancamento": 123,
      "data_lancamento": "2024-01-01",
      "data_vencimento": "2024-01-15",
      "data_pagamento": "2024-01-10",
      "descricao": "Descrição do lançamento",
      "valor": 1500.50,
      "numero_documento": "NF-001",
      "tipo_lancamento": "Receita",
      "natureza": "credito",
      "pessoa_nome": "Cliente ABC",
      "conta_caixa": "Conta Principal",
      "anexos": [
        {
          "id": 1,
          "nome_arquivo": "documento.pdf",
          "url_download": "/api/download/1",
          "tipo_documento": "nota_fiscal",
          "enviar_contabilidade": true,
          "numero_sequencial": 1
        }
      ]
    }
  ],
  "total": 50,
  "total_anexos": 25
}
```

### Colunas de banco necessárias:
```sql
-- Tabela uploads
ALTER TABLE uploads 
ADD COLUMN tipo_documento VARCHAR(50) NULL,
ADD COLUMN enviar_contabilidade BOOLEAN DEFAULT FALSE;

-- Tabela uploads_lctos  
ALTER TABLE uploads_lctos 
ADD COLUMN tipo_documento VARCHAR(50) NULL,
ADD COLUMN enviar_contabilidade BOOLEAN DEFAULT FALSE;
```