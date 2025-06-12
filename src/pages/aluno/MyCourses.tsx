import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Course } from "@/types";
// Importar do arquivo correto
import * as enrollmentService from "@/services/courses/enrollmentService";

// Interface para curso matriculado (estendendo Course)
interface EnrolledCourse extends Course {
  enrolled_at?: string;
  completed_at?: string;
}

const MyCourses = () => {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyCourses = async () => {
      setLoading(true);
      try {
        // Obter o ID do usuário atual
        const userId = localStorage.getItem('userId') || 'current-user';
        
        const data = await enrollmentService.getEnrolledCourses(userId);
        setCourses(data);
      } catch (error) {
        console.error('Erro ao buscar cursos matriculados:', error);
        toast.error('Erro ao carregar seus cursos');
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Meus Cursos</h1>
      {loading ? (
        <p>Carregando...</p>
      ) : courses.length === 0 ? (
        <p>Você ainda não está matriculado em nenhum curso.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="p-4 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
                <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                <Progress value={course.progress || 0} className="my-2" />
                <p className="text-xs mb-1">Progresso: {course.progress || 0}%</p>
                <p className="text-xs mb-1">Início: {course.enrolled_at ? new Date(course.enrolled_at).toLocaleDateString() : '-'}</p>
              </div>
              <Button className="mt-4" onClick={() => navigate(`/aluno/curso/${course.id}/player`)}>
                Continuar Curso
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
