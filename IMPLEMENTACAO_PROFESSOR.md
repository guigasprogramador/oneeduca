# Implementação do Nível Professor - Guia Completo

## 📋 Resumo das Funcionalidades Implementadas

Este documento descreve a implementação completa do nível de professor no sistema LMS, incluindo:

1. **Sistema de Roles**: Admin, Professor, Estudante
2. **Aprovação de Cursos**: Cursos criados por professores precisam de aprovação do admin
3. **Vigência de Cursos**: Data de expiração para cursos
4. **Quiz nos Módulos**: Professores podem adicionar quizzes aos módulos
5. **Arquivos Complementares**: Upload de arquivos nas aulas (PDF, imagens, documentos)
6. **Duplicação de Cursos**: Professores podem duplicar cursos existentes
7. **Sistema de Chat/Fórum**: Comunicação entre professor e alunos
8. **Notificações**: Sistema de notificações para aprovações/rejeições

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas/Modificadas

#### 1. Tabela `profiles` (modificada)
```sql
-- Nova coluna role
role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'professor', 'student'))
```

#### 2. Tabela `courses` (modificada)
```sql
-- Novas colunas
professor_id UUID REFERENCES auth.users(id)
status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
expiry_date TIMESTAMP WITH TIME ZONE
approved_by UUID REFERENCES auth.users(id)
approved_at TIMESTAMP WITH TIME ZONE
rejection_reason TEXT
```

#### 3. Tabela `modules` (modificada)
```sql
-- Novas colunas para quiz
has_quiz BOOLEAN DEFAULT false
quiz_data JSONB
```

#### 4. Tabela `lesson_attachments` (nova)
```sql
CREATE TABLE public.lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 5. Tabela `course_forums` (nova)
```sql
CREATE TABLE public.course_forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 6. Tabela `forum_messages` (nova)
```sql
CREATE TABLE public.forum_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES public.course_forums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  parent_message_id UUID REFERENCES public.forum_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

#### 7. Outras tabelas importantes
- `course_duplications`: Rastreia duplicações de cursos
- `quiz_responses`: Armazena respostas dos quizzes
- `notifications`: Sistema de notificações

## 🔧 Comandos SQL para Execução

### 1. Executar o Script Principal
```sql
-- Execute o arquivo: SQL/professor_features.sql
-- Este arquivo contém todas as modificações necessárias
```

### 2. Executar Atualizações Adicionais
```sql
-- Execute o arquivo: SQL/update_database_types.sql
-- Este arquivo contém índices, funções auxiliares e verificações
```

### 3. Verificar Implementação
```sql
-- Verificar se todas as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'profiles', 'courses', 'modules', 'lessons', 'enrollments',
    'lesson_progress', 'certificates', 'lesson_attachments',
    'course_duplications', 'course_forums', 'forum_messages',
    'quiz_responses', 'notifications'
)
ORDER BY table_name;

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🎯 Funcionalidades Implementadas

### 1. Sistema de Roles
- **Admin**: Pode aprovar/rejeitar cursos, promover usuários
- **Professor**: Pode criar cursos, módulos, aulas, quizzes
- **Estudante**: Pode se matricular em cursos aprovados

### 2. Fluxo de Aprovação de Cursos
1. Professor cria curso (status: 'pending')
2. Admin visualiza cursos pendentes
3. Admin aprova ou rejeita com motivo
4. Professor recebe notificação
5. Curso aprovado fica disponível no catálogo

### 3. Quiz nos Módulos
```json
// Estrutura do quiz_data
{
  "title": "Quiz do Módulo 1",
  "description": "Teste seus conhecimentos",
  "timeLimit": 30,
  "passingScore": 70,
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Qual é a resposta?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Explicação da resposta",
      "points": 1
    }
  ]
}
```

### 4. Upload de Arquivos
- Suporte a múltiplos tipos: PDF, DOC, DOCX, JPG, PNG, etc.
- Controle de tamanho máximo por tipo
- Armazenamento seguro com políticas RLS

### 5. Duplicação de Cursos
```sql
-- Função para duplicar curso
SELECT duplicate_course('course-id-here', 'Novo Título (Opcional)');
```

### 6. Sistema de Fórum
- Fóruns por curso
- Mensagens aninhadas (respostas)
- Participação de professores e alunos matriculados

## 🔐 Políticas de Segurança (RLS)

### Principais Políticas Implementadas

