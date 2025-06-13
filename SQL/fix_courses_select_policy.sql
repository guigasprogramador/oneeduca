-- Fix para liberar CRUD completo para professores e administradores
-- Este arquivo resolve o problema de "Acesso negado" e garante acesso total

-- Remover todas as políticas existentes da tabela courses
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Professors can view their own courses" ON public.courses;
DROP POLICY IF EXISTS "Students can view approved courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view approved courses" ON public.courses;
DROP POLICY IF EXISTS "Professors can create courses" ON public.courses;
DROP POLICY IF EXISTS "Professors can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Professors can delete their own courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON public.courses;

-- =====================================================
-- POLÍTICAS CRUD COMPLETAS PARA PROFESSORES
-- =====================================================

-- Professores podem visualizar seus próprios cursos
CREATE POLICY "Professors can view their own courses"
  ON public.courses
  FOR SELECT
  USING (
    auth.uid() = professor_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- Professores podem criar cursos
CREATE POLICY "Professors can create courses"
  ON public.courses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'professor'
    ) AND auth.uid() = professor_id
  );

-- Professores podem atualizar seus próprios cursos
CREATE POLICY "Professors can update their own courses"
  ON public.courses
  FOR UPDATE
  USING (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'professor'
    )
  )
  WITH CHECK (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- Professores podem deletar seus próprios cursos
CREATE POLICY "Professors can delete their own courses"
  ON public.courses
  FOR DELETE
  USING (
    auth.uid() = professor_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'professor'
    )
  );

-- =====================================================
-- POLÍTICAS CRUD COMPLETAS PARA ADMINISTRADORES
-- =====================================================

-- Administradores têm acesso total (CRUD completo)
CREATE POLICY "Admins have full access to courses"
  ON public.courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS PARA ESTUDANTES (SOMENTE LEITURA)
-- =====================================================

-- Estudantes podem visualizar apenas cursos aprovados
CREATE POLICY "Students can view approved courses"
  ON public.courses
  FOR SELECT
  USING (
    status = 'approved' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- =====================================================
-- POLÍTICA PÚBLICA PARA CATÁLOGO
-- =====================================================

-- Visualização pública de cursos aprovados (para catálogo sem login)
CREATE POLICY "Public can view approved courses catalog"
  ON public.courses
  FOR SELECT
  USING (status = 'approved');