
-- SQL para o Gerenciamento de Aulas

-- Tabela de aulas (caso não exista)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  video_url TEXT,
  content TEXT,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS para aulas
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Política de acesso para visualização pública das aulas
CREATE POLICY IF NOT EXISTS "Lessons are viewable by everyone" 
  ON public.lessons 
  FOR SELECT 
  USING (true);

-- Política para permitir que administradores gerenciem aulas
CREATE POLICY IF NOT EXISTS "Admins can insert lessons" 
  ON public.lessons 
  FOR INSERT 
  WITH CHECK ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can update lessons" 
  ON public.lessons 
  FOR UPDATE 
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can delete lessons" 
  ON public.lessons 
  FOR DELETE 
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Tabela de progresso das aulas (caso não exista)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para progresso das aulas
CREATE POLICY IF NOT EXISTS "Users can view their own lesson progress" 
  ON public.lesson_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own lesson progress" 
  ON public.lesson_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can modify their own lesson progress" 
  ON public.lesson_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Função para quando uma aula é inserida, atualizar a ordem se necessário
CREATE OR REPLACE FUNCTION public.handle_lesson_insertion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number = (
      SELECT COALESCE(MAX(order_number), 0) + 1
      FROM public.lessons
      WHERE module_id = NEW.module_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para manipular a inserção de aulas
DROP TRIGGER IF EXISTS handle_lesson_insertion_trigger ON public.lessons;
CREATE TRIGGER handle_lesson_insertion_trigger
BEFORE INSERT ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.handle_lesson_insertion();

-- Trigger para atualizar a data de modificação das aulas
DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
