import { supabase } from '../lib/supabase';
import { QuizData, QuizQuestion, QuizResponse } from '../types/professor';

export const quizService = {
  // Criar um novo quiz para um módulo
  async createQuiz(moduleId: string, quizData: QuizData): Promise<QuizData> {
    try {
      const { data, error } = await supabase
        .from('module_quizzes')
        .insert({
          module_id: moduleId,
          title: quizData.title,
          description: quizData.description,
          questions: quizData.questions,
          passing_score: quizData.passingScore,
          time_limit: quizData.timeLimit,
          max_attempts: quizData.maxAttempts,
          is_active: quizData.isActive
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar quiz:', error);
        throw new Error('Erro ao criar quiz');
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        questions: data.questions || [],
        passingScore: data.passing_score,
        timeLimit: data.time_limit,
        maxAttempts: data.max_attempts,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao criar quiz:', error);
      throw new Error('Erro ao criar quiz');
    }
  },

  // Buscar quiz por ID do módulo
  async getQuizByModuleId(moduleId: string): Promise<QuizData | null> {
    try {
      const { data, error } = await supabase
        .from('module_quizzes')
        .select('*')
        .eq('module_id', moduleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Quiz não encontrado
        }
        console.error('Erro ao buscar quiz:', error);
        throw new Error('Erro ao buscar quiz');
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        questions: data.questions || [],
        passingScore: data.passing_score,
        timeLimit: data.time_limit,
        maxAttempts: data.max_attempts,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao buscar quiz:', error);
      throw new Error('Erro ao buscar quiz');
    }
  },

  // Atualizar quiz
  async updateQuiz(quizId: string, quizData: Partial<QuizData>): Promise<QuizData> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (quizData.title) updateData.title = quizData.title;
      if (quizData.description !== undefined) updateData.description = quizData.description;
      if (quizData.questions) updateData.questions = quizData.questions;
      if (quizData.passingScore !== undefined) updateData.passing_score = quizData.passingScore;
      if (quizData.timeLimit !== undefined) updateData.time_limit = quizData.timeLimit;
      if (quizData.maxAttempts !== undefined) updateData.max_attempts = quizData.maxAttempts;
      if (quizData.isActive !== undefined) updateData.is_active = quizData.isActive;

      const { data, error } = await supabase
        .from('module_quizzes')
        .update(updateData)
        .eq('id', quizId)
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao atualizar quiz:', error);
        throw new Error('Erro ao atualizar quiz');
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        questions: data.questions || [],
        passingScore: data.passing_score,
        timeLimit: data.time_limit,
        maxAttempts: data.max_attempts,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao atualizar quiz:', error);
      throw new Error('Erro ao atualizar quiz');
    }
  },

  // Deletar quiz
  async deleteQuiz(quizId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('module_quizzes')
        .delete()
        .eq('id', quizId);

      if (error) {
        console.error('Erro ao deletar quiz:', error);
        throw new Error('Erro ao deletar quiz');
      }
    } catch (error) {
      console.error('Erro ao deletar quiz:', error);
      throw new Error('Erro ao deletar quiz');
    }
  },

  // Submeter resposta do quiz
  async submitQuizResponse(quizId: string, userId: string, responses: QuizResponse[]): Promise<{ score: number; passed: boolean; attemptId: string }> {
    try {
      // Buscar o quiz para calcular a pontuação
      const { data: quiz, error: quizError } = await supabase
        .from('module_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) {
        console.error('Erro ao buscar quiz:', quizError);
        throw new Error('Quiz não encontrado');
      }

      // Calcular pontuação
      const questions: QuizQuestion[] = quiz.questions || [];
      let correctAnswers = 0;

      responses.forEach(response => {
        const question = questions.find(q => q.id === response.questionId);
        if (question && question.correctAnswer === response.selectedAnswer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / questions.length) * 100);
      const passed = score >= quiz.passing_score;

      // Salvar tentativa
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: userId,
          responses: responses,
          score: score,
          passed: passed,
          completed_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (attemptError) {
        console.error('Erro ao salvar tentativa:', attemptError);
        throw new Error('Erro ao salvar tentativa do quiz');
      }

      return {
        score,
        passed,
        attemptId: attempt.id
      };
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
      throw new Error('Erro ao submeter quiz');
    }
  },

  // Buscar tentativas de um usuário para um quiz
  async getUserQuizAttempts(quizId: string, userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tentativas:', error);
        throw new Error('Erro ao buscar tentativas');
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar tentativas:', error);
      throw new Error('Erro ao buscar tentativas');
    }
  },

  // Buscar todas as tentativas de um quiz (para professores)
  async getQuizAttempts(quizId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          users(id, name, email)
        `)
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tentativas do quiz:', error);
        throw new Error('Erro ao buscar tentativas do quiz');
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar tentativas do quiz:', error);
      throw new Error('Erro ao buscar tentativas do quiz');
    }
  },

  // Buscar estatísticas do quiz
  async getQuizStats(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    completionRate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('score, passed')
        .eq('quiz_id', quizId);

      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        throw new Error('Erro ao buscar estatísticas');
      }

      const attempts = data || [];
      const totalAttempts = attempts.length;
      
      if (totalAttempts === 0) {
        return {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
          completionRate: 0
        };
      }

      const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
      const passedAttempts = attempts.filter(attempt => attempt.passed).length;
      
      return {
        totalAttempts,
        averageScore: Math.round(totalScore / totalAttempts),
        passRate: Math.round((passedAttempts / totalAttempts) * 100),
        completionRate: 100 // Assumindo que todas as tentativas foram completadas
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      throw new Error('Erro ao calcular estatísticas');
    }
  }
};