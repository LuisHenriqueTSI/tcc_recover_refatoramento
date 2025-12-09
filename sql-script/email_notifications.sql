-- Email notifications via Supabase Edge Functions + pg_net
-- Steps:
-- 1) Replace <PROJECT_REF> with your Supabase project ref (e.g., abcdefghijklmnopqrst)
-- 2) Set a secret for triggers to call functions securely:
--    alter database postgres set app.settings.function_secret = '<strong-secret>';
-- 3) Ensure pg_net extension is enabled
-- 4) Deploy the Edge Functions `notify-message` and `notify-item-found`

-- Enable pg_net (required for HTTP calls from Postgres)
create extension if not exists "pg_net";

-- Function: notify-message (called on INSERT into messages)
create or replace function public.notify_message_http()
returns trigger
language plpgsql
security definer
as $$
declare
  endpoint text := 'https://uiegfwnlphfblvzupziu.functions.supabase.co/notify-message';
  secret text := current_setting('app.settings.function_secret', true);
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZWdmd25scGhmYmx2enVweml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNTM0ODQsImV4cCI6MjA3NTkyOTQ4NH0.zm6OPTKRUnQVfy7FdTlLMtHpehaVZUCpoBgyF3nXB04';
begin
  perform net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ) || case when secret is not null then jsonb_build_object('x-function-secret', secret) else '{}'::jsonb end,
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_message_http on public.messages;
create trigger trg_notify_message_http
  after insert on public.messages
  for each row execute procedure public.notify_message_http();


-- Function: notify-item-found (called when status/found changes to found/true)
create or replace function public.notify_item_found_http()
returns trigger
language plpgsql
security definer
as $$
declare
  endpoint text := 'https://uiegfwnlphfblvzupziu.functions.supabase.co/notify-item-found';
  secret text := current_setting('app.settings.function_secret', true);
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZWdmd25scGhmYmx2enVweml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNTM0ODQsImV4cCI6MjA3NTkyOTQ4NH0.zm6OPTKRUnQVfy7FdTlLMtHpehaVZUCpoBgyF3nXB04';
begin
  -- Only fire when status toggles to found/true
  if (coalesce(old.status, 'pending') = 'found' or coalesce(old.found, false) = true) then
    return NEW;
  end if;
  if not (coalesce(new.status, 'pending') = 'found' or coalesce(new.found, false) = true) then
    return NEW;
  end if;

  perform net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ) || case when secret is not null then jsonb_build_object('x-function-secret', secret) else '{}'::jsonb end,
    body := jsonb_build_object('record', row_to_json(NEW), 'old_record', row_to_json(OLD))
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_item_found_http on public.items;
create trigger trg_notify_item_found_http
  after update on public.items
  for each row execute procedure public.notify_item_found_http();
