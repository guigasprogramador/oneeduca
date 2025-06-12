import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { moduleService, lessonService, lessonProgressService } from "@/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Lesson, Module } from "@/types";
import VideoPlayer from "@/components/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Award, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CoursePlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [isEligibleForCertificate, setIsEligibleForCertificate] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [courseCompletedRecently, setCourseCompletedRecently] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchModulesAndLessons = async () => {
      setLoading(true);
      setError(null);
      if (!id) {
        setError('ID do curso não fornecido');
        setLoading(false);
        return;
      }
      try {
        // Buscar informações do curso
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title')
          .eq('id', id)
          .single();
        if (courseError || !courseData) {
          setError('Curso não encontrado');
          setLoading(false);
          return;
        }
        setCourseName(courseData.title);
        
        // Obter usuário autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('Você precisa estar logado para acessar este curso');
          setLoading(false);
          return;
        }
        
        // Armazenar o ID do usuário para uso posterior
        setUserId(user.id);
        
        // Buscar módulos e aulas
        const mods = await moduleService.getModulesByCourseId(id);
        const lessonsIds = mods.flatMap(module => module.lessons ? module.lessons.map(lesson => lesson.id) : []);
        
        // Buscar progresso salvo no banco
        const { data: completedLessons, error: completedLessonsError } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('completed', true)
          .in('lesson_id', lessonsIds);
        
        const completedLessonsSet = new Set(completedLessons?.map(item => item.lesson_id) || []);
        
        const modsWithProgress = mods.map(module => ({
          ...module,
          lessons: module.lessons ? module.lessons.map(lesson => ({
            ...lesson,
            isCompleted: completedLessonsSet.has(lesson.id)
          })) : []
        }));
        
        setModules(modsWithProgress);

        // Calcular progresso geral
        const { totalLessons, completedLessonsCount } = countLessons(modsWithProgress);
        const calculatedProgress = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
        setProgress(calculatedProgress);
        
        // Verificar certificado se o progresso for 100%
        if (calculatedProgress === 100) {
          checkCertificate(user.id, id);
        }

        // Selecionar primeira aula disponível
        if (modsWithProgress.length > 0) {
          const firstModuleWithLessons = modsWithProgress.find(m => m.lessons && m.lessons.length > 0) || null;
          if (firstModuleWithLessons) {
            setSelectedModule(firstModuleWithLessons);
            setSelectedLesson(firstModuleWithLessons.lessons[0]);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar módulos e aulas:', error);
        setError('Erro ao carregar o curso. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchModulesAndLessons();
  }, [id]);

  // Função para contar aulas totais e concluídas
  const countLessons = (mods = modules) => {
    let totalLessons = 0;
    let completedLessonsCount = 0;

    mods.forEach(module => {
      if (module.lessons) {
        totalLessons += module.lessons.length;
        completedLessonsCount += module.lessons.filter(lesson => lesson.isCompleted).length;
      }
    });

    return { totalLessons, completedLessonsCount };
  };

  // Função para verificar se existe certificado
  const checkCertificate = async (userId: string, courseId: string) => {
    try {
      // Verificar se já existe certificado
      const { data, error } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .limit(1);
      
      if (error) {
        console.error('Erro ao verificar certificado:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setCertificateId(data[0].id);
        setIsEligibleForCertificate(true);
      } else {
        // Se não existe certificado, verificar elegibilidade
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('progress')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .single();
        
        if (!enrollmentError && enrollmentData && enrollmentData.progress === 100) {
          setIsEligibleForCertificate(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar certificado:', error);
    }
  };

  // Função para gerar certificado
  const generateCertificate = async () => {
    if (!userId || !id) return;
    
    try {
      // Verificar se já existe certificado
      const { data: existingCert, error: existingCertError } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', id)
        .limit(1);
      
      if (existingCertError) {
        console.error('Erro ao verificar certificado existente:', existingCertError);
        toast.error('Erro ao verificar certificado');
        return null;
      }
      
      // Se já existe certificado, retornar o ID
      if (existingCert && existingCert.length > 0) {
        setCertificateId(existingCert[0].id);
        return existingCert[0].id;
      }
      
      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        toast.error('Erro ao gerar certificado');
        return null;
      }
      
      // Buscar dados do curso
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('title, duration')
        .eq('id', id)
        .single();
      
      if (courseError) {
        console.error('Erro ao buscar dados do curso:', courseError);
        toast.error('Erro ao gerar certificado');
        return null;
      }
      
      // Preparar dados para o certificado
      const userName = userData?.name || 'Aluno';
      const courseTitle = courseData?.title || 'Curso';
      let courseHours = 40; // Valor padrão
      
      if (courseData?.duration) {
        const hoursMatch = courseData.duration.match(/(\d+)\s*h/i);
        if (hoursMatch && hoursMatch[1]) {
          courseHours = parseInt(hoursMatch[1], 10);
        }
      }
      
      // Criar certificado
      const now = new Date().toISOString();
      
      const { data: newCertificate, error: createError } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          course_id: id,
          user_name: userName,
          course_name: courseTitle,
          course_hours: courseHours,
          issue_date: now
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Erro ao criar certificado:', createError);
        toast.error('Erro ao gerar certificado');
        return null;
      }
      
      if (newCertificate) {
        setCertificateId(newCertificate.id);
        setIsEligibleForCertificate(true);
        toast.success('Certificado gerado com sucesso!');
        return newCertificate.id;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      toast.error('Erro ao gerar certificado');
      return null;
    }
  };

  // Função para navegar para a página do certificado
  const goToCertificate = async () => {
    let certId = certificateId;
    
    if (!certId && isEligibleForCertificate) {
      // Gerar certificado se elegível mas ainda não gerado
      certId = await generateCertificate();
    }
    
    if (certId) {
      navigate(`/aluno/certificado/${certId}`);
    } else {
      toast.error('Não foi possível acessar o certificado');
    }
  };

  // Função para selecionar uma aula
  const handleSelectLesson = (mod: Module, lesson: Lesson) => {
    setSelectedModule(mod);
    setSelectedLesson(lesson);
  };

  // Função para marcar aula como concluída
  const handleMarkAsCompleted = async () => {
    if (!selectedLesson || !id || !userId) return;

    try {
      // Marcar a aula como concluída no banco de dados
      console.log(`Marcando aula ${selectedLesson.id} como concluída para usuário ${userId}`);
      await lessonProgressService.markLessonAsCompleted(userId, selectedLesson.id);
      
      // Atualizar o estado local
      const updatedModules = modules.map(module => {
        if (module.id === selectedModule?.id) {
          return {
            ...module,
            lessons: module.lessons?.map(lesson => 
              lesson.id === selectedLesson.id 
                ? { ...lesson, isCompleted: true } 
                : lesson
            )
          };
        }
        return module;
      });
      
      setModules(updatedModules);
      
      // Recalcular o progresso
      const { totalLessons, completedLessonsCount } = countLessons(updatedModules);
      const calculatedProgress = Math.round((completedLessonsCount / totalLessons) * 100);
      setProgress(calculatedProgress);
      
      // Atualizar o progresso na matrícula
      try {
        const { error } = await supabase
          .from('enrollments')
          .update({ progress: calculatedProgress })
          .eq('user_id', userId)
          .eq('course_id', id);
        
        if (error) {
          console.error('Erro ao atualizar matrícula:', error);
        } else {
          console.log('Matrícula atualizada com sucesso');
          
          // Verificar se o curso foi concluído
          if (calculatedProgress === 100) {
            console.log('Curso 100% concluído, iniciando verificação de certificado...');
            setCourseCompletedRecently(true);
            
            // Verificar certificado
            await checkCertificate(userId, id);
            
            // Mostrar o modal de parabéns após um pequeno atraso
            setTimeout(() => {
              setShowCongratulations(true);
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Erro ao obter usuário:', error);
      }
      
      toast.success('Aula marcada como concluída!');
    } catch (error) {
      console.error('Erro ao marcar aula como concluída:', error);
      toast.error('Erro ao marcar aula como concluída. Tente novamente.');
    }
  };

  // Verificar se pode navegar para a aula anterior
  const canGoToPreviousLesson = () => {
    if (!selectedModule || !selectedLesson || !selectedModule.lessons) return false;
    const currentLessonIdx = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    return currentLessonIdx > 0;
  };

  // Navegar para a aula anterior
  const handlePreviousLesson = () => {
    if (!selectedModule || !selectedLesson || !selectedModule.lessons) return;
    const currentLessonIdx = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    if (currentLessonIdx > 0) {
      setSelectedLesson(selectedModule.lessons[currentLessonIdx - 1]);
    }
  };

  // Verificar se pode navegar para a próxima aula
  const canGoToNextLesson = () => {
    if (!selectedModule || !selectedLesson || !selectedModule.lessons) return false;
    const currentLessonIdx = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    return currentLessonIdx < selectedModule.lessons.length - 1;
  };

  // Navegar para a próxima aula
  const handleNextLesson = () => {
    if (!selectedModule || !selectedLesson || !selectedModule.lessons) return;
    const currentLessonIdx = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    if (currentLessonIdx < selectedModule.lessons.length - 1) {
      setSelectedLesson(selectedModule.lessons[currentLessonIdx + 1]);
    }
  };

  // Renderizar o diálogo de congratulações
  const renderCongratulationsDialog = () => {
    return (
      <Dialog open={showCongratulations} onOpenChange={setShowCongratulations}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-500" />
              <span>Parabéns! Você concluiu o curso</span>
            </DialogTitle>
            <DialogDescription>
              Você completou todas as aulas de <strong>{courseName}</strong> e está 
              elegível para receber seu certificado de conclusão.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            <Award className="h-24 w-24 text-yellow-500 mb-4" />
            <p className="text-center mb-4">
              {certificateId 
                ? "Seu certificado já está disponível e você pode acessá-lo a qualquer momento."
                : "Estamos gerando seu certificado, isso pode levar alguns instantes."}
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setShowCongratulations(false)}>
              Continuar explorando o curso
            </Button>
            <Button 
              onClick={goToCertificate} 
              className="gap-2"
              disabled={!isEligibleForCertificate}
            >
              <Award className="h-4 w-4" /> 
              Ver meu certificado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container py-6">
      {/* Renderizar o diálogo de congratulações */}
      {renderCongratulationsDialog()}

      {loading ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary rounded-full border-t-transparent mx-auto"></div>
            <p className="mt-4 text-lg">Carregando curso...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Barra lateral com módulos e aulas */}
          <div className="md:col-span-1">
            <Card className="h-full max-h-[80vh] overflow-y-auto">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2">Módulos & Aulas</h2>
                
                {/* Progresso do curso */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Seu progresso</span>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                
                {/* Alerta quando curso está concluído */}
                {progress === 100 && (
                  <Alert className="mb-6 bg-green-50 border-green-200 shadow-md">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <AlertTitle className="text-green-800 text-lg font-bold">Parabéns! Curso concluído!</AlertTitle>
                        <AlertDescription className="text-green-700">
                          <p className="my-1">Você completou todas as aulas deste curso. {courseName && <span>Seu progresso em <strong>{courseName}</strong> está 100% completo.</span>}</p>
                          
                          {isEligibleForCertificate ? (
                            <div className="mt-3 flex items-center gap-2">
                              <Award className="h-5 w-5 text-yellow-500" />
                              <span>Seu certificado está disponível!</span>
                              <Button 
                                variant="default" 
                                size="sm"
                                className="ml-2 bg-green-600 hover:bg-green-700 flex items-center gap-1"
                                onClick={goToCertificate}
                              >
                                <Award className="h-4 w-4" /> Ver meu certificado
                              </Button>
                            </div>
                          ) : (
                            <p className="mt-2 text-amber-600">
                              Seu certificado está sendo processado e estará disponível em breve.
                            </p>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
                
                {/* Lista de módulos e aulas */}
                <div className="space-y-4">
                  {modules.map((module) => (
                    <div key={module.id} className="border rounded-md overflow-hidden">
                      <div 
                        className={`p-3 font-medium cursor-pointer ${
                          selectedModule?.id === module.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                        onClick={() => setSelectedModule(module)}
                      >
                        {module.title}
                      </div>
                      
                      {selectedModule?.id === module.id && (
                        <div className="p-2 bg-background">
                          {module.lessons && module.lessons.length > 0 ? (
                            <ul className="space-y-1">
                              {module.lessons.map((lesson) => (
                                <li 
                                  key={lesson.id} 
                                  className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${
                                    selectedLesson?.id === lesson.id 
                                      ? 'bg-primary/10 font-medium' 
                                      : 'hover:bg-muted'
                                  }`}
                                  onClick={() => handleSelectLesson(module, lesson)}
                                >
                                  <span>{lesson.title}</span>
                                  {lesson.isCompleted && (
                                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground p-2">Nenhuma aula disponível</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          
          {/* Conteúdo da aula */}
          <div className="md:col-span-2">
            {selectedLesson ? (
              <div className="space-y-4">
                <Card>
                  <div className="p-4">
                    <h1 className="text-2xl font-bold">{selectedLesson.title}</h1>
                    {selectedModule && <p className="text-muted-foreground">Módulo: {selectedModule.title}</p>}
                    
                    {selectedLesson.videoUrl ? (
                      <div className="mt-4">
                        <VideoPlayer url={selectedLesson.videoUrl} />
                      </div>
                    ) : (
                      <div className="mt-4 p-4 border rounded bg-muted">
                        <p>Esta aula não possui vídeo.</p>
                      </div>
                    )}
                    
                    {selectedLesson.content && (
                      <div className="mt-6 prose max-w-none">
                        <h2 className="text-xl font-semibold mb-2">Conteúdo da Aula</h2>
                        <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                      </div>
                    )}
                    
                    <div className="mt-6 flex justify-between items-center">
                      <Button 
                        variant="outline" 
                        onClick={handlePreviousLesson}
                        disabled={!canGoToPreviousLesson()}
                      >
                        Aula Anterior
                      </Button>
                      
                      <Button 
                        onClick={handleMarkAsCompleted}
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                        disabled={selectedLesson.isCompleted}
                      >
                        {selectedLesson.isCompleted ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Aula Concluída
                          </>
                        ) : (
                          <>Marcar como Concluída</>
                        )}
                      </Button>
                      
                      <Button 
                        variant="default" 
                        onClick={handleNextLesson}
                        disabled={!canGoToNextLesson()}
                        className="flex items-center gap-1"
                      >
                        Próxima Aula
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold mb-2">Nenhuma aula selecionada</h2>
                  <p className="text-muted-foreground">
                    Selecione uma aula na barra lateral para começar a estudar.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
