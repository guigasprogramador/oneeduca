import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, MessageSquare, Award, Plus, Settings, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TeacherStats {
  totalCourses: number;
  pendingCourses: number;
  approvedCourses: number;
  rejectedCourses: number;
  totalStudents: number;
  pendingQuestions: number;
  answeredQuestions: number;
  certificatesIssued: number;
}

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats>({
    totalCourses: 0,
    pendingCourses: 0,
    approvedCourses: 0,
    rejectedCourses: 0,
    totalStudents: 0,
    pendingQuestions: 0,
    answeredQuestions: 0,
    certificatesIssued: 0
  });
  const [loading, setLoading] = useState(true);
  
  const handleNavigateToCreateCourse = () => {
    navigate("/professor/courses/create");
  };
  
  const handleNavigateToCourses = () => {
    navigate("/professor/courses");
  };
  
  const handleNavigateToForum = () => {
    navigate("/professor/forum");
  };

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Buscar estatísticas dos cursos
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, status, enrollments(id), certificates(id)')
          .eq('professor_id', user.id);

        if (coursesError) {
          console.error('Erro ao carregar cursos:', coursesError);
          toast.error('Erro ao carregar estatísticas dos cursos');
          return;
        }

        // Buscar perguntas do chat
        const { data: forumData, error: forumError } = await supabase
          .from('forum_posts')
          .select('id, status')
          .in('course_id', coursesData?.map(c => c.id) || []);

        if (forumError) {
          console.error('Erro ao carregar chat:', forumError);
        }

        // Calcular estatísticas
        const totalCourses = coursesData?.length || 0;
        const pendingCourses = coursesData?.filter(c => c.status === 'pending').length || 0;
        const approvedCourses = coursesData?.filter(c => c.status === 'approved').length || 0;
        const rejectedCourses = coursesData?.filter(c => c.status === 'rejected').length || 0;
        
        // Contar total de alunos únicos matriculados
        const allEnrollments = coursesData?.flatMap(c => c.enrollments) || [];
        const totalStudents = allEnrollments.length;
        
        // Contar certificados emitidos
        const allCertificates = coursesData?.flatMap(c => c.certificates) || [];
        const certificatesIssued = allCertificates.length;
        
        // Contar perguntas pendentes (assumindo que status 'pending' significa não respondida)
        const pendingQuestions = forumData?.filter(p => p.status === 'pending').length || 0;
        const answeredQuestions = forumData?.filter(p => p.status === 'answered').length || 0;
        
        setStats({
          totalCourses,
          pendingCourses,
          approvedCourses,
          rejectedCourses,
          totalStudents,
          pendingQuestions,
          answeredQuestions,
          certificatesIssued
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        toast.error('Erro ao carregar estatísticas');
        // Manter dados padrão em caso de erro
        setStats({
          totalCourses: 0,
          pendingCourses: 0,
          approvedCourses: 0,
          rejectedCourses: 0,
          totalStudents: 0,
          pendingQuestions: 0,
          answeredQuestions: 0,
          certificatesIssued: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Professor</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.user_metadata?.name || user?.email}!
          </p>
        </div>
        <Button onClick={handleNavigateToCreateCourse} className="bg-primary hover:bg-primary/90">
          <BookOpen className="mr-2 h-4 w-4" />
          Criar Novo Curso
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleNavigateToCourses}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Cursos criados por você
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCourses}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCourses}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para alunos
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Matriculados nos seus cursos
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleNavigateToForum}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perguntas Pendentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingQuestions}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando sua resposta
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificados Emitidos</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificatesIssued}</div>
            <p className="text-xs text-muted-foreground">
              Alunos que concluíram cursos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleNavigateToCreateCourse} 
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Novo Curso
            </Button>
            <Button 
              onClick={handleNavigateToCourses} 
              className="w-full justify-start"
              variant="outline"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Gerenciar Cursos
            </Button>
            <Button 
              onClick={handleNavigateToForum} 
              className="w-full justify-start"
              variant="outline"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Responder Perguntas
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Status dos Cursos
            </CardTitle>
            <CardDescription>
              Visão geral do status dos seus cursos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Clock className="mr-1 h-3 w-3" />
                  Pendentes
                </Badge>
                <span className="text-sm text-muted-foreground">{stats.pendingCourses} cursos</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Aprovados
                </Badge>
                <span className="text-sm text-muted-foreground">{stats.approvedCourses} cursos</span>
              </div>
            </div>
            {stats.rejectedCourses > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    Rejeitados
                  </Badge>
                  <span className="text-sm text-muted-foreground">{stats.rejectedCourses} cursos</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessorDashboard;