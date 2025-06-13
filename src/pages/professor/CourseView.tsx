import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Users, 
  Clock, 
  Star, 
  BookOpen,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import courseService from '@/services/courseService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration: string;
  instructor: string;
  enrolledCount: number;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  createdAt: string;
  updatedAt: string;
  professor_id: string;
}

const CourseView = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      console.log('Carregando curso...', { courseId, user: user?.id });
      const data = await courseService.getCourseById(courseId);
      console.log('Dados do curso carregados:', { professor_id: data?.professor_id, user_id: user?.id, data });
      
      // Verificar se o usuário é o professor do curso
      if (data?.professor_id !== user?.id) {
        console.log('Acesso negado - IDs não coincidem:', { professor_id: data?.professor_id, user_id: user?.id });
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para visualizar este curso.",
          variant: "destructive"
        });
        navigate('/professor/courses/approved');
        return;
      }
      
      setCourse(data);
    } catch (error) {
      console.error('Erro ao carregar curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do curso.",
        variant: "destructive"
      });
      navigate('/professor/courses/approved');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/professor/courses/${courseId}/edit`);
  };

  const handleDelete = async () => {
    if (!courseId) return;
    
    setDeleting(true);
    try {
      await courseService.deleteCourse(courseId);
      toast({
        title: "Sucesso",
        description: "Curso deletado com sucesso."
      });
      navigate('/professor/courses/approved');
    } catch (error) {
      console.error('Erro ao deletar curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar curso.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: 'Aprovado', variant: 'default' as const },
      pending: { label: 'Pendente', variant: 'secondary' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
      draft: { label: 'Rascunho', variant: 'outline' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando curso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Curso não encontrado</h2>
          <Button onClick={() => navigate('/professor/courses/approved')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Cursos Aprovados
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/professor/courses/approved')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground">Visualização do Curso</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirmar Exclusão
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar o curso "{course.title}"? 
                  Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Deletando...' : 'Deletar Curso'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Course Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Informações do Curso
                </CardTitle>
                {getStatusBadge(course.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {course.description || 'Nenhuma descrição disponível.'}
                </p>
              </div>
              
              {course.thumbnail && (
                <div>
                  <h3 className="font-semibold mb-2">Thumbnail</h3>
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{course.enrolledCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Alunos Inscritos</p>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{course.rating || 0}</p>
                  <p className="text-sm text-muted-foreground">Avaliação</p>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{course.duration || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Duração</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Instrutor</p>
                  <p className="font-medium">{course.instructor || 'Não informado'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">{formatDate(course.createdAt)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Última atualização</p>
                  <p className="font-medium">{formatDate(course.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/professor/courses/${courseId}/modules`)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Gerenciar Módulos
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/professor/courses/${courseId}/analytics`)}
              >
                <Users className="mr-2 h-4 w-4" />
                Ver Analytics
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/professor/courses/${courseId}/students`)}
              >
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Alunos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseView;