# 🚨 PROBLEMA CRÍTICO: API não retorna Cidade e Estado

## ❌ **Problema Identificado**

A API `/api/pessoas/{id}` **NÃO ESTÁ RETORNANDO** os campos `cidade`, `uf` e `id_municipio` para pessoas, impossibilitando a exibição desses dados no frontend.

---

## 🔍 **Investigação Realizada**

### 1. **Estrutura das Tabelas**

**Tabela `pessoas`:**
```sql
-- NÃO TEM campos de endereço
id_pessoa, nome, id_tipo_cadastro, regime_tributario, id_operador, id_user, 
created_at, updated_at, deleted_at, status
```

**Tabela `un_negocios`:**
```sql
-- TEM dados de endereço
id_un_negocio, apelido, CNPJ, IE, IM, abreviatura, 
logradouro, nr, complemento, bairro, CEP, id_municipio, ← AQUI!
id_pessoa, tipo_pessoa, id_plano_conta, created_at, updated_at, deleted_at, status
```

**Tabela `municipios`:**
```sql
-- TEM nome da cidade e UF
id_municipio, id_UF, sigla_UF, nome ← AQUI!
```

### 2. **Query que Deveria Funcionar**
```sql
SELECT 
    p.id_pessoa, p.nome, 
    m.nome as cidade, 
    m.sigla_UF as uf,
    un.id_municipio
FROM pessoas p
LEFT JOIN un_negocios un ON p.id_pessoa = un.id_pessoa AND un.tipo_pessoa = 1  -- MATRIZ
LEFT JOIN municipios m ON un.id_municipio = m.id_municipio
WHERE p.id_pessoa = 204;
```

**Resultado Esperado:**
```
id_pessoa: 204
nome: "1O Tabelionato de Notas..."  
cidade: "Joinville"
uf: "SC"
id_municipio: 4209102
```

### 3. **Resposta Atual da API**
```json
{
  "id_pessoa": 204,
  "nome": "1O Tabelionato de Notas...",
  "abreviatura": "1O",
  "cnpj_cpf": "09479094940",
  "cep": 89211465,
  "logradouro": "Rua João Paul",
  "numero": "93",
  "bairro": "Floresta",
  // ❌ FALTANDO: cidade, uf, id_municipio
}
```

---

## 🛠️ **Solução Necessária**

### **Backend (Symfony API):**

A API precisa ser corrigida para:

1. **Fazer JOIN com as tabelas corretas:**
   ```sql
   LEFT JOIN un_negocios ON pessoas.id_pessoa = un_negocios.id_pessoa 
                        AND un_negocios.tipo_pessoa = 1  -- MATRIZ apenas
   LEFT JOIN municipios ON un_negocios.id_municipio = municipios.id_municipio
   ```

2. **Adicionar campos na resposta:**
   ```json
   {
     "cidade": "municipios.nome",
     "uf": "municipios.sigla_UF", 
     "id_municipio": "un_negocios.id_municipio"
   }
   ```

3. **Endpoints a corrigir:**
   - `GET /api/pessoas` (listagem)
   - `GET /api/pessoas/{id}` (individual)
   - `PUT /api/pessoas/{id}` (atualização deve salvar na un_negocios)

---

## 🎯 **Frontend Já Está Preparado**

O frontend **JÁ ESTÁ 100% PREPARADO** para receber e exibir esses dados:

✅ **Interface `ApiPerson` tem os campos:**
```typescript
export interface ApiPerson {
  cidade: string | null
  uf: string | null  
  id_municipio: number | null
}
```

✅ **Mapeamento está correto:**
```typescript
const mapApiToPerson = (apiPerson: ApiPerson): Person => ({
  city: apiPerson.cidade || "",
  state: apiPerson.uf || "",
  cityId: apiPerson.id_municipio || undefined,
})
```

✅ **Tabela exibe os dados:**
```typescript
<TableCell>{`${person.city}/${person.state}`}</TableCell>
```

✅ **Modal salva corretamente:**
```typescript
// Dados são enviados corretamente para a API
dto.cidade = person.city
dto.uf = person.state  
dto.id_municipio = person.cityId
```

---

## 🚨 **Impacto do Problema**

- ❌ Usuário preenche cidade/estado no frontend
- ✅ Dados são enviados para a API corretamente  
- ❌ API não retorna os dados na consulta
- ❌ Tabela aparece vazia na coluna "Cidade/UF"
- 😡 **Usuário acha que o sistema está com bug**

---

## ✅ **Teste para Validar a Correção**

Após corrigir a API, este comando deve retornar cidade e UF:

```bash
curl -X GET "http://localhost:8000/api/pessoas/204" \
  -H "Authorization: Bearer TOKEN"
```

**Resposta esperada:**
```json
{
  "id_pessoa": 204,
  "nome": "1O Tabelionato...",
  "cidade": "Joinville",        ← DEVE TER
  "uf": "SC",                   ← DEVE TER  
  "id_municipio": 4209102,      ← DEVE TER
  "cep": 89211465,
  "logradouro": "Rua João Paul",
  "numero": "93",
  "bairro": "Floresta"
}
```

---

## 📋 **Status**

| Item | Status |
|------|---------|
| ✅ Frontend preparado | Completo |
| ✅ Interfaces corretas | Completo |
| ✅ Mapeamento correto | Completo |  
| ✅ Tabela preparada | Completo |
| ❌ **API retorna cidade/estado** | **PENDENTE** |

---

## 🎯 **Conclusão**

**O problema É 100% NO BACKEND (Symfony API)** que não está fazendo o JOIN correto para retornar os dados de cidade e estado que estão na tabela `un_negocios` + `municipios`.

Uma vez corrigida a API, o frontend funcionará imediatamente sem nenhuma alteração adicional.

**PRIORIDADE MÁXIMA:** Corrigir as consultas SQL na API para incluir os campos cidade, uf e id_municipio.