-- Script para adicionar fotos placeholder aos itens existentes (OPCIONAL)
-- Execute este script no SQL Editor do Supabase se quiser adicionar imagens de teste

-- Inserir uma foto placeholder para cada item que não tem foto
-- Substitua a URL pela URL de uma imagem pública ou use um serviço como Unsplash
INSERT INTO item_photos (item_id, url)
SELECT 
    id as item_id,
    'https://via.placeholder.com/400x300?text=Item+' || id as url
FROM items
WHERE id NOT IN (SELECT DISTINCT item_id FROM item_photos WHERE item_id IS NOT NULL);

-- OU se você quiser usar imagens reais do Unsplash (imagens aleatórias):
-- INSERT INTO item_photos (item_id, url)
-- SELECT 
--     id as item_id,
--     'https://source.unsplash.com/random/400x300?object,lost,found&sig=' || id as url
-- FROM items
-- WHERE id NOT IN (SELECT DISTINCT item_id FROM item_photos WHERE item_id IS NOT NULL);

-- Verificar quantas fotos foram adicionadas
SELECT COUNT(*) as total_photos FROM item_photos;

-- Ver todas as fotos por item
SELECT i.id, i.title, ip.url 
FROM items i
LEFT JOIN item_photos ip ON i.id = ip.item_id
ORDER BY i.id;
