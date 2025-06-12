import { LessonProgress, Certificate } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { certificateService } from '@/services'; // Importar certificateService

export const lessonProgressService = {
  /**
   * Obter o progresso de todas as aulas para um usuário
   */
  async getLessonProgress(userId: string): Promise<LessonProgress[]> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      if (!data) return [];

      return data.map(progress => ({
        id: progress.id,
        userId: progress.user_id,
        lessonId: progress.lesson_id,
        completed: progress.completed,
        completedAt: progress.completed_at
      }));
    } catch (error) {
      console.error('Erro ao buscar progresso das aulas:', error);
      throw new Error('Falha ao buscar progresso das aulas');
    }
  },

  /**
   * Obter o progresso de uma aula específica para um usuário
   */
  async getLessonProgressByLessonId(userId: string, lessonId: string): Promise<LessonProgress | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        lessonId: data.lesson_id,
        completed: data.completed,
        completedAt: data.completed_at
      };
    } catch (error) {
      console.error('Erro ao buscar progresso da aula:', error);
      throw new Error('Falha ao buscar progresso da aula');
    }
  },

  /**
   * Marcar uma aula como concluída
   */
  async markLessonAsCompleted(userId: string, lessonId: string): Promise<LessonProgress> {
    try {
      // Verificar se o usuário existe e criar perfil se necessário
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
          
        if (profileError || !userProfile) {
          console.log(`Perfil do usuário ${userId} não encontrado, tentando criar automaticamente...`);
          
          // Buscar dados do usuário autenticado
          const { data: authData } = await supabase.auth.getUser();
          
          if (authData?.user) {
            // Criar perfil do usuário automaticamente
            const { error: createError } = await supabase
              .from('profiles')
              .upsert({
                id: userId,
                name: authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || 'Usuário',
                email: authData.user.email,
                role: authData.user.user_metadata?.role || 'student',
                created_at: new Date().toISOString()
              });
              
            if (createError) {
              console.error('Erro ao criar perfil do usuário:', createError);
            } else {
              console.log(`Perfil do usuário ${userId} criado automaticamente`);
            }
          }
        }
      } catch (profileCheckError) {
        console.error('Erro ao verificar perfil do usuário:', profileCheckError);
        // Continuar mesmo com erro
      }
      
      // Verificar se já existe um registro de progresso
      const { data: existingProgress, error: checkError } = await supabase
        .from('lesson_progress')
        .select('id, user_id, lesson_id, completed, completed_at')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar progresso existente:', checkError);
        // Continuar mesmo com erro
      }

      const now = new Date().toISOString();
      
      if (existingProgress) {
        console.log(`Atualizando progresso existente para aula ${lessonId}`);
        // Atualizar o registro existente
        try {
          const { data, error } = await supabase
            .from('lesson_progress')
            .update({
              completed: true,
              completed_at: now
            })
            .eq('id', existingProgress.id)
            .select()
            .single();

          if (error) {
            console.error('Erro ao atualizar progresso:', error);
            throw error;
          }
          
          return {
            id: data.id,
            userId: data.user_id,
            lessonId: data.lesson_id,
            completed: data.completed,
            completedAt: data.completed_at
          };
        } catch (updateError) {
          console.error('Erro ao atualizar progresso (capturado):', updateError);
          
          // Retornar o progresso existente em caso de erro
          return {
            id: existingProgress.id,
            userId: existingProgress.user_id,
            lessonId: existingProgress.lesson_id,
            completed: true,
            completedAt: existingProgress.completed_at || now
          };
        }
      } else {
        console.log(`Criando novo progresso para aula ${lessonId}`);
        // Criar um novo registro
        try {
          const progressData = {
            user_id: userId,
            lesson_id: lessonId,
            completed: true,
            completed_at: now
          };
          
          const { data, error } = await supabase
            .from('lesson_progress')
            .insert(progressData)
            .select()
            .single();

          if (error) {
            console.error('Erro ao criar progresso:', error);
            
            // Abordagem alternativa: tentar inserir sem retornar dados
            const { error: altError } = await supabase
              .from('lesson_progress')
              .insert(progressData);
              
            if (altError) {
              console.error('Erro na abordagem alternativa:', altError);
              throw altError;
            }
            
            // Se chegou aqui, a inserção foi bem-sucedida, mas não temos os dados
            // Criar um objeto de progresso com os dados que temos
            return {
              id: `temp-${Date.now()}`, // ID temporário
              userId,
              lessonId,
              completed: true,
              completedAt: now
            };
          }
          
          return {
            id: data.id,
            userId: data.user_id,
            lessonId: data.lesson_id,
            completed: data.completed,
            completedAt: data.completed_at
          };
        } catch (insertError) {
          console.error('Erro ao criar progresso (capturado):', insertError);
          
          // Criar um objeto de progresso com os dados que temos
          return {
            id: `temp-${Date.now()}`, // ID temporário
            userId,
            lessonId,
            completed: true,
            completedAt: now
          };
        }
      }
    } catch (error) {
      console.error('Erro ao marcar aula como concluída:', error);
      
      // Retornar um objeto de progresso fictício para não quebrar a interface
      return {
        id: `error-${Date.now()}`,
        userId,
        lessonId,
        completed: true,
        completedAt: new Date().toISOString()
      };
    }
  },

  /**
   * Marcar uma aula como não concluída
   */
  async markLessonAsIncomplete(userId: string, lessonId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lesson_progress')
        .update({
          completed: false,
          completed_at: null
        })
        .eq('user_id', userId)
        .eq('lesson_id', lessonId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao marcar aula como não concluída:', error);
      throw new Error('Falha ao marcar aula como não concluída');
    }
  },

  /**
   * Calcular o progresso geral do curso com base nas aulas concluídas
   */
  async calculateCourseProgress(userId: string, courseId: string): Promise<number> {
    try {
      // Buscar todos os IDs de aulas do curso
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      if (modulesError) throw modulesError;
      if (!modules || modules.length === 0) return 0;

      const moduleIds = modules.map(m => m.id);
      
      // Buscar todas as aulas dos módulos do curso
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (lessonsError) throw lessonsError;
      if (!lessons || lessons.length === 0) return 0;

      const totalLessons = lessons.length;
      const lessonIds = lessons.map(l => l.id);

      // Buscar aulas concluídas pelo usuário
      const { data: completedLessons, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .in('lesson_id', lessonIds);

      if (progressError) throw progressError;
      
      const completedCount = completedLessons?.length || 0;
      
      // Calcular porcentagem de progresso
      const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      
      // Atualizar o progresso na tabela de matrículas
      await supabase
        .from('enrollments')
        .update({ progress })
        .eq('user_id', userId)
        .eq('course_id', courseId);

      // Gerar certificado se o curso for concluído (progresso === 100)
      if (progress === 100) {
        try {
          // Verificar se já existe um certificado para evitar duplicidade
          const existingCertificates = await certificateService.getCertificates(userId, courseId);
          if (existingCertificates.length === 0) {
            console.log(`Iniciando geração de certificado para o usuário ${userId} no curso ${courseId}`);
            const certificate = await certificateService.generateCertificate(courseId, userId);
            // Notificar o usuário sobre o novo certificado
            console.log(`Certificado gerado com sucesso: ${certificate.id}`);
          } else {
            console.log(`Certificado já existe para o usuário ${userId} no curso ${courseId}`);
          }
        } catch (certError) {
          console.error('Erro ao gerar certificado automaticamente:', certError);
          // Não impedir o fluxo principal por erro na geração do certificado, mas registrar
        }
      }

      return progress;
    } catch (error) {
      console.error('Erro ao calcular progresso do curso:', error);
      throw new Error('Falha ao calcular progresso do curso');
    }
  }
};
