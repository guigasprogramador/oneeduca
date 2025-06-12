-- Script simplificado para adicionar políticas de permissão à tabela enrollments
-- Execute este script no SQL Editor do Supabase

-- 1. Habilitar RLS (Row Level Security) na tabela
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes individualmente
DROP POLICY IF EXISTS "Permitir acesso a todas as matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "Permitir inserção de matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "Permitir atualização de matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "Permitir exclusão de matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "Acesso completo à tabela enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Acesso público para leitura da tabela enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Administradores podem ver todas as matrículas" ON public.enrollments;
DROP POLICY IF EXISTS "Alunos podem ver suas próprias matrículas" ON public.enrollments;

-- 3. Criar política para acesso completo (CRUD)
CREATE POLICY "Acesso completo à tabela enrollments" 
ON public.enrollments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Conceder permissões explícitas
GRANT ALL ON public.enrollments TO authenticated;
GRANT SELECT ON public.enrollments TO anon;
