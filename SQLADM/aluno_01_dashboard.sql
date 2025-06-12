
-- SQL para o Dashboard do Aluno

-- View para estatísticas do dashboard do aluno
CREATE OR REPLACE VIEW public.aluno_dashboard_stats AS
SELECT
  u.id AS user_id,
  p.name AS user_name,
  (SELECT COUNT(*) FROM public.enrollments e WHERE e.user_id = u.id) AS enrolled_courses_count,
  (SELECT COUNT(*) FROM public.certificates c WHERE c.user_id = u.id) AS certificates_count,
  (
    SELECT COALESCE(AVG(e.progress), 0)::INTEGER 
    FROM public.enrollments e 
    WHERE e.user_id = u.id
  ) AS average_progress
FROM
  auth.users u
  JOIN public.profiles p ON u.id = p.id;

-- View para os últimos cursos acessados pelo aluno
CREATE OR REPLACE VIEW public.aluno_recent_courses AS
SELECT DISTINCT ON (e.course_id)
  e.id,
  e.user_id,
  e.course_id,
  c.title AS course_title,
  c.thumbnail AS course_thumbnail,
  c.instructor AS course_instructor,
  e.progress,
  e.enrolled_at,
  (
    SELECT COUNT(*) 
    FROM public.modules m 
    WHERE m.course_id = c.id
  ) AS modules_count,
  (
    SELECT COUNT(*) 
    FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = c.id
  ) AS lessons_count
FROM
  public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
ORDER BY
  e.course_id, e.enrolled_at DESC;

-- View para recomendações de cursos personalizadas para o aluno
CREATE OR REPLACE VIEW public.aluno_recommended_courses AS
SELECT
  c.id,
  c.title,
  c.description,
  c.instructor,
  c.thumbnail,
  c.rating,
  c.enrolledCount,
  (
    SELECT COUNT(*) 
    FROM public.modules m 
    WHERE m.course_id = c.id
  ) AS modules_count
FROM
  public.courses c
WHERE
  c.id NOT IN (
    SELECT e.course_id 
    FROM public.enrollments e 
    WHERE e.user_id = auth.uid()
  )
ORDER BY
  c.rating DESC, c.enrolledCount DESC
LIMIT 5;

-- Função para obter estatísticas de progresso do aluno
CREATE OR REPLACE FUNCTION public.get_student_progress_stats(p_user_id UUID)
RETURNS TABLE (
  completed_courses INTEGER,
  in_progress_courses INTEGER,
  total_lessons_completed INTEGER,
  total_certificates INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(e.id)::INTEGER AS completed_courses,
    (SELECT COUNT(*) FROM public.enrollments WHERE user_id = p_user_id AND progress < 100)::INTEGER AS in_progress_courses,
    (SELECT COUNT(*) FROM public.lesson_progress WHERE user_id = p_user_id AND completed = true)::INTEGER AS total_lessons_completed,
    (SELECT COUNT(*) FROM public.certificates WHERE user_id = p_user_id)::INTEGER AS total_certificates
  FROM
    public.enrollments e
  WHERE
    e.user_id = p_user_id AND e.progress = 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
