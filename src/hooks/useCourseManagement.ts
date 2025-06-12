import { useState } from "react";
import { Course } from "@/types";
import { courseService } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppData } from "@/contexts/AppDataContext";

export interface CourseFormData {
  title: string;
  description: string;
  instructor: string;
  duration: string;
  thumbnail: string;
  enrolledCount: number;
  rating: number;
}

const defaultFormData: CourseFormData = {
  title: "",
  description: "",
  instructor: "",
  duration: "",
  thumbnail: "/placeholder.svg",
  enrolledCount: 0,
  rating: 0,
};

export function useCourseManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>(defaultFormData);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  // Usar o contexto de dados da aplicação
  const { 
    courses, 
    isLoadingCourses: isLoading,
    refreshCourses,
    addCourse,
    updateCourseInState,
    removeCourse
  } = useAppData();

  // Mutação para criar curso
  const createCourseMutation = useMutation({
    mutationFn: (courseData: any) => courseService.createCourse(courseData),
    onSuccess: (newCourse) => {
      toast.success("Curso criado com sucesso");
      // Adicionar o novo curso ao estado local imediatamente
      addCourse(newCourse);
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar curso: ${error.message}`);
    }
  });

  // Mutação para atualizar curso
  const updateCourseMutation = useMutation({
    mutationFn: ({ courseId, courseData }: { courseId: string, courseData: any }) => 
      courseService.updateCourse(courseId, courseData),
    onSuccess: (_, variables) => {
      toast.success("Curso atualizado com sucesso");
      // Atualizar o estado local imediatamente
      updateCourseInState(variables.courseId, variables.courseData);
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar curso: ${error.message}`);
    }
  });

  // Mutação para excluir curso
  const deleteCourseMutation = useMutation({
    mutationFn: (courseId: string) => courseService.deleteCourse(courseId),
    onSuccess: (_, courseId) => {
      toast.success("Curso excluído com sucesso");
      // Remover o curso do estado local imediatamente
      removeCourse(courseId);
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir curso: ${error.message}`);
    }
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Tratamento especial para o campo de duração
    if (name === 'duration') {
      // Garantir que seja um número válido
      const numericValue = value === '' ? '' : String(parseInt(value) || 0);
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin()) {
      toast.error("Você não tem permissão para gerenciar cursos");
      return;
    }

    if (!formData.title || !formData.instructor) {
      toast.error("Título e instrutor são obrigatórios");
      return;
    }

    const courseData = {
      ...formData,
      enrolledCount: formData.enrolledCount || 0,
      rating: formData.rating || 0,
      isEnrolled: false,
      progress: 0
    };

    if (editingCourseId) {
      updateCourseMutation.mutate({ courseId: editingCourseId, courseData });
    } else {
      createCourseMutation.mutate(courseData);
    }
  };

  const handleEditCourse = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      duration: course.duration,
      thumbnail: course.thumbnail,
      enrolledCount: course.enrolledCount,
      rating: course.rating,
    });
    setEditingCourseId(course.id);
    setIsDialogOpen(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (!isAdmin()) {
      toast.error("Você não tem permissão para excluir cursos");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este curso?")) {
      return;
    }

    deleteCourseMutation.mutate(courseId);
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingCourseId(null);
  };

  return {
    courses,
    isLoading: isLoading || createCourseMutation.isPending || updateCourseMutation.isPending || deleteCourseMutation.isPending,
    isDialogOpen,
    setIsDialogOpen,
    formData,
    editingCourseId,
    isSubmitting: createCourseMutation.isPending || updateCourseMutation.isPending,
    handleInputChange,
    handleEditCourse,
    handleDeleteCourse,
    handleSubmit,
    resetForm,
  };
}
