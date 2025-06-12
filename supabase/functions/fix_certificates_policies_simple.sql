-- Script simplificado para corrigir as polu00edticas de seguranu00e7a da tabela certificates
-- Desabilita completamente o RLS (Row Level Security) para permitir acesso total

-- Primeiro, removemos todas as polu00edticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Certificates are publicly verifiable by ID" ON public.certificates;
DROP POLICY IF EXISTS "Admins can manage all certificates" ON public.certificates;
DROP POLICY IF EXISTS "Anyone can view certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can create their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can update their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can delete their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Authenticated users can create any certificate" ON public.certificates;

-- Conceder permissu00f5es explu00edcitas aos roles
GRANT ALL ON public.certificates TO authenticated;
GRANT SELECT ON public.certificates TO anon;

-- Desabilitar completamente o RLS para a tabela certificates
-- Esta u00e9 a soluu00e7u00e3o mais direta para resolver problemas de permissu00e3o
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
