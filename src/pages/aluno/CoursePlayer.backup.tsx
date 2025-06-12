import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { moduleService, lessonService, lessonProgressService, certificateService } from "@/services";
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

  useEffect(() => {
    const fetchModulesAndLessons = async () => {
      setLoading(true);
      setError(null);
      
      if (!id) {
        setError('ID do curso não fornecido');
        setLoading(false);
        return;
      }
      
      console.log('Carregando curso com ID:', id);
      
      try {
        // Obter informações do curso
        const { data: courseData } = await supabase
          .from('courses')
          .select('title')
          .eq('id', id)
          .single();
        
        if (courseData) {
          setCourseName(courseData.title);
        }
        
        // Obter o ID do usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Você precisa estar logado para acessar este curso');
        }
        
        // Obter os módulos do curso - as aulas já estão incluídas nesta resposta
        const mods = await moduleService.getModulesByCourseId(id);
        console.log('Módulos carregados:', mods);
        
        // Buscar progresso das aulas para o usuário
        const lessonsIds = mods.flatMap(module => 
          module.lessons ? module.lessons.map(lesson => lesson.id) : []
        );
        
        // Buscar aulas concluídas
        const { data: completedLessons } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('completed', true)
          .in('lesson_id', lessonsIds);
        
        // Criar um Set para busca rápida
        const completedLessonsSet = new Set(
          completedLessons?.map(item => item.lesson_id) || []
        );
        
        console.log('Aulas concluídas:', completedLessonsSet);
        
        // Marcar aulas como concluídas nos módulos
        const modsWithProgress = mods.map(module => ({
          ...module,
          lessons: module.lessons ? module.lessons.map(lesson => ({
            ...lesson,
            isCompleted: completedLessonsSet.has(lesson.id)
          })) : []
        }));
        
        // Definir os módulos
        setModules(modsWithProgress);
        
        // Selecionar o primeiro módulo e aula, se disponíveis
        if (modsWithProgress.length > 0) {
          const firstModule = modsWithProgress[0];
          setSelectedModule(firstModule);
          
          if (firstModule.lessons && firstModule.lessons.length > 0) {
            console.log('Primeira aula:', firstModule.lessons[0]);
            setSelectedLesson(firstModule.lessons[0]);
          } else {
            console.warn('O módulo não tem aulas');
            setSelectedLesson(null);
          }
        } else {
          console.warn('O curso não tem módulos');
        }
        
        // Carregar o progresso do curso e verificar elegibilidade para certificado
        fetchProgress();
      } catch (error) {
        console.error('Erro ao carregar módulos e aulas:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar o conteúdo do curso');
        toast.error('Erro ao carregar o conteúdo do curso');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModulesAndLessons();
    
    // eslint-disable-next-line
  }, [id]);

  const fetchProgress = async () => {
    try {
      // Obter o ID do usuário atual da sessão do Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id || !id) {
        console.log('PROGRESSO: Não pode ser calculado - usuário não autenticado ou ID do curso ausente');
        setProgress(0);
        return;
      }
      
      console.log(`PROGRESSO: Buscando dados para curso ${id} e usuário ${user.id}`);
      
      // Obter informações do curso
      try {
        const { data: courseData } = await supabase
          .from('courses')
          .select('title')
          .eq('id', id)
          .single();
        
        if (courseData) {
          setCourseName(courseData.title);
        }
      } catch (courseError) {
        console.error('PROGRESSO: Erro ao buscar detalhes do curso:', courseError);
      }
      
      // Verificar quantas aulas o curso tem no total
      const { totalLessons, completedLessons } = countLessons();
      console.log(`PROGRESSO: Contagem local: ${completedLessons}/${totalLessons} aulas concluídas`);
      
      // Abordagem 1: Calcular com base nas aulas concluídas da UI (resultado mais imediato)
      const localProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      console.log(`PROGRESSO: Cálculo baseado na UI: ${localProgress}%`);
      
      // Se temos dados locais, usá-los primeiro para feedback imediato
      if (localProgress > 0) {
        setProgress(localProgress);
      }
      
      // Armazenar o progresso anterior para comparação
      const previousProgress = progress;
      
      // Abordagem 2: Buscar dados diretamente do banco
      try {
        // 1. Buscar progresso diretamente da tabela lesson_progress
        const { data: lessonProgressData, error: lpError } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('completed', true);
          
        if (lpError) {
          console.error('PROGRESSO: Erro ao buscar aulas concluídas:', lpError);
        } else {
          // 1. Primeiro, buscar todos os módulos do curso
          const { data: courseModules, error: modulesError } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', id);
            
          if (modulesError) {
            console.error('PROGRESSO: Erro ao buscar módulos do curso:', modulesError);
            return;
          }
          
          if (!courseModules || courseModules.length === 0) {
            console.log('PROGRESSO: Nenhum módulo encontrado para este curso');
            return;
          }
            
          const moduleIds = courseModules.map(module => module.id);
          console.log(`PROGRESSO: Encontrados ${moduleIds.length} módulos para o curso ${id}`);
            
          // 2. Agora buscar todas as aulas desses módulos
          const { data: courseLessons, error: clError } = await supabase
            .from('lessons')
            .select('id, module_id')
            .in('module_id', moduleIds);
            
          if (clError) {
            console.error('PROGRESSO: Erro ao buscar aulas do curso:', clError);
          } else if (courseLessons && courseLessons.length > 0) {
            // Filtrar apenas as aulas concluídas deste curso
            const completedLessonIds = new Set(lessonProgressData?.map(item => item.lesson_id) || []);
            const courseLessonIds = courseLessons.map(lesson => lesson.id);
            
            const completedCourseLesson = courseLessonIds.filter(id => completedLessonIds.has(id));
            
            const dbProgress = Math.round((completedCourseLesson.length / courseLessonIds.length) * 100);
            console.log(`PROGRESSO: Cálculo do banco: ${dbProgress}% (${completedCourseLesson.length}/${courseLessonIds.length})`);
            
            // Atualizar o progresso na UI com o valor calculado do banco
            setProgress(dbProgress);
            
            // Atualizar também a tabela de matrículas se houver discrepância
            const { data: enrollmentData } = await supabase
              .from('enrollments')
              .select('progress')
              .eq('user_id', user.id)
              .eq('course_id', id)
              .single();
              
            if (enrollmentData && enrollmentData.progress !== dbProgress) {
              console.log(`PROGRESSO: Atualizando matrícula de ${enrollmentData.progress}% para ${dbProgress}%`);
              
              const { error: updateError } = await supabase
                .from('enrollments')
                .update({ progress: dbProgress })
                .eq('user_id', user.id)
                .eq('course_id', id);
                
              if (updateError) {
                console.error('PROGRESSO: Erro ao atualizar matrícula:', updateError);
              } else {
                console.log('PROGRESSO: Matrícula atualizada com sucesso');
              }
            }
            
            // Verificar se o curso foi concluído
            if (dbProgress === 100) {
              // Verificar certificado quando o curso for concluído
              console.log('PROGRESSO: Curso 100% concluído, verificando certificado...');
              setCourseCompletedRecently(true); // Sempre marcar como completado recentemente para garantir o modal
              console.log('PROGRESSO: courseCompletedRecently definido como true');
              
              // Buscar usuário atual da sessão
              const { data: authData } = await supabase.auth.getUser();
              if (authData?.user) {
                // Verificar certificado
                console.log(`PROGRESSO: Verificando certificado para ${authData.user.id} no curso ${id}`);
                await checkCertificateEligibility(authData.user.id, id);
                
                // Forçar a exibição do modal depois de um pequeno atraso
                setTimeout(() => {
                  console.log('PROGRESSO: Forçando exibição do modal de parabéns');
                  setShowCongratulations(true);
                }, 1500);
              }
            }
            
            return;
          }
        }
        
        // Se não conseguimos calcular com o método acima, tentar obter da tabela de matrículas
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('progress, completed_at')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .single();
        
        if (enrollmentError) {
          console.error('PROGRESSO: Erro ao buscar matrícula:', enrollmentError);
        } else if (enrollmentData) {
          const enrollmentProgress = enrollmentData.progress || 0;
          console.log(`PROGRESSO: Valor na matrícula: ${enrollmentProgress}%`);
          
          // Verificar se o valor da matrícula é maior que o calculado localmente
          if (enrollmentProgress > localProgress) {
            setProgress(enrollmentProgress);
          }
          
          // Verificar se o curso foi concluído
          if (enrollmentProgress === 100) {
            if (previousProgress < 100) {
              setCourseCompletedRecently(true);
            }
            checkCertificateEligibility(user.id, id);
          }
        }
      } catch (dbError) {
        console.error('PROGRESSO: Erro ao calcular com banco de dados:', dbError);
      }
    } catch (error) {
      console.error('PROGRESSO: Erro ao buscar progresso:', error);
      setProgress(0);
    }
  };
  
  // Redireciona para o certificado ou página de certificados
  const goToCertificate = () => {
    if (certificateId) {
      // Se temos o ID específico, vamos para a página de visualização do certificado
      // Corrigindo a rota para corresponder à definida em App.tsx
      console.log(`Redirecionando para o certificado: /aluno/certificado/${certificateId}`);
      navigate(`/aluno/certificado/${certificateId}`);
    } else {
      // Caso contrário, vamos para a lista de certificados
      console.log('Nenhum certificado encontrado, indo para a lista de certificados');
      navigate('/aluno/certificados'); // Corrigindo para a rota correta
    }
  };

  // Fechar o diálogo de parabéns
  const handleCloseCongratulations = () => {
    setShowCongratulations(false);
  };

  // Verificar elegibilidade para certificado
  const checkCertificateEligibility = async (userId: string, courseId: string) => {
    try {
      console.log('CERTIFICADO: Verificando elegibilidade...');
      const isEligible = await certificateService.isEligibleForCertificate(userId, courseId);
      console.log(`CERTIFICADO: Elegível para certificado: ${isEligible}`);
      setIsEligibleForCertificate(isEligible);

      if (isEligible) {
        // Buscar certificados existentes
        const certificates = await certificateService.getCertificates(userId, courseId);
        console.log('CERTIFICADO: Certificados encontrados:', certificates);

        if (certificates && certificates.length > 0) {
          setCertificateId(certificates[0].id);
          console.log(`CERTIFICADO: ID do certificado definido: ${certificates[0].id}`);
        } else {
          // Tente gerar um novo certificado
          try {
            console.log('CERTIFICADO: Tentando gerar novo certificado...');
            const newCert = await certificateService.generateCertificate(userId, courseId);
            if (newCert) {
              setCertificateId(newCert.id);
              console.log(`CERTIFICADO: Novo certificado gerado com ID: ${newCert.id}`);
            }
          } catch (genError) {
            console.error('CERTIFICADO: Erro ao gerar certificado:', genError);
          }
        }

        // Se o curso foi concluído recentemente, mostrar parabéns
        if (courseCompletedRecently) {
          console.log('CERTIFICADO: Exibindo modal de parabéns');
          setShowCongratulations(true);
        }
      }
    } catch (error) {
      console.error('CERTIFICADO: Erro ao verificar elegibilidade:', error);
    }
  };
  
  // Contar total de aulas e aulas concluídas para cálculo rápido do progresso
  const countLessons = () => {
    let totalLessons = 0;
    let completedLessons = 0;
    
    modules.forEach(module => {
      if (module.lessons) {
        totalLessons += module.lessons.length;
        
        module.lessons.forEach(lesson => {
          if (lesson.isCompleted) {
            completedLessons++;
          }
        });
      }
    });
    
    return { totalLessons, completedLessons };
  };
  
  // Verifica se esta é a última aula não concluída no curso
  const isThisTheLastIncompleteLesson = () => {
    if (!modules || modules.length === 0) return false;
    
    let totalLessons = 0;
    let completedLessons = 0;
    
    // Contar todas as aulas e as concluídas
    modules.forEach(module => {
      if (module.lessons) {
        totalLessons += module.lessons.length;
        completedLessons += module.lessons.filter(lesson => lesson.isCompleted).length;
      }
    });
    
    // Se esta for a penúltima aula concluída (ou seja, depois de marcar esta, todas estarão concluídas)
    return completedLessons === totalLessons - 1;
  };
  
  // Atualiza o status de conclusão da aula na UI
  const updateLessonStatus = (lessonId: string, isCompleted: boolean) => {
    // Atualizar a aula selecionada
    if (selectedLesson && selectedLesson.id === lessonId) {
      setSelectedLesson({
        ...selectedLesson,
        isCompleted
      });
    }
    
    // Atualizar a aula nos módulos
    const updatedModules = modules.map(module => {
      if (!module.lessons) return module;
      
      const updatedLessons = module.lessons.map(lesson => 
        lesson.id === lessonId ? { ...lesson, isCompleted } : lesson
      );
      
      return {
        ...module,
        lessons: updatedLessons
      };
    });
    
    setModules(updatedModules);
  };

  // Verificar se pode navegar para a aula anterior
  const canGoToPreviousLesson = () => {
    if (!selectedModule || !selectedLesson || !selectedModule.lessons) return false;
    const currentLessonIdx = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    return currentLessonIdx > 0;
  };
  
  // Navegar para a aula anterior
  const handlePreviousLesson = () => {
    if (!selectedModule || !selectedLesson || !canGoToPreviousLesson()) return;
    const currentLessonIdx = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    setSelectedLesson(selectedModule.lessons[currentLessonIdx - 1]);
  };
  
  // Verificar se pode navegar para a próxima aula
  const canGoToNextLesson = () => {
    if (!selectedModule || !selectedLesson || !selectedModule.lessons) return false;
    const currentLessonIdx = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    return currentLessonIdx < selectedModule.lessons.length - 1;
  };
  
  // Navegar para a próxima aula
  const handleNextLesson = () => {
    if (!selectedModule || !selectedLesson) return;
    
    const currentLessonIdx = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    
    if (currentLessonIdx < selectedModule.lessons.length - 1) {
      // Próxima aula no mesmo módulo
      setSelectedLesson(selectedModule.lessons[currentLessonIdx + 1]);
    } else {
      // Tentar ir para o próximo módulo
      const currentModuleIdx = modules.findIndex(m => m.id === selectedModule.id);
      if (currentModuleIdx < modules.length - 1) {
        const nextModule = modules[currentModuleIdx + 1];
        setSelectedModule(nextModule);
        if (nextModule.lessons && nextModule.lessons.length > 0) {
          setSelectedLesson(nextModule.lessons[0]);
        }
      }
    }
  };

  // Renderização do diálogo de congratulações quando o curso é concluído
  const renderCongratulationsDialog = () => (
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
            Seu certificado já está disponível e você pode acessá-lo a 
            qualquer momento na seção de certificados ou clicando no botão abaixo.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleCloseCongratulations}>
            Continuar explorando o curso
          </Button>
          <Button onClick={goToCertificate} className="gap-2">
            <Award className="h-4 w-4" /> 
            Ver meu certificado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Renderizar o diálogo de congratulações */}
      {renderCongratulationsDialog()}

      {error ? (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Barra lateral com módulos e aulas */}
          <div className="md:col-span-1">
            <Card className="h-full max-h-[80vh] overflow-y-auto">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2">Módulos & Aulas</h2>
                
                {/* Progresso do curso - Melhorado */}
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
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-3"
                            onClick={() => setShowCongratulations(true)}
                          >
                            Ver detalhes da conclusão
                          </Button>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div key={module.id} className="border rounded-lg overflow-hidden">
                      <div 
                        className={`p-3 cursor-pointer ${
                          selectedModule?.id === module.id 
                            ? 'bg-primary text-white' 
                            : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => setSelectedModule(module)}
                      >
                        <h3 className="font-medium">{module.title}</h3>
                      </div>
                      
                      {selectedModule?.id === module.id && (
                        <div className="p-2 border-t">
                          {module.lessons && module.lessons.length > 0 ? (
                            <ul className="space-y-1">
                              {module.lessons.map((lesson) => (
                                <li 
                                  key={lesson.id}
                                  className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                                    selectedLesson?.id === lesson.id 
                                      ? 'bg-secondary text-secondary-foreground' 
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
