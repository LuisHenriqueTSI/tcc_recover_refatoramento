# Sistema de Notificações por Email

## Configuração Necessária

### 1. Criar conta no Resend
1. Acesse: https://resend.com
2. Faça signup (é grátis para testes)
3. Copie sua API Key

### 2. Configurar variável de ambiente no Supabase
1. No dashboard do Supabase: Project Settings → Edge Functions
2. Adicione a variável: `RESEND_API_KEY` com seu token do Resend
3. Salve as mudanças

### 3. Deploy da Edge Function
No seu terminal, execute:

```bash
cd frontend
supabase functions deploy send-email-notification
```

Se não tiver `supabase` CLI instalado:
```bash
npm install -g supabase
supabase login
```

### 4. Executar SQL no Supabase
1. Copie todo o conteúdo de `CREATE_NOTIFICATIONS_TABLE.sql`
2. Vá para: SQL Editor → New Query
3. Cole e execute o SQL
4. Isso vai criar:
   - Tabela de notificações
   - Triggers automáticos para criar notificações
   - Funções PostgreSQL para disparar eventos

## Como Funciona

### Flow de Notificações

1. **Usuário avista um item**
   - Trigger `sightings_notify_trigger` dispara automaticamente
   - Cria notificação para o proprietário do item
   - Sistema pode enviar email via Resend

2. **Usuário recebe mensagem**
   - Trigger `messages_notify_trigger` dispara automaticamente
   - Cria notificação para o receptor da mensagem
   - Sistema pode enviar email via Resend

### Tipos de Notificações
- `sighting`: Quando alguém avista um item
- `message`: Quando recebe uma mensagem
- `reward_claim`: Quando alguém reclama uma recompensa

## Testando

### Teste 1: Criar uma notificação manualmente
```sql
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  email_sent
) VALUES (
  'seu-user-id-aqui',
  'sighting',
  'Teste de Notificação',
  'Esta é uma mensagem de teste',
  false
);
```

### Teste 2: Enviar um email
Use a função `sendEmailNotification(notificationId)` no serviço `notifications.js`

## Próximos Passos

1. Adicionar o painel de notificações na interface
2. Implementar notificações em tempo real (WebSocket)
3. Permitir que usuários configurem preferências de notificação (email, SMS, etc.)
4. Adicionar mais tipos de notificações conforme necessário

## Troubleshooting

Se não receber emails:
1. Verifique a API Key do Resend
2. Verifique se a Edge Function foi deployada corretamente
3. Cheque os logs no Supabase (Functions → Logs)
4. Verifique se o email está indo para SPAM
