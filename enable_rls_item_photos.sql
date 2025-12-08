-- SOLUÇÃO: Adicionar política RLS para permitir leitura de fotos

-- Habilitar RLS na tabela (se ainda não estiver habilitado)
ALTER TABLE item_photos ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir LEITURA pública de todas as fotos
DROP POLICY IF EXISTS "Enable read access for all users" ON item_photos;
CREATE POLICY "Enable read access for all users" 
ON item_photos FOR SELECT 
USING (true);

-- Criar política para permitir INSERT apenas para usuários autenticados
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON item_photos;
CREATE POLICY "Enable insert for authenticated users" 
ON item_photos FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Criar política para permitir DELETE apenas para o dono do item
DROP POLICY IF EXISTS "Enable delete for item owners" ON item_photos;
CREATE POLICY "Enable delete for item owners" 
ON item_photos FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM items 
    WHERE items.id = item_photos.item_id 
    AND items.owner_id = auth.uid()::text
  )
);

-- Verificar se as políticas foram criadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'item_photos';
