import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User } from "@/types";
import { School } from "lucide-react";
import CourseSelector from "./CourseSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserEnrollmentsProps {
  user: User;
}

interface CourseEnrollment {
  id: string;
  title: string;
  progress: number;
  enrolled_at: string;
}

const UserEnrollments = ({ user }: UserEnrollmentsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEnrollments = async () => {
    if (!user.id || !isOpen) return;

    setIsLoading(true);
    try {
      // Buscar matrículas do usuário
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('course_id, progress, enrolled_at')
        .eq('user_id', user.id);

      if (enrollmentError) {
        console.error('Erro ao buscar matrículas:', enrollmentError);
        toast.error('Erro ao carregar matrículas do usuário');
        return;
      }

      if (!enrollmentData || enrollmentData.length === 0) {
        setEnrollments([]);
        return;
      }

      // Buscar informações dos cursos
      const courseIds = enrollmentData.map(e => e.course_id);
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .in('id', courseIds);

      if (coursesError) {
        console.error('Erro ao buscar cursos:', coursesError);
        toast.error('Erro ao carregar informações dos cursos');
        return;
      }

      // Combinar dados de matrículas com informações dos cursos
      const enrollmentsWithCourseInfo = enrollmentData.map(enrollment => {
        const course = coursesData?.find(c => c.id === enrollment.course_id);
        return {
          id: enrollment.course_id,
          title: course?.title || 'Curso não encontrado',
          progress: enrollment.progress,
          enrolled_at: enrollment.enrolled_at
        };
      });

      setEnrollments(enrollmentsWithCourseInfo);
    } catch (error) {
      console.error('Erro ao buscar dados de matrículas:', error);
      toast.error('Erro ao carregar dados de matrículas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [user.id, isOpen]);

  const handleEnrollmentComplete = () => {
    fetchEnrollments();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <School className="h-4 w-4" />
          Cursos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Matrículas</DialogTitle>
          <DialogDescription>
            Gerencie os cursos em que {user.name} está matriculado(a).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lista de cursos em que o usuário já está matriculado */}
          <div>
            <h3 className="text-lg font-medium mb-2">Cursos Matriculados</h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando matrículas...</p>
            ) : enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este usuário não está matriculado em nenhum curso.</p>
            ) : (
              <div className="space-y-2">
                {enrollments.map(enrollment => (
                  <div key={enrollment.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{enrollment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Matriculado em: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        <span className="text-sm font-medium">{Math.round(enrollment.progress)}%</span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Componente para matricular o usuário em novos cursos */}
          <CourseSelector 
            userId={user.id} 
            onEnrollmentComplete={handleEnrollmentComplete}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserEnrollments;
