-- 1. Primeiro, adicionar as colunas necessárias à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS role text DEFAULT 'student';

-- 2. Atualizar os perfis existentes com emails dos usuários
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
AND p.email IS NULL;

-- 3. Definir o perfil do administrador existente
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'guigasprogramador@gmail.com';

-- 4. Criar política para permitir acesso a todos os perfis
-- Primeiro, verificar se a política já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Permitir acesso a todos os perfis'
    ) THEN
        EXECUTE 'CREATE POLICY "Permitir acesso a todos os perfis" ON public.profiles FOR SELECT USING (true)';
    END IF;
END
$$;

-- 5. Recriar a função get_all_users para usar a estrutura correta
DROP FUNCTION IF EXISTS public.get_all_users();

CREATE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  created_at timestamp with time zone,
  avatar_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    COALESCE(p.role, 'student') as role,
    p.created_at,
    p.avatar_url
  FROM 
    public.profiles p
  ORDER BY 
    p.created_at DESC;
END;
$$;
