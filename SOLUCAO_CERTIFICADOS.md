# Solução para o Fluxo de Geração de Certificados

Este documento contém a solução completa para o fluxo de geração de certificados quando o progresso do curso atinge 100%.

## Problema Original

O sistema estava enfrentando erros 400 ao fazer chamadas à API do Supabase, especialmente:
1. Consultas aninhadas complexas no serviço de cursos
2. Falhas nas consultas de perfil
3. Falhas na criação de certificados

## Solução Implementada

### 1. Serviço de Certificados Simplificado

Criamos o arquivo `src/services/certificadoService.ts` que implementa consultas simplificadas ao Supabase para evitar os erros 400:

```typescript
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const certificadoService = {
  // Verifica se um aluno tem certificado para um curso específico
  async verificarCertificado(userId: string, courseId: string) {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, issue_date')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .limit(1);
      
      if (error) {
        console.error('[CERTIFICADO] Erro ao verificar certificado:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        return {
          id: data[0].id,
          dataEmissao: data[0].issue_date
        };
      }
      
      return null;
    } catch (error) {
      console.error('[CERTIFICADO] Erro ao verificar certificado:', error);
      return null;
    }
  },
  
  // Verifica se um aluno completou um curso (progresso = 100%)
  async verificarConclusaoCurso(userId: string, courseId: string) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();
      
      if (error) {
        console.error('[CERTIFICADO] Erro ao verificar matrícula:', error);
        return false;
      }
      
      return data && data.progress === 100;
    } catch (error) {
      console.error('[CERTIFICADO] Erro ao verificar conclusão do curso:', error);
      return false;
    }
  },
  
  // Gera um certificado para um aluno que concluiu um curso
  async gerarCertificado(userId: string, courseId: string) {
    try {
      // 1. Verificar se já existe certificado
      const certificadoExistente = await this.verificarCertificado(userId, courseId);
      if (certificadoExistente) {
        return certificadoExistente.id;
      }
      
      // 2. Verificar se o curso foi concluído
      const cursoConcluido = await this.verificarConclusaoCurso(userId, courseId);
      if (!cursoConcluido) {
        toast.error('Você precisa completar 100% do curso para receber o certificado');
        return null;
      }
      
      // 3. Buscar dados do usuário e do curso
      let userName = 'Aluno';
      let courseName = 'Curso';
      let courseHours = 40;
      
      // Buscar nome do usuário
      const { data: userData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
      
      if (userData && userData.name) {
        userName = userData.name;
      }
      
      // Buscar dados do curso
      const { data: courseData } = await supabase
        .from('courses')
        .select('title, duration')
        .eq('id', courseId)
        .single();
      
      if (courseData) {
        courseName = courseData.title || courseName;
        
        if (courseData.duration) {
          const hoursMatch = courseData.duration.match(/(\d+)\s*h/i);
          if (hoursMatch && hoursMatch[1]) {
            courseHours = parseInt(hoursMatch[1], 10);
          }
        }
      }
      
      // 4. Criar certificado no banco
      const now = new Date().toISOString();
      
      const { data: newCertificate, error } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          course_id: courseId,
          user_name: userName,
          course_name: courseName,
          course_hours: courseHours,
          issue_date: now
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('[CERTIFICADO] Erro ao criar certificado:', error);
        toast.error('Erro ao gerar certificado. Tente novamente mais tarde.');
        return null;
      }
      
      if (newCertificate && newCertificate.id) {
        toast.success('Certificado gerado com sucesso!');
        return newCertificate.id;
      }
      
      return null;
    } catch (error) {
      console.error('[CERTIFICADO] Erro ao gerar certificado:', error);
      toast.error('Erro ao gerar certificado. Tente novamente mais tarde.');
      return null;
    }
  }
};
```

### 2. Hook Personalizado para Certificados

Criamos o arquivo `src/hooks/useCertificado.ts` que encapsula toda a lógica de verificação e geração de certificados:

