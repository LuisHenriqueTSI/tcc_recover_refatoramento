-- Script para diagnosticar e corrigir URLs de fotos no Supabase

-- 1. Ver todas as fotos atuais e suas URLs
SELECT id, item_id, url, uploaded_at 
FROM item_photos 
ORDER BY item_id 
LIMIT 20;

-- 2. Verificar se há URLs que apontam para localhost (backend antigo)
SELECT id, item_id, url 
FROM item_photos 
WHERE url LIKE '%localhost%' OR url LIKE '%8000%';

-- 3. Verificar o formato das URLs do Supabase Storage
-- URLs do Supabase Storage devem ser algo como:
-- https://[PROJECT_ID].supabase.co/storage/v1/object/public/item-photos/[PATH]

-- 4. Se as URLs estiverem apontando para localhost, CORRIJA assim:
-- (Substitua YOUR_PROJECT_ID pelo ID do seu projeto Supabase)
-- 
-- UPDATE item_photos 
-- SET url = REPLACE(
--     url, 
--     'http://localhost:8000/storage/', 
--     'https://uiegfwnlphfblvzupziu.supabase.co/storage/v1/object/public/'
-- )
-- WHERE url LIKE '%localhost%';

-- 5. OU se as fotos estão no Storage mas as URLs estão erradas,
-- reconstrua as URLs baseado nos nomes dos arquivos do Storage:
-- 
-- Primeiro, veja quais arquivos existem no Storage (vai para o dashboard)
-- Depois, atualize as URLs para o formato correto:
-- 
-- UPDATE item_photos 
-- SET url = 'https://uiegfwnlphfblvzupziu.supabase.co/storage/v1/object/public/item-photos/' || 
--           'item_' || item_id || '_' || id || '.jpg'
-- WHERE url IS NULL OR url LIKE '%localhost%';

-- 6. Verificar quantas fotos cada item tem
SELECT item_id, COUNT(*) as foto_count 
FROM item_photos 
GROUP BY item_id 
ORDER BY foto_count DESC;

-- 7. Ver se há itens sem foto
SELECT i.id, i.title 
FROM items i 
LEFT JOIN item_photos ip ON i.id = ip.item_id 
WHERE ip.id IS NULL;
