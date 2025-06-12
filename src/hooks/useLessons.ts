
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lessonService, moduleService, courseService } from "@/services/api";
import { Lesson, Module, Course } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { realtimeEvents } from "@/utils/realtimeSubscriptions";

export function useLessons(moduleId?: string) {
  const queryClient = useQueryClient();
  
  // Não precisamos mais do useEffect com realtimeEvents, pois estamos usando o React Query diretamente
  
  const {
    data: lessons = [],
    isLoading: isLoadingLessons,
    error: lessonsError,
    refetch: refetchLessons,
  } = useQuery({
    queryKey: ["lessons", moduleId],
    queryFn: () => (moduleId ? lessonService.getLessonsByModuleId(moduleId) : Promise.resolve([])),
    enabled: !!moduleId,
  });

  return {
    lessons,
    isLoadingLessons,
    lessonsError,
    refetchLessons,
  };
}

export function useModules(courseId?: string) {
  const queryClient = useQueryClient();
  
  const {
    data: modules = [],
    isLoading: isLoadingModules,
    error: modulesError,
    refetch: refetchModules,
  } = useQuery({
    queryKey: ["modules", courseId],
    queryFn: () => (courseId ? moduleService.getModulesByCourseId(courseId) : Promise.resolve([])),
    enabled: !!courseId,
  });

  return {
    modules,
    isLoadingModules,
    modulesError,
    refetchModules,
  };
}

export function useLessonMutations() {
  const createLessonMutation = useMutation({
    mutationFn: (data: Omit<Lesson, "id">) => {
      return lessonService.createLesson(data.moduleId, {
        title: data.title,
        description: data.description,
        duration: data.duration,
        videoUrl: data.videoUrl,
        content: data.content,
        order: data.order
      });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({
      id,
      lesson,
    }: {
      id: string;
      lesson: Partial<Lesson>;
    }) => lessonService.updateLesson(id, lesson),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => lessonService.deleteLesson(id),
  });

  // Remover esta mutação se não existe o método updateLessonStatus no seu serviço
  // ou implementar o método no serviço
  /*
  const updateLessonStatusMutation = useMutation({
    mutationFn: ({
      lessonId,
      userId,
      completed,
    }: {
      lessonId: string;
      userId: string;
      completed: boolean;
    }) => lessonService.updateLessonStatus(lessonId, userId, completed),
  });
  */

  return {
    createLesson: createLessonMutation.mutate,
    isCreating: createLessonMutation.isPending,
    updateLesson: updateLessonMutation.mutate,
    isUpdating: updateLessonMutation.isPending,
    deleteLesson: deleteLessonMutation.mutate,
    isDeleting: deleteLessonMutation.isPending,
  };
}

// New hook for admin lessons page
export function useAdminLessons() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Lesson, "id"> & { id?: string }>({
    moduleId: "",
    title: "",
    description: "",
    duration: "",
    order: 0,
    videoUrl: "",
    content: "",
    isCompleted: false
  });

  // Get courses
  const {
    data: courses = [],
    isLoading: isLoadingCourses,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: () => courseService.getCourses(),
  });

  // Get modules filtered by selected course
  const {
    modules: allModules = [],
    isLoadingModules,
  } = useModules(selectedCourseId);

  // Get lessons filtered by selected module
  const {
    lessons,
    isLoadingLessons,
    refetchLessons,
  } = useLessons(selectedModuleId);

  // Mutações com integração aprimorada com o queryClient
  const queryClient = useQueryClient();

  // Mutação para criar aula
  const createLessonMutation = useMutation({
    mutationFn: (data: Omit<Lesson, "id">) => {
      // O campo isCompleted não é aceito pelo serviço, apenas usamos na interface
      return lessonService.createLesson(data.moduleId, {
        title: data.title,
        description: data.description,
        duration: data.duration,
        videoUrl: data.videoUrl,
        content: data.content,
        order: data.order
      });
    },
    onSuccess: () => {
      toast.success("Aula criada com sucesso");
      // Invalidar queries para forçar atualização imediata
      queryClient.invalidateQueries({ queryKey: ["lessons", selectedModuleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", selectedCourseId] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar aula: ${error.message}`);
    }
  });

  // Mutação para atualizar aula
  const updateLessonMutation = useMutation({
    mutationFn: ({ id, lesson }: { id: string, lesson: Partial<Lesson> }) => 
      lessonService.updateLesson(id, lesson),
    onSuccess: () => {
      toast.success("Aula atualizada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["lessons", selectedModuleId] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar aula: ${error.message}`);
    }
  });

  // Mutação para excluir aula
  const deleteLessonMutation = useMutation({
    mutationFn: lessonService.deleteLesson,
    onSuccess: () => {
      toast.success("Aula excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ["lessons", selectedModuleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", selectedCourseId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir aula: ${error.message}`);
    }
  });

  const isCreating = createLessonMutation.isPending;
  const isUpdating = updateLessonMutation.isPending;
  const isDeleting = deleteLessonMutation.isPending;

  const isLoading = isLoadingCourses || isLoadingModules || isLoadingLessons || isCreating || isUpdating || isDeleting;
  
  const filteredModules = selectedCourseId ? allModules : [];

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId("");
  };

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModuleId(moduleId);
  };

  const resetForm = () => {
    setFormData({
      moduleId: selectedModuleId,
      title: "",
      description: "",
      duration: "",
      order: lessons.length + 1,
      videoUrl: "",
      content: "",
      isCompleted: false
    });
    setEditingLessonId(null);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setFormData({
      ...lesson,
      id: lesson.id,
    });
    setEditingLessonId(lesson.id);
    setIsDialogOpen(true);
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (confirm("Tem certeza que deseja excluir esta aula?")) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLessonId) {
        const { id, ...lessonData } = formData;
        updateLessonMutation.mutate({ id: editingLessonId, lesson: lessonData });
      } else {
        createLessonMutation.mutate(formData);
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
    }
  };

  // Initialize form when selectedModuleId changes
  useEffect(() => {
    if (selectedModuleId) {
      resetForm();
    }
  }, [selectedModuleId]);

  return {
    courses,
    lessons,
    isLoading,
    selectedCourseId,
    selectedModuleId,
    filteredModules,
    isDialogOpen,
    setIsDialogOpen,
    formData,
    setFormData,
    editingLessonId,
    handleCourseSelect,
    handleModuleSelect,
    handleEditLesson,
    handleDeleteLesson,
    handleSubmit,
    resetForm,
  };
}
