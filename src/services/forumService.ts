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
   * Busca todos os tópicos do chat para administradores (incluindo cursos não publicados)
   */
  async getAllTopicsForAdmin(): Promise<ForumTopic[]> {
    try {
      // Consulta simplificada sem relacionamentos explícitos para evitar erros 400
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('course_forums')
          .select('*')
          .order('updated_at', { ascending: false });
      });

      if (error) {
        console.error('Erro ao buscar tópicos do chat:', error);
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

          // Obter informações do curso e do usuário de forma isolada
          const { data: course } = await supabase
            .from('courses')
            .select('title, status')
            .eq('id', topic.course_id)
            .single();

          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', topic.created_by)
            .single();

          return {
            id: topic.id,
            title: topic.title,
            description: topic.description,
            courseId: topic.course_id,
            courseName: course?.title || 'Curso não encontrado',
            courseStatus: course?.status || 'unknown',
            createdBy: topic.created_by,
            createdByName: profile?.name || 'Usuário não encontrado',
            createdAt: topic.created_at,
            updatedAt: topic.updated_at,
            messagesCount: count || 0,
            lastActivity: lastMessage?.created_at || topic.updated_at
          };
        })
      );

      return topicsWithCounts;
    } catch (error) {
      console.error('Erro no serviço de chat:', error);
      throw error;
    }
  }

  /**
   * Busca tópicos do chat para professores (apenas seus cursos)
   */
  async getTopicsForProfessor(professorId: string): Promise<ForumTopic[]> {
    try {
      // Primeiro, obter todos os cursos do professor
      const { data: professorCourses, error: courseError } = await supabase
        .from('courses')
        .select('id, title, status')
        .eq('professor_id', professorId);

      if (courseError) {
        console.error('Erro ao buscar cursos do professor:', courseError);
        throw courseError;
      }

      const courseIds = (professorCourses || []).map(c => c.id);

      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('course_forums')
          .select('*')
          .in('course_id', courseIds)
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

          const course = professorCourses?.find(c => c.id === topic.course_id);

          return {
            id: topic.id,
            title: topic.title,
            description: topic.description,
            courseId: topic.course_id,
            courseName: course?.title || 'Curso não encontrado',
            courseStatus: course?.status || 'unknown',
            createdBy: topic.created_by,
            createdByName: 'Usuário', // nome não crítico nessa listagem
            createdAt: topic.created_at,
            updatedAt: topic.updated_at,
            messagesCount: count || 0,
            lastActivity: lastMessage?.created_at || topic.updated_at
          };
        })
      );

      return topicsWithCounts;
    } catch (error) {
      console.error('Erro no serviço de chat do professor:', error);
      throw error;
    }
  }

  /**
   * Cria um novo tópico no chat
   */
  async createTopic(topicData: CreateForumTopicData): Promise<string> {
    try {
      console.log('Dados recebidos no createTopic:', topicData);
      
      // Obter usuário atual para preencher created_by conforme política RLS
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      console.log('Usuário autenticado:', user.id);

      const insertData = {
        title: topicData.title,
        description: topicData.description,
        course_id: topicData.courseId,
        created_by: user.id
      };
      
      console.log('Dados para inserção no banco:', insertData);
      
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('course_forums')
          .insert(insertData)
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
      // Buscar mensagens sem join
      const { data: messages, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('forum_messages')
          .select(`
            id,
            forum_id,
            user_id,
            message,
            parent_message_id,
            created_at,
            updated_at
          `)
          .eq('forum_id', forumId)
          .order('created_at', { ascending: true });
      });

      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        throw error;
      }

      // Buscar dados dos usuários separadamente
      const userIds = [...new Set((messages || []).map((msg: any) => msg.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, role')
        .in('id', userIds);

      // Mapear mensagens com dados dos usuários
      return (messages || []).map((message: any) => {
        const profile = profiles?.find(p => p.id === message.user_id);
        return {
          id: message.id,
          forumId: message.forum_id,
          userId: message.user_id,
          userName: profile?.name || 'Usuário não encontrado',
          userRole: profile?.role || 'student',
          message: message.message,
          parentMessageId: message.parent_message_id,
          createdAt: message.created_at,
          updatedAt: message.updated_at
        };
      });
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
      console.log('Dados recebidos no sendMessage:', messageData);
      
      // Obter usuário atual para preencher user_id conforme política RLS
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      const insertData = {
        forum_id: messageData.forumId,
        user_id: user.id,
        message: messageData.message,
        parent_message_id: messageData.parentMessageId
      };
      
      console.log('Dados para inserção no banco:', insertData);
      
      const { data, error } = await requestQueue.enqueue(async () => {
        return await supabase
          .from('forum_messages')
          .insert(insertData)
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
            professor_id
          `)
          .order('title', { ascending: true });
      });

      if (error) {
        console.error('Erro ao buscar cursos:', error);
        throw error;
      }

      // Buscar dados dos professores separadamente
      const professorIds = [...new Set((data || []).map((course: any) => course.professor_id).filter(Boolean))];
      const { data: professors } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', professorIds);

      return (data || []).map((course: any) => {
        const professor = professors?.find(p => p.id === course.professor_id);
        return {
          id: course.id,
          title: course.title,
          status: course.status || 'draft',
          professor_name: professor?.name || 'Professor não encontrado'
        };
      });
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