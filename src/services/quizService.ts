import { supabase } from '@/integrations/supabase/client';
import { QuizData, QuizQuestion, QuizResponse } from '../types/professor';

export const quizService = {
  // Criar um novo quiz para um módulo
  async createQuiz(moduleId: string, quizData: QuizData): Promise<QuizData> {
    try {
      // Primeiro, verificar se o módulo existe
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('id', moduleId)
        .single();

      if (moduleError) {
        console.error('Erro ao verificar módulo:', moduleError);
        throw new Error('Módulo não encontrado');
      }

      // Preparar os dados do quiz para armazenar no formato JSONB
      const quizDataForStorage = {
        title: quizData.title,
        description: quizData.description,
        questions: quizData.questions,
        passingScore: quizData.passingScore,
        timeLimit: quizData.timeLimit,
        maxAttempts: quizData.maxAttempts
      };

      // Atualizar o módulo com os dados do quiz
      const { data, error } = await supabase
        .from('modules')
        .update({
          has_quiz: true,
          quiz_data: quizDataForStorage
        })
        .eq('id', moduleId)
        .select('id, quiz_data')
        .single();

      if (error) {
        console.error('Erro ao criar quiz:', error);
        throw new Error('Erro ao criar quiz');
      }

      // Retornar os dados do quiz
      return {
        id: data.id, // Usando o ID do módulo como ID do quiz
        title: quizData.title,
        description: quizData.description || '',
        questions: quizData.questions || [],
        passingScore: quizData.passingScore,
        timeLimit: quizData.timeLimit,
        maxAttempts: quizData.maxAttempts,
        isActive: true,
        createdAt: null,
        updatedAt: null
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
        .from('modules')
        .select('id, quiz_data, has_quiz')
        .eq('id', moduleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Módulo não encontrado
        }
        console.error('Erro ao buscar módulo:', error);
        throw new Error('Erro ao buscar quiz');
      }

      // Verificar se o módulo tem quiz
      if (!data.has_quiz || !data.quiz_data) {
        return null; // Módulo não tem quiz
      }

      // Converter o JSON armazenado para objeto
      const quizData = typeof data.quiz_data === 'string' 
        ? JSON.parse(data.quiz_data) 
        : data.quiz_data;

      return {
        id: data.id, // Usando o ID do módulo como ID do quiz
        title: quizData.title || 'Quiz',
        description: quizData.description || '',
        questions: quizData.questions || [],
        passingScore: quizData.passingScore || 70,
        timeLimit: quizData.timeLimit,
        maxAttempts: quizData.maxAttempts,
        isActive: true,
        createdAt: null,
        updatedAt: null
      };
    } catch (error) {
      console.error('Erro ao buscar quiz:', error);
      throw new Error('Erro ao buscar quiz');
    }
  },

  // Atualizar quiz
  async updateQuiz(moduleId: string, quizData: Partial<QuizData>): Promise<QuizData> {
    try {
      // Primeiro, buscar os dados atuais do quiz
      const { data: currentModule, error: fetchError } = await supabase
        .from('modules')
        .select('quiz_data')
        .eq('id', moduleId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar módulo:', fetchError);
        throw new Error('Módulo não encontrado');
      }

      // Combinar dados existentes com novos dados
      const currentQuizData = currentModule.quiz_data ? 
        (typeof currentModule.quiz_data === 'string' ? JSON.parse(currentModule.quiz_data) : currentModule.quiz_data) 
        : {};

      const updatedQuizData = {
        ...currentQuizData,
        ...(quizData.title && { title: quizData.title }),
        ...(quizData.description !== undefined && { description: quizData.description }),
        ...(quizData.questions && { questions: quizData.questions }),
        ...(quizData.passingScore !== undefined && { passingScore: quizData.passingScore }),
        ...(quizData.timeLimit !== undefined && { timeLimit: quizData.timeLimit }),
        ...(quizData.maxAttempts !== undefined && { maxAttempts: quizData.maxAttempts })
      };

      const { data, error } = await supabase
        .from('modules')
        .update({
          quiz_data: updatedQuizData,
          has_quiz: true
        })
        .eq('id', moduleId)
        .select('id, quiz_data')
        .single();

      if (error) {
        console.error('Erro ao atualizar quiz:', error);
        throw new Error('Erro ao atualizar quiz');
      }

      const finalQuizData = typeof data.quiz_data === 'string' ? JSON.parse(data.quiz_data) : data.quiz_data;

      return {
        id: data.id,
        title: finalQuizData.title || 'Quiz',
        description: finalQuizData.description || '',
        questions: finalQuizData.questions || [],
        passingScore: finalQuizData.passingScore || 70,
        timeLimit: finalQuizData.timeLimit,
        maxAttempts: finalQuizData.maxAttempts,
        isActive: true,
        createdAt: null,
        updatedAt: null
      };
    } catch (error) {
      console.error('Erro ao atualizar quiz:', error);
      throw new Error('Erro ao atualizar quiz');
    }
  },

  // Deletar quiz
  async deleteQuiz(moduleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('modules')
        .update({
          has_quiz: false,
          quiz_data: null
        })
        .eq('id', moduleId);

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
  async submitQuizResponse(moduleId: string, userId: string, responses: QuizResponse[]): Promise<{ score: number; attemptId: string }> {
    try {
      // Buscar o quiz para calcular a pontuação
      const { data: module, error: quizError } = await supabase
        .from('modules')
        .select('quiz_data, has_quiz')
        .eq('id', moduleId)
        .single();

      if (quizError || !module.has_quiz || !module.quiz_data) {
        console.error('Erro ao buscar quiz:', quizError);
        throw new Error('Quiz não encontrado');
      }

      const quiz = typeof module.quiz_data === 'string' ? JSON.parse(module.quiz_data) : module.quiz_data;

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
      const passed = score >= (quiz.passingScore || 70);

      // Salvar tentativa na tabela quiz_responses (upsert para permitir retentativas)
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_responses')
        .upsert({
          module_id: moduleId,
          user_id: userId,
          responses: responses,
          score: score,
          max_score: questions.length * 100,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_id'
        })
        .select('*')
        .single();

      if (attemptError) {
        console.error('Erro ao salvar tentativa:', attemptError);
        throw new Error('Erro ao salvar tentativa do quiz');
      }

      return {
        score,
        attemptId: attempt.id
      };
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
      throw new Error('Erro ao submeter quiz');
    }
  },

  // Buscar tentativas de um usuário para um quiz
  async getUserQuizAttempts(moduleId: string, userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('module_id', moduleId)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

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
  async getQuizAttempts(moduleId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select(`
          *,
          profiles(id, name)
        `)
        .eq('module_id', moduleId)
        .order('completed_at', { ascending: false });

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
  async getQuizStats(moduleId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    completionRate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('score')
        .eq('module_id', moduleId);

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
      const passedAttempts = attempts.filter(attempt => attempt.score >= 70).length;
      
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