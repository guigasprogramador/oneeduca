-- Script para corrigir a constraint de status na tabela courses
-- Garante que todos os status válidos estejam incluídos

-- Remover a constraint existente
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_status_check;

-- Adicionar nova constraint com todos os status válidos
ALTER TABLE public.courses 
ADD CONSTRAINT courses_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'draft', 'archived'));

-- Verificar se a constraint foi aplicada corretamente
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.courses'::regclass 
AND conname = 'courses_status_check';

-- Verificar cursos existentes e seus status
SELECT status, COUNT(*) as count
FROM public.courses 
GROUP BY status
ORDER BY status;