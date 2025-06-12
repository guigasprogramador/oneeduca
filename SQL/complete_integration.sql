-- =====================================================
-- INTEGRAÇÃO COMPLETA DO SISTEMA LMS
-- Comandos SQL para criar tabelas, colunas, políticas e funções
-- para funcionalidades de professor, fórum e formulários
-- =====================================================

-- 1. ADICIONAR COLUNAS NECESSÁRIAS NA TABELA PROFILES
-- =====================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'professor', 'student'));

-- Atualizar usuários existentes para ter role 'student' por padrão
UPDATE public.profiles SET role = 'student' WHERE role IS NULL;

-- 2. ADICIONAR COLUNAS NECESSÁRIAS NA TABELA COURSES
-- =====================================================
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Atualizar cursos existentes para status 'approved'
UPDATE public.courses SET status = 'approved' WHERE status IS NULL;

-- 3. ADICIONAR COLUNAS PARA QUIZ NOS MÓDULOS
-- =====================================================
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS has_quiz BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quiz_data JSONB;

-- 4. CRIAR TABELA PARA ARQUIVOS COMPLEMENTARES DAS AULAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR TABELA PARA DUPLICAÇÃO DE CURSOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_duplications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  duplicated_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  duplicated_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.course_duplications ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR TABELAS PARA FÓRUM
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.course_forums ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.forum_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES public.course_forums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  parent_message_id UUID REFERENCES public.forum_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.forum_messages ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR TABELA PARA RESPOSTAS DE QUIZ
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  responses JSONB NOT NULL,
  score INTEGER,
  max_score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR TABELA PARA FORMULÁRIOS PERSONALIZADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.custom_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  form_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR TABELA PARA RESPOSTAS DOS FORMULÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  responses JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(form_id, user_id)
);

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Políticas para Courses (Professor)
DROP POLICY IF EXISTS "Professors can create courses" ON public.courses;
CREATE POLICY "Professors can create courses"
  ON public.courses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'professor'
    ) AND auth.uid() = professor_id
  );

DROP POLICY IF EXISTS "Professors can update their own courses" ON public.courses;
CREATE POLICY "Professors can update their own courses"
  ON public.courses
  FOR UPDATE
  USING (auth.uid() = professor_id);

DROP POLICY IF EXISTS "Professors can delete their own courses" ON public.courses;
CREATE POLICY "Professors can delete their own courses"
  ON public.courses
  FOR DELETE
  USING (auth.uid() = professor_id);

DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
CREATE POLICY "Admins can manage all courses"
  ON public.courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para Modules
DROP POLICY IF EXISTS "Professors can manage modules of their courses" ON public.modules;
CREATE POLICY "Professors can manage modules of their courses"
  ON public.modules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND professor_id = auth.uid()
    )
  );

-- Políticas para Lessons
DROP POLICY IF EXISTS "Professors can manage lessons of their courses" ON public.lessons;
CREATE POLICY "Professors can manage lessons of their courses"
  ON public.lessons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.professor_id = auth.uid()
    )
  );

-- Políticas para Lesson Attachments
DROP POLICY IF EXISTS "Professors can manage attachments of their lessons" ON public.lesson_attachments;
CREATE POLICY "Professors can manage attachments of their lessons"
  ON public.lesson_attachments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.modules m ON l.module_id = m.id
      JOIN public.courses c ON m.course_id = c.id
      WHERE l.id = lesson_id AND c.professor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view attachments of enrolled courses" ON public.lesson_attachments;
CREATE POLICY "Students can view attachments of enrolled courses"
  ON public.lesson_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.modules m ON l.module_id = m.id
      JOIN public.enrollments e ON m.course_id = e.course_id
      WHERE l.id = lesson_id AND e.user_id = auth.uid()
    )
  );

-- Políticas para Course Duplications
DROP POLICY IF EXISTS "Professors can view their course duplications" ON public.course_duplications;
CREATE POLICY "Professors can view their course duplications"
  ON public.course_duplications
  FOR SELECT
  USING (duplicated_by = auth.uid());

DROP POLICY IF EXISTS "Professors can create course duplications" ON public.course_duplications;
CREATE POLICY "Professors can create course duplications"
  ON public.course_duplications
  FOR INSERT
  WITH CHECK (duplicated_by = auth.uid());

