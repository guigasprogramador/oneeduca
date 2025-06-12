
-- SQL para o Dashboard administrativo
-- Criação de visualização para estatísticas do dashboard

-- View para contagem total de cursos, módulos e aulas
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.courses) AS total_courses,
  (SELECT COUNT(*) FROM public.modules) AS total_modules,
  (SELECT COUNT(*) FROM public.lessons) AS total_lessons,
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM public.certificates) AS total_certificates;

-- View para matrículas recentes
CREATE OR REPLACE VIEW public.recent_enrollments AS
SELECT
  e.id,
  e.user_id,
  e.course_id,
  e.enrolled_at,
  c.title AS course_title,
  p.name AS user_name
FROM
  public.enrollments e
  JOIN public.courses c ON e.course_id = c.id
  JOIN public.profiles p ON e.user_id = p.id
ORDER BY
  e.enrolled_at DESC
LIMIT 10;

-- View para certificados recentes
CREATE OR REPLACE VIEW public.recent_certificates AS
SELECT
  c.id,
  c.user_id,
  c.course_id,
  c.issue_date,
  c.course_name,
  c.user_name
FROM
  public.certificates c
ORDER BY
  c.issue_date DESC
LIMIT 10;
