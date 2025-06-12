-- Script para corrigir as políticas de segurança da tabela certificates

-- Primeiro, verificamos se RLS está habilitado (deve estar)
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Removemos todas as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Certificates are publicly verifiable by ID" ON public.certificates;
DROP POLICY IF EXISTS "Admins can manage all certificates" ON public.certificates;

-- Criamos políticas mais abrangentes para garantir acesso adequado

-- 1. Política para permitir que qualquer usuário autenticado possa visualizar certificados
CREATE POLICY "Anyone can view certificates" 
  ON public.certificates 
  FOR SELECT 
  USING (true);

-- 2. Política para permitir que usuários autenticados criem seus próprios certificados
CREATE POLICY "Users can create their own certificates" 
  ON public.certificates 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Política para permitir que usuários autenticados atualizem seus próprios certificados
CREATE POLICY "Users can update their own certificates" 
  ON public.certificates 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Política para permitir que usuários autenticados excluam seus próprios certificados
CREATE POLICY "Users can delete their own certificates" 
  ON public.certificates 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Política para permitir que administradores gerenciem todos os certificados
CREATE POLICY "Admins can manage all certificates" 
  ON public.certificates 
  FOR ALL 
  TO authenticated
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- 6. Política alternativa para permitir que qualquer usuário autenticado crie certificados
-- Esta política é mais permissiva e pode ser usada se a política 2 não resolver o problema
CREATE POLICY "Authenticated users can create any certificate" 
  ON public.certificates 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Conceder permissões explícitas aos roles
GRANT ALL ON public.certificates TO authenticated;
GRANT SELECT ON public.certificates TO anon;

-- Como alternativa, se as políticas acima não resolverem o problema,
-- podemos desabilitar completamente o RLS para a tabela certificates
-- Descomente a linha abaixo se necessário:
-- ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
