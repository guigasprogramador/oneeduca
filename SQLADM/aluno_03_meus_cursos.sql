
-- SQL para gerenciamento de "Meus Cursos" do Aluno

-- View para listar todos os cursos do aluno com detalhes de progresso
CREATE OR REPLACE VIEW public.aluno_my_courses AS
SELECT
  e.id AS enrollment_id,
  e.user_id,
  e.course_id,
  c.title AS course_title,
  c.description AS course_description,
  c.thumbnail AS course_thumbnail,
  c.instructor AS course_instructor,
  e.progress,
  e.enrolled_at,
  e.completed_at,
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
  ) AS total_lessons,
  (
    SELECT COUNT(*) 
    FROM public.lesson_progress lp
    JOIN public.lessons l ON lp.lesson_id = l.id
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = c.id AND lp.user_id = e.user_id AND lp.completed = true
  ) AS completed_lessons,
  EXISTS (
    SELECT 1 
    FROM public.certificates cert 
    WHERE cert.course_id = c.id AND cert.user_id = e.user_id
  ) AS has_certificate,
  (
    SELECT cert.id
    FROM public.certificates cert 
    WHERE cert.course_id = c.id AND cert.user_id = e.user_id
    LIMIT 1
  ) AS certificate_id
FROM
  public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
ORDER BY
  e.enrolled_at DESC;

-- Function para marcar uma aula como concluída
CREATE OR REPLACE FUNCTION public.mark_lesson_completed(p_lesson_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_course_id UUID;
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_progress INTEGER;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user ID exists
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update lesson progress
  INSERT INTO public.lesson_progress (user_id, lesson_id, completed, completed_at)
  VALUES (v_user_id, p_lesson_id, TRUE, now())
  ON CONFLICT (user_id, lesson_id) 
  DO UPDATE SET 
    completed = TRUE,
    completed_at = now();

  -- Get course ID for this lesson
  SELECT c.id INTO v_course_id
  FROM public.courses c
  JOIN public.modules m ON m.course_id = c.id
  JOIN public.lessons l ON l.module_id = m.id
  WHERE l.id = p_lesson_id;
  
  -- Calculate new progress percentage
  SELECT 
    COUNT(l.id) AS total_lessons,
    COUNT(lp.id) AS completed_lessons
  INTO 
    v_total_lessons, v_completed_lessons
  FROM 
    public.lessons l
    JOIN public.modules m ON l.module_id = m.id
    LEFT JOIN public.lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = v_user_id AND lp.completed = TRUE
  WHERE 
    m.course_id = v_course_id;
    
  -- Calculate progress as percentage
  IF v_total_lessons > 0 THEN
    v_progress := (v_completed_lessons * 100) / v_total_lessons;
  ELSE
    v_progress := 0;
  END IF;
  
  -- Update enrollment progress
  UPDATE public.enrollments
  SET progress = v_progress,
      completed_at = CASE WHEN v_progress = 100 THEN now() ELSE completed_at END
  WHERE user_id = v_user_id AND course_id = v_course_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para obter o progresso detalhado de um curso
CREATE OR REPLACE FUNCTION public.get_course_detailed_progress(p_course_id UUID)
RETURNS TABLE (
  module_id UUID,
  module_title TEXT,
  module_order INTEGER,
  lesson_id UUID,
  lesson_title TEXT,
  lesson_order INTEGER,
  is_completed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS module_id,
    m.title AS module_title,
    m.order_number AS module_order,
    l.id AS lesson_id,
    l.title AS lesson_title,
    l.order_number AS lesson_order,
    COALESCE(lp.completed, FALSE) AS is_completed,
    lp.completed_at
  FROM
    public.modules m
    JOIN public.lessons l ON l.module_id = m.id
    LEFT JOIN public.lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = auth.uid()
  WHERE
    m.course_id = p_course_id
  ORDER BY
    m.order_number, l.order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
