-- Script para adicionar a coluna status à tabela enrollments
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar a coluna status à tabela enrollments
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 2. Atualizar registros existentes para ter o status 'active'
UPDATE public.enrollments
SET status = 'active'
WHERE status IS NULL;

-- 3. Criar política para permitir acesso a todas as matrículas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'enrollments' 
        AND policyname = 'Permitir acesso a todas as matrículas'
    ) THEN
        EXECUTE 'CREATE POLICY "Permitir acesso a todas as matrículas" ON public.enrollments FOR SELECT USING (true)';
    END IF;
END
$$;
