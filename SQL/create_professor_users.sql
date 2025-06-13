-- SCRIPT PARA CRIAR 3 USUÁRIOS PROFESSORES
-- ==========================================
-- Este script cria 3 usuários professores para teste no sistema LMS
-- Execute este script no Supabase SQL Editor

-- IMPORTANTE: Estes usuários devem ser criados primeiro no Supabase Auth
-- através do painel administrativo ou pela API de autenticação
-- Os IDs abaixo são exemplos e devem ser substituídos pelos IDs reais

-- 1. PROFESSOR MARIA SILVA
-- Email: maria.silva@professor.com
-- Senha: Professor123!
INSERT INTO public.profiles (id, name, email, role)
VALUES (
  '17402cea-259f-461f-a407-780311570726',
  'Maria Silva',
  'maria.silva@professor.com',
  'professor'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 2. PROFESSOR JOÃO SANTOS
-- Email: joao.santos@professor.com
-- Senha: Professor123!
INSERT INTO public.profiles (id, name, email, role)
VALUES (
  '98b68d1d-59b1-4bf2-8e83-e032823704dd',
  'João Santos',
  'joao.santos@professor.com',
  'professor'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 3. PROFESSORA ANA COSTA
-- Email: ana.costa@professor.com
-- Senha: Professor123!
INSERT INTO public.profiles (id, name, email, role)
VALUES (
  '1a09a4b2-d443-4d4d-a09e-e7c63b852ffe',
  'Ana Costa',
  'ana.costa@professor.com',
  'professor'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- FUNÇÃO PARA SINCRONIZAR ROLE DOS PROFESSORES COM AUTH.USERS
CREATE OR REPLACE FUNCTION sync_professor_roles()
RETURNS void AS $$
DECLARE
    prof_record RECORD;
BEGIN
    -- Atualizar metadados dos usuários professores
    FOR prof_record IN 
        SELECT id, email, role 
        FROM public.profiles 
        WHERE role = 'professor'
    LOOP
        -- Atualizar user_metadata com o role de professor
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'professor')
        WHERE id = prof_record.id;
        
        RAISE NOTICE 'Sincronizado role de professor para usuário: %', prof_record.email;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- EXECUTAR A SINCRONIZAÇÃO
SELECT sync_professor_roles();

-- VERIFICAR SE OS USUÁRIOS FORAM CRIADOS CORRETAMENTE
SELECT id, name, email, role, created_at
FROM public.profiles
WHERE role = 'professor'
ORDER BY created_at DESC;

-- VERIFICAR SE OS METADADOS FORAM ATUALIZADOS
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE id IN (
    SELECT id FROM public.profiles WHERE role = 'professor'
);

-- INSTRUÇÕES PARA USO:
-- ====================
-- 1. Primeiro, crie os usuários no Supabase Auth:
--    - Vá para Authentication > Users no painel do Supabase
--    - Clique em "Add user" para cada professor
--    - Use os emails: maria.silva@professor.com, joao.santos@professor.com, ana.costa@professor.com
--    - Use a senha: Professor123! (ou outra de sua escolha)
--    - Copie os UUIDs gerados pelo Supabase
--
-- 2. Substitua os UUIDs de exemplo neste script pelos UUIDs reais
--
-- 3. Execute este script no SQL Editor do Supabase
--
-- 4. Os professores poderão fazer login com:
--    Email: maria.silva@professor.com | Senha: Professor123!
--    Email: joao.santos@professor.com | Senha: Professor123!
--    Email: ana.costa@professor.com | Senha: Professor123!

-- ALTERNATIVA: CRIAR USUÁRIOS DIRETAMENTE VIA SQL (AVANÇADO)
-- ===========================================================
-- Se você tiver acesso direto ao banco e quiser criar os usuários
-- diretamente via SQL, use os comandos abaixo:

/*
-- ATENÇÃO: Estes comandos só funcionam se você tiver acesso direto
-- à tabela auth.users (normalmente não disponível via SQL Editor)

-- Criar usuário 1
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'maria.silva@professor.com',
  crypt('Professor123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Maria Silva"}'
);

-- Criar usuário 2
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'joao.santos@professor.com',
  crypt('Professor123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "João Santos"}'
);

-- Criar usuário 3
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'ana.costa@professor.com',
  crypt('Professor123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Ana Costa"}'
);
*/