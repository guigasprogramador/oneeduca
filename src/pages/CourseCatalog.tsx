import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/types";
import { courseService } from "@/services/api";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";


const CourseCatalog = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await courseService.getCourses();
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Erro ao carregar cursos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para se matricular");
      return;
    }

    setEnrollingCourseId(courseId);
    try {
      const result = await courseService.enrollCourse(courseId, user.id);
      if (result.success) {
        toast.success(result.message);
        setCourses(courses.map(course => 
          course.id === courseId ? { ...course, isEnrolled: true } : course
        ));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast.error("Erro ao realizar matrícula");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Cursos</h1>
        <p className="text-muted-foreground">Explore nossos cursos e comece a aprender hoje</p>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Course List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p>Carregando cursos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Nenhum curso encontrado</p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <Card key={course.id} className="h-full course-card">
                <div className="aspect-video">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{course.title}</CardTitle>
                    <Badge variant="outline">{course.duration}</Badge>
                  </div>
                  <CardDescription>por {course.instructor}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex items-center">
                      <div className="mr-1 text-yellow-500">★</div>
                      <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {course.enrolledCount} alunos
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Link to={`/courses/${course.id}`} className="w-full">
                    <Button variant="outline" className="w-full">Ver Detalhes</Button>
                  </Link>
                  {course.isEnrolled ? (
                    <Link to={`/courses/${course.id}/content`} className="w-full">
                      <Button className="w-full">Continuar Curso</Button>
                    </Link>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingCourseId === course.id}
                    >
                      {enrollingCourseId === course.id ? "Matriculando..." : "Matricular-se"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;
