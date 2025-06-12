
-- SQL para o Catálogo de Cursos do Aluno

-- View para o catálogo de cursos com informações enriquecidas
CREATE OR REPLACE VIEW public.aluno_course_catalog AS
SELECT
  c.id,
  c.title,
  c.description,
  c.thumbnail,
  c.duration,
  c.instructor,
  c.enrolledCount,
  c.rating,
  c.created_at,
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
  ) AS lessons_count,
  EXISTS (
    SELECT 1 
    FROM public.enrollments e 
    WHERE e.course_id = c.id AND e.user_id = auth.uid()
  ) AS is_enrolled,
  (
    SELECT e.progress 
    FROM public.enrollments e 
    WHERE e.course_id = c.id AND e.user_id = auth.uid()
  ) AS progress
FROM
  public.courses c
ORDER BY
  c.created_at DESC;

-- Function para buscar cursos por palavra-chave
CREATE OR REPLACE FUNCTION public.search_courses(search_term TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  instructor TEXT,
  enrolledCount INTEGER,
  rating DECIMAL,
  modules_count BIGINT,
  lessons_count BIGINT,
  is_enrolled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    c.thumbnail,
    c.instructor,
    c.enrolledCount,
    c.rating,
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
    ) AS lessons_count,
    EXISTS (
      SELECT 1 
      FROM public.enrollments e 
      WHERE e.course_id = c.id AND e.user_id = auth.uid()
    ) AS is_enrolled
  FROM
    public.courses c
  WHERE
    c.title ILIKE '%' || search_term || '%' OR
    c.description ILIKE '%' || search_term || '%' OR
    c.instructor ILIKE '%' || search_term || '%'
  ORDER BY
    c.rating DESC, c.enrolledCount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para filtrar cursos por critérios
CREATE OR REPLACE FUNCTION public.filter_courses(
  p_min_rating DECIMAL DEFAULT 0,
  p_instructor TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  instructor TEXT,
  enrolledCount INTEGER,
  rating DECIMAL,
  modules_count BIGINT,
  lessons_count BIGINT,
  is_enrolled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    c.thumbnail,
    c.instructor,
    c.enrolledCount,
    c.rating,
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
    ) AS lessons_count,
    EXISTS (
      SELECT 1 
      FROM public.enrollments e 
      WHERE e.course_id = c.id AND e.user_id = auth.uid()
    ) AS is_enrolled
  FROM
    public.courses c
  WHERE
    (p_min_rating IS NULL OR c.rating >= p_min_rating) AND
    (p_instructor IS NULL OR c.instructor = p_instructor)
  ORDER BY
    c.rating DESC, c.enrolledCount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
