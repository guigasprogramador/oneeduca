import { supabase } from '@/integrations/supabase/client';
import { certificateService } from './api';
import { toast } from 'sonner';

/**
 * Serviço para gerenciar a geração de certificados
 * Centraliza a lógica de verificação e geração para evitar duplicação de código
 */
export const certificateManager = {
  /**
   * Verifica se um aluno é elegível para receber um certificado e gera o certificado se necessário
   * @param userId ID do usuário
   * @param courseId ID do curso
   * @returns Objeto com informações sobre o certificado gerado ou encontrado
   */
  async checkAndGenerateCertificate(userId: string, courseId: string) {
    try {
      console.log(`[CERTIFICADO] Verificando certificado para usuário ${userId} no curso ${courseId}`);
      
      // 1. Verificar se já existe um certificado
      const existingCerts = await certificateService.getCertificates(userId, courseId);
      if (existingCerts && existingCerts.length > 0) {
        console.log(`[CERTIFICADO] Certificado já existente: ${existingCerts[0].id}`);
        return {
          success: true,
          certificateId: existingCerts[0].id,
          isNew: false,
          message: 'Certificado já existente'
        };
      }
      
      // 2. Verificar se o aluno completou o curso (progresso = 100%)
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('progress')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();
        
      if (enrollmentError) {
        console.error('[CERTIFICADO] Erro ao verificar matrícula:', enrollmentError);
        throw new Error('Erro ao verificar matrícula no curso');
      }
      
      if (!enrollment) {
        console.error('[CERTIFICADO] Matrícula não encontrada');
        throw new Error('Matrícula não encontrada');
      }
      
      // 3. Verificar progresso
      if (enrollment.progress < 100) {
        // Se o progresso não for 100%, verificar aulas concluídas para cálculo alternativo
        const calculatedProgress = await this.calculateProgressFromLessons(userId, courseId);
        
        if (calculatedProgress < 100) {
          console.log(`[CERTIFICADO] Progresso insuficiente: ${calculatedProgress}%`);
          return {
            success: false,
            message: 'Progresso insuficiente para gerar certificado'
          };
        } else {
          // Atualizar o progresso na tabela de matrículas para 100%
          await supabase
            .from('enrollments')
            .update({ progress: 100 })
            .eq('user_id', userId)
            .eq('course_id', courseId);
            
          console.log('[CERTIFICADO] Progresso atualizado para 100% com base nas aulas concluídas');
        }
      }
      
      // 4. Gerar certificado
      try {
        console.log('[CERTIFICADO] Gerando novo certificado...');
        const newCert = await certificateService.generateCertificate(courseId, userId);
        
        if (newCert && newCert.id) {
          console.log(`[CERTIFICADO] Certificado gerado com sucesso: ${newCert.id}`);
          toast.success('Parabéns! Seu certificado foi gerado com sucesso.');
          
          return {
            success: true,
            certificateId: newCert.id,
            isNew: true,
            message: 'Novo certificado gerado com sucesso'
          };
        } else {
          throw new Error('Falha ao gerar certificado');
        }
      } catch (error) {
        console.error('[CERTIFICADO] Erro ao gerar certificado:', error);
        
        // Verificar novamente se já existe um certificado (pode ter sido criado em paralelo)
        const checkAgain = await certificateService.getCertificates(userId, courseId);
        if (checkAgain && checkAgain.length > 0) {
          return {
            success: true,
            certificateId: checkAgain[0].id,
            isNew: false,
            message: 'Certificado encontrado após erro'
          };
        }
        
        throw error;
      }
    } catch (error) {
      console.error('[CERTIFICADO] Erro geral:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao verificar/gerar certificado: ${errorMessage}`);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  },
  
  /**
   * Calcula o progresso do curso com base nas aulas concluídas
   * @param userId ID do usuário
   * @param courseId ID do curso
   * @returns Percentual de progresso (0-100)
   */
  async calculateProgressFromLessons(userId: string, courseId: string): Promise<number> {
    try {
      // 1. Buscar todos os módulos do curso
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);
        
      if (!modulesData || modulesData.length === 0) {
        return 0;
      }
      
      const moduleIds = modulesData.map(m => m.id);
      
      // 2. Buscar todas as aulas desses módulos
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);
        
      if (!lessonsData || lessonsData.length === 0) {
        return 0;
      }
      
      // 3. Buscar aulas concluídas pelo usuário
      const { data: completedLessonsData } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('completed', true);
        
      if (!completedLessonsData) {
        return 0;
      }
      
      // 4. Calcular progresso
      const completedLessonIds = new Set(completedLessonsData.map(item => item.lesson_id));
      const completedCount = lessonsData.filter(lesson => completedLessonIds.has(lesson.id)).length;
      const totalCount = lessonsData.length;
      
      if (totalCount === 0) return 0;
      
      const progress = Math.round((completedCount / totalCount) * 100);
      console.log(`[CERTIFICADO] Progresso calculado: ${progress}% (${completedCount}/${totalCount})`);
      
      return progress;
    } catch (error) {
      console.error('[CERTIFICADO] Erro ao calcular progresso:', error);
      return 0;
    }
  }
};
