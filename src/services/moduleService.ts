import { Module, Lesson } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { requestQueue } from '@/utils/requestQueue';
import { cacheManager } from '@/utils/cacheManager';
import type { 
  ExtendedModule, 
  CreateModuleForm, 
  QuizData 
} from '@/types/professor';

export const moduleService = {
  async getAllModules(): Promise<Module[]> {
    try {
      // Primeiro, buscar todos os módulos
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, description, order_number, course_id')
        .order('title', { ascending: true });

      if (error) throw error;
      if (!data) throw new Error('Nenhum módulo encontrado');

      // Para cada módulo, buscar suas aulas
      const modulesWithLessons = await Promise.all(data.map(async (module) => {
        try {
          // Buscar aulas para este módulo
          const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('id, module_id, title, description, duration, video_url, content, order_number')
            .eq('module_id', module.id)
            .order('order_number', { ascending: true });

          if (lessonsError) {
            console.error(`Erro ao buscar aulas para o módulo ${module.id}:`, lessonsError);
            return {
              id: module.id,
              title: module.title,
              description: module.description || '',
              order: module.order_number,
              courseId: module.course_id,
              lessons: []
            };
          }

          return {
            id: module.id,
            title: module.title,
            description: module.description || '',
            order: module.order_number,
            courseId: module.course_id,
            lessons: (lessons || []).map(lesson => ({
              id: lesson.id,
              moduleId: lesson.module_id,
              title: lesson.title,
              description: lesson.description || '',
              duration: lesson.duration || '',
              videoUrl: lesson.video_url || '',
              content: lesson.content || '',
              order: lesson.order_number,
              isCompleted: false
            }))
          };
        } catch (error) {
          console.error(`Erro ao processar módulo ${module.id}:`, error);
          return {
            id: module.id,
            title: module.title,
            description: module.description || '',
            order: module.order_number,
            courseId: module.course_id,
            lessons: []
          };
        }
      }));

      return modulesWithLessons;
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
      throw new Error('Falha ao buscar módulos');
    }
  },

  async getModulesByCourseId(courseId: string): Promise<Module[]> {
    if (!courseId) throw new Error('ID do curso é obrigatório');

    console.log(`DIAGNÓSTICO: Buscando módulos e aulas do curso ${courseId}...`);
    
    try {
      // Abordagem 1: Buscar modules e lessons em uma única consulta com join Foreign Keys
      // Isso minimiza o número de requisições e contorna problemas de RLS
      console.log(`Usando abordagem com join para buscar módulos e aulas do curso ${courseId}...`);
      
      // Busca otimizada que já traz módulos e aulas de uma vez
      const { data: modulesWithLessonsData, error: modulesJoinError } = await supabase
        .from('modules')
        .select(`
          id, title, description, order_number, course_id,
          lessons:lessons(id, module_id, title, description, duration, video_url, content, order_number)
        `)
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });
      
      if (modulesJoinError) {
        console.error(`DIAGNÓSTICO: Erro na abordagem com join:`, modulesJoinError);
        // Se a abordagem com join falhar, tente a abordagem legada
        console.log(`Voltando para abordagem legada de busca sequencial...`);
      } else if (modulesWithLessonsData && modulesWithLessonsData.length > 0) {
        console.log(`DIAGNÓSTICO: Join bem-sucedido! Encontrados ${modulesWithLessonsData.length} módulos`);
        
        // Processar os dados retornados pelo join
        const processedModules: Module[] = modulesWithLessonsData.map(moduleData => {
          // Ordenar lições por order_number
          const sortedLessons = [...(moduleData.lessons || [])].sort((a, b) => 
            (a.order_number || 0) - (b.order_number || 0)
          );

          console.log(`DIAGNÓSTICO: Módulo ${moduleData.title} tem ${sortedLessons.length} aulas`);
          
          // Criar objeto Module com as aulas ordenadas
          return {
            id: moduleData.id,
            title: moduleData.title,
            description: moduleData.description || '',
            order: moduleData.order_number,
            courseId: moduleData.course_id,
            lessons: sortedLessons.map(lesson => ({
              id: lesson.id,
              moduleId: lesson.module_id,
              title: lesson.title,
              description: lesson.description || '',
              duration: lesson.duration || '',
              videoUrl: lesson.video_url || '',
              content: lesson.content || '',
              order: lesson.order_number,
              isCompleted: false
            }))
          };
        }).sort((a, b) => a.order - b.order);
        
        console.log(`DIAGNÓSTICO: Retornando ${processedModules.length} módulos com suas aulas`);
        return processedModules;
      } else {
        console.log(`DIAGNÓSTICO: Nenhum módulo encontrado na abordagem com join`);
      }
      
      // Abordagem 2 (fallback): Buscar primeiro os módulos e depois as aulas
      console.log(`DIAGNÓSTICO: Tentando abordagem legada...`);
      
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, title, description, order_number, course_id')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });
      
      if (modulesError) {
        console.error(`DIAGNÓSTICO: Erro ao buscar módulos do curso ${courseId}:`, modulesError);
        return []; // Retornar array vazio em caso de erro em vez de lançar erro
      }
      
      if (!modules || modules.length === 0) {
        console.log('DIAGNÓSTICO: Nenhum módulo encontrado para o curso:', courseId);
        return []; // Retornar array vazio em vez de lançar erro
      }
      
      console.log(`DIAGNÓSTICO: Encontrados ${modules.length} módulos. Buscando aulas...`);
      
      // Processar módulos sequencialmente para evitar muitas requisições simultâneas
      const modulesWithLessons: Module[] = [];

      // Usar uma abordagem mais direta para buscar todas as aulas de uma vez
      // em vez de fazer uma consulta por módulo
      const moduleIds = modules.map(m => m.id);
      
      console.log(`DIAGNÓSTICO: Buscando aulas para ${moduleIds.length} módulos de uma vez...`);
      
      const { data: allLessons, error: allLessonsError } = await supabase
        .from('lessons')
        .select('id, module_id, title, description, duration, video_url, content, order_number')
        .in('module_id', moduleIds)
        .order('order_number', { ascending: true });
        
      if (allLessonsError) {
        console.error(`DIAGNÓSTICO: Erro ao buscar todas as aulas:`, allLessonsError);
      } else {
        console.log(`DIAGNÓSTICO: Encontradas ${allLessons?.length || 0} aulas no total`);
      }
      
      // Agrupar aulas por módulo
      const lessonsByModule = new Map();
      if (allLessons && allLessons.length > 0) {
        allLessons.forEach(lesson => {
          if (!lessonsByModule.has(lesson.module_id)) {
            lessonsByModule.set(lesson.module_id, []);
          }
          lessonsByModule.get(lesson.module_id).push(lesson);
        });
      }
      
      // Montar a estrutura final
      for (const module of modules) {
        const moduleLessons = lessonsByModule.get(module.id) || [];
        console.log(`DIAGNÓSTICO: Módulo ${module.title} (${module.id}) tem ${moduleLessons.length} aulas`);
        
        modulesWithLessons.push({
          id: module.id,
          title: module.title,
          description: module.description || '',
          order: module.order_number,
          courseId: module.course_id,
          lessons: moduleLessons.map(lesson => ({
            id: lesson.id,
            moduleId: lesson.module_id,
            title: lesson.title,
            description: lesson.description || '',
            duration: lesson.duration || '',
            videoUrl: lesson.video_url || '',
            content: lesson.content || '',
            order: lesson.order_number,
            isCompleted: false
          }))
        });
      }

      return modulesWithLessons.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('DIAGNÓSTICO: Erro ao buscar módulos do curso:', error);
      // Retornar array vazio em vez de lançar erro para evitar quebrar a UI
      return [];
    }
  },

  async createModule(courseId: string, moduleData: CreateModuleForm): Promise<ExtendedModule> {
    if (!courseId) throw new Error('ID do curso é obrigatório');
    if (!moduleData?.title?.trim()) throw new Error('Título do módulo é obrigatório');

    try {
      const { data, error } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: moduleData.title.trim(),
          description: moduleData.description?.trim() || '',
          order_number: moduleData.order,
          has_quiz: moduleData.hasQuiz || false,
          quiz_data: moduleData.quizData ? JSON.stringify(moduleData.quizData) : null
        })
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Nenhum dado retornado após criar o módulo');

      // Limpar o cache para este curso
      cacheManager.remove(`modules_${courseId}`);

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        order: data.order_number,
        courseId: data.course_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        hasQuiz: data.has_quiz || false,
        quizData: data.quiz_data ? JSON.parse(data.quiz_data) : null,
        lessonsCount: 0,
        lessons: []
      };
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
      throw new Error('Falha ao criar módulo');
    }
  },

  async updateModule(moduleId: string, moduleData: { 
    title?: string; 
    description?: string; 
    order?: number 
  }): Promise<void> {
    if (!moduleId) throw new Error('ID do módulo é obrigatório');

    const updates: Record<string, any> = {};
    
    if (moduleData.title !== undefined) {
      if (!moduleData.title.trim()) {
        throw new Error('Título do módulo não pode ficar vazio');
      }
      updates.title = moduleData.title.trim();
    }
    
    if (moduleData.description !== undefined) {
      updates.description = moduleData.description.trim();
    }
    
    if (moduleData.order !== undefined) {
      updates.order_number = moduleData.order;
    }

    try {
      // Primeiro, obter o módulo para saber o courseId
      const { data: moduleInfo, error: moduleError } = await supabase
        .from('modules')
        .select('course_id')
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;
      if (!moduleInfo) throw new Error('Módulo não encontrado');

      const courseId = moduleInfo.course_id;

      // Atualizar o módulo
      const { error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', moduleId);

      if (error) throw error;

      // Limpar o cache para este curso
      cacheManager.remove(`modules_${courseId}`);
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      throw new Error('Falha ao atualizar módulo');
    }
  },

  async deleteModule(moduleId: string): Promise<void> {
    if (!moduleId) throw new Error('ID do módulo é obrigatório');

    try {
      // Primeiro, obter o módulo para saber o courseId
      const { data: moduleInfo, error: moduleError } = await supabase
        .from('modules')
        .select('course_id')
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;
      if (!moduleInfo) throw new Error('Módulo não encontrado');

      const courseId = moduleInfo.course_id;

      // Excluir o módulo
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      // Limpar o cache para este curso
      cacheManager.remove(`modules_${courseId}`);
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
      throw new Error('Falha ao excluir módulo');
    }
  },

  // Novas funções para professores
  async getModuleById(moduleId: string): Promise<ExtendedModule> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          lessons(count)
        `)
        .eq('id', moduleId)
        .single();

      if (error) {
        console.error('Erro ao buscar módulo:', error);
        throw new Error('Erro ao buscar módulo');
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        order: data.order_number,
        courseId: data.course_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        hasQuiz: data.has_quiz || false,
        quizData: data.quiz_data ? JSON.parse(data.quiz_data) : null,
        lessonsCount: data.lessons?.[0]?.count || 0,
        lessons: []
      };
    } catch (error) {
      console.error('Erro ao buscar módulo:', error);
      throw new Error('Erro ao buscar módulo');
    }
  },

  async updateModuleExtended(moduleId: string, moduleData: Partial<CreateModuleForm>): Promise<ExtendedModule> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (moduleData.title) updateData.title = moduleData.title;
      if (moduleData.description !== undefined) updateData.description = moduleData.description;
      if (moduleData.order !== undefined) updateData.order_number = moduleData.order;
      if (moduleData.hasQuiz !== undefined) updateData.has_quiz = moduleData.hasQuiz;
      if (moduleData.quizData !== undefined) {
        updateData.quiz_data = moduleData.quizData ? JSON.stringify(moduleData.quizData) : null;
      }

      const { data, error } = await supabase
        .from('modules')
        .update(updateData)
        .eq('id', moduleId)
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao atualizar módulo:', error);
        throw new Error('Erro ao atualizar módulo');
      }

      // Limpar o cache para este curso
      cacheManager.remove(`modules_${data.course_id}`);

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        order: data.order_number,
        courseId: data.course_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        hasQuiz: data.has_quiz || false,
        quizData: data.quiz_data ? JSON.parse(data.quiz_data) : null,
        lessonsCount: 0,
        lessons: []
      };
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      throw new Error('Erro ao atualizar módulo');
    }
  },

  async getModulesByCourseExtended(courseId: string): Promise<ExtendedModule[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          lessons(count)
        `)
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });

      if (error) {
        console.error('Erro ao buscar módulos:', error);
        throw new Error('Erro ao buscar módulos');
      }

      return data.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description || '',
        order: module.order_number,
        courseId: module.course_id,
        createdAt: module.created_at,
        updatedAt: module.updated_at,
        hasQuiz: module.has_quiz || false,
        quizData: module.quiz_data ? JSON.parse(module.quiz_data) : null,
        lessonsCount: module.lessons?.[0]?.count || 0,
        lessons: []
      }));
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
      throw new Error('Erro ao buscar módulos');
    }
  },

  async updateModuleOrder(moduleId: string, newOrder: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('modules')
        .update({ 
          order_number: newOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', moduleId);

      if (error) {
        console.error('Erro ao atualizar ordem do módulo:', error);
        throw new Error('Erro ao atualizar ordem do módulo');
      }
    } catch (error) {
      console.error('Erro ao atualizar ordem do módulo:', error);
      throw new Error('Erro ao atualizar ordem do módulo');
    }
  }
};
