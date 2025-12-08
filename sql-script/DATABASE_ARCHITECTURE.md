# Arquitetura do Banco de Dados - RECOVER

## Estrutura Atual

### Tabelas Principais

1. **`auth.users`** (Sistema Supabase)
   - Gerenciada automaticamente pelo Supabase
   - Contém: id, email, encrypted_password, email_confirmed_at, etc.
   - Não pode ser deletada via API frontend (apenas Admin API)

2. **`profiles`** (Dados adicionais do usuário)
   - Contém: id, name, phone, instagram, twitter, whatsapp, facebook, linkedin, avatar_url
   - Referenciada por: items, messages

3. **`items`** (Itens perdidos/encontrados)
   - owner_id FK → auth.users.id
   - Relacionada com: item_photos, messages

4. **`item_photos`** (Fotos dos itens)
   - item_id FK → items.id
   - Stored em: Storage bucket "item-photos"

5. **`messages`** (Mensagens entre usuários)
   - sender_id FK → auth.users.id
   - recipient_id FK → auth.users.id

## Fluxo de Exclusão de Conta

### Processo Atual (Completo)

```
1. Deletar items do usuário
   ↓
2. Deletar messages do usuário
   ↓
3. Deletar profile do usuário
   ↓
4. Sign out (remove session local)
   ↓
5. Usuário em auth.users permanece (só pode deletar via Admin API)
```

### Por que precisamos de ambas?

- **auth.users**: Gerenciada pelo Supabase, contém credenciais
- **profiles**: Nossos dados customizados que precisamos acessar

## Recomendação Arquitetural

Para uma solução melhor, você poderia:

### Opção 1: Usar apenas `auth.users` (Recomendado)
- Armazenar dados extras em `user_metadata` do Supabase Auth
- Eliminar a tabela `profiles`
- Vantagem: Uma única fonte de verdade

### Opção 2: Manter ambas com Trigger
- Criar trigger que sincroniza automaticamente
- Quando deleta `profiles`, marca usuário como inativo
- Vantagem: Mais flexível para dados complexos

### Opção 3: Usar Admin API para deleção
- Criar uma Cloud Function que deleta do `auth.users`
- Chamar essa função do frontend após deletar dados
- Vantagem: Deleta completamente o usuário

## Solução Recomendada para Agora

**Use a Opção 2 com melhorias**:

1. Manter a tabela `profiles` como está
2. Adicionar um campo `status` em `profiles` (active/deleted)
3. Quando usuário pede deleção:
   - Marca `profiles.status = 'deleted'`
   - Deleta items, messages, photos
   - Faz sign out
4. Usuário pode tentar login mas será rejeitado (status = deleted)

## SQL para Melhorias

```sql
-- Adicionar campo status à profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Criar trigger para sincronizar deleção
CREATE OR REPLACE TRIGGER delete_profile_on_auth_delete
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION delete_user_profile();

-- Função para deletar profile quando auth.users é deletado
CREATE OR REPLACE FUNCTION delete_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Próximos Passos

1. ✅ Melhorar fluxo de exclusão (já feito)
2. ⏳ Adicionar campo `status` em profiles
3. ⏳ Implementar soft delete (marcar como deleted ao invés de remover)
4. ⏳ Documentar processo para usuários
5. ⏳ Criar Admin Panel para gerenciar usuários deletados
