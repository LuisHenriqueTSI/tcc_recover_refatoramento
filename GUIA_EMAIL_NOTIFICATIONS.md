# 🔧 Guia: Ativar Notificações por Email no Chat

## Problema
Usuários não recebem emails quando mensagens são enviadas no chat.

---

## ✅ Solução em 5 Passos

### **Passo 1: Verificar Extensão pg_net**

1. Abra o Dashboard do Supabase
2. Vá em **SQL Editor** → **New Query**
3. Execute:

```sql
SELECT extname FROM pg_extension WHERE extname = 'pg_net';
```

**Se retornar vazio**, execute:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

### **Passo 2: Verificar Trigger**

Execute na SQL:

```sql
SELECT 
  tgname,
  tgrelid::regclass AS table_name,
  CASE WHEN tgenabled = 'O' THEN '✓ ATIVADO' ELSE '✗ DESATIVADO' END AS status
FROM pg_trigger 
WHERE tgname = 'trg_notify_message_http';
```

**Se retornar status = DESATIVADO**, execute:
```sql
ALTER TABLE public.messages ENABLE TRIGGER trg_notify_message_http;
```

---

### **Passo 3: Verificar Variáveis de Ambiente**

1. Vá em **Funções** → **notify-message** (ou **notify-item-found**)
2. Clique em **Configurações** (⚙️)
3. Vá em **Variáveis de Ambiente**
4. Verifique se existem:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `SMTP_USERNAME` | Sua chave API do Brevo | Obtém em https://app.brevo.com/settings/account/api |
| `SMTP_SENDER_EMAIL` | seu-email@seu-dominio.com | Email verificado no Brevo |
| `SMTP_SENDER_NAME` | Recover (opcional) | Nome que aparece no remetente |

**Se faltar alguma**, clique em **Adicionar Variável** e preencha.

---

### **Passo 4: Testar Inserção de Mensagem**

1. Na SQL, primeiro obtenha dois usuários:

```sql
SELECT id, name, email FROM profiles WHERE email IS NOT NULL LIMIT 5;
```

2. Copie dois IDs diferentes (um será sender, outro receiver)

3. Execute a inserção:

```sql
INSERT INTO public.messages (sender_id, receiver_id, content, created_at)
VALUES (
  'SENDER_ID_AQUI',
  'RECEIVER_ID_AQUI', 
  'Teste de notificação por email',
  now()
);
```

---

### **Passo 5: Verificar Logs**

1. Vá em **Funções** → **notify-message**
2. Clique em **Logs**
3. Procure pela mensagem que você inseriu
4. Verifique:

| Log | Significado | Solução |
|-----|-----------|---------|
| `[sendEmail] Brevo API error` | API do Brevo rejeitou | Verifique SMTP_USERNAME e SMTP_SENDER_EMAIL |
| `[notify-message] Recipient fetch error` | receiver_id não existe | Verifique o UUID do receiver |
| `Recipient email not found` | Usuario não tem email | Execute: `UPDATE profiles SET email = '...' WHERE id = '...'` |
| Nenhum log aparece | Trigger não disparou | Volte ao Passo 2, trigger pode estar desativado |
| `OK` ou sem erro | ✓ Email enviado! | Pronto! Verifique a caixa de email |

---

## 🔍 Diagnóstico Rápido

Se ainda não funcionar, faça este teste:

```bash
# Teste direto da edge function (via curl)
curl -X POST https://uiegfwnlphfblvzupziu.functions.supabase.co/notify-message \
  -H "Content-Type: application/json" \
  -d '{
    "record": {
      "sender_id": "seu-sender-uuid",
      "receiver_id": "seu-receiver-uuid",
      "content": "Teste direto"
    }
  }'
```

Se funcionar, o problema está no trigger.
Se não funcionar, o problema está na edge function ou variáveis.

---

## 📋 Checklist Final

- [ ] `pg_net` está ativado
- [ ] Trigger `trg_notify_message_http` está **ATIVADO**
- [ ] Edge Function `notify-message` foi **deployada**
- [ ] `SMTP_USERNAME` configurado
- [ ] `SMTP_SENDER_EMAIL` configurado
- [ ] Ambos os usuários têm email válido em `profiles`
- [ ] Teste de inserção executado e logs verificados
- [ ] Email recebido na caixa de entrada

---

## ❌ Problemas Comuns

### "Internal error" nos logs
→ Procure por erros específicos acima na tabela de logs

### Sem logs aparecendo
→ Trigger está desativado (volte ao Passo 2)

### "Missing Brevo env vars"
→ Faltam variáveis de ambiente (volte ao Passo 3)

### Email não chega na caixa
→ Verifique spam/lixo eletrônico
→ Ou remetenete não está verificado no Brevo

---

## 💡 Próximos Passos

Depois de funcionando:
1. Testar envio real via chat do app
2. Verificar se email chega em < 5 segundos
3. Considerar adicionar template HTML melhor nos emails
4. Testar notificação de item encontrado (`notify-item-found`)

