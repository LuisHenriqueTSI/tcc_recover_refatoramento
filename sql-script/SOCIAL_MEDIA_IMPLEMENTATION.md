# 📱 Sistema de Redes Sociais e Compartilhamento

## Resumo das Funcionalidades Implementadas

Este documento descreve as novas funcionalidades adicionadas ao projeto Recover para permitir compartilhamento de itens perdidos/encontrados em redes sociais e gerenciamento de contatos sociais dos usuários.

---

## 🎯 Funcionalidades Principais

### 1. **Perfil de Usuário com Redes Sociais**
- Usuários podem adicionar seus dados de contato no perfil:
  - Instagram
  - Twitter
  - WhatsApp
  - Facebook
  - LinkedIn
  - Telefone

- **Páginas afetadas:**
  - `EditProfile.jsx` - Formulário para adicionar/editar redes sociais
  - `Profile.jsx` - Visualização de redes sociais com links clicáveis

### 2. **Compartilhamento em Redes Sociais**
- Botão "Compartilhar" em cards de itens
- Opções de compartilhamento:
  - 📱 WhatsApp
  - ✈️ Telegram
  - 𝕏 Twitter
  - 👍 Facebook
  - ✉️ Email
  - 📋 Copiar Texto

- **Componente:** `ShareButton.jsx`
- **Usado em:** `RegisterItem.jsx` (após criar item), `Home.jsx` (em cada card)

### 3. **Contato Direto via Redes Sociais**
- Modal de contato mostra redes sociais do proprietário
- Usuários podem:
  - Clicar direto para WhatsApp, Instagram, Facebook, etc.
  - Enviar mensagem pelo chat do sistema
  - Ver telefone do proprietário

- **Página:** `Home.jsx` - Modal de contato melhorado

---

## 🔧 Mudanças Técnicas

### Backend

