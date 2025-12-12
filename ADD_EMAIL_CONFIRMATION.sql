-- ============================================
-- ADICIONAR COLUNA DE CONFIRMAÇÃO DE EMAIL
-- ============================================
-- Execute isto no Supabase SQL Editor

-- Adicionar coluna email_confirmed na tabela profiles (se não existir)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_email_confirmed ON profiles(email_confirmed);

-- Função para marcar email como confirmado quando o auth user é verificado
CREATE OR REPLACE FUNCTION mark_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário foi marcado como email_confirmed no Auth, atualizar a tabela profiles
  IF NEW.email_confirmed = true THEN
    UPDATE profiles 
    SET email_confirmed = true, updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronizar confirmação de email (opcional, depende da estrutura)
-- DROP TRIGGER IF EXISTS sync_email_confirmed_trigger ON auth.users;
-- CREATE TRIGGER sync_email_confirmed_trigger
-- AFTER UPDATE ON auth.users
-- FOR EACH ROW
-- EXECUTE FUNCTION mark_email_confirmed();

-- RLS Policy para bloquear usuarios com email não confirmado de certas operações
-- Nota: Essas políticas podem ser adicionadas após verificar a estrutura completa da tabela items
-- Por enquanto, vamos habilitar RLS mas sem restringir até confirmar que email_confirmed existe
