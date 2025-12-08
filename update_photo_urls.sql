-- Script para CORRIGIR URLs das fotos antigas do Supabase Storage
-- Execute este script no SQL Editor do Supabase

-- Passo 1: Ver as URLs atuais
SELECT id, item_id, url FROM item_photos LIMIT 10;

-- Passo 2: Atualizar todas as URLs para o formato correto do Supabase Storage
-- Baseado nos arquivos que vi no seu Storage (item_41_1764880364.jpg, etc.)

-- Se as URLs estão no formato antigo do backend FastAPI:
UPDATE item_photos 
SET url = 'https://uiegfwnlphfblvzupziu.supabase.co/storage/v1/object/public/item-photos/' || 
          substring(url from 'item_\d+_\d+\.\w+')
WHERE url LIKE '%localhost%' OR url LIKE '%8000%';

-- OU se você souber o padrão exato dos nomes dos arquivos no Storage:
-- UPDATE item_photos 
-- SET url = 'https://uiegfwnlphfblvzupziu.supabase.co/storage/v1/object/public/item-photos/item_' || 
--           item_id || '_' || id || '.jpg'
-- WHERE url IS NULL OR url NOT LIKE 'https://uiegfwnlphfblvzupziu.supabase.co%';

-- Passo 3: Verificar se funcionou
SELECT id, item_id, url FROM item_photos LIMIT 10;
