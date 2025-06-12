import { Module, Lesson } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { requestQueue } from '@/utils/requestQueue';
import { cacheManager } from '@/utils/cacheManager';

export const moduleService = {
  async getAllModules(): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, description, order_number, course_id')
        .order('title', { ascending: true });

      if (error) throw error;
      if (!data) throw new Error('Nenhum módulo encontrado');

      return data.map(module => ({
        id: module.id,
        title: module.title,
        description: module.description || '',
        order: module.order_number,
        courseId: module.course_id,
        lessons: []
      }));
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
      throw new Error('Falha ao buscar módulos');
    }
  },

  async getModulesByCourseId(courseId: string): Promise<Module[]> {
    if (!courseId) throw new Error('ID do curso é obrigatório');

    // Chave de cache para este curso
    const cacheKey = `modules_${courseId}`;
    
    // Tentar obter do cache primeiro, com expiração de 10 minutos
    try {
      return await cacheManager.getOrSet(
        cacheKey,
        async () => {
          console.log(`Buscando módulos do curso ${courseId} do servidor...`);
          
          // Buscar os módulos usando a fila de requisições
          const modulesResponse = await requestQueue.enqueue(async () => {
            const response = await supabase
              .from('modules')
              .select('id, title, description, order_number, course_id')
              .eq('course_id', courseId)
              .order('order_number', { ascending: true });
              
            return response;
          });
          
          const modules = modulesResponse.data || [];
          const modulesError = modulesResponse.error;

          if (modulesError) throw modulesError;
          
          if (modules.length === 0) {
            console.log('Nenhum módulo encontrado para o curso:', courseId);
            return []; // Retornar array vazio em vez de lançar erro
          }

          // Processar módulos sequencialmente para evitar muitas requisições simultâneas
          const modulesWithLessons: Module[] = [];
          
          for (const module of modules) {
            try {
              // Buscar aulas para este módulo usando a fila de requisições
              const lessonsResponse = await requestQueue.enqueue(async () => {
                const response = await supabase
                  .from('lessons')
                  .select('id, module_id, title, description, duration, video_url, content, order_number')
                  .eq('module_id', module.id)
                  .order('order_number', { ascending: true });
                  
                return response;
              });
              
              const lessons = lessonsResponse.data || [];
              const lessonsError = lessonsResponse.error;

              if (lessonsError) {
                console.error(`Erro ao buscar aulas para o módulo ${module.id}:`, lessonsError);
                throw lessonsError;
              }

              modulesWithLessons.push({
                id: module.id,
                title: module.title,
                description: module.description || '',
                order: module.order_number,
                courseId: module.course_id,
                lessons: lessons.map(lesson => ({
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
            } catch (error) {
              console.error(`Erro ao processar módulo ${module.id}:`, error);
              // Continuar com os outros módulos mesmo se um falhar
              modulesWithLessons.push({
                id: module.id,
                title: module.title,
                description: module.description || '',
                order: module.order_number,
                courseId: module.course_id,
                lessons: [] // Sem aulas se houver erro
              });
            }
          }

          return modulesWithLessons;
        },
        10 * 60 * 1000 // 10 minutos de cache
      );
    } catch (error) {
      console.error('Erro ao buscar módulos do curso:', error);
      
      // Mensagens de erro mais informativas
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('O servidor está temporariamente sobrecarregado. Estamos limitando as requisições para evitar problemas. Por favor, aguarde alguns instantes.');
        }
        
        if (error.message.includes('network') || error.message.includes('Network')) {
          throw new Error('Problema de conexão detectado. Verifique sua internet e tente novamente.');
        }
        
        // Incluir a mensagem original para ajudar no diagnóstico
        throw new Error(`Erro ao carregar módulos e aulas: ${error.message}`);
      }
      
      throw new Error('Falha ao buscar módulos do curso. Tente novamente mais tarde.');
    }
  },

  async createModule(courseId: string, moduleData: { 
    title: string; 
    description?: string; 
    order: number 
  }): Promise<Module> {
    if (!courseId) throw new Error('ID do curso é obrigatório');
    if (!moduleData?.title?.trim()) throw new Error('Título do módulo é obrigatório');

    try {
      const { data, error } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: moduleData.title.trim(),
          description: moduleData.description?.trim() || '',
          order_number: moduleData.order
        })
        .select('id, title, description, order_number, course_id')
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
  }
};
