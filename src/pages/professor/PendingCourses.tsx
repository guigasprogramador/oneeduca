import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Users, Clock, Edit, Eye, Search, Filter, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import courseService from '@/services/courseService';

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
}

const PendingCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm]);

  const loadCourses = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await courseService.getCoursesByProfessor(user.id);
      // Filtrar apenas cursos pendentes
      const pendingCourses = data.filter(course => course.status === 'pending');
      setCourses(pendingCourses);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar cursos pendentes.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;
    
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCourses(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Clock className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Carregando cursos pendentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cursos Pendentes</h1>
          <p className="text-muted-foreground">
            Cursos aguardando aprovação da administração
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/professor/courses/create')}>
            <BookOpen className="mr-2 h-4 w-4" />
            Criar Novo Curso
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Cursos */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum curso pendente encontrado</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca' 
                  : 'Você não possui cursos aguardando aprovação no momento'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {getStatusBadge(course.status)}
                      <CardTitle className="mt-2 text-lg line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-3">
                        {course.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{course.enrolledCount} alunos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Criado em: {formatDate(course.createdAt)}</p>
                      {course.updatedAt !== course.createdAt && (
                        <p>Atualizado em: {formatDate(course.updatedAt)}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/professor/courses/${course.id}/view`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/professor/courses/${course.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingCourses;