import { supabase } from '@/integrations/supabase/client';
import courseService from './courseService';
import { moduleService } from './moduleService';
import { lessonService } from './lessonService';
import { lessonProgressService } from './lessonProgressService';

/**
 * Serviço de integração para operações que envolvem múltiplas tabelas
 * e garantem a consistência dos dados entre elas.
 */
export const integrationService = {
  /**
   * Exclui um curso e todos os seus módulos, aulas e matrículas relacionadas
   */
  async deleteCourseWithRelations(courseId: string): Promise<void> {
    try {
      // Iniciar uma transação para garantir consistência
      const { error } = await supabase.rpc('delete_course_with_relations', { course_id_param: courseId });
      
      if (error) {
        console.error('Erro ao excluir curso e relações:', error);
        throw new Error('Falha ao excluir curso e seus dados relacionados');
      }
    } catch (error) {
      console.error('Erro ao excluir curso e relações:', error);
      throw new Error('Falha ao excluir curso e seus dados relacionados');
    }
  },

  /**
   * Obtém um curso completo com todos os seus módulos, aulas e progresso do usuário
   */
  async getFullCourseWithProgress(courseId: string, userId?: string): Promise<any> {
    try {
      // Buscar o curso com seus módulos e aulas
      const course = await courseService.getCourseById(courseId);
      
      if (!course) {
        throw new Error('Curso não encontrado');
      }

      // Se um usuário foi especificado, buscar o progresso das aulas
      if (userId) {
        // Verificar se o usuário está matriculado
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('progress')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .maybeSingle();

        // Buscar o progresso de todas as aulas do usuário
        const { data: lessonProgress } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', userId);

        // Mapear o progresso para as aulas
        const progressMap = new Map();
        if (lessonProgress) {
          lessonProgress.forEach((progress: any) => {
            progressMap.set(progress.lesson_id, {
              completed: progress.completed,
              completedAt: progress.completed_at
            });
          });
        }

        // Atualizar o status de conclusão das aulas
        course.modules.forEach((module: any) => {
          module.lessons.forEach((lesson: any) => {
            const progress = progressMap.get(lesson.id);
            lesson.isCompleted = progress ? progress.completed : false;
            lesson.completedAt = progress ? progress.completedAt : null;
          });
        });

        // Atualizar o status de matrícula e progresso do curso
        course.isEnrolled = !!enrollment;
        course.progress = enrollment ? enrollment.progress : 0;
      }

      return course;
    } catch (error) {
      console.error('Erro ao buscar curso completo:', error);
      throw new Error('Falha ao buscar curso completo');
    }
  },

  /**
   * Cria um curso completo com módulos e aulas
   */
  async createFullCourse(courseData: any, modulesData: any[]): Promise<any> {
    try {
      // Criar o curso
      const course = await courseService.createCourse({
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail,
        duration: courseData.duration,
        instructor: courseData.instructor
      });

      // Criar os módulos
      const modulePromises = modulesData.map(async (moduleData, index) => {
        const module = await moduleService.createModule(course.id, {
          title: moduleData.title,
          description: moduleData.description,
          order: moduleData.order || index + 1
        });

        // Criar as aulas para este módulo
        if (moduleData.lessons && moduleData.lessons.length > 0) {
          const lessonPromises = moduleData.lessons.map((lessonData: any, lessonIndex: number) => {
            return lessonService.createLesson(module.id, {
              title: lessonData.title,
              description: lessonData.description,
              duration: lessonData.duration,
              videoUrl: lessonData.videoUrl,
              content: lessonData.content,
              order: lessonData.order || lessonIndex + 1
            });
          });

          const lessons = await Promise.all(lessonPromises);
          module.lessons = lessons;
        }

        return module;
      });

      const modules = await Promise.all(modulePromises);
      course.modules = modules;

      return course;
    } catch (error) {
      console.error('Erro ao criar curso completo:', error);
      throw new Error('Falha ao criar curso completo');
    }
  },

  /**
   * Atualiza o progresso do curso com base nas aulas concluídas
   */
  async updateCourseProgressFromLessons(userId: string, courseId: string): Promise<number> {
    return lessonProgressService.calculateCourseProgress(userId, courseId);
  }
};
