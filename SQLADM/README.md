
# Scripts SQL para Administração do Sistema LMS

Este diretório contém todos os scripts SQL necessários para o funcionamento adequado dos módulos administrativos e da área do aluno do sistema LMS.

## Organização dos Scripts

### Scripts Administrativos
1. **01_dashboard.sql** - Views e funções para o painel administrativo
2. **02_courses.sql** - Tabelas e políticas para gerenciamento de cursos
3. **03_modules.sql** - Tabelas e políticas para gerenciamento de módulos
4. **04_lessons.sql** - Tabelas e políticas para gerenciamento de aulas
5. **05_users.sql** - Tabelas e políticas para gerenciamento de usuários
6. **06_enrollments.sql** - Tabelas e políticas para gerenciamento de matrículas
7. **07_certificates.sql** - Tabelas e políticas para gerenciamento de certificados
8. **08_admin_functions.sql** - Funções administrativas gerais
9. **09_all_tables.sql** - Criação de todas as tabelas do sistema
10. **10_run_all.sql** - Script para execução de todos os scripts administrativos em ordem

### Scripts da Área do Aluno
1. **aluno_01_dashboard.sql** - Views e funções para o painel do aluno
2. **aluno_02_catalogo_cursos.sql** - Funcionalidades para o catálogo de cursos
3. **aluno_03_meus_cursos.sql** - Gerenciamento de cursos do aluno e progresso
4. **aluno_04_certificados.sql** - Gerenciamento de certificados do aluno
5. **aluno_05_run_all.sql** - Script para execução de todos os scripts da área do aluno em ordem

## Como Usar

### Para configurar a área administrativa:
```
psql -h <hostname> -U <username> -d <database> -a -f 10_run_all.sql
```

### Para configurar a área do aluno:
```
psql -h <hostname> -U <username> -d <database> -a -f aluno_05_run_all.sql
```

Ou execute cada script individualmente, na ordem numerada, conforme necessário para configurações específicas.

## Dependências

Estes scripts pressupõem uma instalação do PostgreSQL com a extensão Supabase Auth habilitada.

## Segurança

Os scripts incluem configuração completa de Row Level Security (RLS) para todas as tabelas, garantindo que:

- Alunos só podem ver seus próprios dados
- Administradores podem gerenciar todo o sistema
- Conteúdo do curso é visível para todos os usuários autenticados

## Suporte

Consulte a documentação completa para mais informações sobre a estrutura de dados e lógica do sistema.
