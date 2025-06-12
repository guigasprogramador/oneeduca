import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { enrollmentService } from "@/services/api";

interface Course {
  id: string;
  title: string;
}

interface CourseSelectorProps {
  userId: string;
  onEnrollmentComplete?: () => void;
}

const CourseSelector = ({ userId, onEnrollmentComplete }: CourseSelectorProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Buscar todos os cursos disponíveis
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        
        // Buscar todos os cursos
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title');
        
        if (coursesError) {
          console.error('Erro ao buscar cursos:', coursesError);
          toast.error('Erro ao carregar cursos disponíveis');
          return;
        }
        
        if (!coursesData) {
          console.log('Nenhum curso encontrado');
          return;
        }
        
        setCourses(coursesData);
        
        // Buscar cursos em que o usuário já está matriculado
        if (userId) {
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', userId);
          
          if (enrollmentsError) {
            console.error('Erro ao buscar matrículas:', enrollmentsError);
          } else if (enrollments) {
            const enrolledIds = enrollments.map(e => e.course_id);
            setEnrolledCourses(enrolledIds);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar dados de cursos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, [userId]);

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const handleEnrollUser = async () => {
    if (!userId || selectedCourses.length === 0) {
      toast.error('Selecione pelo menos um curso para matricular o usuário');
      return;
    }
    
    setIsEnrolling(true);
    
    try {
      // Matricular o usuário em cada curso selecionado
      const enrollmentPromises = selectedCourses.map(courseId => 
        enrollmentService.enrollCourse(courseId, userId)
      );
      
      const results = await Promise.all(enrollmentPromises);
      
      // Verificar resultados
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        toast.success(`Usuário matriculado com sucesso em ${successCount} curso(s)`);
        
        // Atualizar a lista de cursos matriculados
        setEnrolledCourses(prev => [...prev, ...selectedCourses]);
        setSelectedCourses([]);
        
        // Notificar o componente pai que a matrícula foi concluída
        if (onEnrollmentComplete) {
          onEnrollmentComplete();
        }
      } else {
        toast.error('Não foi possível matricular o usuário nos cursos selecionados');
      }
    } catch (error) {
      console.error('Erro ao matricular usuário:', error);
      toast.error('Erro ao processar matrículas');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Carregando cursos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Matricular em Cursos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione os cursos em que deseja matricular este usuário.
        </p>
      </div>
      
      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum curso disponível.</p>
      ) : (
        <>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
            {courses.map(course => {
              const isEnrolled = enrolledCourses.includes(course.id);
              return (
                <div key={course.id} className="flex items-start space-x-2 py-1">
                  <Checkbox 
                    id={`course-${course.id}`} 
                    checked={selectedCourses.includes(course.id)}
                    disabled={isEnrolled}
                    onCheckedChange={() => handleCourseToggle(course.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor={`course-${course.id}`}
                      className={`cursor-pointer ${isEnrolled ? 'text-muted-foreground' : ''}`}
                    >
                      {course.title}
                      {isEnrolled && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Já matriculado
                        </span>
                      )}
                    </Label>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleEnrollUser} 
              disabled={selectedCourses.length === 0 || isEnrolling}
            >
              {isEnrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Matricular em {selectedCourses.length} curso(s)
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseSelector;
