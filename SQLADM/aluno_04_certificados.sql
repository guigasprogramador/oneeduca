
-- SQL para Certificados do Aluno

-- View para listar todos os certificados do aluno
CREATE OR REPLACE VIEW public.aluno_my_certificates AS
SELECT
  cert.id AS certificate_id,
  cert.user_id,
  cert.course_id,
  cert.course_name,
  cert.user_name,
  cert.issue_date,
  cert.expiry_date,
  cert.certificate_url,
  c.thumbnail AS course_thumbnail,
  c.instructor AS course_instructor,
  c.duration AS course_duration
FROM
  public.certificates cert
  JOIN public.courses c ON cert.course_id = c.id
WHERE
  cert.user_id = auth.uid()
ORDER BY
  cert.issue_date DESC;

-- Function para verificar se um aluno é elegível para receber um certificado
CREATE OR REPLACE FUNCTION public.check_certificate_eligibility(p_course_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_progress INTEGER;
  v_eligible BOOLEAN;
BEGIN
  -- Get current progress for the course
  SELECT progress INTO v_progress
  FROM public.enrollments
  WHERE user_id = auth.uid() AND course_id = p_course_id;
  
  -- Check if eligible (100% progress)
  v_eligible := (v_progress = 100);
  
  RETURN v_eligible;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para gerar um certificado (caso elegível)
CREATE OR REPLACE FUNCTION public.generate_student_certificate(p_course_id UUID)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_course_name TEXT;
  v_user_name TEXT;
  v_eligible BOOLEAN;
  v_certificate_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user ID exists
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Check eligibility
  v_eligible := public.check_certificate_eligibility(p_course_id);
  
  IF NOT v_eligible THEN
    RAISE EXCEPTION 'Você não é elegível para obter este certificado. É necessário concluir 100%% do curso.';
  END IF;
  
  -- Get course name
  SELECT title INTO v_course_name
  FROM public.courses
  WHERE id = p_course_id;
  
  -- Get user name
  SELECT name INTO v_user_name
  FROM public.profiles
  WHERE id = v_user_id;
  
  -- Generate certificate
  INSERT INTO public.certificates (
    user_id, 
    course_id, 
    course_name, 
    user_name, 
    issue_date
  )
  VALUES (
    v_user_id,
    p_course_id,
    v_course_name,
    v_user_name,
    now()
  )
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    issue_date = now()
  RETURNING id INTO v_certificate_id;
  
  RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function para verificar a autenticidade de um certificado
CREATE OR REPLACE FUNCTION public.verify_certificate(p_certificate_id UUID)
RETURNS TABLE (
  is_valid BOOLEAN,
  course_name TEXT,
  user_name TEXT,
  issue_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE AS is_valid,
    cert.course_name,
    cert.user_name,
    cert.issue_date
  FROM
    public.certificates cert
  WHERE
    cert.id = p_certificate_id;
    
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
