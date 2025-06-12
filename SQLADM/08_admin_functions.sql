
-- SQL para Funções Administrativas

-- Função para verificar se o usuário atual é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (raw_user_meta_data->>'role') = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de uso
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS TABLE (
  stat_name TEXT,
  stat_value BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'total_users'::TEXT, COUNT(*)::BIGINT FROM auth.users
  UNION ALL
  SELECT 'total_courses'::TEXT, COUNT(*)::BIGINT FROM public.courses
  UNION ALL
  SELECT 'total_modules'::TEXT, COUNT(*)::BIGINT FROM public.modules
  UNION ALL
  SELECT 'total_lessons'::TEXT, COUNT(*)::BIGINT FROM public.lessons
  UNION ALL
  SELECT 'total_enrollments'::TEXT, COUNT(*)::BIGINT FROM public.enrollments
  UNION ALL
  SELECT 'total_certificates'::TEXT, COUNT(*)::BIGINT FROM public.certificates
  UNION ALL
  SELECT 'active_users'::TEXT, COUNT(DISTINCT auth.uid())::BIGINT FROM auth.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para reiniciar o progresso de um aluno em um curso
CREATE OR REPLACE FUNCTION public.admin_reset_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  lesson_ids UUID[];
BEGIN
  -- Verifica se o usuário atual é administrador
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;
  
  -- Encontra todas as aulas do curso
  SELECT array_agg(l.id)
  INTO lesson_ids
  FROM public.lessons l
  JOIN public.modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id;
  
  -- Exclui o progresso das aulas para o usuário
  DELETE FROM public.lesson_progress
  WHERE user_id = p_user_id AND lesson_id = ANY(lesson_ids);
  
  -- Atualiza a matrícula para zero progresso
  UPDATE public.enrollments
  SET progress = 0, completed_at = NULL
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  -- Exclui o certificado, se existir
  DELETE FROM public.certificates
  WHERE user_id = p_user_id AND course_id = p_course_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para promover um usuário a administrador por email
CREATE OR REPLACE FUNCTION public.make_user_admin(email_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Verifica se o usuário atual é administrador
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;
  
  -- Encontra o usuário pelo email
  SELECT id INTO target_user_id FROM auth.users WHERE email = email_address;
  
  -- Se o usuário não existe, retorna falso
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Atualiza o papel do usuário para administrador
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb
  )
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para revogar privilégios de administrador
CREATE OR REPLACE FUNCTION public.revoke_admin(email_address TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Obtém o ID do usuário atual
  current_user_id := auth.uid();
  
  -- Verifica se o usuário atual é administrador
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permissão negada';
  END IF;
  
  -- Encontra o usuário alvo pelo email
  SELECT id INTO target_user_id FROM auth.users WHERE email = email_address;
  
  -- Se o usuário não existe, retorna falso
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Um administrador não pode revogar seus próprios privilégios
  IF target_user_id = current_user_id THEN
    RAISE EXCEPTION 'Você não pode revogar seus próprios privilégios de administrador';
  END IF;
  
  -- Atualiza o papel do usuário para aluno
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"student"'::jsonb
  )
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

