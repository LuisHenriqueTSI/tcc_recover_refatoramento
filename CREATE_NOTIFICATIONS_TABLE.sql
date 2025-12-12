-- Criar tabela de notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
  related_user_id UUID,
  read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX notifications_read_idx ON notifications(read);
CREATE INDEX notifications_email_sent_idx ON notifications(email_sent);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas suas próprias notificações
CREATE POLICY "Usuários podem ver suas notificações" ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Sistema pode inserir notificações
CREATE POLICY "Sistema pode criar notificações" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Usuários podem atualizar suas notificações
CREATE POLICY "Usuários podem atualizar suas notificações" ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar suas notificações
CREATE POLICY "Usuários podem deletar suas notificações" ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Criar função para notificar quando alguém avista um item
CREATE OR REPLACE FUNCTION notify_item_sighting()
RETURNS TRIGGER AS $$
DECLARE
  item_owner_id UUID;
  item_title TEXT;
  item_name TEXT;
  notification_message TEXT;
BEGIN
  -- Buscar proprietário e título do item
  SELECT owner_id, title, name INTO item_owner_id, item_title, item_name
  FROM items WHERE id = NEW.item_id;

  -- Garantir que temos o proprietário
  IF item_owner_id IS NOT NULL THEN
    -- Criar notificação
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      item_id,
      related_user_id,
      email_sent
    ) VALUES (
      item_owner_id::uuid,
      'sighting',
      'Avistamento do item: ' || COALESCE(item_title, item_name),
      'Alguém avistou seu item em ' || NEW.location || '! Clique para ver detalhes.',
      NEW.item_id,
      NEW.user_id,
      FALSE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para notificar ao criar avistamento
CREATE TRIGGER sightings_notify_trigger
  AFTER INSERT ON sightings
  FOR EACH ROW
  EXECUTE FUNCTION notify_item_sighting();

-- Criar função para notificar quando recebe mensagem
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Buscar nome do remetente
  SELECT name INTO sender_name
  FROM profiles WHERE id = NEW.sender_id;

  -- Criar notificação
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    item_id,
    related_user_id,
    email_sent
  ) VALUES (
    NEW.receiver_id,
    'message',
    'Nova mensagem de ' || COALESCE(sender_name, 'Usuário'),
    SUBSTRING(NEW.content, 1, 100) || (CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END),
    NEW.item_id,
    NEW.sender_id,
    FALSE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para notificar ao receber mensagem
CREATE TRIGGER messages_notify_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();
