-- Esta função SQL personalizada busca todos os usuários da tabela public.profiles
-- Deve ser executada no Supabase SQL Editor para criar a função no banco de dados

-- Primeiro, excluir a função existente para evitar erros de tipo de retorno
DROP FUNCTION IF EXISTS public.get_all_users();

-- Agora criar a nova função
CREATE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text,
  created_at timestamp with time zone,
  avatar_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com as permissões do criador, não do chamador
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name,
    p.role,
    p.created_at,
    p.avatar_url
  FROM 
    public.profiles p
  ORDER BY 
    p.created_at DESC;
END;
$$;
