
-- Script para executar todas as configurações SQL para a área do aluno

-- Execute os scripts na seguinte ordem:
-- 1. Primeiro, certifique-se de que as tabelas base existam:
\i 'SQLADM/09_all_tables.sql'

-- 2. Execute os scripts da área do aluno em ordem:
\i 'SQLADM/aluno_01_dashboard.sql'
\i 'SQLADM/aluno_02_catalogo_cursos.sql'
\i 'SQLADM/aluno_03_meus_cursos.sql'
\i 'SQLADM/aluno_04_certificados.sql'

-- Este script pode ser executado no psql para configurar todas as funcionalidades da área do aluno:
-- psql -h <hostname> -U <username> -d <database> -a -f SQLADM/aluno_05_run_all.sql
