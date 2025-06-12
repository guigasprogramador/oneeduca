import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Clock, CheckCircle, User, Send, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { teacherService, ForumQuestion as TeacherForumQuestion } from '@/services';
import { toast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface ForumQuestion {
  id: string;
  title: string;
  content: string;
  studentName: string;
  studentAvatar?: string;
  courseName: string;
  lessonName?: string;
  createdAt: string;
  status: 'pending' | 'answered';
  answer?: string;
  answeredAt?: string;
}

const TeacherForum = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAnswerModal = (question: ForumQuestion) => {
    setSelectedQuestion(question);
    setAnswer('');
    setIsDialogOpen(true);
  };

  const closeAnswerModal = () => {
    setSelectedQuestion(null);
    setAnswer('');
    setIsDialogOpen(false);
  };

  useEffect(() => {
    const loadQuestions = async () => {
      if (!user?.id) return;
      
      try {
        const forumQuestions = await teacherService.getForumQuestions(user.id);
        // Transform the data to match our local interface
        const transformedQuestions: ForumQuestion[] = forumQuestions.map((q: TeacherForumQuestion) => ({
          id: q.id,
          title: q.title,
          content: q.content,
          studentName: q.student_name,
          courseName: q.course_title,
          createdAt: q.created_at,
          status: q.status,
          answer: q.answer,
          answeredAt: q.answered_at
        }));
        setQuestions(transformedQuestions);
      } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as perguntas do fórum.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [user?.id]);

  const handleAnswerQuestion = async (questionId: string) => {
    if (!answer.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, escreva uma resposta antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await teacherService.answerForumQuestion(questionId, answer);
      
      // Atualizar a pergunta localmente
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              status: 'answered' as const,
              answer: answer,
              answeredAt: new Date().toISOString()
            }
          : q
      ));
      
      closeAnswerModal();
      toast({
        title: "Sucesso",
        description: "Resposta enviada com sucesso!"
      });
    } catch (error) {
      console.error("Error answering question:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ForumQuestion['status']) => {
    switch (status) {
      case 'answered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Respondida</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const answeredQuestions = questions.filter(q => q.status === 'answered');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Carregando perguntas...</p>
        </div>
      </div>
    );
  }

  const QuestionCard = ({ question }: { question: ForumQuestion }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={question.studentAvatar} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{question.title}</h3>
                {getStatusBadge(question.status)}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Por: {question.studentName}</p>
                <p>Curso: {question.courseName}</p>
                {question.lessonName && <p>Aula: {question.lessonName}</p>}
                <p>Em: {formatDate(question.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{question.content}</p>
        
        {question.status === 'answered' && question.answer && (
          <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Sua Resposta:</span>
              <span className="text-xs text-green-600">em {formatDate(question.answeredAt!)}</span>
            </div>
            <p className="text-sm text-green-700">{question.answer}</p>
          </div>
        )}
        
        {question.status === 'pending' && (
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => openAnswerModal(question)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Responder
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fórum - Perguntas dos Alunos</h1>
          <p className="text-muted-foreground">
            Responda às perguntas dos seus alunos
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Perguntas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingQuestions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respondidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{answeredQuestions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pendingQuestions.length})</TabsTrigger>
          <TabsTrigger value="answered">Respondidas ({answeredQuestions.length})</TabsTrigger>
          <TabsTrigger value="all">Todas ({questions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingQuestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma pergunta pendente no momento.</p>
              </CardContent>
            </Card>
          ) : (
            pendingQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          )}
        </TabsContent>

        <TabsContent value="answered" className="space-y-4">
          {answeredQuestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma pergunta respondida ainda.</p>
              </CardContent>
            </Card>
          ) : (
            answeredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma pergunta encontrada.</p>
              </CardContent>
            </Card>
          ) : (
            questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Resposta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Pergunta</DialogTitle>
            <DialogDescription>
              Responda à pergunta do estudante sobre o curso.
            </DialogDescription>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{selectedQuestion.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Por: {selectedQuestion.studentName} • {selectedQuestion.courseName}
                  {selectedQuestion.lessonName && ` • ${selectedQuestion.lessonName}`}
                </p>
                <p className="text-sm">{selectedQuestion.content}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Sua Resposta:</label>
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  rows={6}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={closeAnswerModal}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleAnswerQuestion(selectedQuestion.id)}
                  disabled={isSubmitting || !answer.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Resposta
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherForum;