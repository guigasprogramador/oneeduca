import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Course, Lesson, Module } from "@/types";
import { courseService } from "@/services/api";
import { CheckCircle, Clock, PlayCircle } from "lucide-react";

const CourseContent = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  const fetchCourse = async (id: string) => {
    try {
      const courseData = await courseService.getCourseById(id);
      setCourse(courseData);
      
      // Set first module and lesson as active by default
      if (courseData.modules.length > 0) {
        setActiveModule(courseData.modules[0].id);
        
        if (courseData.modules[0].lessons.length > 0) {
          setActiveLesson(courseData.modules[0].lessons[0].id);
        }
      }
      
      // Calculate progress (this would typically come from user progress data)
      calculateProgress(courseData);
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = (course: Course) => {
    // This is a placeholder. In a real app, you'd get this from user progress data
    const totalLessons = course.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0
    );
    const completedLessons = Math.floor(totalLessons * 0.3); // Assume 30% complete for demo
    const calculatedProgress = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;
    setProgress(calculatedProgress);
  };

  const handleModuleClick = (moduleId: string) => {
    setActiveModule(moduleId);
    
    // Set first lesson of the module as active
    const module = course?.modules.find(m => m.id === moduleId);
    if (module && module.lessons.length > 0) {
      setActiveLesson(module.lessons[0].id);
    } else {
      setActiveLesson(null);
    }
  };

  const handleLessonClick = (lessonId: string) => {
    setActiveLesson(lessonId);
  };

  const getActiveLesson = (): Lesson | null => {
    if (!course || !activeModule || !activeLesson) return null;
    
    const module = course.modules.find(m => m.id === activeModule);
    if (!module) return null;
    
    return module.lessons.find(l => l.id === activeLesson) || null;
  };

  const isLessonCompleted = (lessonId: string) => {
    // This is a placeholder. In a real app, you'd check user progress data
    return Math.random() > 0.7; // Randomly mark some lessons as completed for demo
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando curso...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Curso não encontrado</p>
      </div>
    );
  }

  const currentLesson = getActiveLesson();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground mt-2">{course.description}</p>
          
          <div className="mt-4 flex items-center gap-2">
            <Progress value={progress} className="h-2 w-[200px]" />
            <span className="text-sm text-muted-foreground">{progress}% concluído</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do Curso</CardTitle>
                <CardDescription>
                  {course.modules.length} módulos • {course.modules.reduce(
                    (sum, module) => sum + module.lessons.length,
                    0
                  )} aulas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {course.modules.map((module) => (
                    <div key={module.id} className="border-b border-border last:border-0">
                      <button
                        onClick={() => handleModuleClick(module.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-accent ${
                          activeModule === module.id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="font-medium">{module.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {module.lessons.length} aulas
                        </div>
                      </button>
                      
                      {activeModule === module.id && (
                        <div className="pl-6 pr-4 pb-3 space-y-1">
                          {module.lessons.map((lesson) => {
                            const isCompleted = isLessonCompleted(lesson.id);
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonClick(lesson.id)}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between ${
                                  activeLesson === lesson.id
                                    ? "bg-accent"
                                    : "hover:bg-accent/50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4" />
                                  )}
                                  <span>{lesson.title}</span>
                                </div>
                                <Badge variant={isCompleted ? "default" : "outline"}>
                                  {lesson.duration}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            {currentLesson ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentLesson.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {currentLesson.duration}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      Módulo {course.modules.findIndex(m => m.id === activeModule) + 1} • 
                      Aula {course.modules
                        .find(m => m.id === activeModule)
                        ?.lessons.findIndex(l => l.id === activeLesson) + 1}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="video">
                    <TabsList>
                      <TabsTrigger value="video">Vídeo</TabsTrigger>
                      <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    </TabsList>
                    <TabsContent value="video" className="mt-4">
                      {currentLesson.videoUrl ? (
                        <div className="aspect-video bg-black rounded-md flex items-center justify-center">
                          <iframe
                            src={currentLesson.videoUrl}
                            className="w-full h-full rounded-md"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                          <p className="text-muted-foreground">
                            Nenhum vídeo disponível para esta aula
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="content" className="mt-4">
                      {currentLesson.content ? (
                        <div className="prose max-w-none">
                          <p>{currentLesson.content}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          Nenhum conteúdo adicional disponível para esta aula
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <Separator />
                <CardFooter className="flex justify-between py-4">
                  <Button
                    variant="outline"
                    disabled={!getPreviousLesson()}
                    onClick={() => {
                      const prev = getPreviousLesson();
                      if (prev) {
                        setActiveModule(prev.moduleId);
                        setActiveLesson(prev.id);
                      }
                    }}
                  >
                    Aula Anterior
                  </Button>
                  <Button
                    disabled={!getNextLesson()}
                    onClick={() => {
                      const next = getNextLesson();
                      if (next) {
                        setActiveModule(next.moduleId);
                        setActiveLesson(next.id);
                      }
                    }}
                  >
                    Próxima Aula
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[300px]">
                  <p className="text-muted-foreground">
                    Selecione uma aula para começar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Helper functions to navigate between lessons
  function getPreviousLesson(): Lesson | null {
    if (!course || !activeModule || !activeLesson) return null;
    
    const allLessons = getAllLessonsFlat();
    const currentIndex = allLessons.findIndex(l => l.id === activeLesson);
    
    if (currentIndex <= 0) return null;
    return allLessons[currentIndex - 1];
  }
  
  function getNextLesson(): Lesson | null {
    if (!course || !activeModule || !activeLesson) return null;
    
    const allLessons = getAllLessonsFlat();
    const currentIndex = allLessons.findIndex(l => l.id === activeLesson);
    
    if (currentIndex === -1 || currentIndex >= allLessons.length - 1) return null;
    return allLessons[currentIndex + 1];
  }
  
  function getAllLessonsFlat(): Lesson[] {
    if (!course) return [];
    
    return course.modules.reduce((lessons, module) => {
      return [
        ...lessons,
        ...module.lessons.map(lesson => ({
          ...lesson,
          moduleId: module.id
        }))
      ];
    }, [] as (Lesson & { moduleId: string })[]);
  }
};

export default CourseContent;
