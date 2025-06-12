import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para verificar e configurar relações no banco de dados
 * Este serviço é útil para diagnosticar problemas de relacionamento entre tabelas
 */
export const databaseRelationsService = {
  /**
   * Verifica se as relações entre tabelas estão configuradas corretamente
   */
  async checkRelations(): Promise<{ success: boolean; message: string; details: any }> {
    try {
      // Verificar se as tabelas existem
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables');

      if (tablesError) {
        return {
          success: false,
          message: 'Erro ao verificar tabelas',
          details: tablesError
        };
      }

      // Verificar relações entre tabelas
      const relations = [
        { parent: 'courses', child: 'modules', foreignKey: 'course_id' },
        { parent: 'modules', child: 'lessons', foreignKey: 'module_id' },
        { parent: 'courses', child: 'enrollments', foreignKey: 'course_id' },
        { parent: 'lessons', child: 'lesson_progress', foreignKey: 'lesson_id' }
      ];

      const relationChecks = await Promise.all(relations.map(async (relation) => {
        try {
          // Verificar se a tabela pai existe
          const { data: parentData, error: parentError } = await supabase
            .from(relation.parent)
            .select('id')
            .limit(1);

          if (parentError) {
            return {
              relation,
              exists: false,
              error: `Erro ao verificar tabela pai ${relation.parent}: ${parentError.message}`
            };
          }

          // Verificar se a tabela filha existe
          const { data: childData, error: childError } = await supabase
            .from(relation.child)
            .select('id')
            .limit(1);

          if (childError) {
            return {
              relation,
              exists: false,
              error: `Erro ao verificar tabela filha ${relation.child}: ${childError.message}`
            };
          }

          // Verificar se a coluna de chave estrangeira existe na tabela filha
          const { data: columnData, error: columnError } = await supabase
            .from(relation.child)
            .select(relation.foreignKey)
            .limit(1);

          if (columnError) {
            return {
              relation,
              exists: false,
              error: `Erro ao verificar coluna ${relation.foreignKey} na tabela ${relation.child}: ${columnError.message}`
            };
          }

          return {
            relation,
            exists: true,
            error: null
          };
        } catch (error) {
          return {
            relation,
            exists: false,
            error: `Erro ao verificar relação ${relation.parent} -> ${relation.child}: ${error.message}`
          };
        }
      }));

      const failedRelations = relationChecks.filter(check => !check.exists);

      if (failedRelations.length > 0) {
        return {
          success: false,
          message: 'Algumas relações não estão configuradas corretamente',
          details: failedRelations
        };
      }

      return {
        success: true,
        message: 'Todas as relações estão configuradas corretamente',
        details: relationChecks
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao verificar relações',
        details: error
      };
    }
  },

  /**
   * Obtém cursos com seus módulos e aulas de forma otimizada
   * Esta função não depende de relações configuradas no banco de dados
   */
  async getCoursesWithModulesAndLessons(): Promise<any[]> {
    try {
      // Buscar todos os cursos
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      if (!coursesData || coursesData.length === 0) return [];

      // Buscar todos os módulos para esses cursos
      const courseIds = coursesData.map(course => course.id);
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .in('course_id', courseIds)
        .order('order_number', { ascending: true });

      if (modulesError) throw modulesError;

      // Criar um mapa de módulos por curso
      const modulesByCourse = new Map();
      (modulesData || []).forEach(module => {
        if (!modulesByCourse.has(module.course_id)) {
          modulesByCourse.set(module.course_id, []);
        }
        modulesByCourse.get(module.course_id).push(module);
      });

      // Buscar todas as aulas para esses módulos
      const moduleIds = (modulesData || []).map(module => module.id);
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('order_number', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Criar um mapa de aulas por módulo
      const lessonsByModule = new Map();
      (lessonsData || []).forEach(lesson => {
        if (!lessonsByModule.has(lesson.module_id)) {
          lessonsByModule.set(lesson.module_id, []);
        }
        lessonsByModule.get(lesson.module_id).push(lesson);
      });

      // Montar a estrutura completa
      return coursesData.map(course => {
        const modules = (modulesByCourse.get(course.id) || []).map(module => {
          const lessons = (lessonsByModule.get(module.id) || []).map(lesson => ({
            id: lesson.id,
            moduleId: lesson.module_id,
            title: lesson.title,
            description: lesson.description || '',
            duration: lesson.duration || '',
            videoUrl: lesson.video_url || '',
            content: lesson.content || '',
            order: lesson.order_number,
            isCompleted: false
          }));

          return {
            id: module.id,
            courseId: module.course_id,
            title: module.title,
            description: module.description || '',
            order: module.order_number,
            lessons
          };
        });

        return {
          id: course.id,
          title: course.title,
          description: course.description || '',
          thumbnail: course.thumbnail || '/placeholder.svg',
          duration: course.duration || '',
          instructor: course.instructor,
          enrolledCount: course.enrolledcount || 0,
          rating: course.rating || 0,
          modules,
          createdAt: course.created_at,
          updatedAt: course.updated_at,
          isEnrolled: false,
          progress: 0
        };
      });
    } catch (error) {
      console.error('Erro ao buscar cursos com módulos e aulas:', error);
      throw error;
    }
  }
};
