import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { enrollmentService } from './api';

/**
 * Serviço para matricular automaticamente usuários em cursos
 * Usado quando novos usuários são criados ou quando novos cursos são adicionados
 */
export const autoEnrollmentService = {
  /**
   * Matricula um usuário em todos os cursos disponíveis
   * @param userId ID do usuário a ser matriculado
   * @returns Array com os IDs dos cursos em que o usuário foi matriculado
   */
  async enrollUserInAllCourses(userId: string): Promise<string[]> {
    try {
      console.log(`Iniciando matrícula automática para o usuário ${userId}`);
      
      // Verificar se o usuário existe
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();
      
      if (userError || !userProfile) {
        console.error('Erro ao buscar perfil do usuário:', userError);
        throw new Error(`Usuário não encontrado: ${userError?.message || 'Perfil não existe'}`);
      }
      
      console.log(`Matriculando usuário ${userProfile.name} (${userProfile.email}) em todos os cursos disponíveis`);
      
      // Buscar todos os cursos disponíveis
      const { data: availableCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title');
      
      if (coursesError) {
        console.error('Erro ao buscar cursos disponíveis:', coursesError);
        throw new Error(`Erro ao buscar cursos: ${coursesError.message}`);
      }
      
      if (!availableCourses || availableCourses.length === 0) {
        console.log('Nenhum curso disponível para matrícula');
        return [];
      }
      
      console.log(`Encontrados ${availableCourses.length} cursos para matrícula automática`);
      
      // Verificar em quais cursos o usuário já está matriculado
      const { data: existingEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', userId);
      
      if (enrollmentsError) {
        console.error('Erro ao verificar matrículas existentes:', enrollmentsError);
      }
      
      // Criar um conjunto de IDs de cursos em que o usuário já está matriculado
      const enrolledCourseIds = new Set(
        existingEnrollments?.map(enrollment => enrollment.course_id) || []
      );
      
      console.log(`Usuário já está matriculado em ${enrolledCourseIds.size} cursos`);
      
      // Filtrar cursos em que o usuário ainda não está matriculado
      const coursesToEnroll = availableCourses.filter(course => !enrolledCourseIds.has(course.id));
      
      if (coursesToEnroll.length === 0) {
        console.log('Usuário já está matriculado em todos os cursos disponíveis');
        return [];
      }
      
      console.log(`Matriculando usuário em ${coursesToEnroll.length} novos cursos`);
      
      // Matricular o usuário em cada curso
      const enrollmentPromises = coursesToEnroll.map(async (course) => {
        try {
          const result = await enrollmentService.enrollCourse(course.id, userId);
          if (result.success) {
            console.log(`Usuário matriculado com sucesso no curso "${course.title}"`);
            return course.id;
          } else {
            console.error(`Falha ao matricular usuário no curso "${course.title}": ${result.message}`);
            return null;
          }
        } catch (enrollError) {
          console.error(`Erro ao matricular usuário no curso "${course.title}":`, enrollError);
          return null;
        }
      });
      
      // Aguardar todas as matrículas serem processadas
      const enrollmentResults = await Promise.all(enrollmentPromises);
      
      // Filtrar matrículas bem-sucedidas (remover nulls)
      const successfulEnrollments = enrollmentResults.filter(id => id !== null) as string[];
      
      console.log(`Matrícula automática concluída. Usuário matriculado em ${successfulEnrollments.length} novos cursos`);
      
      if (successfulEnrollments.length > 0) {
        toast.success(`Usuário matriculado automaticamente em ${successfulEnrollments.length} cursos`);
      }
      
      return successfulEnrollments;
    } catch (error) {
      console.error('Erro durante matrícula automática:', error);
      toast.error(`Erro durante matrícula automática: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return [];
    }
  },
  
  /**
   * Matricula todos os usuários em um curso específico
   * @param courseId ID do curso em que os usuários serão matriculados
   * @returns Array com os IDs dos usuários matriculados
   */
  async enrollAllUsersInCourse(courseId: string): Promise<string[]> {
    try {
      console.log(`Iniciando matrícula automática de todos os usuários no curso ${courseId}`);
      
      // Verificar se o curso existe
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .single();
      
      if (courseError || !course) {
        console.error('Erro ao buscar curso:', courseError);
        throw new Error(`Curso não encontrado: ${courseError?.message || 'Curso não existe'}`);
      }
      
      console.log(`Matriculando todos os usuários no curso "${course.title}"`);
      
      // Buscar todos os usuários (apenas alunos)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('role', 'student');
      
      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError);
        throw new Error(`Erro ao buscar usuários: ${usersError.message}`);
      }
      
      if (!users || users.length === 0) {
        console.log('Nenhum usuário encontrado para matrícula');
        return [];
      }
      
      console.log(`Encontrados ${users.length} usuários para matrícula automática`);
      
      // Verificar quais usuários já estão matriculados neste curso
      const { data: existingEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('course_id', courseId);
      
      if (enrollmentsError) {
        console.error('Erro ao verificar matrículas existentes:', enrollmentsError);
      }
      
      // Criar um conjunto de IDs de usuários que já estão matriculados
      const enrolledUserIds = new Set(
        existingEnrollments?.map(enrollment => enrollment.user_id) || []
      );
      
      console.log(`${enrolledUserIds.size} usuários já estão matriculados neste curso`);
      
      // Filtrar usuários que ainda não estão matriculados
      const usersToEnroll = users.filter(user => !enrolledUserIds.has(user.id));
      
      if (usersToEnroll.length === 0) {
        console.log('Todos os usuários já estão matriculados neste curso');
        return [];
      }
      
      console.log(`Matriculando ${usersToEnroll.length} novos usuários no curso`);
      
      // Matricular cada usuário no curso
      const enrollmentPromises = usersToEnroll.map(async (user) => {
        try {
          const result = await enrollmentService.enrollCourse(courseId, user.id);
          if (result.success) {
            console.log(`Usuário "${user.name}" matriculado com sucesso no curso`);
            return user.id;
          } else {
            console.error(`Falha ao matricular usuário "${user.name}": ${result.message}`);
            return null;
          }
        } catch (enrollError) {
          console.error(`Erro ao matricular usuário "${user.name}":`, enrollError);
          return null;
        }
      });
      
      // Aguardar todas as matrículas serem processadas
      const enrollmentResults = await Promise.all(enrollmentPromises);
      
      // Filtrar matrículas bem-sucedidas (remover nulls)
      const successfulEnrollments = enrollmentResults.filter(id => id !== null) as string[];
      
      console.log(`Matrícula automática concluída. ${successfulEnrollments.length} usuários matriculados no curso`);
      
      if (successfulEnrollments.length > 0) {
        toast.success(`${successfulEnrollments.length} usuários matriculados automaticamente no curso`);
      }
      
      return successfulEnrollments;
    } catch (error) {
      console.error('Erro durante matrícula automática:', error);
      toast.error(`Erro durante matrícula automática: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return [];
    }
  }
};
