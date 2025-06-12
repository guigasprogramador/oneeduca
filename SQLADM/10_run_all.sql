
-- Script para executar todas as configurações SQL administrativas

-- Execute os scripts na seguinte ordem:
-- 1. Primeiro, crie todas as tabelas:
\i 'SQLADM/09_all_tables.sql'

-- 2. Execute os scripts funcionais em ordem:
\i 'SQLADM/01_dashboard.sql'
\i 'SQLADM/02_courses.sql'
\i 'SQLADM/03_modules.sql'
\i 'SQLADM/04_lessons.sql'
\i 'SQLADM/05_users.sql'
\i 'SQLADM/06_enrollments.sql'
\i 'SQLADM/07_certificates.sql'
\i 'SQLADM/08_admin_functions.sql'

-- Este script pode ser executado no psql para configurar todo o banco de dados:
-- psql -h <hostname> -U <username> -d <database> -a -f SQLADM/10_run_all.sql
