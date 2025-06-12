import { useEffect, useState } from "react";
import { Course, Module, Lesson } from "@/types";
import { courseService, moduleService, lessonService } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import LessonForm from "@/components/LessonForm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, Plus, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLessons() {
  const { isAdmin } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    duration: "",
    videoUrl: "",
    order: 0,
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Você não tem permissão para acessar esta página");
      return;
    }
    fetchCourses();
  }, [isAdmin]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      toast.error("Erro ao carregar cursos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModules = async (courseId: string) => {
    if (!courseId) return;
    
    try {
      setIsLoading(true);
      const modules = await moduleService.getModulesByCourseId(courseId);
      setModules(modules);
    } catch (error) {
      console.error("Erro ao carregar módulos:", error);
      toast.error("Erro ao carregar módulos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLessons = async (moduleId: string) => {
    if (!moduleId) return;
    
    try {
      setIsLoading(true);
      const lessons = await lessonService.getLessonsByModuleId(moduleId);
      setLessons(lessons);
    } catch (error) {
      console.error("Erro ao carregar aulas:", error);
      toast.error("Erro ao carregar aulas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId("");
    setLessons([]);
    if (courseId) {
      fetchModules(courseId);
    } else {
      setModules([]);
    }
  };

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    if (moduleId) {
      fetchLessons(moduleId);
    } else {
      setLessons([]);
    }
  };

  const handleCreateLesson = () => {
    if (!selectedModuleId) {
      toast.error("Selecione um módulo primeiro");
      return;
    }
    
    setEditingLesson(null);
    setFormData({
      title: "",
      description: "",
      content: "",
      duration: "",
      videoUrl: "",
      order: lessons.length,
    });
    setIsDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      content: lesson.content || "",
      duration: lesson.duration || "",
      videoUrl: lesson.videoUrl || "",
      order: lesson.order,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) {
      return;
    }

    try {
      await lessonService.deleteLesson(lessonId);
      toast.success("Aula excluída com sucesso");
      fetchLessons(selectedModuleId);
    } catch (error: any) {
      console.error("Erro ao excluir aula:", error);
      toast.error(error.message || "Erro ao excluir aula");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedModuleId) {
      toast.error("Selecione um módulo primeiro");
      return;
    }

    if (!formData.title?.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      const lessonDataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        duration: formData.duration.trim(),
        videoUrl: formData.videoUrl.trim(),
        order: formData.order
      };

      if (editingLesson) {
        await lessonService.updateLesson(editingLesson.id, lessonDataToSave);
        toast.success("Aula atualizada com sucesso");
      } else {
        await lessonService.createLesson(selectedModuleId, lessonDataToSave);
        toast.success("Aula criada com sucesso");
      }

      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        content: "",
        duration: "",
        videoUrl: "",
        order: 0,
      });
      fetchLessons(selectedModuleId);
    } catch (error: any) {
      console.error("Erro ao salvar aula:", error);
      toast.error(error.message || "Erro ao salvar aula");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Acesso negado</p>
      </div>
    );
  }

  if (isLoading && !lessons.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Aulas</h1>
        <Button
          onClick={handleCreateLesson}
          disabled={!selectedModuleId}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Aula
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="w-48">
          <Select value={selectedCourseId} onValueChange={handleCourseSelect}>
            <SelectTrigger>
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

        <div className="w-48">
          <Select 
            value={selectedModuleId} 
            onValueChange={handleModuleSelect}
            disabled={!selectedCourseId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um módulo" />
            </SelectTrigger>
            <SelectContent>
              {modules.map((module) => (
                <SelectItem key={module.id} value={module.id}>
                  {module.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedModuleId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {lesson.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditLesson(lesson)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteLesson(lesson.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {lesson.description || "Sem descrição"}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-xs text-muted-foreground">
                    Ordem: {lesson.order}
                  </p>
                  {lesson.duration && (
                    <p className="text-xs text-muted-foreground">
                      Duração: {lesson.duration}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <LessonForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          editingLessonId={editingLesson?.id || null}
        />
      </Dialog>
    </div>
  );
}