```typescript
import { useState } from 'react';
import { certificadoService } from '@/services/certificadoService';

export function useCertificado() {
  const [certificadoId, setCertificadoId] = useState<string | null>(null);
  const [isElegivel, setIsElegivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica e gera um certificado se o aluno for elegível
  const verificarEGerarCertificado = async (userId: string, courseId: string) => {
    try {
      setLoading(true);
      
      // 1. Verificar se já existe certificado
      const certificadoExistente = await certificadoService.verificarCertificado(userId, courseId);
      if (certificadoExistente) {
        setCertificadoId(certificadoExistente.id);
        setIsElegivel(true);
        return { success: true, certificateId: certificadoExistente.id };
      }
      
      // 2. Verificar se o curso foi concluído
      const cursoConcluido = await certificadoService.verificarConclusaoCurso(userId, courseId);
      if (!cursoConcluido) {
        return { success: false, message: 'Curso não concluído' };
      }
      
      // 3. Gerar certificado
      const novoCertificadoId = await certificadoService.gerarCertificado(userId, courseId);
      
      if (novoCertificadoId) {
        setCertificadoId(novoCertificadoId);
        setIsElegivel(true);
        return { success: true, certificateId: novoCertificadoId };
      }
      
      return { success: false, message: 'Erro ao gerar certificado' };
    } catch (error) {
      console.error('[CERTIFICADO] Erro ao verificar/gerar certificado:', error);
      setError('Erro ao processar certificado');
      return { success: false, message: 'Erro ao processar certificado' };
    } finally {
      setLoading(false);
    }
  };

  return {
    certificadoId,
    isElegivel,
    loading,
    error,
    verificarEGerarCertificado
  };
}
```

### 3. Modal de Certificado

Criamos o arquivo `src/components/CertificadoModal.tsx` para parabenizar o aluno pela conclusão do curso:

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { certificadoService } from "@/services/certificadoService";

