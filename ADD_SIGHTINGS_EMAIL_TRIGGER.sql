-- Função e trigger para notificar por email em novo avistamento
-- Triggered via Postgres HTTP request (net.http_post) na Edge Function send-sighting-email
-- Padrão idêntico ao notify_message_http

CREATE OR REPLACE FUNCTION notify_sighting_http()
RETURNS TRIGGER AS $$
DECLARE
  endpoint text := 'https://uiegfwnlphfblvzupziu.functions.supabase.co/send-sighting-email';
  secret text := current_setting('app.settings.function_secret', true);
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZWdmd25scGhmYmx2enVweml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNTM0ODQsImV4cCI6MjA3NTkyOTQ4NH0.zm6OPTKRUnQVfy7FdTlLMtHpehaVZUCpoBgyF3nXB04';
BEGIN
  PERFORM net.http_post(
    url := endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ) || case when secret is not null then jsonb_build_object('x-function-secret', secret) else '{}'::jsonb end,
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_sighting ON sightings;
CREATE TRIGGER trg_notify_sighting
AFTER INSERT ON sightings
FOR EACH ROW EXECUTE FUNCTION notify_sighting_http();
