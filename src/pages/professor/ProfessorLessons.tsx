import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Play, Plus, Search, Edit, Trash2, Clock, Eye, FileText } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  status: string;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  course?: {
    title: string;
    status: string;
  };
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content?: string;
  duration?: string;
  video_url?: string;
  order_number: number;
  created_at: string;
  updated_at: string;
  module?: {
    title: string;
    course?: {
      title: string;
      status: string;
    };
  };
}

const ProfessorLessons = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedModuleId, setSelectedModuleId] = useState(searchParams.get('module') || 'all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    module_id: '',
    title: '',
    description: '',
    content: '',
    duration: '',
    video_url: '',
    order_number: 1
  });

  useEffect(() => {
    if (user) {
      loadCourses();
      loadModules();
      loadLessons();
    }
  }, [user]);

  useEffect(() => {
    filterLessons();
  }, [lessons, searchTerm, selectedCourseId, selectedModuleId]);

  useEffect(() => {
    // Se um módulo específico foi passado na URL, selecionar o curso correspondente
    if (selectedModuleId !== 'all') {
      const module = modules.find(m => m.id === selectedModuleId);
      if (module) {
        setSelectedCourseId(module.course_id);
      }
    }
  }, [modules, selectedModuleId]);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, status')
        .eq('professor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar cursos:', error);
        toast.error('Erro ao carregar cursos');
      } else {
        setCourses(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      toast.error('Erro ao carregar cursos');
    }
  };

  const loadModules = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          course:courses!inner(
            title,
            status,
            professor_id
          )
        `)
        .eq('course.professor_id', user?.id)
        .order('order_number', { ascending: true });

      if (error) {
        console.error('Erro ao carregar módulos:', error);
        toast.error('Erro ao carregar módulos');
      } else {
        setModules(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      toast.error('Erro ao carregar módulos');
    }
  };

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          module:modules!inner(
            title,
            course:courses!inner(
              title,
              status,
              professor_id
            )
          )
        `)
        .eq('module.course.professor_id', user?.id)
        .order('order_number', { ascending: true });

      if (error) {
        console.error('Erro ao carregar aulas:', error);
        toast.error('Erro ao carregar aulas');
      } else {
        setLessons(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar aulas:', error);
      toast.error('Erro ao carregar aulas');
    } finally {
      setIsLoading(false);
    }
  };

  const filterLessons = () => {
    let filtered = lessons;

    // Filtro por módulo
    if (selectedModuleId !== 'all') {
      filtered = filtered.filter(lesson => lesson.module_id === selectedModuleId);
    }

    // Filtro por curso (se módulo não estiver selecionado)
    if (selectedCourseId !== 'all' && selectedModuleId === 'all') {
      const courseModules = modules.filter(m => m.course_id === selectedCourseId);
      const moduleIds = courseModules.map(m => m.id);
      filtered = filtered.filter(lesson => moduleIds.includes(lesson.module_id));
    }

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(lesson => 
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLessons(filtered);
  };

  const getAvailableModules = () => {
    if (selectedCourseId === 'all') {
      return modules;
    }
    return modules.filter(module => module.course_id === selectedCourseId);
  };

  const handleCreateLesson = () => {
    setEditingLesson(null);
    const availableModules = getAvailableModules();
    const defaultModuleId = selectedModuleId !== 'all' ? selectedModuleId : 
                           availableModules.length > 0 ? availableModules[0].id : '';
    
    const moduleForCount = defaultModuleId ? 
      lessons.filter(l => l.module_id === defaultModuleId).length + 1 : 1;
    
    setFormData({
      module_id: defaultModuleId,
      title: '',
      description: '',
      content: '',
      duration: '',
      video_url: '',
      order_number: moduleForCount
    });
    setIsDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      module_id: lesson.module_id,
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      duration: lesson.duration || '',
      video_url: lesson.video_url || '',
      order_number: lesson.order_number
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.module_id) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingLesson) {
        // Atualizar aula existente
        const { error } = await supabase
          .from('lessons')
          .update({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            duration: formData.duration,
            video_url: formData.video_url,
            order_number: formData.order_number,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast.success('Aula atualizada com sucesso!');
      } else {
        // Criar nova aula
        const { error } = await supabase
          .from('lessons')
          .insert({
            module_id: formData.module_id,
            title: formData.title,
            description: formData.description,
            content: formData.content,
            duration: formData.duration,
            video_url: formData.video_url,
            order_number: formData.order_number
          });

        if (error) throw error;
        toast.success('Aula criada com sucesso!');
      }

      setIsDialogOpen(false);
      loadLessons();
    } catch (error: any) {
      console.error('Erro ao salvar aula:', error);
      toast.error(error.message || 'Erro ao salvar aula');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      
      toast.success('Aula excluída com sucesso!');
      loadLessons();
    } catch (error: any) {
      console.error('Erro ao excluir aula:', error);
      toast.error('Erro ao excluir aula');
    }
  };

  const canEdit = (lesson: Lesson) => {
    return lesson.module?.course?.status === 'draft' || lesson.module?.course?.status === 'rejected';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      pending: { label: 'Pendente', variant: 'default' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return 'Não definida';
    return duration.includes(':') ? duration : `${duration} min`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando aulas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minhas Aulas</h1>
          <p className="text-muted-foreground">Gerencie as aulas dos seus módulos</p>
        </div>
        <Button onClick={handleCreateLesson} className="flex items-center gap-2">
          <Plus size={16} />
          Nova Aula
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Buscar aulas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCourseId} onValueChange={(value) => {
          setSelectedCourseId(value);
          if (value !== 'all') {
            setSelectedModuleId('all');
          }
        }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cursos</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {getAvailableModules().map((module) => (
              <SelectItem key={module.id} value={module.id}>
                {module.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de aulas */}
      {filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Play className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma aula encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedCourseId !== 'all' || selectedModuleId !== 'all'
                ? 'Tente ajustar os filtros para encontrar aulas.'
                : 'Comece criando sua primeira aula.'}
            </p>
            {!searchTerm && selectedCourseId === 'all' && selectedModuleId === 'all' && (
              <Button onClick={handleCreateLesson} className="flex items-center gap-2">
                <Plus size={16} />
                Criar Primeira Aula
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {lesson.module?.title} • {lesson.module?.course?.title}
                    </CardDescription>
                  </div>
                  {getStatusBadge(lesson.module?.course?.status || 'draft')}
                </div>
              </CardHeader>
              <CardContent>
                {lesson.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {lesson.description}
                  </p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDuration(lesson.duration)}
                    </span>
                    <span>Ordem: {lesson.order_number}</span>
                  </div>
                  
                  {lesson.video_url && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Play size={14} />
                      <span>Vídeo disponível</span>
                    </div>
                  )}
                  
                  {lesson.content && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText size={14} />
                      <span>Conteúdo disponível</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {canEdit(lesson) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLesson(lesson)}
                        className="flex-1"
                      >
                        <Edit size={14} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                  {!canEdit(lesson) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled
                    >
                      <Eye size={14} className="mr-1" />
                      Visualizar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar aula */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Editar Aula' : 'Nova Aula'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="module_id">Módulo *</Label>
              <Select
                value={formData.module_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value }))}
                disabled={!!editingLesson}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um módulo" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableModules().filter(module => 
                    module.course?.status === 'draft' || module.course?.status === 'rejected'
                  ).map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title} ({module.course?.title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título da aula"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite a descrição da aula"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Ex: 30 min ou 00:30:00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_number">Ordem</Label>
                <Input
                  id="order_number"
                  type="number"
                  min="1"
                  value={formData.order_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_number: parseInt(e.target.value) || 1 }))}
                  placeholder="Ordem da aula"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">URL do Vídeo</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo da Aula</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Digite o conteúdo detalhado da aula"
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : editingLesson ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorLessons;