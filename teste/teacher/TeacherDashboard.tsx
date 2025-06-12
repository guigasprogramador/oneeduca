import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, MessageSquare, Award, Plus, Settings, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { teacherService } from '@/services';
import { TeacherStats } from '@/types/user';

const TeacherDashboard = () => {
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
    navigate("/teacher/courses/create");
  };
  
  const handleNavigateToCourses = () => {
    navigate("/teacher/courses");
  };
  
  const handleNavigateToForum = () => {
    navigate("/teacher/forum");
  };

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      
      try {
        const teacherStats = await teacherService.getTeacherStats(user.id);
        setStats(teacherStats);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Manter dados padrão em caso de erro
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
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingCourses}</div>
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
            <div className="text-2xl font-bold text-green-600">{stats.approvedCourses}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis no catálogo
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
              Inscritos em seus cursos
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleNavigateToForum}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perguntas Pendentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.answeredQuestions} respondidas
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificados Emitidos</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.certificatesIssued}</div>
            <p className="text-xs text-muted-foreground">
              Para alunos concluintes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={handleNavigateToCreateCourse}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Criar Novo Curso
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={handleNavigateToCourses}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Gerenciar Cursos
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={handleNavigateToForum}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Responder Perguntas
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo da Atividade</CardTitle>
            <CardDescription>
              Suas estatísticas como professor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de Aprovação</span>
                <span className="text-sm text-green-600 font-bold">60%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avaliação Média</span>
                <span className="text-sm text-yellow-600 font-bold">4.5/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tempo de Resposta</span>
                <span className="text-sm text-blue-600 font-bold">2h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;