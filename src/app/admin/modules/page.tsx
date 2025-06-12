import { useEffect, useState } from "react";
import { Course, Module } from "@/types";
import { courseService, moduleService } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import ModuleForm from "@/components/ModuleForm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, Plus, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminModules() {
  const { isAdmin } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
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

  const fetchModulesByCourse = async (courseId: string) => {
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

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (courseId) {
      fetchModulesByCourse(courseId);
    } else {
      setModules([]);
    }
  };

  const handleCreateModule = () => {
    if (!selectedCourseId) {
      toast.error("Selecione um curso primeiro");
      return;
    }

    setEditingModule(null);
    setFormData({
      title: "",
      description: "",
      order: modules.length,
    });
    setIsDialogOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || "",
      order: module.order,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Tem certeza que deseja excluir este módulo?")) {
      return;
    }

    try {
      await moduleService.deleteModule(moduleId);
      toast.success("Módulo excluído com sucesso");
      fetchModulesByCourse(selectedCourseId);
    } catch (error: any) {
      console.error("Erro ao excluir módulo:", error);
      toast.error(error.message || "Erro ao excluir módulo");
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

    if (!selectedCourseId) {
      toast.error("Selecione um curso primeiro");
      return;
    }

    if (!formData.title?.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      const moduleDataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        order: formData.order,
      };

      if (editingModule) {
        await moduleService.updateModule(editingModule.id, moduleDataToSave);
        toast.success("Módulo atualizado com sucesso");
      } else {
        await moduleService.createModule(selectedCourseId, moduleDataToSave);
        toast.success("Módulo criado com sucesso");
      }

      setIsDialogOpen(false);
      setFormData({ title: "", description: "", order: 0 });
      fetchModulesByCourse(selectedCourseId);
    } catch (error: any) {
      console.error("Erro ao salvar módulo:", error);
      toast.error(error.message || "Erro ao salvar módulo");
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

  if (isLoading && !modules.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Módulos</h1>
        <Button
          onClick={handleCreateModule}
          disabled={!selectedCourseId}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Módulo
        </Button>
      </div>

      <div className="max-w-xs">
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

      {selectedCourseId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {module.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditModule(module)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteModule(module.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {module.description || "Sem descrição"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ordem: {module.order}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ModuleForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          editingModuleId={editingModule?.id || null}
        />
      </Dialog>
    </div>
  );
}