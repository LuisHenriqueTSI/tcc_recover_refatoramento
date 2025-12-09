-- ============================================
-- CORRIGIR RLS DO STORAGE (item-photos bucket)
-- ============================================
-- Execute isto no Supabase SQL Editor

-- 1. Remover políticas antigas do Storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to item-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "item-photos-public-read" ON storage.objects;
DROP POLICY IF EXISTS "item-photos-authenticated-upload" ON storage.objects;
DROP POLICY IF EXISTS "item-photos-owner-delete" ON storage.objects;

-- 2. Criar novas políticas CORRETAS para Storage

-- Política 1: Qualquer um pode LER (SELECT) do bucket item-photos
CREATE POLICY "item-photos-public-read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'item-photos');

-- Política 2: Autenticados podem UPLOAD (INSERT) para item-photos
CREATE POLICY "item-photos-authenticated-upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'item-photos'
    AND auth.role() = 'authenticated'
  );

-- Política 3: Autenticados podem DELETAR (DELETE) seus arquivos do item-photos
CREATE POLICY "item-photos-authenticated-delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'item-photos'
    AND auth.role() = 'authenticated'
  );

-- 3. Verificar
SELECT policyname, permissive
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
