
-- SQL para o Gerenciamento de Usuários

-- Tabela de perfis (caso não exista)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  job_title TEXT,
  company TEXT,
  location TEXT,
  website TEXT
);

-- RLS para perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY IF NOT EXISTS "Users can view their own profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Políticas para permitir que administradores gerenciem todos os perfis
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Função para criar automaticamente um perfil quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar um perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar a data de modificação dos perfis
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar o papel (role) do usuário
CREATE OR REPLACE FUNCTION public.update_user_role(user_email TEXT, new_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Encontra o ID do usuário pelo email
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  -- Se o usuário não for encontrado, retorna falso
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Atualiza o papel do usuário
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    concat('"', new_role, '"')::jsonb
  )
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
