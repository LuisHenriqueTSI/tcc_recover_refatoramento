# Setup de Soft Delete para Exclusão de Contas

## Problema Atual
A funcionalidade de exclusão de conta está marcando o perfil como deletado (`status = 'deleted'`), mas o usuário ainda consegue fazer login novamente.

## Causa
A coluna `status` provavelmente não foi criada na tabela `profiles` do Supabase ainda.

## Solução

### 1. Executar SQL no Supabase
Acesse o Supabase Dashboard → SQL Editor e execute este comando:

```sql
-- Adicionar coluna status se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Atualizar registros nulos para 'active'
UPDATE profiles SET status = 'active' WHERE status IS NULL;
```

### 2. Verificar a Coluna
Para confirmar que a coluna foi criada corretamente:

```sql
-- Selecionar todas as colunas da tabela profiles
SELECT * FROM profiles LIMIT 5;
```

Você deve ver uma coluna chamada `status` com valores `'active'` ou `'deleted'`.

### 3. Testar a Funcionalidade
1. Faça login com uma conta de teste
2. Vá para `/edit-profile`
3. Clique em "Excluir Conta"
4. Confirme a exclusão
5. Você deve ser desconectado automaticamente
6. Tente fazer login novamente com aquela conta
7. Você deve receber a mensagem: "Esta conta foi deletada e não pode mais ser acessada"

## Fluxo de Deletamento

```
1. Usuário clica "Excluir Conta"
   ↓
2. Deletar todos os items do usuário (cascade delete item_photos)
   ↓
3. Deletar todas as mensagens do usuário
   ↓
4. Marcar profile como status = 'deleted'
   ↓
5. Desconectar usuário (signOut)
   ↓
6. Redirecionar para home
   ↓
7. Na próxima tentativa de login:
   - signIn() procura status = 'deleted' na profile
   - Se encontrar, lança erro e desconecta
   - getUser() também verifica status
   - Se deletado, lança erro e desconecta automaticamente
```

## Código Envolvido

### EditProfile.jsx (handleDeleteAccount)
- Deleta items
- Deleta messages
- Marca profile com `status = 'deleted'`
- Desconecta usuário

### supabaseAuth.js (signIn)
- Após login bem-sucedido, verifica `status` na profile
- Se for `'deleted'`, lança erro e desconecta

### user.js (getUser)
- Busca profile do usuário
- Se `status === 'deleted'`, lança erro e desconecta

## Fallback
Se a coluna `status` não existir, o código em `EditProfile.jsx` irá automaticamente:
1. Tentar criar a coluna (será criada no Supabase)
2. Se falhar, deletar o profile inteiro (hard delete)

Mas é recomendado executar o SQL manualmente para garantir.

## Próximas Melhorias
- [ ] Adicionar mensagem de confirmação visual antes de deletar
- [ ] Adicionar opção de recuperar conta dentro de 30 dias
- [ ] Enviar email de confirmação de exclusão
- [ ] Limpar storage (fotos) do usuário
