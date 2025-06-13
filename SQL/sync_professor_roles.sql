-- SCRIPT PARA SINCRONIZAR ROLES DOS PROFESSORES
-- Execute este script se os professores já foram criados mas não estão sendo redirecionados corretamente

-- ATUALIZAR METADADOS DOS USUÁRIOS PROFESSORES EXISTENTES
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'professor')
WHERE email IN (
    'maria.silva@professor.com',
    'joao.santos@professor.com', 
    'ana.costa@professor.com'
);

-- VERIFICAR SE A ATUALIZAÇÃO FOI BEM-SUCEDIDA
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IN (
    'maria.silva@professor.com',
    'joao.santos@professor.com',
    'ana.costa@professor.com'
);

-- INSTRUÇÕES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se os raw_user_meta_data contêm {"role": "professor"}
-- 3. Teste o login dos professores novamente
-- 4. Eles devem ser redirecionados para /professor/dashboard