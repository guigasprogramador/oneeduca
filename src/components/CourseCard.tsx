import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Course } from "@/types";
import { useState } from "react";

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Carregar módulos e aulas apenas quando necessário
  const [modules, setModules] = useState(course.modules || []);
  const [lessons, setLessons] = useState([]);

  const loadLessons = async (moduleId: string) => {
    if (modules.length === 0) return;
    
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    try {
      setIsLoading(true);
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('position');

      if (lessonData) {
        setLessons(lessonData);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {course.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Duração: {course.duration}
              </p>
              <p className="text-xs text-muted-foreground">
                Instrutor: {course.instructor}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <Progress value={course.progress} className="w-32" />
              <p className="text-xs text-muted-foreground">
                Progresso: {course.progress}%
              </p>
            </div>
          </div>
          
          {modules.length > 0 && (
            <div className="space-y-2">
              {modules.map((module) => (
                <div key={module.id} className="space-y-1">
                  <button
                    onClick={() => loadLessons(module.id)}
                    className="text-sm font-medium hover:underline"
                  >
                    {module.title}
                  </button>
                  {lessons.length > 0 && (
                    <div className="pl-4 space-y-1">
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="text-sm text-muted-foreground">
                          {lesson.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <div className="p-4 border-t">
        <Link to={`/aluno/curso/${course.id}/player`}>
          <Button className="w-full">Continuar Curso</Button>
        </Link>
      </div>
    </Card>
  );
};

export default CourseCard;
