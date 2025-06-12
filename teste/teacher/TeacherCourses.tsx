import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Eye, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { teacherService } from '@/services';
import { TeacherCourse } from '@/types/user';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Clock, CheckCircle } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { moduleService, lessonService } from '@/services';
import { Module, Lesson } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import ModuleForm from '@/components/ModuleForm';
import LessonForm from '@/components/LessonForm';

// Usando TeacherCourse diretamente do types/user.ts
// interface Course removida - usando TeacherCourse

const TeacherCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: '', description: '' });
  const [courseModules, setCourseModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [activeEditTab, setActiveEditTab] = useState('course');
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [moduleFormData, setModuleFormData] = useState({
    title: '',
    description: '',
    order: 1,
    hasAssessment: false,
    assessmentTitle: '',
    assessmentDescription: '',
    assessmentPassingScore: 70,
    assessmentQuestions: []
  });
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration: '',
    videoUrl: '',
    order: 1,
    hasFiles: false,
    complementaryFiles: []
  });
  
  // Define a aba ativa baseada no parâmetro de query 'tab'
  const activeTab = searchParams.get('tab') || 'all';

  useEffect(() => {
    const loadCourses = async () => {
      if (!user?.id) return;
      
      try {
        const teacherCourses = await teacherService.getTeacherCourses(user.id);
        setCourses(teacherCourses);
      } catch (error) {
        console.error('Erro ao carregar cursos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os cursos.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user?.id]);

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      await teacherService.deleteCourse(selectedCourse.id);
      setCourses(courses.filter(course => course.id !== selectedCourse.id));
      toast({
        title: "Sucesso",
        description: "Curso excluído com sucesso."
      });
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o curso.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: TeacherCourse['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejeitado</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  const handleCreateCourse = () => {
    navigate("/teacher/courses/create");
  };

  const handleEditCourse = async (course: TeacherCourse) => {
    setSelectedCourse(course);
    setEditFormData({ title: course.title, description: course.description });
    setActiveEditTab('course');
    setIsEditModalOpen(true);
    
    // Carregar módulos do curso
    setLoadingModules(true);
    try {
      const modules = await moduleService.getModulesByCourseId(course.id);
      
      // Carregar aulas para cada módulo
      const modulesWithLessons = await Promise.all(
        modules.map(async (module) => {
          try {
            const lessons = await lessonService.getLessonsByModuleId(module.id);
            return { ...module, lessons };
          } catch (error) {
            console.error(`Erro ao carregar aulas do módulo ${module.id}:`, error);
            return { ...module, lessons: [] };
          }
        })
      );
      
      setCourseModules(modulesWithLessons);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os módulos do curso.",
        variant: "destructive"
      });
    } finally {
      setLoadingModules(false);
    }
  };

  const handleViewCourse = (course: TeacherCourse) => {
    setSelectedCourse(course);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (course: TeacherCourse) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedCourse) return;
    
    try {
      await teacherService.updateCourse(selectedCourse.id, editFormData);
      setCourses(courses.map(course => 
        course.id === selectedCourse.id 
          ? { ...course, ...editFormData }
          : course
      ));
      toast({
        title: "Sucesso",
        description: "Curso atualizado com sucesso."
      });
      setIsEditModalOpen(false);
      setSelectedCourse(null);
      setCourseModules([]);
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o curso.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateModule = async (moduleId: string, moduleData: Partial<Module>) => {
    try {
      await moduleService.updateModule(moduleId, moduleData);
      
      // Atualizar a lista de módulos
      setCourseModules(prev => 
        prev.map(module => 
          module.id === moduleId 
            ? { ...module, ...moduleData }
            : module
        )
      );
      
      setEditingModule(null);
      toast({
        title: "Sucesso",
        description: "Módulo atualizado com sucesso."
      });
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o módulo.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateLesson = async (lessonId: string, lessonData: Partial<Lesson>) => {
    try {
      await lessonService.updateLesson(lessonId, lessonData);
      
      // Atualizar a lista de módulos com a aula atualizada
      setCourseModules(prev => 
        prev.map(module => ({
          ...module,
          lessons: module.lessons?.map(lesson => 
            lesson.id === lessonId 
              ? { ...lesson, ...lessonData }
              : lesson
          ) || []
        }))
      );
      
      setEditingLesson(null);
      toast({
        title: "Sucesso",
        description: "Aula atualizada com sucesso."
      });
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a aula.",
        variant: "destructive"
      });
    }
  };

  const handleAddModule = async () => {
    if (!selectedCourse) return;
    
    const newModuleData = {
      title: 'Novo Módulo',
      description: 'Descrição do módulo',
      order: courseModules.length + 1
    };
    
    try {
      const newModule = await moduleService.createModule(selectedCourse.id, newModuleData);
      setCourseModules(prev => [...prev, { ...newModule, lessons: [] }]);
      toast({
        title: "Sucesso",
        description: "Módulo criado com sucesso."
      });
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o módulo.",
        variant: "destructive"
      });
    }
  };

  const handleModuleSubmit = async (moduleData: any) => {
    if (!selectedCourse) return;
    
    try {
      if (editingModule) {
        // Atualizar módulo existente
        const updatedModule = await moduleService.updateModule(editingModule.id, {
          ...moduleData,
          courseId: selectedCourse.id
        });
        setCourseModules(courseModules.map(m => m.id === editingModule.id ? updatedModule : m));
        toast({
          title: "Sucesso",
          description: "Módulo atualizado com sucesso."
        });
      } else {
        // Criar novo módulo
        const newModule = await moduleService.createModule(selectedCourse.id, {
          ...moduleData
        });
        setCourseModules([...courseModules, newModule]);
        toast({
          title: "Sucesso",
          description: "Módulo criado com sucesso."
        });
      }
      setShowModuleForm(false);
      setEditingModule(null);
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar módulo",
        variant: "destructive"
      });
    }
  };

  const handleLessonSubmit = async (lessonData: any) => {
    if (!editingModule) return;
    
    try {
      if (editingLesson) {
        // Atualizar aula existente
        const updatedLesson = await lessonService.updateLesson(editingLesson.id, {
          ...lessonData,
          moduleId: editingModule.id
        });
        // Atualizar a lista de módulos com a aula atualizada
        setCourseModules(courseModules.map(module => {
          if (module.id === editingModule.id) {
            return {
              ...module,
              lessons: module.lessons?.map(lesson => 
                lesson.id === editingLesson.id ? updatedLesson : lesson
              ) || []
            };
          }
          return module;
        }));
        toast({
          title: "Sucesso",
          description: "Aula atualizada com sucesso."
        });
      } else {
        // Criar nova aula
        const newLesson = await lessonService.createLesson(editingModule.id, {
          ...lessonData
        });
        // Atualizar a lista de módulos com a nova aula
        setCourseModules(courseModules.map(module => {
          if (module.id === editingModule.id) {
            return {
              ...module,
              lessons: [...(module.lessons || []), newLesson]
            };
          }
          return module;
        }));
        toast({
          title: "Sucesso",
          description: "Aula criada com sucesso."
        });
      }
      setShowLessonForm(false);
      setEditingLesson(null);
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar aula",
        variant: "destructive"
      });
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    const module = courseModules.find(m => m.id === moduleId);
    if (!module) return;
    
    const newLessonData = {
      title: 'Nova Aula',
      description: 'Descrição da aula',
      duration: '00:00',
      order: (module.lessons?.length || 0) + 1
    };
    
    try {
      const newLesson = await lessonService.createLesson(moduleId, newLessonData);
      setCourseModules(courseModules.map(m => 
        m.id === moduleId 
          ? { ...m, lessons: [...(m.lessons || []), newLesson] }
          : m
      ));
      toast({
        title: "Sucesso",
        description: "Aula criada com sucesso."
      });
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a aula.",
        variant: "destructive"
      });
    }
  };

  const pendingCourses = courses.filter(course => course.status === 'pending');
  const approvedCourses = courses.filter(course => course.status === 'approved');
  const rejectedCourses = courses.filter(course => course.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Carregando cursos...</p>
        </div>
      </div>
    );
  }

  const CourseTable = ({ courses }: { courses: TeacherCourse[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Alunos</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id}>
            <TableCell>
              <div>
                <div className="font-medium">{course.title}</div>
                <div className="text-sm text-muted-foreground">{course.description}</div>
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(course.status)}</TableCell>
            <TableCell>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {course.enrolledcount || 0}
              </div>
            </TableCell>
            <TableCell>{new Date(course.created_at).toLocaleDateString('pt-BR')}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewCourse(course)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditCourse(course)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(course)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Cursos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus cursos criados
          </p>
        </div>
        <Button onClick={handleCreateCourse} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Curso
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCourses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Aprovação</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCourses.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({courses.length})</TabsTrigger>
          <TabsTrigger value="approved">Aprovados ({approvedCourses.length})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingCourses.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados ({rejectedCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseTable courses={courses} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseTable courses={approvedCourses} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseTable courses={pendingCourses} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Rejeitados</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseTable courses={rejectedCourses} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Curso</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Título</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedCourse.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedCourse.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge 
                      variant={selectedCourse.status === 'approved' ? 'default' : 
                              selectedCourse.status === 'pending' ? 'secondary' : 'destructive'}
                    >
                      {selectedCourse.status === 'approved' ? 'Aprovado' : 
                       selectedCourse.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Alunos</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedCourse.enrolledcount || 0}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Data de Criação</Label>
                <p className="text-sm text-gray-600 mt-1">{selectedCourse.created_at}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição Completo */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Curso: {selectedCourse?.title}</DialogTitle>
            <DialogDescription>
              Gerencie todas as informações do seu curso, incluindo módulos e aulas.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="course">Informações do Curso</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="lessons">Aulas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="course" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    placeholder="Digite o título do curso"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Digite a descrição do curso"
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="modules" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Módulos do Curso</h3>
                <Button onClick={() => {
                  setModuleFormData({
                    title: '',
                    description: '',
                    order: courseModules.length + 1,
                    hasAssessment: false,
                    assessmentTitle: '',
                    assessmentDescription: '',
                    assessmentPassingScore: 70,
                    assessmentQuestions: []
                  });
                  setShowModuleForm(true);
                }} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Módulo
                </Button>
              </div>
              
              {loadingModules ? (
                <div className="text-center py-4">Carregando módulos...</div>
              ) : (
                <div className="space-y-3">
                  {courseModules.map((module, index) => (
                    <Card key={module.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div>
                              <CardTitle className="text-base">Módulo {index + 1}: {module.title}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>{module.lessons?.length || 0} aulas</span>
                                {(module as any).hasAssessment && (
                                  <span className="text-blue-600">✓ Tem avaliação</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setModuleFormData({
                                title: module.title,
                                description: module.description,
                                order: module.order || index + 1,
                                hasAssessment: (module as any).hasAssessment || false,
                                assessmentTitle: (module as any).assessmentTitle || '',
                                assessmentDescription: (module as any).assessmentDescription || '',
                                assessmentPassingScore: (module as any).assessmentPassingScore || 70,
                                assessmentQuestions: (module as any).assessmentQuestions || []
                              });
                              setEditingModule(module);
                              setShowModuleForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {courseModules.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum módulo encontrado. Clique em "Adicionar Módulo" para começar.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="lessons" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">Aulas por Módulo</h3>
              
              {loadingModules ? (
                <div className="text-center py-4">Carregando aulas...</div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {courseModules.map((module, moduleIndex) => (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger>
                        <div className="flex justify-between items-center w-full mr-4">
                          <span>Módulo {moduleIndex + 1}: {module.title}</span>
                          <span className="text-sm text-gray-500">{module.lessons?.length || 0} aulas</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <Button 
                            onClick={() => {
                              setLessonFormData({
                                title: '',
                                description: '',
                                content: '',
                                duration: '',
                                videoUrl: '',
                                order: (module.lessons?.length || 0) + 1,
                                hasFiles: false,
                                complementaryFiles: []
                              });
                              setEditingModule(module);
                              setShowLessonForm(true);
                            }} 
                            size="sm" 
                            variant="outline" 
                            className="mb-3"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Aula
                          </Button>
                          
                          {module.lessons?.map((lesson, lessonIndex) => (
                            <Card key={lesson.id} className="ml-4">
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium">Aula {lessonIndex + 1}: {lesson.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                      <span>Duração: {lesson.duration}</span>
                                      {lesson.videoUrl && <span>Vídeo: Sim</span>}
                                      {(lesson as any).hasFiles && (
                                        <span className="text-green-600">✓ Tem arquivos</span>
                                      )}
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      setLessonFormData({
                                        title: lesson.title,
                                        description: lesson.description,
                                        content: lesson.content || '',
                                        duration: lesson.duration,
                                        videoUrl: lesson.videoUrl || '',
                                        order: lesson.order || lessonIndex + 1,
                                        hasFiles: (lesson as any).hasFiles || false,
                                        complementaryFiles: (lesson as any).complementaryFiles || []
                                      });
                                      setEditingLesson(lesson);
                                      setEditingModule(module);
                                      setShowLessonForm(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )) || (
                            <div className="text-center py-4 text-gray-500 ml-4">
                              Nenhuma aula neste módulo. Clique em "Adicionar Aula" para começar.
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {courseModules.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum módulo encontrado. Adicione módulos primeiro na aba "Módulos".
                    </div>
                  )}
                </Accordion>
              )}
            </TabsContent>
          </Tabs>
          
          <Separator className="my-4" />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditModalOpen(false);
              setSelectedCourse(null);
              setCourseModules([]);
              setEditingModule(null);
              setEditingLesson(null);
            }}>
              Fechar
            </Button>
            {activeEditTab === 'course' && (
              <Button onClick={handleSaveEdit}>
                Salvar Informações do Curso
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o curso "{selectedCourse?.title}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourse}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal do ModuleForm */}
      <Dialog open={showModuleForm} onOpenChange={setShowModuleForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Editar Módulo' : 'Criar Novo Módulo'}
            </DialogTitle>
          </DialogHeader>
          <ModuleForm
            initialData={moduleFormData}
            onSubmit={handleModuleSubmit}
            onCancel={() => {
              setShowModuleForm(false);
              setEditingModule(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal do LessonForm */}
      <Dialog open={showLessonForm} onOpenChange={setShowLessonForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Editar Aula' : 'Criar Nova Aula'}
            </DialogTitle>
          </DialogHeader>
          <LessonForm
            initialData={lessonFormData}
            onSubmit={handleLessonSubmit}
            onCancel={() => {
              setShowLessonForm(false);
              setEditingLesson(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherCourses;