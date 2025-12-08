-- Verificar estrutura e dados da tabela item_photos

-- 1. Ver estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'item_photos'
ORDER BY ordinal_position;

-- 2. Ver todas as fotos (primeiras 20)
SELECT * FROM item_photos ORDER BY id LIMIT 20;

-- 3. Ver quantas fotos existem por item
SELECT item_id, COUNT(*) as total_fotos
FROM item_photos
GROUP BY item_id
ORDER BY item_id;

-- 4. Verificar políticas RLS (Row Level Security)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'item_photos';

-- 5. Se não houver política de leitura pública, adicione:
-- DROP POLICY IF EXISTS "Enable read access for all users" ON item_photos;
-- CREATE POLICY "Enable read access for all users" 
-- ON item_photos FOR SELECT 
-- USING (true);

-- 6. Ou para permitir apenas leitura autenticada:
-- DROP POLICY IF EXISTS "Enable read access for authenticated users" ON item_photos;
-- CREATE POLICY "Enable read access for authenticated users" 
-- ON item_photos FOR SELECT 
-- TO authenticated
-- USING (true);