-- Políticas para Course Forums
DROP POLICY IF EXISTS "Course members can view forums" ON public.course_forums;
CREATE POLICY "Course members can view forums"
  ON public.course_forums
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE c.id = course_id AND (c.professor_id = auth.uid() OR e.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Professors can manage forums of their courses" ON public.course_forums;
CREATE POLICY "Professors can manage forums of their courses"
  ON public.course_forums
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND professor_id = auth.uid()
    )
  );

-- Políticas para Forum Messages
DROP POLICY IF EXISTS "Course members can view forum messages" ON public.forum_messages;
CREATE POLICY "Course members can view forum messages"
  ON public.forum_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_forums cf
      JOIN public.courses c ON cf.course_id = c.id
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE cf.id = forum_id AND (c.professor_id = auth.uid() OR e.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Course members can create forum messages" ON public.forum_messages;
CREATE POLICY "Course members can create forum messages"
  ON public.forum_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.course_forums cf
      JOIN public.courses c ON cf.course_id = c.id
      LEFT JOIN public.enrollments e ON c.id = e.course_id
      WHERE cf.id = forum_id AND (c.professor_id = auth.uid() OR e.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own forum messages" ON public.forum_messages;
CREATE POLICY "Users can update their own forum messages"
  ON public.forum_messages
  FOR UPDATE
  USING (user_id = auth.uid());

-- Políticas para Quiz Responses
DROP POLICY IF EXISTS "Users can view their own quiz responses" ON public.quiz_responses;
CREATE POLICY "Users can view their own quiz responses"
  ON public.quiz_responses
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own quiz responses" ON public.quiz_responses;
CREATE POLICY "Users can create their own quiz responses"
  ON public.quiz_responses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own quiz responses" ON public.quiz_responses;
CREATE POLICY "Users can update their own quiz responses"
  ON public.quiz_responses
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Professors can view quiz responses of their courses" ON public.quiz_responses;
CREATE POLICY "Professors can view quiz responses of their courses"
  ON public.quiz_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON m.course_id = c.id
      WHERE m.id = module_id AND c.professor_id = auth.uid()
    )
  );

-- Políticas para Custom Forms
DROP POLICY IF EXISTS "Professors can manage forms of their courses" ON public.custom_forms;
CREATE POLICY "Professors can manage forms of their courses"
  ON public.custom_forms
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_id AND professor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can view active forms of enrolled courses" ON public.custom_forms;
CREATE POLICY "Students can view active forms of enrolled courses"
  ON public.custom_forms
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.enrollments 
      WHERE course_id = course_id AND user_id = auth.uid()
    )
  );

-- Políticas para Form Responses
DROP POLICY IF EXISTS "Users can view their own form responses" ON public.form_responses;
CREATE POLICY "Users can view their own form responses"
  ON public.form_responses
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own form responses" ON public.form_responses;
CREATE POLICY "Users can create their own form responses"
  ON public.form_responses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own form responses" ON public.form_responses;
