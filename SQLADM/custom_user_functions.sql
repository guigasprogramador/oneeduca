
-- Função para obter todos os usuários (compatível com RLS)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se o usuário atual é administrador
  IF NOT (SELECT (raw_user_meta_data->>'role') = 'admin' FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'name' as name,
    u.raw_user_meta_data->>'role' as role,
    u.created_at
  FROM auth.users u;
END;
$$;

-- Função para atualizar os metadados do usuário
CREATE OR REPLACE FUNCTION public.update_user_metadata(user_id UUID, user_metadata JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se o usuário atual é administrador
  IF NOT (SELECT (raw_user_meta_data->>'role') = 'admin' FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;
  
  -- Atualiza os metadados do usuário
  UPDATE auth.users
  SET raw_user_meta_data = user_metadata
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Função para excluir um usuário
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se o usuário atual é administrador
  IF NOT (SELECT (raw_user_meta_data->>'role') = 'admin' FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;
  
  -- Exclui o usuário (na prática, você pode querer usar soft delete ou outras estratégias)
  DELETE FROM auth.users WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;
