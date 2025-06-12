
-- SQL para o Gerenciamento de Cursos

-- Tabela de cursos (caso não exista)
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  duration TEXT,
  instructor TEXT NOT NULL,
  enrolledcount INTEGER DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS para cursos
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Política de acesso para visualização pública dos cursos
CREATE POLICY IF NOT EXISTS "Courses are viewable by everyone" 
  ON public.courses 
  FOR SELECT 
  USING (true);

-- Política para permitir que administradores gerenciem cursos
-- Usa a função is_admin() mais segura para verificar se o usuário é administrador
CREATE POLICY IF NOT EXISTS "Admins can insert courses" 
  ON public.courses 
  FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY IF NOT EXISTS "Admins can update courses" 
  ON public.courses 
  FOR UPDATE 
  USING (public.is_admin());

CREATE POLICY IF NOT EXISTS "Admins can delete courses" 
  ON public.courses 
  FOR DELETE 
  USING (public.is_admin());

-- Função para atualizar a data de modificação
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar a data de modificação dos cursos
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
