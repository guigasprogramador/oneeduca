
-- SQL para o Gerenciamento de Certificados

-- Tabela de certificados (caso não exista)
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  user_name TEXT NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  UNIQUE(user_id, course_id)
);

-- RLS para certificados
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Políticas para certificados
CREATE POLICY IF NOT EXISTS "Users can view their own certificates" 
  ON public.certificates 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Permitir acesso público a certificados via UUID para verificação
CREATE POLICY IF NOT EXISTS "Certificates are publicly verifiable by ID" 
  ON public.certificates 
  FOR SELECT 
  USING (true);

-- Políticas para permitir que administradores gerenciem todos os certificados
CREATE POLICY IF NOT EXISTS "Admins can manage all certificates" 
  ON public.certificates 
  FOR ALL 
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Função para gerar certificado automaticamente quando um curso é concluído
CREATE OR REPLACE FUNCTION public.generate_course_certificate()
RETURNS TRIGGER AS $$
DECLARE
  course_title TEXT;
  user_full_name TEXT;
BEGIN
  -- Só gera certificado se o curso foi concluído (progress = 100)
  IF NEW.progress = 100 AND NEW.completed_at IS NOT NULL THEN
    -- Busca o título do curso
    SELECT title INTO course_title FROM public.courses WHERE id = NEW.course_id;
    
    -- Busca o nome do usuário
    SELECT name INTO user_full_name FROM public.profiles WHERE id = NEW.user_id;
    
    -- Insere o certificado se não existir
    INSERT INTO public.certificates (user_id, course_id, course_name, user_name)
    VALUES (NEW.user_id, NEW.course_id, course_title, user_full_name)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para gerar certificado automaticamente
DROP TRIGGER IF EXISTS generate_certificate_on_course_completion ON public.enrollments;
CREATE TRIGGER generate_certificate_on_course_completion
AFTER UPDATE ON public.enrollments
FOR EACH ROW
WHEN (OLD.progress < 100 AND NEW.progress = 100)
EXECUTE FUNCTION public.generate_course_certificate();

-- Função para gerar certificado manualmente por um administrador
CREATE OR REPLACE FUNCTION public.admin_generate_certificate(p_user_id UUID, p_course_id UUID)
RETURNS UUID AS $$
DECLARE
  course_title TEXT;
  user_full_name TEXT;
  cert_id UUID;
BEGIN
  -- Busca o título do curso
  SELECT title INTO course_title FROM public.courses WHERE id = p_course_id;
  IF course_title IS NULL THEN
    RAISE EXCEPTION 'Curso não encontrado';
  END IF;
  
  -- Busca o nome do usuário
  SELECT name INTO user_full_name FROM public.profiles WHERE id = p_user_id;
  IF user_full_name IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  -- Insere ou atualiza o certificado
  INSERT INTO public.certificates (user_id, course_id, course_name, user_name)
  VALUES (p_user_id, p_course_id, course_title, user_full_name)
  ON CONFLICT (user_id, course_id) 
  DO UPDATE SET 
    issue_date = now(),
    course_name = course_title,
    user_name = user_full_name
  RETURNING id INTO cert_id;
  
  RETURN cert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
