# Instruções para Implementação do Fluxo de Certificados

Este documento contém instruções detalhadas para implementar o fluxo de geração de certificados quando o progresso do curso atingir 100%.

## Arquivos Criados

1. **certificadoService.ts** - Serviço simplificado para gerenciar certificados, evitando erros 400 com o Supabase
2. **useCertificado.ts** - Hook personalizado para verificação e geração de certificados
3. **CertificadoModal.tsx** - Modal para parabenizar o aluno pela conclusão do curso
4. **BotaoCertificado.tsx** - Componente de botão para verificar e gerar certificados
5. **CertificadoHandler.tsx** - Componente para gerenciar a verificação e geração de certificados

## Como Integrar ao CoursePlayer

### 1. Adicionar o Hook e Componentes Necessários

No início do arquivo `CoursePlayer.tsx`, adicione os seguintes imports:

```tsx
import { useCertificado } from "@/hooks/useCertificado";
import BotaoCertificado from "@/components/BotaoCertificado";
import CertificadoModal from "@/components/CertificadoModal";
```

### 2. Adicionar Estado para Gerenciar o Modal

Dentro do componente `CoursePlayer`, adicione os seguintes estados:

```tsx
const [showCertificadoModal, setShowCertificadoModal] = useState(false);
const [userId, setUserId] = useState<string | null>(null);
```

### 3. Obter o ID do Usuário

No useEffect inicial que carrega os dados do curso, adicione o seguinte código para obter e armazenar o ID do usuário:

```tsx
// Obter usuário autenticado
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  setError('Você precisa estar logado para acessar este curso');
  setLoading(false);
  return;
}
setUserId(user.id); // Armazenar o ID do usuário
```

### 4. Adicionar o Botão de Certificado

No local onde você exibe o progresso do curso, adicione o componente BotaoCertificado:

```tsx
{/* Progresso do curso */}
<div className="mb-4">
  <div className="flex justify-between items-center mb-1">
    <span className="text-sm font-medium">Seu progresso</span>
    <span className="text-sm font-medium">{progress}%</span>
  </div>
  <Progress value={progress} className="h-3" />
  
  {/* Botão de certificado - só aparece quando o progresso é 100% */}
  {userId && id && progress === 100 && (
    <div className="mt-4">
      <BotaoCertificado 
        userId={userId} 
        courseId={id} 
        courseName={courseName} 
        progress={progress} 
      />
    </div>
  )}
</div>
```

### 5. Modificar a Função de Marcação de Aula como Concluída

Na função `handleMarkAsCompleted`, modifique o trecho que verifica se o curso foi concluído:

```tsx
// Verificar se o curso foi concluído
if (calculatedProgress === 100) {
  console.log('PROGRESSO: Curso 100% concluído, iniciando verificação de certificado...');
  setCourseCompletedRecently(true);
  
  // Mostrar o modal de certificado após um pequeno atraso
  setTimeout(() => {
    setShowCertificadoModal(true);
  }, 1000);
}
```

### 6. Adicionar o Modal de Certificado

No final do componente, antes do return final, adicione o modal de certificado:

```tsx
{/* Modal de certificado */}
{userId && id && (
  <CertificadoModal
    userId={userId}
    courseId={id}
    courseName={courseName}
    open={showCertificadoModal}
    onOpenChange={setShowCertificadoModal}
  />
)}
```

## Como Funciona o Fluxo de Certificados

1. Quando o aluno conclui uma aula, o progresso é recalculado
2. Se o progresso atingir 100%, o sistema verifica se já existe um certificado
3. Se não existir, um novo certificado é gerado automaticamente
4. Um modal é exibido parabenizando o aluno pela conclusão do curso
5. O aluno pode visualizar ou baixar seu certificado

## Solução para Erros 400 com o Supabase

Os erros 400 com o Supabase foram resolvidos das seguintes formas:

1. Simplificação das consultas ao banco de dados, evitando consultas aninhadas complexas
2. Uso de consultas individuais em vez de consultas com joins complexos
3. Implementação de tratamento de erros mais robusto
4. Verificação de existência de dados antes de tentar acessá-los

## Testando o Fluxo de Certificados

Para testar o fluxo de certificados:

1. Faça login como aluno
2. Acesse um curso em que você esteja matriculado
3. Complete todas as aulas do curso (ou atualize manualmente o progresso para 100%)
4. Verifique se o certificado é gerado automaticamente
5. Teste a visualização e download do certificado

## Próximos Passos

1. Adicionar mais opções de personalização para os certificados
2. Implementar validação de certificados por terceiros
3. Adicionar estatísticas sobre certificados emitidos
