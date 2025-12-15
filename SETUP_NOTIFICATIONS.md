# Notificações por Email (Avistamentos)

## Passos de Configuração

### 1) Variáveis de Ambiente nas Edge Functions
No Supabase Dashboard, em Project Settings → Edge Functions → Environment Variables, adicione:
- `RESEND_API_KEY`: sua API key do Resend
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: service role key do projeto

### 2) Deploy da função
No terminal, execute:

```bash
cd frontend
supabase functions deploy send-sighting-email
```

Se não tiver a CLI:
```bash
npm install -g supabase
supabase login
```

### 3) Garantir tabela `sightings`
Execute o SQL de criação da tabela sightings (ajustada para `item_id BIGINT`).

### 4) Comportamento
- Quando um avistamento é criado (`createSighting`), o frontend invoca `send-sighting-email` passando `sightingId`.
- A função (com service role) busca o item, resolve o e-mail do proprietário via Auth Admin, e envia o e-mail via Resend.

### 5) Teste rápido
Após criar um avistamento, verifique logs da função nas Edge Functions e o recebimento do e-mail.

## Dicas
- Caso não queira chamar via frontend, você pode criar um trigger no banco que publique em uma tabela de eventos e uma função edge em cron consuma e envie e-mails em lote.
