
-- SQL para o Gerenciamento de Matrículas

-- Tabela de matrículas (caso não exista)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- RLS para matrículas
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Políticas para matrículas
CREATE POLICY IF NOT EXISTS "Users can view their own enrollments" 
  ON public.enrollments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own enrollments" 
  ON public.enrollments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Políticas para permitir que administradores gerenciem todas as matrículas
CREATE POLICY IF NOT EXISTS "Admins can view all enrollments" 
  ON public.enrollments 
  FOR SELECT 
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can manage all enrollments" 
  ON public.enrollments 
  FOR ALL 
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Função para atualizar a contagem de matrículas
CREATE OR REPLACE FUNCTION public.update_course_enrolled_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.courses
    SET "enrolledCount" = "enrolledCount" + 1
    WHERE id = NEW.course_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.courses
    SET "enrolledCount" = GREATEST("enrolledCount" - 1, 0)
    WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar a contagem de matrículas
DROP TRIGGER IF EXISTS update_course_enrolled_count_trigger ON public.enrollments;
CREATE TRIGGER update_course_enrolled_count_trigger
AFTER INSERT OR DELETE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.update_course_enrolled_count();