CREATE POLICY "Users can update their own form responses"
  ON public.form_responses
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Professors can view form responses of their courses" ON public.form_responses;
CREATE POLICY "Professors can view form responses of their courses"
  ON public.form_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_forms cf
      JOIN public.courses c ON cf.course_id = c.id
      WHERE cf.id = form_id AND c.professor_id = auth.uid()
    )
  );

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar se usuário é professor
CREATE OR REPLACE FUNCTION public.is_professor(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'professor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter cursos do professor
CREATE OR REPLACE FUNCTION public.get_professor_courses(prof_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  duration TEXT,
  instructor TEXT,
  enrolledcount INTEGER,
  rating NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  modules_count BIGINT,
  enrollments_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.thumbnail,
    c.duration,
    c.instructor,
    c.enrolledcount,
    c.rating,
    c.status,
    c.created_at,
    c.updated_at,
    COUNT(DISTINCT m.id) as modules_count,
    COUNT(DISTINCT e.id) as enrollments_count
  FROM public.courses c
  LEFT JOIN public.modules m ON c.id = m.course_id
  LEFT JOIN public.enrollments e ON c.id = e.course_id
  WHERE c.professor_id = prof_id
  GROUP BY c.id, c.title, c.description, c.thumbnail, c.duration, 
           c.instructor, c.enrolledcount, c.rating, c.status, 
           c.created_at, c.updated_at
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para duplicar curso
CREATE OR REPLACE FUNCTION public.duplicate_course(
  original_course_id UUID,
  new_title TEXT,
  professor_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_course_id UUID;
  module_record RECORD;
  lesson_record RECORD;
  new_module_id UUID;
BEGIN
  -- Verificar se o usuário é professor
  IF NOT public.is_professor(professor_id) THEN
    RAISE EXCEPTION 'Usuário não é professor';
  END IF;

  -- Criar novo curso
  INSERT INTO public.courses (
    title, description, thumbnail, duration, instructor, 
    professor_id, status
  )
  SELECT 
    new_title, description, thumbnail, duration, instructor,
    professor_id, 'draft'
  FROM public.courses 
  WHERE id = original_course_id
  RETURNING id INTO new_course_id;

  -- Duplicar módulos
  FOR module_record IN 
    SELECT * FROM public.modules WHERE course_id = original_course_id
  LOOP
    INSERT INTO public.modules (
      course_id, title, description, order_number, has_quiz, quiz_data
    )
    VALUES (
      new_course_id, module_record.title, module_record.description, 
      module_record.order_number, module_record.has_quiz, module_record.quiz_data
    )
    RETURNING id INTO new_module_id;

    -- Duplicar aulas do módulo
    FOR lesson_record IN 
      SELECT * FROM public.lessons WHERE module_id = module_record.id
    LOOP
      INSERT INTO public.lessons (
        module_id, title, description, duration, video_url, 
        content, order_number
      )
      VALUES (
        new_module_id, lesson_record.title, lesson_record.description,
        lesson_record.duration, lesson_record.video_url, 
        lesson_record.content, lesson_record.order_number
      );
    END LOOP;
  END LOOP;

  -- Registrar duplicação
  INSERT INTO public.course_duplications (
    original_course_id, duplicated_course_id, duplicated_by
  )
  VALUES (original_course_id, new_course_id, professor_id);

  RETURN new_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para aprovar curso
CREATE OR REPLACE FUNCTION public.approve_course(
  p_course_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar cursos';
  END IF;

  -- Atualizar status do curso
  UPDATE public.courses 
  SET 
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  WHERE id = p_course_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Curso não encontrado';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para rejeitar curso
CREATE OR REPLACE FUNCTION public.reject_course(
  p_course_id UUID,
  p_rejection_reason TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar cursos';
  END IF;

  -- Atualizar status do curso
  UPDATE public.courses 
  SET 
    status = 'rejected',
    rejection_reason = p_rejection_reason,
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  WHERE id = p_course_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Curso não encontrado';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas necessárias
DROP TRIGGER IF EXISTS update_course_forums_updated_at ON public.course_forums;
CREATE TRIGGER update_course_forums_updated_at
  BEFORE UPDATE ON public.course_forums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_messages_updated_at ON public.forum_messages;
CREATE TRIGGER update_forum_messages_updated_at
  BEFORE UPDATE ON public.forum_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_forms_updated_at ON public.custom_forms;
CREATE TRIGGER update_custom_forms_updated_at
  BEFORE UPDATE ON public.custom_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_courses_professor_id ON public.courses(professor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_course_forums_course_id ON public.course_forums(course_id);
CREATE INDEX IF NOT EXISTS idx_forum_messages_forum_id ON public.forum_messages(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_messages_user_id ON public.forum_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_module ON public.quiz_responses(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_custom_forms_course_id ON public.custom_forms(course_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_user ON public.form_responses(form_id, user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson_id ON public.lesson_attachments(lesson_id);

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.lesson_attachments IS 'Arquivos complementares das aulas';
COMMENT ON TABLE public.course_duplications IS 'Registro de duplicações de cursos';
COMMENT ON TABLE public.course_forums IS 'Fóruns de discussão dos cursos';
COMMENT ON TABLE public.forum_messages IS 'Mensagens dos fóruns';
COMMENT ON TABLE public.quiz_responses IS 'Respostas dos quizzes dos módulos';
COMMENT ON TABLE public.custom_forms IS 'Formulários personalizados dos cursos';
COMMENT ON TABLE public.form_responses IS 'Respostas dos formulários personalizados';

COMMENT ON COLUMN public.profiles.role IS 'Papel do usuário: admin, professor ou student';
COMMENT ON COLUMN public.courses.professor_id IS 'ID do professor responsável pelo curso';
COMMENT ON COLUMN public.courses.status IS 'Status do curso: pending, approved, rejected ou draft';
COMMENT ON COLUMN public.modules.has_quiz IS 'Indica se o módulo possui quiz';
COMMENT ON COLUMN public.modules.quiz_data IS 'Dados do quiz em formato JSON';