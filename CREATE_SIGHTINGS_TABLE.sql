-- Criar tabela de avistamentos
CREATE TABLE sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX sightings_item_id_idx ON sightings(item_id);
CREATE INDEX sightings_user_id_idx ON sightings(user_id);
CREATE INDEX sightings_created_at_idx ON sightings(created_at DESC);

-- Habilitar RLS
ALTER TABLE sightings ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer usuário autenticado pode ver avistamentos de itens públicos
CREATE POLICY "Qualquer um pode ver avistamentos" ON sightings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Usuários autenticados podem criar avistamentos
CREATE POLICY "Usuários autenticados podem criar avistamentos" ON sightings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar seus próprios avistamentos
CREATE POLICY "Usuários podem deletar seus próprios avistamentos" ON sightings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Proprietários do item podem deletar avistamentos
CREATE POLICY "Proprietários podem deletar avistamentos do seu item" ON sightings
  FOR DELETE
  TO authenticated
  USING (
    item_id IN (
      SELECT id FROM items WHERE owner_id = auth.uid()
    )
  );

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sightings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para updated_at
CREATE TRIGGER sightings_updated_at_trigger
  BEFORE UPDATE ON sightings
  FOR EACH ROW
  EXECUTE FUNCTION update_sightings_timestamp();
