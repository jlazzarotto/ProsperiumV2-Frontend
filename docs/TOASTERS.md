# Sistema de Toasters Centralizado

Este sistema permite interceptar automaticamente respostas da API e exibir toasters de sucesso/erro sem precisar adicionar `customToast.success()` ou `customToast.error()` em cada arquivo.

## 🎯 Principais Benefícios

- **Menos código**: Não precisa repetir toasters em cada serviço
- **Consistência**: Todas as mensagens seguem o mesmo padrão
- **Flexibilidade**: Pode customizar ou desabilitar toasters quando necessário
- **Interceptação automática**: Erros de rede e da API são tratados automaticamente

## 📖 Como Usar

### Método 1: GlobalToastHttpClient (Mais Simples)

```typescript
import { GlobalToastHttpClient } from '@/lib/global-toast'

// Requisições com toasters automáticos
const response = await GlobalToastHttpClient.post('/operacoes', data, {
  customSuccessMessage: 'Operação criada com sucesso!',
  customErrorMessage: 'Erro ao criar operação'
})
```

### Método 2: Hook useGlobalToast

```typescript
import { useGlobalToast } from '@/lib/global-toast'

function MyComponent() {
  const toast = useGlobalToast()
  
  const handleSubmit = async () => {
    try {
      await toast.post('/operacoes', data, {
        customSuccessMessage: 'Sucesso!'
      })
      // Toast já foi exibido automaticamente
    } catch (error) {
      // Toast de erro já foi exibido
      console.log('Erro capturado:', error)
    }
  }
}
```

### Método 3: Serviços Pré-configurados

```typescript
import { operationServiceWithToasts } from '@/services/operation-service'

// Todas essas funções já têm toasters configurados
await operationServiceWithToasts.create(data)
await operationServiceWithToasts.update(id, data)
await operationServiceWithToasts.delete(id)
await operationServiceWithToasts.close(id)
await operationServiceWithToasts.reopen(id)
```

## ⚙️ Configurações Disponíveis

```typescript
interface ToastConfig {
  showSuccess?: boolean        // Mostrar toast de sucesso (padrão: true)
  showErrors?: boolean         // Mostrar toast de erro (padrão: true)
  customSuccessMessage?: string // Mensagem customizada de sucesso
  customErrorMessage?: string   // Mensagem customizada de erro
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}
```

## 🔧 Exemplos Práticos

### Listagem (sem toast de sucesso)
```typescript
const operations = await GlobalToastHttpClient.get('/operacoes', {
  showSuccess: false, // Não mostrar "Sucesso" para listagem
  showErrors: true    // Apenas erros de conexão/API
})
```

### Operação crítica (toasters customizados)
```typescript
await GlobalToastHttpClient.delete(`/operacoes/${id}`, {
  customSuccessMessage: 'Operação excluída permanentemente!',
  customErrorMessage: 'Falha ao excluir - verifique dependências',
  position: 'top-left'
})
```

### Desabilitar toasters (controle manual)
```typescript
const response = await GlobalToastHttpClient.get('/data', {
  showSuccess: false,
  showErrors: false
})

// Tratar manualmente
if (response.special_case) {
  customToast.success('Caso especial tratado!')
}
```

### Upload de arquivos
```typescript
const uploadResponse = await GlobalToastHttpClient.post('/upload', formData, {
  customSuccessMessage: 'Arquivos enviados com sucesso!',
  customErrorMessage: 'Falha no upload - verifique os arquivos'
})
```

## 🏗️ Migrar Código Existente

### Antes (código manual)
```typescript
const handleSave = async () => {
  setLoading(true)
  try {
    await createOperation(data)
    customToast.success('Operação criada!')
    onClose()
  } catch (error) {
    customToast.error('Erro ao criar operação')
  } finally {
    setLoading(false)
  }
}
```

### Depois (automático)
```typescript
const handleSave = async () => {
  setLoading(true)
  try {
    await operationServiceWithToasts.create(data)
    // Toast já exibido automaticamente
    onClose()
  } catch (error) {
    // Toast de erro já exibido
  } finally {
    setLoading(false)
  }
}
```

## 🔍 Detecção Automática de Erros

O sistema detecta automaticamente:

- **Status codes** de erro (4xx, 5xx)
- **Campos `error`** na resposta da API
- **Arrays `errors`** com múltiplos erros
- **Erros de rede** (conexão, timeout, etc.)
- **Campos `message`** para sucessos

## 📋 Exemplo de Resposta da API

```json
// Sucesso
{
  "data": { "id": 123 },
  "message": "Operação criada com sucesso"
}

// Erro único
{
  "error": "Operação não encontrada"
}

// Múltiplos erros
{
  "errors": [
    "Campo 'nome' é obrigatório",
    "Campo 'email' deve ser válido"
  ]
}
```

## 📚 Implementação em Novos Serviços

```typescript
// meu-novo-service.ts
import { GlobalToastHttpClient } from '@/lib/global-toast'

export const myServiceWithToasts = {
  async create(data: any) {
    return GlobalToastHttpClient.post('/my-endpoint', data, {
      customSuccessMessage: 'Item criado com sucesso!',
      customErrorMessage: 'Erro ao criar item'
    })
  },
  
  async getList() {
    return GlobalToastHttpClient.get('/my-endpoint', {
      showSuccess: false, // Listagem sem toast de sucesso
      customErrorMessage: 'Erro ao carregar lista'
    })
  }
}
```

## ⚠️ Casos Especiais

- **Uploads grandes**: Use `customSuccessMessage` detalhado
- **Operações em batch**: Considere toasters por item
- **Background tasks**: Desabilite toasters automáticos
- **Validação de formulários**: Use `errors` array da API

---

💡 **Dica**: Para manter compatibilidade, mantenha os serviços antigos e crie versões `WithToasts` gradualmente.