1. **Cursos**: Apenas cursos aprovados são visíveis publicamente
2. **Módulos/Aulas**: Visíveis apenas para matriculados e donos do curso
3. **Anexos**: Acesso controlado por matrícula
4. **Fóruns**: Apenas participantes do curso podem ver/participar
5. **Notificações**: Cada usuário vê apenas suas próprias

## 🚀 Próximos Passos para Implementação Frontend

### 1. Atualizar Componentes Existentes
- Modificar formulários de criação de curso
- Adicionar campos de vigência
- Implementar seletor de role no registro

### 2. Criar Novos Componentes
- `ProfessorDashboard`: Dashboard específico do professor
- `CourseApproval`: Interface de aprovação para admins
- `QuizBuilder`: Construtor de quizzes
- `FileUploader`: Componente de upload de arquivos
- `ForumComponent`: Interface do fórum
- `CourseDuplicator`: Interface para duplicar cursos

### 3. Criar Novos Hooks
- `useProfessorCourses`: Gerenciar cursos do professor
- `useQuizBuilder`: Construir e gerenciar quizzes
- `useFileUpload`: Upload de arquivos
- `useForum`: Gerenciar fóruns e mensagens
- `useNotifications`: Sistema de notificações

### 4. Criar Novos Serviços
- `professorService.ts`: APIs específicas do professor
- `quizService.ts`: Gerenciamento de quizzes
- `fileUploadService.ts`: Upload de arquivos
- `forumService.ts`: APIs do fórum
- `notificationService.ts`: Sistema de notificações

### 5. Atualizar Rotas
```typescript
// Novas rotas necessárias
/professor/dashboard
/professor/courses
/professor/courses/create
/professor/courses/:id/edit
/professor/courses/:id/modules
/professor/courses/:id/forum
/admin/course-approvals
/admin/professors
/course/:id/forum
/course/:id/quiz/:moduleId
```

## 📱 Interfaces de Usuário Sugeridas

### 1. Dashboard do Professor
- Estatísticas dos cursos
- Cursos pendentes de aprovação
- Novos alunos matriculados
- Atividade do fórum

### 2. Dashboard do Admin
- Cursos pendentes de aprovação
- Estatísticas do sistema
- Gestão de professores
- Cursos próximos do vencimento

### 3. Interface do Fórum
- Lista de tópicos
- Mensagens aninhadas
- Editor de mensagens
- Notificações de novas mensagens

### 4. Construtor de Quiz
- Editor de perguntas
- Múltiplos tipos de questão
- Preview do quiz
- Configurações de tempo e pontuação

## 🔍 Testes Recomendados

### 1. Testes de Banco de Dados
```sql
-- Testar criação de curso por professor
-- Testar aprovação por admin
-- Testar políticas RLS
-- Testar duplicação de curso
-- Testar sistema de quiz
```

### 2. Testes de Frontend
- Fluxo completo de criação de curso
- Sistema de aprovação
- Upload de arquivos
- Funcionalidade do fórum
- Responsividade mobile

## 📚 Documentação Adicional

### Arquivos Criados
1. `SQL/professor_features.sql` - Script principal
2. `SQL/update_database_types.sql` - Atualizações adicionais
3. `src/types/professor.ts` - Tipos TypeScript
4. Atualizações em `src/types/database.ts` e `src/types/index.ts`
5. Atualizações em `src/contexts/AuthContext.tsx`

### Funções SQL Importantes
- `duplicate_course()` - Duplicar curso
- `approve_course()` - Aprovar curso
- `reject_course()` - Rejeitar curso
- `promote_to_professor()` - Promover a professor
- `get_system_stats()` - Estatísticas do sistema

## ⚠️ Considerações Importantes

1. **Backup**: Sempre faça backup antes de executar os scripts
2. **Ambiente**: Teste primeiro em ambiente de desenvolvimento
3. **Permissões**: Execute como superuser no Supabase
4. **Migração**: Considere migração gradual em produção
5. **Performance**: Monitore performance após implementação

## 🎉 Conclusão

Esta implementação fornece uma base sólida para o sistema de professores com todas as funcionalidades solicitadas. O próximo passo é implementar as interfaces de usuário correspondentes no frontend React/TypeScript.

Todas as funcionalidades foram projetadas com segurança e escalabilidade em mente, utilizando as melhores práticas do Supabase e PostgreSQL.