#### 1. **Banco de Dados** (`scripts/add_social_media_fields.sql`)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
```

#### 2. **Schemas** (`app/schemas.py`)
- Adicionado `UserSocialMediaUpdate` para atualizar redes sociais
- Expandido `UserOut` com campos de redes sociais
- Adicionado `SocialShareLinks` para gerar URLs de compartilhamento

#### 3. **Endpoints** (`app/routers/auth.py`)

**POST /auth/update-social-media**
- Atualiza redes sociais do usuário autenticado
- Requer token JWT válido
- Campos opcionais

**GET /auth/users/{user_id}/social-media**
- Busca redes sociais de um usuário (público)
- Retorna dados de contato disponíveis

---

### Frontend

#### 1. **Novos Componentes**
- `ShareButton.jsx` - Botão reutilizável para compartilhamento

#### 2. **Páginas Modificadas**

**EditProfile.jsx**
- Seção de informações básicas
- Seção de contato (telefone/WhatsApp)
- Seção de redes sociais com inputs para cada rede
- Salva dados em dois endpoints (perfil + redes sociais)

**Profile.jsx**
- Visualiza redes sociais do usuário
- Botões clicáveis com ícones
- Links diretos para cada rede social
- Interface limpa e responsiva

**RegisterItem.jsx**
- Adiciona botão de compartilhamento após criar item
- Modal de sucesso com opções de compartilhamento
- Integração com componente ShareButton

**Home.jsx**
- Botão de compartilhamento em cada card de item
- Modal de contato melhorado com:
  - Exibição de redes sociais do proprietário
  - Links diretos (WhatsApp, Instagram, etc.)
  - Chat do sistema como alternativa
- Carrega redes sociais sob demanda

---

## 📋 Instruções de Implementação

### Passo 1: Preparar o Banco de Dados
1. Acesse o Supabase SQL Editor
2. Execute o script em `scripts/add_social_media_fields.sql`
3. Verifique se as colunas foram criadas na tabela `users`

### Passo 2: Backend - Implementado ✅
- ✅ Endpoints já criados em `app/routers/auth.py`
- ✅ Schemas atualizados em `app/schemas.py`
- ✅ Faça um restart do servidor FastAPI

### Passo 3: Frontend - Implementado ✅
- ✅ Todos os componentes criados/atualizados
- ✅ `npm install` para instalar dependências (se necessário)
- ✅ `npm run dev` para testar

### Passo 4: Testar Funcionalidades

#### Teste 1: Adicionar Redes Sociais
1. Faça login
2. Vá para Perfil > Editar Perfil
3. Preencha os campos de redes sociais
4. Clique em Salvar
5. Verifique se os dados aparecem no Perfil

#### Teste 2: Compartilhar Item
1. Registre um novo item
2. Após sucesso, clique em "Compartilhar"
3. Teste cada rede social (WhatsApp, Twitter, etc.)
4. Verifique se o texto é compartilhado corretamente

#### Teste 3: Contato via Redes Sociais
1. Na Home, veja um item de outro usuário
2. Clique em "Entrar em contato"
3. Verifique se as redes sociais do proprietário aparecem
4. Clique em uma rede social para contatar diretamente

---

## 🎨 Interface do Usuário

### Página de Edição de Perfil
```
┌─────────────────────────────────┐
│ Editar Perfil                   │
├─────────────────────────────────┤
│ Informações Básicas             │
│ [Nome: ................]         │
│ [Email: ............. ] (desab) │
├─────────────────────────────────┤
│ Contato                         │
│ [Telefone: .............]       │
│ [WhatsApp: .............]       │
├─────────────────────────────────┤
│ Redes Sociais                   │
│ [Instagram: .............]      │
│ [Twitter: ...............]      │
│ [Facebook: .............]       │
│ [LinkedIn: .............]       │
│                                 │
│ [Salvar]  [Cancelar]            │
└─────────────────────────────────┘
```

### Modal de Contato (Home)
```
┌─────────────────────────────────┐
│ Contato com o proprietário      │
├─────────────────────────────────┤
│ Item: Cachorro Preto e Branco   │
│                                 │
│ 📱 Contato direto:              │
│ [📷 Instagram] [💬 WhatsApp]    │
│ [🔗 LinkedIn] [☎️ Ligação]      │
│                                 │
│ Ou envie uma mensagem:          │
│ [...........................]   │
│ [...........................]   │
│                                 │
│ [Fechar] [Enviar Mensagem]      │
└─────────────────────────────────┘
```

---

## 🔐 Segurança

- ✅ Redes sociais são opcionais
- ✅ Endpoints de leitura (GET) são públicos (dados de contato)
- ✅ Endpoints de escrita (POST) requerem autenticação JWT
- ✅ Validação de formato em inputs
- ✅ Sanitização de URLs compartilhadas

---

## 📱 Compatibilidade

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile
- ✅ Todos os navegadores modernos

---

## 🐛 Possíveis Melhorias Futuras

1. **Validação de Usuários Sociais**
   - Verificar se o usuário existe antes de gerar links
   - Cache de perfis sociais

2. **Analytics**
   - Rastrear quantas vezes um item foi compartilhado
   - Qual rede social mais usada

3. **Verificação de Redes Sociais**
   - Badge de "Verificado" para usuários com redes confirmadas
   - Sistema de ratings/reviews

4. **Notificações**
   - Notificar quando alguém compartilha seu item
   - Histórico de compartilhamentos

5. **Integração Direta**
   - OAuth para conectar redes sociais automaticamente
   - Sincronização de fotos do item com social media

---

## 📞 Suporte

Para dúvidas sobre implementação, consulte:
- Backend: `app/routers/auth.py`
- Schemas: `app/schemas.py`
- Frontend: `frontend/src/pages/{EditProfile,Profile,Home}.jsx`
- Componentes: `frontend/src/components/ShareButton.jsx`

---

**Status:** ✅ Implementação Completa  
**Data:** Dezembro 2025  
**Desenvolvido para:** Projeto Recover
