# 🔄 Notas de Migração - Remoção do Backend FastAPI

## O que foi removido

Este projeto foi migrado de uma arquitetura com backend FastAPI separado para usar **apenas o Supabase como backend completo**.

### Arquivos Removidos

#### Backend FastAPI
- ❌ `app/main.py` - Servidor FastAPI
- ❌ `app/routers/` - Todos os endpoints REST
  - `auth.py`
  - `publications.py`
  - `chat.py`
  - `photos.py`
  - `categories.py`
  - `reports.py`
  - `gemini.py`
- ❌ `app/schemas.py` - Schemas Pydantic
- ❌ `app/crud_supabase.py` - Funções CRUD intermediárias

#### Arquivos de Teste
- ❌ `test_message_read.py`
- ❌ `test_notification.py`
- ❌ `test_unread_messages.py`

### Arquivos Mantidos

✅ `app/supabase_client.py` - Cliente Supabase (apenas para referência, o frontend usa seu próprio cliente)

### Dependências Removidas do `requirements.txt`
- FastAPI
- Uvicorn
- Pydantic
- Bcrypt
- Python-multipart
- Google-auth (mover para Edge Functions se necessário)
- Requests

### Dependências Mantidas
- `supabase` - Cliente Python do Supabase (apenas para scripts/testes)
- `python-dotenv` - Gerenciamento de variáveis de ambiente

## Por que essa mudança?

1. **Redundância**: O Supabase já oferece todas as funcionalidades de backend:
   - Autenticação (Supabase Auth)
   - Banco de dados (PostgreSQL)
   - Storage (Supabase Storage)
   - APIs REST automáticas
   - Real-time subscriptions
   - Row Level Security (RLS)

2. **Simplificação**: Elimina a necessidade de manter dois backends separados

3. **Redução de custos**: Menos infraestrutura para manter e hospedar

4. **Performance**: Comunicação direta entre frontend e Supabase

## Próximos Passos

### 1. Migrar Lógica de Negócio

Se houver lógica de negócio complexa nos routers removidos, considere:
- **Supabase Edge Functions** - Para lógica de servidor
- **Database Functions** - Para lógica no PostgreSQL
- **Row Level Security (RLS)** - Para segurança baseada em regras

### 2. Configurar RLS

Implemente políticas de segurança no Supabase:

```sql
-- Exemplo: Usuários só podem ver seus próprios itens
CREATE POLICY "Users can view own items"
ON items FOR SELECT
USING (auth.uid() = owner_id);

-- Exemplo: Usuários só podem inserir itens com seu próprio ID
CREATE POLICY "Users can insert own items"
ON items FOR INSERT
WITH CHECK (auth.uid() = owner_id);
```

### 3. Migrar Endpoints Personalizados

Para funcionalidades que exigiam endpoints customizados:

#### Análise de Imagem (Gemini Vision)
- Criar uma **Supabase Edge Function**
- Mover código de `app/routers/gemini.py` para a Edge Function

#### Notificações
- Usar **Supabase Realtime** para notificações em tempo real
- Criar triggers no banco de dados
- Ou usar Edge Functions com webhooks

### 4. Atualizar Frontend

Certifique-se de que o frontend está usando:
- `@supabase/supabase-js` - Cliente JavaScript do Supabase
- Chamadas diretas ao Supabase em vez de endpoints FastAPI
- Supabase Auth para autenticação

Exemplo de mudança:

**Antes (com FastAPI):**
```javascript
const response = await fetch('http://localhost:8000/publications', {
  headers: { Authorization: `Bearer ${token}` }
});
```

**Depois (com Supabase):**
```javascript
const { data, error } = await supabase
  .from('items')
  .select('*');
```

## Estrutura Recomendada

```
recover/
├── frontend/                    # Aplicação React
│   └── src/
│       └── lib/
│           └── supabaseClient.js   # Cliente Supabase
├── supabase/                    # (Opcional) Configuração Supabase
│   ├── migrations/              # Migrações SQL
│   ├── functions/               # Edge Functions
│   └── seed.sql                 # Dados iniciais
└── scripts/                     # Scripts SQL e utilitários
```

## Benefícios da Nova Arquitetura

✅ Menos código para manter
✅ Autenticação nativa do Supabase
✅ APIs REST geradas automaticamente
✅ Real-time subscriptions out-of-the-box
✅ Segurança com Row Level Security
✅ Storage integrado
✅ Deploy mais simples (apenas frontend)

## Recursos Úteis

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