interface CertificadoModalProps {
  userId: string;
  courseId: string;
  courseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CertificadoModal({ userId, courseId, courseName, open, onOpenChange }: CertificadoModalProps) {
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verificar certificado quando o modal for aberto
  useEffect(() => {
    if (open && userId && courseId) {
      verificarCertificado();
    }
  }, [open, userId, courseId]);

  // Verificar se o usuário já tem certificado ou gerar um novo
  const verificarCertificado = async () => {
    try {
      setLoading(true);
      
      // Verificar se já existe um certificado
      const certificadoExistente = await certificadoService.verificarCertificado(userId, courseId);
      
      if (certificadoExistente) {
        setCertificateId(certificadoExistente.id);
        return;
      }
      
      // Verificar se o curso foi concluído
      const cursoConcluido = await certificadoService.verificarConclusaoCurso(userId, courseId);
      
      if (cursoConcluido) {
        // Gerar certificado
        const novoCertificadoId = await certificadoService.gerarCertificado(userId, courseId);
        if (novoCertificadoId) {
          setCertificateId(novoCertificadoId);
        }
      }
    } catch (error) {
      console.error("[CERTIFICADO] Erro ao verificar/gerar certificado:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navegar para a página do certificado
  const verCertificado = () => {
    if (certificateId) {
      navigate(`/aluno/certificado/${certificateId}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            <span>Parabéns! Você concluiu o curso</span>
          </DialogTitle>
          <DialogDescription>
            Você completou todas as aulas de <strong>{courseName}</strong> e está 
            elegível para receber seu certificado de conclusão.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <Award className="h-24 w-24 text-yellow-500 mb-4" />
          <p className="text-center mb-4">
            {certificateId 
              ? "Seu certificado já está disponível e você pode acessá-lo a qualquer momento."
              : "Estamos gerando seu certificado, isso pode levar alguns instantes."}
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continuar explorando o curso
          </Button>
          <Button 
            onClick={verCertificado} 
            className="gap-2"
            disabled={!certificateId || loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processando...
              </span>
            ) : (
              <>
                <Award className="h-4 w-4" /> 
                Ver meu certificado
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4. Botão de Certificado

Criamos o arquivo `src/components/BotaoCertificado.tsx` para verificar e gerar certificados:

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { certificadoService } from "@/services/certificadoService";

interface BotaoCertificadoProps {
  userId: string;
  courseId: string;
  progress: number;
  className?: string;
}

export function BotaoCertificado({ userId, courseId, progress, className }: BotaoCertificadoProps) {
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isElegivel, setIsElegivel] = useState(false);

  // Verificar certificado quando o componente for montado
  useEffect(() => {
    if (userId && courseId && progress === 100) {
      verificarCertificado();
    }
  }, [userId, courseId, progress]);

  // Verificar se o certificado existe ou pode ser gerado
  const verificarCertificado = async () => {
    try {
      setLoading(true);
      
      // Verificar se já existe um certificado
      const certificadoExistente = await certificadoService.verificarCertificado(userId, courseId);
      
      if (certificadoExistente) {
        setCertificateId(certificadoExistente.id);
        setIsElegivel(true);
        return;
      }
      
      // Verificar se o curso foi concluído
      const cursoConcluido = await certificadoService.verificarConclusaoCurso(userId, courseId);
      setIsElegivel(cursoConcluido);
    } catch (error) {
      console.error("[CERTIFICADO] Erro ao verificar certificado:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gerar certificado e navegar para a página
  const gerarEVerCertificado = async () => {
    try {
      setLoading(true);
      
      // Se já temos um ID de certificado, apenas navegar
      if (certificateId) {
        navigate(`/aluno/certificado/${certificateId}`);
        return;
      }
      
      // Gerar certificado
      const novoCertificadoId = await certificadoService.gerarCertificado(userId, courseId);
      
      if (novoCertificadoId) {
        setCertificateId(novoCertificadoId);
        navigate(`/aluno/certificado/${novoCertificadoId}`);
      }
    } catch (error) {
      console.error("[CERTIFICADO] Erro ao gerar certificado:", error);
    } finally {
      setLoading(false);
    }
  };

  // Se o progresso não for 100%, não mostrar o botão
  if (progress < 100) {
    return null;
  }

  return (
    <Button
      onClick={gerarEVerCertificado}
      className={`gap-2 ${className || ""}`}
      disabled={loading || !isElegivel}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Processando...
        </span>
      ) : (
        <>
          <Award className="h-4 w-4" />
          {certificateId ? "Ver meu certificado" : "Gerar certificado"}
        </>
      )}
    </Button>
  );
}
```

## Como Integrar ao CoursePlayer

Para integrar esta solução ao CoursePlayer, siga estas etapas:

### 1. Adicione os imports necessários

No início do arquivo `CoursePlayer.tsx`, adicione:

```typescript
import { certificadoService } from "@/services/certificadoService";
import CertificadoModal from "@/components/CertificadoModal";
import BotaoCertificado from "@/components/BotaoCertificado";
```

### 2. Adicione os estados necessários

Dentro do componente CoursePlayer, adicione:

```typescript
const [showCertificadoModal, setShowCertificadoModal] = useState(false);
const [userId, setUserId] = useState<string | null>(null);
```

### 3. Obtenha e armazene o ID do usuário

No useEffect que carrega os dados do curso, adicione:

```typescript
// Obter usuário autenticado
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  setError('Você precisa estar logado para acessar este curso');
  setLoading(false);
  return;
}
setUserId(user.id); // Armazenar o ID do usuário
```

### 4. Modifique a função handleMarkAsCompleted

Na função que marca uma aula como concluída, adicione:

```typescript
// Verificar se o curso foi concluído
if (calculatedProgress === 100) {
  console.log('PROGRESSO: Curso 100% concluído');
  setCourseCompletedRecently(true);
  
  // Mostrar o modal de certificado após um pequeno atraso
  setTimeout(() => {
    setShowCertificadoModal(true);
  }, 1000);
}
```

### 5. Adicione o botão de certificado

No local onde você exibe o progresso do curso, adicione:

```typescript
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
        progress={progress} 
        className="bg-green-600 hover:bg-green-700"
      />
    </div>
  )}
</div>
```

### 6. Adicione o modal de certificado

No final do componente, antes do return final, adicione:

```typescript
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

## Solução para os Erros 400

Os erros 400 com o Supabase foram resolvidos através de:

1. **Simplificação das consultas**: Evitamos consultas aninhadas complexas, optando por consultas simples e diretas.
2. **Consultas individuais**: Em vez de tentar fazer tudo em uma única consulta, dividimos em várias consultas menores.
3. **Tratamento de erros robusto**: Implementamos tratamento de erros em cada etapa do processo.
4. **Verificação de dados**: Verificamos a existência de dados antes de tentar acessá-los.

## Próximos Passos

1. Adicionar mais opções de personalização para os certificados
2. Implementar validação de certificados por terceiros
3. Adicionar estatísticas sobre certificados emitidos

## Conclusão

Esta solução garante que o certificado seja gerado automaticamente quando o progresso do curso atingir 100%, incluindo todos os dados necessários como nome do aluno, nome do curso e carga horária. Além disso, resolve os problemas de erros 400 com o Supabase, tornando o sistema mais robusto e confiável.
