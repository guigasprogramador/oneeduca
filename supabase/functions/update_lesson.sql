-- Função para atualizar uma aula de forma mais robusta
-- Esta função é usada como fallback quando a atualização normal falha com erro 406

CREATE OR REPLACE FUNCTION update_lesson(
  p_lesson_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT '',
  p_duration TEXT DEFAULT '',
  p_video_url TEXT DEFAULT '',
  p_content TEXT DEFAULT '',
  p_order_number INTEGER DEFAULT 1,
  p_module_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar se a aula existe
  SELECT COUNT(*) INTO v_count FROM lessons WHERE id = p_lesson_id;
  
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Aula não encontrada com o ID: %', p_lesson_id;
  END IF;
  
  -- Se p_module_id for NULL, obter o module_id atual da aula
  IF p_module_id IS NULL THEN
    SELECT module_id INTO p_module_id FROM lessons WHERE id = p_lesson_id;
  END IF;
  
  -- Atualizar a aula
  UPDATE lessons
  SET 
    title = p_title,
    description = p_description,
    duration = p_duration,
    video_url = p_video_url,
    content = p_content,
    order_number = p_order_number,
    module_id = p_module_id,
    updated_at = NOW()
  WHERE id = p_lesson_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
