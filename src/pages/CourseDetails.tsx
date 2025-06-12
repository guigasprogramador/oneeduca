
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { Course } from "@/types";
import { courseService } from "@/services";
import { enrollCourse, getEnrolledCourses, checkEnrollment } from "@/services/courses/enrollmentService";
import { GraduationCap, Clock, Users, BookOpen, Play } from "lucide-react";
import { toast } from "sonner";
import LoadingWithFeedback from "@/components/LoadingWithFeedback";
import { supabase } from "@/integrations/supabase/client";

const CourseDetails = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (courseId) {
          console.log(`DIAGNÓSTICO: Buscando detalhes do curso ${courseId}`);
          const courseData = await courseService.getCourseById(courseId);
          setCourse(courseData);
          console.log('DIAGNÓSTICO: Dados do curso carregados:', courseData?.title);
          
          // Verificar se o usuário está matriculado no curso
          if (user) {
            console.log(`DIAGNÓSTICO: Verificando matrícula do usuário ${user.id} no curso ${courseId}`);
            
            try {
              // Verificar diretamente no Supabase se o usuário está matriculado
              const { data, error } = await checkEnrollment(courseId, user.id);
              
              if (error) {
                console.error('DIAGNÓSTICO: Erro ao verificar matrícula diretamente:', error);
                // Tentar método alternativo
                const enrolledCourses = await getEnrolledCourses(user.id);
                const isUserEnrolled = enrolledCourses.some(course => course.id === courseId);
                console.log(`DIAGNÓSTICO: Verificando com lista de cursos - Matriculado: ${isUserEnrolled}`);
                setIsEnrolled(isUserEnrolled);
              } else {
                const isUserEnrolled = !!data;
                console.log(`DIAGNÓSTICO: Verificar matrícula direta - Matriculado: ${isUserEnrolled}`);
                setIsEnrolled(isUserEnrolled);
              }
            } catch (enrollError) {
              console.error("DIAGNÓSTICO: Erro ao verificar matrícula:", enrollError);
              // Se houver erro, assumimos que o usuário não está matriculado
              setIsEnrolled(false);
            }
          }
        }
      } catch (error) {
        console.error("DIAGNÓSTICO: Error fetching course:", error);
        toast.error("Erro ao carregar detalhes do curso");
        navigate("/courses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, navigate, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setIsEnrolling(true);
    try {
      if (courseId) {
        const result = await enrollCourse(courseId, user.id);
        
        if (result.success) {
          setIsEnrolled(true);
          toast.success(result.message || "Matrícula realizada com sucesso!");
        } else {
          toast.error(result.message || "Erro ao realizar matrícula");
        }
      }
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast.error("Erro ao realizar matrícula");
    } finally {
      setIsEnrolling(false);
    }
  };

  const startCourse = () => {
    if (courseId) {
      // Redirecionar para o player de aulas em vez da pu00e1gina de conteu00fado
      navigate(`/aluno/curso/${courseId}/player`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingWithFeedback message="Carregando detalhes do curso..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p>Curso não encontrado</p>
        <Button className="mt-4" onClick={() => navigate("/courses")}>
          Voltar para Catálogo
        </Button>
      </div>
    );
  }

  const totalLessons = course.modules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="mt-2 text-muted-foreground">{course.description}</p>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{course.instructor}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{course.enrolledCount} alunos</span>
            </div>
            <div className="flex items-center">
              <div className="text-yellow-500 mr-1">★</div>
              <span>{course.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="md:w-1/3">
          <Card>
            <div className="aspect-video">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover rounded-t-lg"
              />
            </div>
            <CardContent className="p-6">
              {isEnrolled ? (
                <Button className="w-full" onClick={startCourse}>
                  Continuar Curso
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? "Matriculando..." : "Matricular-se"}
                </Button>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{course.modules.length} módulos</span>
                </div>
                <div className="flex items-center">
                  <Play className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{totalLessons} aulas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Course Content */}
      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Conteúdo do Curso</TabsTrigger>
          <TabsTrigger value="description">Sobre o Curso</TabsTrigger>
        </TabsList>
        
        <TabsContent value="modules" className="space-y-4 mt-4">
          <h2 className="text-2xl font-semibold">Módulos e Aulas</h2>
          
          {course.modules.length === 0 ? (
            <p className="text-muted-foreground">Este curso ainda não possui módulos</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {course.modules.map((module) => (
                <AccordionItem key={module.id} value={module.id}>
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <span className="font-medium">{module.title}</span>
                      <Badge variant="outline" className="ml-2">
                        {module.lessons.length} aulas
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {module.lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">{index + 1}.</span>
                            <span>{lesson.title}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
        
        <TabsContent value="description" className="space-y-4 mt-4">
          <h2 className="text-2xl font-semibold">Sobre o Curso</h2>
          <div className="prose max-w-none">
            <p>{course.description}</p>
            <h3 className="text-xl font-medium mt-4">O que você vai aprender</h3>
            <ul>
              <li>Entender os conceitos fundamentais</li>
              <li>Aplicar técnicas avançadas</li>
              <li>Desenvolver projetos práticos</li>
              <li>Construir um portfólio profissional</li>
            </ul>
            
            <h3 className="text-xl font-medium mt-4">Requisitos</h3>
            <ul>
              <li>Conhecimentos básicos na área</li>
              <li>Computador com acesso à internet</li>
              <li>Vontade de aprender e praticar</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseDetails;
