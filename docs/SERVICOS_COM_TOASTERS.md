# Serviços com Toasters Automáticos

Lista completa de todos os serviços que possuem versões com toasters automáticos.

## ✅ Implementados

### 1. **Operações**
**Arquivo**: `/src/app/services/operation-service.ts`
**Serviço**: `operationServiceWithToasts`

```typescript
import { operationServiceWithToasts } from '@/services/operation-service'

// Métodos disponíveis
await operationServiceWithToasts.create(data)     // ✅ "Operação criada com sucesso!"
await operationServiceWithToasts.update(id, data) // ✅ "Operação atualizada com sucesso!"
await operationServiceWithToasts.delete(id)       // ✅ "Operação excluída com sucesso!"
await operationServiceWithToasts.close(id, date)  // ✅ "Operação encerrada com sucesso!"
await operationServiceWithToasts.reopen(id)       // ✅ "Operação reaberta com sucesso!"
await operationServiceWithToasts.getAll()         // 🔇 Sem toast de sucesso, apenas erros
```

### 2. **Lançamentos**
**Arquivo**: `/src/app/services/lancamento-service.ts`
**Serviço**: `lancamentoServiceWithToasts`

```typescript
import { lancamentoServiceWithToasts } from '@/services/lancamento-service'

// Métodos disponíveis
await lancamentoServiceWithToasts.create(data)           // ✅ "Lançamento criado com sucesso!"
await lancamentoServiceWithToasts.update(id, data)       // ✅ "Lançamento atualizado com sucesso!"
await lancamentoServiceWithToasts.delete(id)             // ✅ "Lançamento excluído com sucesso!"
await lancamentoServiceWithToasts.baixar(id, dadosBaixa) // ✅ "Lançamento baixado com sucesso!"
await lancamentoServiceWithToasts.cancelar(id, motivo)   // ✅ "Lançamento cancelado com sucesso!"
await lancamentoServiceWithToasts.estornar(id)           // ✅ "Baixa estornada com sucesso!"
await lancamentoServiceWithToasts.getAll(filters)        // 🔇 Sem toast de sucesso, apenas erros
```

## 🚧 Próximos a Implementar

### 3. **Pessoas**
**Arquivo**: `/src/services/person-api-service.ts`
**Status**: 🔄 Pendente

```typescript
// Futuro: personServiceWithToasts
await personServiceWithToasts.create(data)
await personServiceWithToasts.update(id, data)
await personServiceWithToasts.delete(id)
```

### 4. **Unidades de Negócio**
**Arquivo**: `/src/services/business-unit-api-service.ts`
**Status**: 🔄 Pendente

```typescript
// Futuro: businessUnitServiceWithToasts
await businessUnitServiceWithToasts.create(data)
await businessUnitServiceWithToasts.update(id, data)
await businessUnitServiceWithToasts.delete(id)
```

### 5. **Navios**
**Arquivo**: `/src/services/ship-service.ts`
**Status**: 🔄 Pendente

### 6. **Portos**
**Arquivo**: `/src/services/port-service.ts`  
**Status**: 🔄 Pendente

## 📋 Status de Migração por Módulo

| Módulo | Status | Toasters Funcionais | Observações |
|--------|--------|-------------------|-------------|
| **Operações** | ✅ Completo | Sim | Encerrar/Reabrir corrigidos |
| **Lançamentos** | ✅ Completo | Sim | CRUD + Baixar/Cancelar/Estornar |
| **Pessoas** | 🔄 Pendente | - | Aguardando implementação |
| **Unidades** | 🔄 Pendente | - | Aguardando implementação |
| **Navios** | 🔄 Pendente | - | Aguardando implementação |
| **Portos** | 🔄 Pendente | - | Aguardando implementação |

## 🎯 Páginas já Migradas

### ✅ Página de Operações
**Arquivo**: `/src/app/cadastros/operacoes/page.tsx`
- Encerrar operação: ✅ Toast automático
- Reabrir operação: ✅ Toast automático  
- Excluir operação: ✅ Toast automático
- **Bug corrigido**: Duplicação de toasters removida

### 🔄 Outras páginas
- Lançamentos: Aguardando migração
- Pessoas: Aguardando migração
- Outras: Aguardando migração

## 💡 Como Migrar um Serviço

1. **Adicionar import**:
```typescript
import { GlobalToastHttpClient } from '@/lib/global-toast'
```

2. **Criar objeto de serviço**:
```typescript
export const meuServicoWithToasts = {
  async create(data: any) {
    return GlobalToastHttpClient.post('/endpoint', data, {
      customSuccessMessage: 'Item criado com sucesso!',
      customErrorMessage: 'Erro ao criar item'
    })
  },
  // ... outros métodos
}
```

3. **Atualizar componentes**:
```typescript
// Antes
await createItem(data)
customToast.success('Item criado!')

// Depois  
await meuServicoWithToasts.create(data)
// Toast automático já exibido
```

## 🔧 Configurações Especiais

### Modo Silent (sem toasters)
```typescript
await GlobalToastHttpClient.get('/data', {
  silent: true  // Nenhum toast será exibido
})
```

### Apenas erros (listagens)
```typescript
await GlobalToastHttpClient.get('/items', {
  showSuccess: false,  // Não mostrar sucesso
  showErrors: true     // Apenas erros de conexão
})
```

### Customizar mensagens
```typescript
await GlobalToastHttpClient.post('/items', data, {
  customSuccessMessage: 'Item criado com sucesso!',
  customErrorMessage: 'Falha ao criar - verifique os dados',
  position: 'top-left'
})
```

## 🚨 Problemas Corrigidos

1. **Duplicação de toasters**: ✅ Resolvido
   - Removidos toasts manuais onde já existem automáticos
   - MultiFileUpload mantém seus toasters internos
   
2. **Encerrar/Reabrir não funcionando**: ✅ Resolvido
   - Trocados serviços antigos pelos novos com toasters
   - Funcionalidade restaurada com feedback visual

3. **Toasters aparecendo em local errado**: ✅ Configurável
   - Nova opção `position` para controlar localização
   - Padrão: 'top-right'