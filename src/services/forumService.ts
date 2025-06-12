import { supabase } from '@/integrations/supabase/client';
import { requestQueue } from '@/utils/requestQueue';

export interface CreateForumTopicData {
  title: string;
  description?: string;
  courseId: string;
}

export interface SendMessageData {
  forumId: string;
  message: string;
  parentMessageId?: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  courseStatus: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
  lastActivity?: string;
}

export interface ForumMessage {
  id: string;
  forumId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
  replies?: ForumMessage[];
}

class ForumService {
  /**
   * Busca todos os tópicos do fórum para administradores (incluindo cursos não publicados)
   */
  async getAllTopicsForAdmin(): Promise<ForumTopic[]> {
    try {
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('course_forums')
          .select(`
            id,
            title,
            description,
            course_id,
            created_by,
            created_at,
            updated_at,
            courses!inner (
              title,
              status
            ),
            profiles!created_by (
              name
            )
          `)
          .order('updated_at', { ascending: false });
      });

      if (error) {
        console.error('Erro ao buscar tópicos do fórum:', error);
        throw error;
      }

      // Buscar contagem de mensagens para cada tópico
      const topicsWithCounts = await Promise.all(
        (data || []).map(async (topic: any) => {
          const { count } = await supabase
            .from('forum_messages')
            .select('*', { count: 'exact', head: true })
            .eq('forum_id', topic.id);

          // Buscar última atividade
          const { data: lastMessage } = await supabase
            .from('forum_messages')
            .select('created_at')
            .eq('forum_id', topic.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: topic.id,
            title: topic.title,
            description: topic.description,
            courseId: topic.course_id,
            courseName: topic.courses?.title || 'Curso não encontrado',
            courseStatus: topic.courses?.status || 'unknown',
            createdBy: topic.created_by,
            createdByName: topic.profiles?.name || 'Usuário não encontrado',
            createdAt: topic.created_at,
            updatedAt: topic.updated_at,
            messagesCount: count || 0,
            lastActivity: lastMessage?.created_at || topic.updated_at
          };
        })
      );

      return topicsWithCounts;
    } catch (error) {
      console.error('Erro no serviço de fórum:', error);
      throw error;
    }
  }

  /**
   * Busca tópicos do fórum para professores (apenas seus cursos)
   */
  async getTopicsForProfessor(professorId: string): Promise<ForumTopic[]> {
    try {
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('course_forums')
          .select(`
            id,
            title,
            description,
            course_id,
            created_by,
            created_at,
            updated_at,
            courses!inner (
              title,
              status,
              professor_id
            ),
            profiles!created_by (
              name
            )
          `)
          .eq('courses.professor_id', professorId)
          .order('updated_at', { ascending: false });
      });

      if (error) {
        console.error('Erro ao buscar tópicos do professor:', error);
        throw error;
      }

      // Buscar contagem de mensagens para cada tópico
      const topicsWithCounts = await Promise.all(
        (data || []).map(async (topic: any) => {
          const { count } = await supabase
            .from('forum_messages')
            .select('*', { count: 'exact', head: true })
            .eq('forum_id', topic.id);

          // Buscar última atividade
          const { data: lastMessage } = await supabase
            .from('forum_messages')
            .select('created_at')
            .eq('forum_id', topic.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: topic.id,
            title: topic.title,
            description: topic.description,
            courseId: topic.course_id,
            courseName: topic.courses?.title || 'Curso não encontrado',
            courseStatus: topic.courses?.status || 'unknown',
            createdBy: topic.created_by,
            createdByName: topic.profiles?.name || 'Usuário não encontrado',
            createdAt: topic.created_at,
            updatedAt: topic.updated_at,
            messagesCount: count || 0,
            lastActivity: lastMessage?.created_at || topic.updated_at
          };
        })
      );

      return topicsWithCounts;
    } catch (error) {
      console.error('Erro no serviço de fórum do professor:', error);
      throw error;
    }
  }

  /**
   * Cria um novo tópico no fórum
   */
  async createTopic(topicData: CreateForumTopicData): Promise<string> {
    try {
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('course_forums')
          .insert({
            title: topicData.title,
            description: topicData.description,
            course_id: topicData.courseId
          })
          .select('id')
          .single();
      });

      if (error) {
        console.error('Erro ao criar tópico:', error);
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Erro no serviço de criação de tópico:', error);
      throw error;
    }
  }

  /**
   * Busca mensagens de um tópico específico
   */
  async getTopicMessages(forumId: string): Promise<ForumMessage[]> {
    try {
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('forum_messages')
          .select(`
            id,
            forum_id,
            user_id,
            message,
            parent_message_id,
            created_at,
            updated_at,
            profiles!user_id (
              name,
              role
            )
          `)
          .eq('forum_id', forumId)
          .order('created_at', { ascending: true });
      });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        throw error;
      }

      return (data || []).map((message: any) => ({
        id: message.id,
        forumId: message.forum_id,
        userId: message.user_id,
        userName: message.profiles?.name || 'Usuário não encontrado',
        userRole: message.profiles?.role || 'student',
        message: message.message,
        parentMessageId: message.parent_message_id,
        createdAt: message.created_at,
        updatedAt: message.updated_at
      }));
    } catch (error) {
      console.error('Erro no serviço de mensagens:', error);
      throw error;
    }
  }

  /**
   * Envia uma nova mensagem em um tópico
   */
  async sendMessage(messageData: SendMessageData): Promise<string> {
    try {
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('forum_messages')
          .insert({
            forum_id: messageData.forumId,
            message: messageData.message,
            parent_message_id: messageData.parentMessageId
          })
          .select('id')
          .single();
      });

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Erro no serviço de envio de mensagem:', error);
      throw error;
    }
  }

  /**
   * Busca todos os cursos disponíveis para criação de tópicos (admin)
   */
  async getAllCoursesForAdmin(): Promise<Array<{id: string, title: string, status: string, professor_name?: string}>> {
    try {
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('courses')
          .select(`
            id,
            title,
            status,
            profiles!professor_id (
              name
            )
          `)
          .order('title', { ascending: true });
      });

      if (error) {
        console.error('Erro ao buscar cursos:', error);
        throw error;
      }

      return (data || []).map((course: any) => ({
        id: course.id,
        title: course.title,
        status: course.status || 'draft',
        professor_name: course.profiles?.name
      }));
    } catch (error) {
      console.error('Erro no serviço de cursos:', error);
      throw error;
    }
  }

  /**
   * Busca cursos de um professor específico
   */
  async getCoursesForProfessor(professorId: string): Promise<Array<{id: string, title: string, status: string}>> {
    try {
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('courses')
          .select('id, title, status')
          .eq('professor_id', professorId)
          .order('title', { ascending: true });
      });

      if (error) {
        console.error('Erro ao buscar cursos do professor:', error);
        throw error;
      }

      return (data || []).map((course: any) => ({
        id: course.id,
        title: course.title,
        status: course.status || 'draft'
      }));
    } catch (error) {
      console.error('Erro no serviço de cursos do professor:', error);
      throw error;
    }
  }
}

export const forumService = new ForumService();
export default forumService;