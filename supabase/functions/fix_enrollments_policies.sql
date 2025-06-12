-- Script para adicionar políticas de permissão à tabela enrollments com CRUD completo
-- Execute este script no SQL Editor do Supabase

-- 0. Remover políticas existentes para evitar conflitos
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Remover políticas existentes para a tabela enrollments
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'enrollments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.enrollments', pol.policyname);
    END LOOP;
END
$$;

-- 1. Verificar se a tabela está habilitada para RLS (Row Level Security)
-- e habilitar se não estiver
DO $$
DECLARE
    is_rls_enabled BOOLEAN;
BEGIN
    SELECT rls_enabled INTO is_rls_enabled
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'enrollments';
    
    IF NOT is_rls_enabled THEN
        EXECUTE 'ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY';
    END IF;
END
$$;

-- 2. Criar uma única política para acesso completo (CRUD) à tabela enrollments
-- Esta abordagem é mais simples e abrangente
CREATE POLICY "Acesso completo à tabela enrollments" 
ON public.enrollments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. Garantir que a tabela tenha acesso público para leitura (opcional, se quiser permitir acesso anônimo)
CREATE POLICY "Acesso público para leitura da tabela enrollments" 
ON public.enrollments 
FOR SELECT 
TO anon 
USING (true);

-- 4. Conceder permissões explícitas para o role authenticated
GRANT ALL ON public.enrollments TO authenticated;

-- 5. Conceder permissões de leitura para o role anon
GRANT SELECT ON public.enrollments TO anon;

-- 6. Adicionar política para permitir que os administradores vejam todas as matrículas
CREATE POLICY "Administradores podem ver todas as matrículas" 
ON public.enrollments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 7. Adicionar política para permitir que os alunos vejam apenas suas próprias matrículas
CREATE POLICY "Alunos podem ver suas próprias matrículas" 
ON public.enrollments 
FOR SELECT 
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
