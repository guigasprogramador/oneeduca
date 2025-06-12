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
import { BookOpen, Plus, Search, Edit, Trash2, List, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  description?: string;
  order_number: number;
  created_at: string;
  updated_at: string;
  lessons_count?: number;
  course?: {
    title: string;
    status: string;
  };
}

const ProfessorModules = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    order_number: 1
  });

  useEffect(() => {
    if (user) {
      loadCourses();
      loadModules();
    }
  }, [user]);

  useEffect(() => {
    filterModules();
  }, [modules, searchTerm, selectedCourseId]);

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
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('modules')
        .select(`
          *,
          course:courses!inner(
            title,
            status,
            professor_id
          ),
          lessons_count:lessons(count)
        `)
        .eq('course.professor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar módulos:', error);
        toast.error('Erro ao carregar módulos');
      } else {
        const modulesWithCount = (data || []).map(module => ({
          ...module,
          lessons_count: module.lessons_count?.[0]?.count || 0
        }));
        setModules(modulesWithCount);
      }
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      toast.error('Erro ao carregar módulos');
    } finally {
      setIsLoading(false);
    }
  };

  const filterModules = () => {
    let filtered = modules;

    // Filtro por curso
    if (selectedCourseId !== 'all') {
      filtered = filtered.filter(module => module.course_id === selectedCourseId);
    }

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(module => 
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredModules(filtered);
  };

  const handleCreateModule = () => {
    setEditingModule(null);
    setFormData({
      course_id: selectedCourseId !== 'all' ? selectedCourseId : '',
      title: '',
      description: '',
      order_number: modules.filter(m => selectedCourseId === 'all' || m.course_id === selectedCourseId).length + 1
    });
    setIsDialogOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setFormData({
      course_id: module.course_id,
      title: module.title,
      description: module.description || '',
      order_number: module.order_number
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.course_id) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingModule) {
        // Atualizar módulo existente
        const { error } = await supabase
          .from('modules')
          .update({
            title: formData.title,
            description: formData.description,
            order_number: formData.order_number,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingModule.id);

        if (error) throw error;
        toast.success('Módulo atualizado com sucesso!');
      } else {
        // Criar novo módulo
        const { error } = await supabase
          .from('modules')
          .insert({
            course_id: formData.course_id,
            title: formData.title,
            description: formData.description,
            order_number: formData.order_number
          });

        if (error) throw error;
        toast.success('Módulo criado com sucesso!');
      }

      setIsDialogOpen(false);
      loadModules();
    } catch (error: any) {
      console.error('Erro ao salvar módulo:', error);
      toast.error(error.message || 'Erro ao salvar módulo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este módulo? Todas as aulas serão removidas também.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
      
      toast.success('Módulo excluído com sucesso!');
      loadModules();
    } catch (error: any) {
      console.error('Erro ao excluir módulo:', error);
      toast.error('Erro ao excluir módulo');
    }
  };

  const canEdit = (module: Module) => {
    return module.course?.status === 'draft' || module.course?.status === 'rejected';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meus Módulos</h1>
          <p className="text-muted-foreground">Gerencie os módulos dos seus cursos</p>
        </div>
        <Button onClick={handleCreateModule} className="flex items-center gap-2">
          <Plus size={16} />
          Novo Módulo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
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
      </div>

      {/* Lista de módulos */}
      {filteredModules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum módulo encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedCourseId !== 'all' 
                ? 'Tente ajustar os filtros para encontrar módulos.'
                : 'Comece criando seu primeiro módulo.'}
            </p>
            {!searchTerm && selectedCourseId === 'all' && (
              <Button onClick={handleCreateModule} className="flex items-center gap-2">
                <Plus size={16} />
                Criar Primeiro Módulo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => (
            <Card key={module.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {module.course?.title}
                    </CardDescription>
                  </div>
                  {getStatusBadge(module.course?.status || 'draft')}
                </div>
              </CardHeader>
              <CardContent>
                {module.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {module.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <List size={14} />
                    {module.lessons_count || 0} aulas
                  </span>
                  <span>Ordem: {module.order_number}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/professor/lessons?module=${module.id}`)}
                    className="flex-1"
                  >
                    <Eye size={14} className="mr-1" />
                    Ver Aulas
                  </Button>
                  {canEdit(module) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditModule(module)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteModule(module.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar módulo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course_id">Curso *</Label>
              <Select
                value={formData.course_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, course_id: value }))}
                disabled={!!editingModule}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.filter(course => course.status === 'draft' || course.status === 'rejected').map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
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
                placeholder="Digite o título do módulo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite a descrição do módulo"
                rows={3}
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
                placeholder="Ordem do módulo"
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
                {isSubmitting ? 'Salvando...' : editingModule ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorModules;