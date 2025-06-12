-- Script para desabilitar RLS na tabela enrollments
-- Esta é uma solução temporária para resolver os problemas de permissão

-- 1. Desabilitar RLS (Row Level Security) na tabela enrollments
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;

-- 2. Conceder permissões explícitas
GRANT ALL ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO anon;
GRANT ALL ON public.enrollments TO service_role;
