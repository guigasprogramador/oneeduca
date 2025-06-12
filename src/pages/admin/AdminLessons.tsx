import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { lessonService, moduleService, courseService } from "@/services/api";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Edit, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const defaultFormData = {
  title: "",
  description: "",
  duration: "",
  order: 1,
  videoUrl: "",
  content: "",
  moduleId: "",
};

const AdminLessons = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const moduleIdFromUrl = queryParams.get("moduleId") || "";
  const courseIdFromUrl = queryParams.get("courseId") || "";

  const [lessons, setLessons] = useState([]);
  const [module, setModule] = useState(null);
  const [allModules, setAllModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdFromUrl);
  const [selectedModuleId, setSelectedModuleId] = useState(moduleIdFromUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [editingLessonId, setEditingLessonId] = useState(null);

  // Carregar todos os cursos - otimizado para carregar mais rápido
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        // Usando o Supabase diretamente para uma consulta mais rápida
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .order('title');
        
        if (error) throw error;
        
        setCourses(data || []);
        console.log('Cursos carregados:', data?.length || 0, 'cursos');
      } catch (error) {
        console.error('Erro ao carregar cursos:', error);
        toast.error('Erro ao carregar cursos');
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, []);
  
  // Carregar módulos do curso selecionado - otimizado
  useEffect(() => {
    const fetchModulesByCourse = async () => {
      if (!selectedCourseId) {
        setFilteredModules([]);
        return;
      }
      
      setIsLoading(true);
      try {
        // Consulta direta ao Supabase para módulos do curso selecionado
        const { data, error } = await supabase
          .from('modules')
          .select('id, title, course_id, order_number')
          .eq('course_id', selectedCourseId)
          .order('order_number');
        
        if (error) throw error;
        
        // Mapear para o formato esperado
        const modules = (data || []).map(m => ({
          id: m.id,
          title: m.title,
          courseId: m.course_id,
          order: m.order_number
        }));
        
        setFilteredModules(modules);
        console.log('Módulos filtrados:', modules.length, 'para o curso', selectedCourseId);
        
        // Se temos módulos e nenhum está selecionado, selecionamos o primeiro
        if (modules.length > 0 && !selectedModuleId) {
          setSelectedModuleId(modules[0].id);
          fetchModuleAndLessons(modules[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar módulos do curso:', error);
        toast.error('Erro ao carregar módulos');
        setFilteredModules([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchModulesByCourse();
  }, [selectedCourseId]);

  // Este useEffect foi removido pois a funcionalidade foi movida para o fetchModulesByCourse acima
  
  // Quando o módulo selecionado muda, carregamos suas aulas
  useEffect(() => {
    if (selectedModuleId) {
      fetchModuleAndLessons(selectedModuleId);
    } else {
      setLessons([]);
      setModule(null);
    }
  }, [selectedModuleId]);

  const fetchModuleAndLessons = async (moduleId) => {
    if (!moduleId) return;
    
    setIsLoading(true);
    try {
      // Buscar informações do módulo diretamente do Supabase
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('id, title, description, course_id, order_number')
        .eq('id', moduleId)
        .single();
      
      if (moduleError) throw moduleError;
      
      // Mapear para o formato esperado
      const mod = moduleData ? {
        id: moduleData.id,
        title: moduleData.title,
        description: moduleData.description || '',
        courseId: moduleData.course_id,
        order: moduleData.order_number
      } : null;
      
      setModule(mod);
      
      // Buscar aulas diretamente do Supabase para melhor performance
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, description, video_url, content, order_number, module_id, duration')
        .eq('module_id', moduleId)
        .order('order_number');
      
      if (lessonsError) throw lessonsError;
      
      // Mapear para o formato esperado
      const lessons = (lessonsData || []).map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        videoUrl: lesson.video_url || '',
        content: lesson.content || '',
        order: lesson.order_number,
        moduleId: lesson.module_id,
        duration: lesson.duration || ''
      }));
      
      setLessons(lessons);
      console.log(`Carregadas ${lessons.length} aulas para o módulo ${moduleId}`);
    } catch (error) {
      console.error('Erro ao carregar dados do módulo ou aulas:', error);
      toast.error("Erro ao carregar dados do módulo ou aulas");
      setModule(null);
      setLessons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourseSelect = (value) => {
    // Limpar estado atual antes de carregar novos dados
    setLessons([]);
    setModule(null);
    setFilteredModules([]);
    
    // Mostrar feedback visual imediato
    toast.info("Carregando módulos do curso...", {
      duration: 2000,
      id: "loading-modules"
    });
    
    // Atualizar o curso selecionado (isso vai disparar o useEffect que carrega os módulos)
    setSelectedCourseId(value);
    
    // Ao mudar o curso, resetamos o módulo selecionado
    setSelectedModuleId("");
    setFormData((prev) => ({ ...prev, moduleId: "" }));
  };

  const handleModuleSelect = (value) => {
    setSelectedModuleId(value);
    setFormData((prev) => ({ ...prev, moduleId: value }));
    fetchModuleAndLessons(value);
  };

  const handleEditLesson = (lesson) => {
    setFormData({
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration || "",
      order: lesson.order_number || lesson.order || 1,
      videoUrl: lesson.video_url || lesson.videoUrl || "",
      content: lesson.content || "",
      moduleId: lesson.module_id || lesson.moduleId || moduleIdFromUrl,
    });
    setEditingLessonId(lesson.id);
    setIsDialogOpen(true);
  };

  const handleDeleteLesson = async (lessonId) => {
    if (confirm("Tem certeza de que deseja excluir esta aula?")) {
      try {
        setIsLoading(true);
        await lessonService.deleteLesson(lessonId);
        toast.success("Aula excluída com sucesso");
        const modId = formData.moduleId || moduleIdFromUrl;
        await fetchModuleAndLessons(modId);
      } catch (error) {
        console.error('Erro detalhado ao excluir aula:', error);
        toast.error(error.message || "Erro ao excluir a aula");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedModuleId = formData.moduleId || moduleIdFromUrl;
    if (!formData.title.trim()) {
      toast.error("Título da aula é obrigatório");
      return;
    }
    if (!selectedModuleId) {
      toast.error("Selecione o módulo da aula");
      return;
    }
    
    // Verificar se já existe uma aula com a mesma ordem no módulo selecionado
    const existingLessonWithSameOrder = lessons.find(
      lesson => lesson.order === Number(formData.order) && 
      (editingLessonId ? lesson.id !== editingLessonId : true)
    );
    
    if (existingLessonWithSameOrder) {
      toast.error(`Já existe uma aula com a ordem ${formData.order} neste módulo: ${existingLessonWithSameOrder.title}`);
      return;
    }
    
    setIsLoading(true);
    try {
      if (editingLessonId) {
        const updatedLesson = await lessonService.updateLesson(editingLessonId, {
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          duration: formData.duration?.trim() || '',
          order: Number(formData.order) || 1,
          videoUrl: formData.videoUrl?.trim() || '',
          content: formData.content?.trim() || '',
          moduleId: selectedModuleId,
        });
        toast.success("Aula atualizada com sucesso");
        
        // Atualizar o estado local imediatamente com a aula retornada pelo serviço
        setLessons(prevLessons => 
          prevLessons.map(lesson => 
            lesson.id === editingLessonId ? updatedLesson : lesson
          )
        );
      } else {
        const newLesson = await lessonService.createLesson(selectedModuleId, {
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          duration: formData.duration?.trim() || '',
          order: Number(formData.order) || 1,
          videoUrl: formData.videoUrl?.trim() || '',
          content: formData.content?.trim() || '',
        });
        toast.success("Aula criada com sucesso");
        
        // Adicionar a nova aula ao estado local imediatamente
        setLessons(prevLessons => [...prevLessons, newLesson]);
      }
      setIsDialogOpen(false);
      setFormData({ ...defaultFormData });
      setEditingLessonId(null);
    } catch (error) {
      // Exibir mensagem de erro mais detalhada
      const errorMessage = error.message || "Erro ao salvar a aula";
      console.error('Erro detalhado:', error);
      toast.error(errorMessage);
      
      // Se o erro for relacionado a ordem duplicada, destacar o campo de ordem
      if (errorMessage.includes('ordem') || errorMessage.includes('Já existe uma aula')) {
        // O campo já está destacado visualmente pelo CSS que adicionamos
        // Focar no campo de ordem para chamar a atenção do usuário
        document.getElementById('order')?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    // Sugerir a pru00f3xima ordem disponiu00edvel para uma nova aula
    let nextOrder = 1;
    if (lessons.length > 0) {
      // Encontrar a maior ordem atual e adicionar 1
      nextOrder = Math.max(...lessons.map(lesson => lesson.order || 0)) + 1;
    }
    
    setFormData({ ...defaultFormData, order: nextOrder });
    setEditingLessonId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-4 w-full">
          <h1 className="text-3xl font-bold tracking-tight" data-component-name="AdminLessons">
            Gerenciar Aulas {module ? `- ${module.title}` : ""}
          </h1>
          
          <div className="flex flex-wrap gap-4 w-full">
            {/* Seletor de Cursos */}
            <div className="w-full md:w-64">
              <Label htmlFor="course-select" className="mb-2 block">Selecione o Curso</Label>
              <Select value={selectedCourseId} onValueChange={handleCourseSelect}>
                <SelectTrigger id="course-select">
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Seletor de Módulos */}
            <div className="w-full md:w-64">
              <Label htmlFor="module-select" className="mb-2 block">Selecione o Módulo</Label>
              <Select 
                value={selectedModuleId} 
                onValueChange={handleModuleSelect}
                disabled={!selectedCourseId || filteredModules.length === 0}
              >
                <SelectTrigger id="module-select">
                  <SelectValue placeholder={filteredModules.length === 0 ? "Nenhum módulo disponível" : "Selecione o módulo"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredModules.map((mod) => (
                    <SelectItem key={mod.id} value={mod.id}>
                      {mod.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl px-2 sm:px-6 overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingLessonId ? "Editar Aula" : "Criar Nova Aula"}
              </DialogTitle>
              <DialogDescription>
                Preencha os detalhes da aula abaixo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 w-full">
              <div className="flex flex-col gap-2">
                <Label htmlFor="moduleId">Módulo</Label>
                <Select value={formData.moduleId} onValueChange={handleModuleSelect}>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Selecione o módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {allModules.map((mod) => (
                      <SelectItem key={mod.id} value={mod.id}>
                        {mod.title} {mod.courseId && 
                          <span className="text-gray-500 text-xs ml-1">
                            (Ordem: {mod.order})
                          </span>
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {module && (
                  <p className="text-xs text-blue-500 mt-1">
                    Módulo atual: <strong>{module.title}</strong> (Ordem: {module.order})
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Título da aula"
                  className="w-full min-w-0"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descreva a aula"
                  className="w-full min-w-0 resize-y"
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="order">Ordem</Label>
                <div className="flex flex-col space-y-1">
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    value={formData.order}
                    onChange={handleInputChange}
                    className={`w-full min-w-0 ${
                      lessons.some(lesson => lesson.order === Number(formData.order) && 
                      (editingLessonId ? lesson.id !== editingLessonId : true)) 
                        ? 'border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                    min={1}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {lessons.some(lesson => lesson.order === Number(formData.order) && 
                      (editingLessonId ? lesson.id !== editingLessonId : true)) ? (
                      <span className="text-red-500">Já existe uma aula com esta ordem</span>
                    ) : (
                      "A ordem determina a sequência de exibição das aulas"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="videoUrl">URL do Vídeo</Label>
                <Input
                  id="videoUrl"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="Link do vídeo (opcional)"
                  className="w-full min-w-0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Conteúdo adicional (opcional)"
                  className="w-full min-w-0 resize-y"
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="duration">Duração</Label>
                <Input
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="Ex: 10min, 1h, etc. (opcional)"
                  className="w-full min-w-0"
                />
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                  {editingLessonId ? "Salvar Alterações" : "Criar Aula"}
                </Button>
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <p>Carregando aulas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vídeo</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhuma aula encontrada para este módulo
                    </TableCell>
                  </TableRow>
                ) : (
                  lessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell>{lesson.order_number || lesson.order}</TableCell>
                      <TableCell className="font-medium">{lesson.title}</TableCell>
                      <TableCell>{lesson.description}</TableCell>
                      <TableCell>
                        {lesson.video_url || lesson.videoUrl ? (
                          <a href={lesson.video_url || lesson.videoUrl} target="_blank" rel="noopener noreferrer">
                            <Badge variant="outline">Ver vídeo</Badge>
                          </a>
                        ) : (
                          <Badge variant="secondary">-</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {lesson.content ? (
                          <span title={lesson.content}>{lesson.content.slice(0, 30)}...</span>
                        ) : (
                          <Badge variant="secondary">-</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditLesson(lesson)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteLesson(lesson.id)}>
                              <Trash className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminLessons;
