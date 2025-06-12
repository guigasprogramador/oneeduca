
-- SQL para o Gerenciamento de Módulos

-- Tabela de módulos (caso não exista)
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS para módulos
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Política de acesso para visualização pública dos módulos
CREATE POLICY IF NOT EXISTS "Modules are viewable by everyone" 
  ON public.modules 
  FOR SELECT 
  USING (true);

-- Política para permitir que administradores gerenciem módulos
CREATE POLICY IF NOT EXISTS "Admins can insert modules" 
  ON public.modules 
  FOR INSERT 
  WITH CHECK ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can update modules" 
  ON public.modules 
  FOR UPDATE 
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can delete modules" 
  ON public.modules 
  FOR DELETE 
  USING ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Função para quando um módulo é inserido, atualizar a ordem se necessário
CREATE OR REPLACE FUNCTION public.handle_module_insertion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number = (
      SELECT COALESCE(MAX(order_number), 0) + 1
      FROM public.modules
      WHERE course_id = NEW.course_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para manipular a inserção de módulos
DROP TRIGGER IF EXISTS handle_module_insertion_trigger ON public.modules;
CREATE TRIGGER handle_module_insertion_trigger
BEFORE INSERT ON public.modules
FOR EACH ROW
EXECUTE FUNCTION public.handle_module_insertion();

-- Trigger para atualizar a data de modificação dos módulos
DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
