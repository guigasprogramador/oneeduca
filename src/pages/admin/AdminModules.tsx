import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal, Edit, Trash, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Course, Module } from "@/types";
import { courseService } from "@/services/api";
import { useModuleManagement } from "@/hooks/useModuleManagement";
import { useAppData } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";

const AdminModules = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const coursePrefillId = queryParams.get("courseId");
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(coursePrefillId || "");
  const [isLoading, setIsLoading] = useState(true);

  // Usar o hook de gerenciamento de módulos
  const {
    modules,
    isLoading: isLoadingModules,
    isDialogOpen,
    setIsDialogOpen,
    formData,
    editingModuleId,
    isSubmitting,
    handleInputChange,
    handleEditModule,
    handleDeleteModule,
    handleSubmit,
    resetForm,
  } = useModuleManagement(selectedCourseId);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      // Obter cursos
      const coursesData = await courseService.getCourses();
      
      // Obter contagem de matrículas para cada curso
      const coursesWithEnrollmentCount = await Promise.all(coursesData.map(async (course) => {
        try {
          // Buscar matrículas para este curso
          const { data: enrollments, error } = await supabase
            .from('enrollments')
            .select('id')
            .eq('course_id', course.id);
          
          if (error) throw error;
          
          // Atualizar a contagem de alunos matriculados
          return {
            ...course,
            enrolledCount: enrollments?.length || 0
          };
        } catch (err) {
          console.error(`Erro ao buscar matrículas para o curso ${course.id}:`, err);
          return course;
        }
      }));
      
      setCourses(coursesWithEnrollmentCount);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Erro ao carregar cursos");
      setIsLoading(false);
    }
  };

  const handleCourseSelect = (courseId: string) => {
    // Se o valor for "all", definir como string vazia para compatibilidade com o hook
    setSelectedCourseId(courseId === "all" ? "" : courseId);
  };

  // Usar o contexto de dados da aplicação para carregar todos os módulos
  const { loadAllModules } = useAppData();

  // Carregar todos os módulos quando a página for montada
  useEffect(() => {
    // Carregar todos os módulos ao inicializar a página
    loadAllModules();
  }, [loadAllModules]);

  // Atualizar o curso selecionado no hook quando mudar
  useEffect(() => {
    if (selectedCourseId && formData) {
      // O resetForm do hook já será chamado quando o curso mudar
      // porque o useModuleManagement recebe o selectedCourseId como parâmetro
    }
  }, [selectedCourseId, formData]);

  return (
    <div className="space-y-8 px-4 py-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gerenciar Módulos</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md px-4 py-2 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingModuleId ? "Editar Módulo" : "Criar Novo Módulo"}
              </DialogTitle>
              <DialogDescription>
                Preencha os detalhes do módulo abaixo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Curso</Label>
                <Select
                  value={selectedCourseId}
                  onValueChange={handleCourseSelect}
                  disabled={!!editingModuleId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um curso" />
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
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Título do módulo"
                  required
                  className="rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descreva o módulo"
                  rows={3}
                  required
                  className="rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Ordem</Label>
                <div className="flex flex-col space-y-1">
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={handleInputChange}
                    placeholder="Ordem de exibição"
                    required
                    className="rounded-md"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {modules.some(m => m.order === formData.order && (editingModuleId ? m.id !== editingModuleId : true)) ? (
                      <span className="text-red-500">Já existe um módulo com esta ordem</span>
                    ) : (
                      "A ordem determina a sequência de exibição dos módulos"
                    )}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  {editingModuleId ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
        <div className="w-full sm:w-[320px]">
          <Label htmlFor="filterCourse">Filtrar por Curso</Label>
          <Select value={selectedCourseId || "all"} onValueChange={handleCourseSelect}>
            <SelectTrigger id="filterCourse" className="w-full rounded-md">
              <SelectValue placeholder="Todos os cursos" />
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
      </div>

      <Card className="rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-lg text-gray-500">Carregando módulos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-200">Ordem</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-200">Título</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-200">Curso</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-200">Aulas</TableHead>
                  <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-200">Alunos</TableHead>
                  <TableHead className="py-3 px-4 text-center font-semibold text-gray-700 dark:text-gray-200 w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      {selectedCourseId
                        ? "Este curso ainda não possui módulos"
                        : "Nenhum módulo encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  modules.map((module) => {
                    const course = courses.find(c => c.id === module.courseId);
                    return (
                      <TableRow key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition rounded-lg">
                        <TableCell className="py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-200">{module.order}</TableCell>
                        <TableCell className="py-3 px-4 font-medium text-gray-900 dark:text-white">{module.title}</TableCell>
                        <TableCell className="py-3 px-4 text-gray-700 dark:text-gray-200">{course ? course.title : "Curso não encontrado"}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant="outline" className="rounded-full px-3 py-1 text-sm bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
                            {module.lessons.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant="outline" className="rounded-full px-3 py-1 text-sm bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-700" data-component-name="Badge">
                            {course ? course.enrolledCount : 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-lg shadow-lg">
                              <DropdownMenuItem onClick={() => handleEditModule(module)} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteModule(module.id)} className="flex items-center gap-2 text-red-600">
                                <Trash className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => window.location.href = `/admin/lessons?moduleId=${module.id}`}
                                className="flex items-center gap-2"
                              >
                                <BookOpen className="h-4 w-4" />
                                Gerenciar Aulas
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminModules;
