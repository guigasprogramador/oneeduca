import { supabase } from '../lib/supabase';
import { Notification } from '../types/professor';

export const notificationService = {
  // Criar uma nova notificação
  async createNotification(notificationData: {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'course_approved' | 'course_rejected' | 'new_enrollment' | 'quiz_completed';
    relatedId?: string;
    relatedType?: 'course' | 'module' | 'lesson' | 'quiz' | 'forum';
  }): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          related_id: notificationData.relatedId,
          related_type: notificationData.relatedType,
          is_read: false
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar notificação:', error);
        throw new Error('Erro ao criar notificação');
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedId: data.related_id,
        relatedType: data.related_type,
        isRead: data.is_read,
        createdAt: data.created_at,
        readAt: data.read_at
      };
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw new Error('Erro ao criar notificação');
    }
  },

  // Buscar notificações de um usuário
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20): Promise<{
    notifications: Notification[];
    totalCount: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Buscar notificações
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (notificationsError) {
        console.error('Erro ao buscar notificações:', notificationsError);
        throw new Error('Erro ao buscar notificações');
      }

      // Contar total de notificações
      const { count: totalCount, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        console.error('Erro ao contar notificações:', countError);
      }

      // Contar notificações não lidas
      const { count: unreadCount, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (unreadError) {
        console.error('Erro ao contar notificações não lidas:', unreadError);
      }

      const mappedNotifications: Notification[] = (notifications || []).map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        relatedId: notification.related_id,
        relatedType: notification.related_type,
        isRead: notification.is_read,
        createdAt: notification.created_at,
        readAt: notification.read_at
      }));

      const total = totalCount || 0;
      const hasMore = offset + limit < total;

      return {
        notifications: mappedNotifications,
        totalCount: total,
        unreadCount: unreadCount || 0,
        hasMore
      };
    } catch (error) {
      console.error('Erro ao buscar notificações do usuário:', error);
      throw new Error('Erro ao buscar notificações do usuário');
    }
  },

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        throw new Error('Erro ao marcar notificação como lida');
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw new Error('Erro ao marcar notificação como lida');
    }
  },

  // Marcar todas as notificações como lidas
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        throw new Error('Erro ao marcar todas as notificações como lidas');
      }
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      throw new Error('Erro ao marcar todas as notificações como lidas');
    }
  },

  // Deletar notificação
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao deletar notificação:', error);
        throw new Error('Erro ao deletar notificação');
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      throw new Error('Erro ao deletar notificação');
    }
  },

  // Deletar todas as notificações lidas de um usuário
  async deleteReadNotifications(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) {
        console.error('Erro ao deletar notificações lidas:', error);
        throw new Error('Erro ao deletar notificações lidas');
      }
    } catch (error) {
      console.error('Erro ao deletar notificações lidas:', error);
      throw new Error('Erro ao deletar notificações lidas');
    }
  },

  // Buscar contagem de notificações não lidas
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao contar notificações não lidas:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  },

  // Notificações específicas para professores
  async notifyCourseApproval(professorId: string, courseId: string, courseTitle: string, approved: boolean): Promise<void> {
    const title = approved ? 'Curso Aprovado!' : 'Curso Rejeitado';
    const message = approved 
      ? `Seu curso "${courseTitle}" foi aprovado e está disponível para os alunos.`
      : `Seu curso "${courseTitle}" foi rejeitado. Verifique os comentários e faça as correções necessárias.`;
    const type = approved ? 'course_approved' : 'course_rejected';

    await this.createNotification({
      userId: professorId,
      title,
      message,
      type,
      relatedId: courseId,
      relatedType: 'course'
    });
  },

  async notifyNewEnrollment(professorId: string, courseId: string, courseTitle: string, studentName: string): Promise<void> {
    await this.createNotification({
      userId: professorId,
      title: 'Nova Inscrição!',
      message: `${studentName} se inscreveu no seu curso "${courseTitle}".`,
      type: 'new_enrollment',
      relatedId: courseId,
      relatedType: 'course'
    });
  },

  async notifyQuizCompleted(professorId: string, quizId: string, studentName: string, score: number, passed: boolean): Promise<void> {
    const status = passed ? 'aprovado' : 'reprovado';
    await this.createNotification({
      userId: professorId,
      title: 'Quiz Completado',
      message: `${studentName} completou um quiz com ${score}% e foi ${status}.`,
      type: 'quiz_completed',
      relatedId: quizId,
      relatedType: 'quiz'
    });
  },

  // Notificações para administradores
  async notifyNewCourseSubmission(adminId: string, courseId: string, courseTitle: string, professorName: string): Promise<void> {
    await this.createNotification({
      userId: adminId,
      title: 'Novo Curso para Aprovação',
      message: `${professorName} submeteu o curso "${courseTitle}" para aprovação.`,
      type: 'info',
      relatedId: courseId,
      relatedType: 'course'
    });
  },

  // Notificações para estudantes
  async notifyStudentCourseUpdate(studentId: string, courseId: string, courseTitle: string, updateType: string): Promise<void> {
    const messages = {
      'new_module': `Novo módulo adicionado ao curso "${courseTitle}".`,
      'new_lesson': `Nova aula adicionada ao curso "${courseTitle}".`,
      'course_updated': `O curso "${courseTitle}" foi atualizado.`,
      'quiz_available': `Novo quiz disponível no curso "${courseTitle}".`
    };

    await this.createNotification({
      userId: studentId,
      title: 'Atualização do Curso',
      message: messages[updateType as keyof typeof messages] || `Atualização no curso "${courseTitle}".`,
      type: 'info',
      relatedId: courseId,
      relatedType: 'course'
    });
  }
};