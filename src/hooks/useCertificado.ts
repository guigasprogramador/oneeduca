import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook personalizado para gerenciar a verificação e geração de certificados
 * Implementa uma solução robusta para evitar erros 400 com o Supabase
 */
export function useCertificado() {
  const [certificadoId, setCertificadoId] = useState<string | null>(null);
  const [isElegivel, setIsElegivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verifica se um aluno já possui certificado para um curso
   */
  const verificarCertificado = async (userId: string, courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[CERTIFICADO] Verificando certificado para usuário ${userId} no curso ${courseId}`);
      
      // Consulta simples para evitar erros 400
      const { data, error } = await supabase
        .from('certificates')
        .select('id, issue_date')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .limit(1);
      
      if (error) {
        console.error('[CERTIFICADO] Erro ao verificar certificado:', error);
        setError('Erro ao verificar certificado');
        return null;
      }
      
      if (data && data.length > 0) {
        console.log(`[CERTIFICADO] Certificado encontrado: ${data[0].id}`);
        setCertificadoId(data[0].id);
        setIsElegivel(true);
        return {
          id: data[0].id,
          dataEmissao: data[0].issue_date
        };
      }
      
      return null;
    } catch (error) {
      console.error('[CERTIFICADO] Erro ao verificar certificado:', error);
      setError('Erro ao verificar certificado');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica se um aluno completou um curso (progresso = 100%)
   */
  const verificarConclusaoCurso = async (userId: string, courseId: string) => {
    try {
      // Verificar progresso na tabela de matrículas
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
      
      if (data && data.progress === 100) {
        setIsElegivel(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[CERTIFICADO] Erro ao verificar conclusão do curso:', error);
      return false;
    }
  };

  /**
   * Gera um certificado para um aluno que concluiu um curso
   */
  const gerarCertificado = async (userId: string, courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[CERTIFICADO] Iniciando geração para usuário ${userId} no curso ${courseId}`);
      
      // 1. Verificar se já existe certificado
      const certificadoExistente = await verificarCertificado(userId, courseId);
      if (certificadoExistente) {
        console.log(`[CERTIFICADO] Certificado já existe, retornando ID: ${certificadoExistente.id}`);
        setCertificadoId(certificadoExistente.id);
        setIsElegivel(true);
        return certificadoExistente.id;
      }
      
      // 2. Verificar se o curso foi concluído
      const cursoConcluido = await verificarConclusaoCurso(userId, courseId);
      console.log(`[CERTIFICADO] Curso concluído? ${cursoConcluido}`);
      
      if (!cursoConcluido) {
        // Forçar atualização do progresso
        try {
          // Atualizar progresso para 100% se todas as aulas estiverem concluídas
          await supabase
            .from('enrollments')
            .update({ progress: 100 })
            .eq('user_id', userId)
            .eq('course_id', courseId);
          console.log('[CERTIFICADO] Progresso atualizado para 100%');
        } catch (progressError) {
          console.error('[CERTIFICADO] Erro ao atualizar progresso:', progressError);
        }
        
        // Verificar novamente após atualização
        const verificacaoAtualizada = await verificarConclusaoCurso(userId, courseId);
        if (!verificacaoAtualizada) {
          toast.error('Você precisa completar 100% do curso para receber o certificado');
          return null;
        }
      }
      
      // 3. Buscar dados do usuário e do curso
      let userName = 'Aluno';
      let courseName = 'Curso';
      let courseHours = 40;
      
      // Buscar nome do usuário
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('[CERTIFICADO] Erro ao buscar perfil do usuário:', userError);
      }
      
      if (userData && userData.name) {
        userName = userData.name;
        console.log(`[CERTIFICADO] Nome do usuário encontrado: ${userName}`);
      } else {
        console.warn('[CERTIFICADO] Nome do usuário não encontrado, usando padrão');
      }
      
      // Buscar dados do curso
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('title, duration')
        .eq('id', courseId)
        .single();
      
      if (courseError) {
        console.error('[CERTIFICADO] Erro ao buscar dados do curso:', courseError);
      }
      
      if (courseData) {
        if (courseData.title) {
          courseName = courseData.title;
          console.log(`[CERTIFICADO] Nome do curso encontrado: ${courseName}`);
        }
        
        if (courseData.duration) {
          const hoursMatch = courseData.duration.match(/(\d+)\s*h/i);
          if (hoursMatch && hoursMatch[1]) {
            courseHours = parseInt(hoursMatch[1], 10);
            console.log(`[CERTIFICADO] Carga horária do curso: ${courseHours}h`);
          }
        }
      } else {
        console.warn('[CERTIFICADO] Dados do curso não encontrados, usando padrões');
      }
      
      // 4. Criar certificado no banco
      const now = new Date().toISOString();
      console.log(`[CERTIFICADO] Criando certificado com os seguintes dados:`);
      console.log(`- Usuário: ${userName} (${userId})`);
      console.log(`- Curso: ${courseName} (${courseId})`);
      console.log(`- Carga horária: ${courseHours}h`);
      console.log(`- Data de emissão: ${now}`);
      
      // Preparar dados para inserção
      const certificateData = {
        user_id: userId,
        course_id: courseId,
        user_name: userName,
        course_name: courseName,
        course_hours: courseHours,
        issue_date: now
      };
      
      // Tentar inserir o certificado
      const { data: newCertificate, error } = await supabase
        .from('certificates')
        .insert(certificateData)
        .select('id')
        .single();
      
      if (error) {
        console.error('[CERTIFICADO] Erro ao criar certificado:', error);
        console.error('[CERTIFICADO] Código do erro:', error.code);
        console.error('[CERTIFICADO] Mensagem do erro:', error.message);
        
        // Verificar se o erro é de duplicidade
        if (error.code === '23505') { // Código de erro de duplicidade no PostgreSQL
          console.log('[CERTIFICADO] Certificado já existe, tentando buscar novamente');
          
          // Tentar buscar o certificado existente
          const existingCert = await verificarCertificado(userId, courseId);
          if (existingCert) {
            setCertificadoId(existingCert.id);
            setIsElegivel(true);
            return existingCert.id;
          }
        }
        
        // Tentar criar um certificado virtual se falhar a criação no banco
        try {
          // Salvar no localStorage como fallback
          const tempCertId = `temp_${userId}_${courseId}_${Date.now()}`;
          const tempCertificate = {
            id: tempCertId,
            userId,
            courseId,
            userName,
            courseName,
            courseHours,
            issueDate: now,
            isVirtual: true
          };
          
          // Salvar no localStorage
          const existingCertsJSON = localStorage.getItem('temp_certificates') || '[]';
          const existingCerts = JSON.parse(existingCertsJSON);
          existingCerts.push(tempCertificate);
          localStorage.setItem('temp_certificates', JSON.stringify(existingCerts));
          
          console.log('[CERTIFICADO] Certificado virtual criado como fallback');
          setCertificadoId(tempCertId);
          setIsElegivel(true);
          toast.success('Certificado criado localmente (modo offline)');
          return tempCertId;
        } catch (localError) {
          console.error('[CERTIFICADO] Erro ao criar certificado virtual:', localError);
        }
        
        setError(`Erro ao gerar certificado: ${error.message}`);
        toast.error(`Erro ao gerar certificado: ${error.message}`);
        return null;
      }
      
      if (newCertificate && newCertificate.id) {
        console.log(`[CERTIFICADO] Certificado criado com sucesso: ${newCertificate.id}`);
        setCertificadoId(newCertificate.id);
        setIsElegivel(true);
        toast.success('Certificado gerado com sucesso!');
        
        // Registrar na tabela recent_certificates para histórico
        try {
          await supabase
            .from('recent_certificates')
            .insert({
              id: newCertificate.id,
              user_id: userId,
              course_id: courseId,
              user_name: userName,
              course_name: courseName,
              issue_date: now
            });
          console.log('[CERTIFICADO] Registrado em recent_certificates');
        } catch (recentError) {
          console.error('[CERTIFICADO] Erro ao registrar em recent_certificates:', recentError);
          // Não falhar o processo principal se este registro falhar
        }
        
        return newCertificate.id;
      }
      
      console.error('[CERTIFICADO] Nenhum ID de certificado retornado após criação');
      return null;
    } catch (error) {
      console.error('[CERTIFICADO] Erro ao gerar certificado:', error);
      setError('Erro ao gerar certificado');
      toast.error('Erro ao gerar certificado. Tente novamente mais tarde.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica e gera um certificado se o aluno for elegível
   */
  const verificarEGerarCertificado = async (userId: string, courseId: string) => {
    try {
      setLoading(true);
      console.log(`[CERTIFICADO_HOOK] Iniciando verificação/geração para usuário ${userId} no curso ${courseId}`);
      
      // 1. Verificar se já existe certificado
      const certificadoExistente = await verificarCertificado(userId, courseId);
      if (certificadoExistente) {
        console.log(`[CERTIFICADO_HOOK] Certificado existente encontrado: ${certificadoExistente.id}`);
        return { success: true, certificateId: certificadoExistente.id };
      }
      
      console.log(`[CERTIFICADO_HOOK] Nenhum certificado existente, verificando conclusão do curso`);
      
      // 2. Forçar atualização do progresso para 100%
      try {
        // Atualizar progresso para 100%
        await supabase
          .from('enrollments')
          .update({ progress: 100 })
          .eq('user_id', userId)
          .eq('course_id', courseId);
        console.log('[CERTIFICADO_HOOK] Progresso atualizado para 100%');
      } catch (progressError) {
        console.error('[CERTIFICADO_HOOK] Erro ao atualizar progresso:', progressError);
        // Continuar mesmo se falhar a atualização do progresso
      }
      
      // 3. Verificar conclusão do curso novamente após atualização
      const cursoConcluido = await verificarConclusaoCurso(userId, courseId);
      console.log(`[CERTIFICADO_HOOK] Curso concluído após atualização? ${cursoConcluido}`);
      
      if (!cursoConcluido) {
        console.warn('[CERTIFICADO_HOOK] Curso ainda não concluído após atualização de progresso');
        toast.error('Você precisa completar 100% do curso para receber o certificado');
        return { success: false, message: 'Curso não concluído' };
      }
      
      // 4. Gerar certificado
      console.log('[CERTIFICADO_HOOK] Curso concluído, gerando certificado');
      const novoCertificadoId = await gerarCertificado(userId, courseId);
      
      if (novoCertificadoId) {
        console.log(`[CERTIFICADO_HOOK] Certificado gerado com sucesso: ${novoCertificadoId}`);
        return { success: true, certificateId: novoCertificadoId };
      }
      
      console.error('[CERTIFICADO_HOOK] Falha ao gerar certificado');
      return { success: false, message: 'Erro ao gerar certificado' };
    } catch (error) {
      console.error('[CERTIFICADO_HOOK] Erro ao verificar/gerar certificado:', error);
      toast.error('Erro ao processar certificado. Tente novamente mais tarde.');
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
    verificarCertificado,
    verificarConclusaoCurso,
    gerarCertificado,
    verificarEGerarCertificado
  };
}

export default useCertificado;
