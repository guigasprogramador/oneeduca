import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizService } from "@/services/quizService";
import { useAuth } from "@/contexts/AuthContext";
import { QuizData, QuizQuestion, QuizResponse } from "@/types/professor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

const QuizPage = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number } | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<any[]>([]);

  // Buscar o quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!moduleId || !user) return;
      
      try {
        setLoading(true);
        const quizData = await quizService.getQuizByModuleId(moduleId);
        
        if (!quizData) {
          setError("Quiz não encontrado");
          return;
        }
        
        setQuiz(quizData);
        
        // Iniciar o temporizador se houver limite de tempo
        if (quizData.timeLimit) {
          setTimeRemaining(quizData.timeLimit * 60); // Converter minutos para segundos
        }
        
        // Buscar tentativas anteriores
        const attempts = await quizService.getUserQuizAttempts(moduleId, user.id);
        setPreviousAttempts(attempts);
      } catch (err) {
        console.error("Erro ao buscar quiz:", err);
        setError("Erro ao carregar o quiz. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [moduleId, user]);
  
  // Temporizador
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0 || quizResult) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev && prev > 0) {
          return prev - 1;
        } else {
          clearInterval(timer);
          handleSubmitQuiz(); // Submeter automaticamente quando o tempo acabar
          return 0;
        }
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, quizResult]);
  
  // Formatar o tempo restante
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Atualizar resposta
  const handleResponseChange = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  // Navegar para a próxima pergunta
  const handleNextQuestion = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };
  
  // Navegar para a pergunta anterior
  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };
  
  // Submeter o quiz
  const handleSubmitQuiz = async () => {
    if (!quiz || !user) return;
    
    // Verificar se todas as perguntas foram respondidas
    const answeredQuestions = Object.keys(responses).length;
    if (answeredQuestions < quiz.questions.length) {
      const unansweredCount = quiz.questions.length - answeredQuestions;
      toast.warning(`Você ainda não respondeu ${unansweredCount} ${unansweredCount === 1 ? 'pergunta' : 'perguntas'}. Tem certeza que deseja enviar?`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Preparar as respostas no formato esperado pelo serviço
      const quizResponses: QuizResponse[] = Object.entries(responses).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer
      }));
      
      // Submeter as respostas
      const result = await quizService.submitQuizResponse(moduleId, user.id, quizResponses);
      
      setQuizResult({
        score: result.score
      });
      
      // Atualizar a lista de tentativas
      const attempts = await quizService.getUserQuizAttempts(moduleId, user.id);
      setPreviousAttempts(attempts);
      
    } catch (err) {
      console.error("Erro ao submeter quiz:", err);
      toast.error("Erro ao enviar suas respostas. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reiniciar o quiz
  const handleRestartQuiz = () => {
    setResponses({});
    setCurrentQuestion(0);
    setQuizResult(null);
    
    // Reiniciar o temporizador se houver limite de tempo
    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60);
    }
  };
  
  // Voltar para o curso
  const handleBackToCourse = () => {
    navigate(`/aluno/curso/${courseId}/player`);
  };
  
  // Renderizar o carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Carregando quiz...</p>
        </div>
      </div>
    );
  }
  
  // Renderizar erro
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={handleBackToCourse}>Voltar ao curso</Button>
      </div>
    );
  }
  
  // Renderizar resultado do quiz
  if (quizResult) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Quiz</CardTitle>
            <CardDescription>Você completou o quiz: {quiz?.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-6xl font-bold mb-4">{quizResult.score}%</div>
              <Progress value={quizResult.score} className="w-full h-2 mb-4" />
              
              {quizResult.score >= (quiz?.passingScore || 70) ? (
                <div className="flex items-center text-green-500 gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Aprovado! Nota mínima: {quiz?.passingScore}%</span>
                </div>
              ) : (
                <div className="flex items-center text-red-500 gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Não aprovado. Nota mínima: {quiz?.passingScore}%</span>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Tentativas anteriores</h3>
              {previousAttempts.length > 0 ? (
                <div className="space-y-2">
                  {previousAttempts.map((attempt, index) => (
                    <div key={attempt.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                      <div>
                        <span className="font-medium">Tentativa {previousAttempts.length - index}</span>
                        <span className="text-sm text-muted-foreground block">
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{attempt.score}%</span>
                        {attempt.score >= 70 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma tentativa anterior</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBackToCourse}>Voltar ao curso</Button>
            {/* Permitir tentar novamente se houver tentativas disponíveis */}
            {(!quiz?.maxAttempts || previousAttempts.length < quiz.maxAttempts) && (
              <Button onClick={handleRestartQuiz}>Tentar novamente</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Verificar se o quiz existe
  if (!quiz) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Quiz não encontrado</AlertTitle>
          <AlertDescription>Não foi possível encontrar o quiz para este módulo.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={handleBackToCourse}>Voltar ao curso</Button>
      </div>
    );
  }
  
  // Verificar se o usuário atingiu o número máximo de tentativas
  if (quiz.maxAttempts && previousAttempts.length >= quiz.maxAttempts) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limite de tentativas atingido</AlertTitle>
          <AlertDescription>
            Você já realizou o número máximo de tentativas permitidas para este quiz ({quiz.maxAttempts}).
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={handleBackToCourse}>Voltar ao curso</Button>
      </div>
    );
  }
  
  // Renderizar o quiz
  const currentQuestionData = quiz.questions[currentQuestion];
  
  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm">{currentQuestion + 1} de {quiz.questions.length}</span>
            </div>
            <Progress value={((currentQuestion + 1) / quiz.questions.length) * 100} className="h-2" />
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Pergunta {currentQuestion + 1}</h3>
            <p className="mb-6">{currentQuestionData.question}</p>
            
            {currentQuestionData.type === 'multiple_choice' && currentQuestionData.options && (
              <RadioGroup
                value={responses[currentQuestionData.id] || ''}
                onValueChange={(value) => handleResponseChange(currentQuestionData.id, value)}
              >
                <div className="space-y-3">
                  {currentQuestionData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
            
            {currentQuestionData.type === 'true_false' && (
              <RadioGroup
                value={responses[currentQuestionData.id] || ''}
                onValueChange={(value) => handleResponseChange(currentQuestionData.id, value)}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true">Verdadeiro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false">Falso</Label>
                  </div>
                </div>
              </RadioGroup>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Anterior
            </Button>
          </div>
          <div className="flex gap-2">
            {currentQuestion < quiz.questions.length - 1 ? (
              <Button onClick={handleNextQuestion}>Próxima</Button>
            ) : (
              <Button 
                onClick={handleSubmitQuiz} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Quiz'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizPage;