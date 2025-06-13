import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Clock, CheckCircle, AlertCircle, Search, Filter, User, Calendar, Reply, Send, Eye, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { forumService } from '@/services/forumService';
import type { ForumTopic as ServiceForumTopic, ForumMessage as ServiceForumMessage } from '@/services/forumService';

interface Course {
  id: string;
  title: string;
  status: string;
  professor_name: string;
}

interface ForumTopic {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  courseStatus: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
  lastActivity: string;
}

interface ForumMessage {
  id: string;
  forumId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
}

const ProfessorForum = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<ForumTopic[]>([]);
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [isViewTopicModalOpen, setIsViewTopicModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    filterTopics();
  }, [topics, searchTerm, courseFilter, statusFilter]);

  const loadData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Carregar cursos do professor
      const coursesData = await forumService.getCoursesForProfessor(user.id);
      setCourses(coursesData);
      
      // Carregar tópicos do fórum do professor
      const topicsData = await forumService.getTopicsForProfessor(user.id);
      setTopics(topicsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados do chat.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTopics = () => {
    let filtered = topics;
    
    if (searchTerm) {
      filtered = filtered.filter(topic => 
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.createdByName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (courseFilter !== 'all') {
      filtered = filtered.filter(topic => topic.courseId === courseFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(topic => topic.courseStatus === statusFilter);
    }
    
    setFilteredTopics(filtered);
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle || !selectedCourseId || !user?.id) return;
    
    try {
      console.log('Dados do tópico:', {
        title: newTopicTitle,
        description: newTopicDescription,
        courseId: selectedCourseId,
        userId: user?.id
      });
      
      const topicData = {
        title: newTopicTitle,
        description: newTopicDescription,
        courseId: selectedCourseId
      };
      
      await forumService.createTopic(topicData);
      
      // Recarregar os tópicos após criar
      await loadData();
      setNewTopicTitle('');
      setNewTopicDescription('');
      setSelectedCourseId('');
      setIsCreateTopicModalOpen(false);
      
      toast({
        title: 'Sucesso',
        description: 'Tópico criado com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar tópico.',
        variant: 'destructive'
      });
    }
  };

  const handleViewTopic = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    
    try {
      const messages = await forumService.getTopicMessages(topic.id);
      setMessages(messages);
      setIsViewTopicModalOpen(true);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar mensagens do tópico.',
        variant: 'destructive'
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTopic || !user?.id) return;
    
    try {
      const messageData = {
        forumId: selectedTopic.id,
        message: newMessage
      };
      
      await forumService.sendMessage(messageData);
      
      // Recarregar as mensagens após enviar
      const updatedMessages = await forumService.getTopicMessages(selectedTopic.id);
      setMessages(updatedMessages);
      setNewMessage('');
      setReplyToMessage(null);
      
      toast({
        title: 'Sucesso',
        description: 'Mensagem enviada com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao enviar mensagem.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: 'Aprovado', variant: 'default' as const, className: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { label: 'Pendente', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      draft: { label: 'Rascunho', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTopicCounts = () => {
    return {
      all: topics.length,
      approved: topics.filter(t => t.courseStatus === 'approved').length,
      pending: topics.filter(t => t.courseStatus === 'pending').length,
      draft: topics.filter(t => t.courseStatus === 'draft').length
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Carregando chat...</p>
        </div>
      </div>
    );
  }

  const topicCounts = getTopicCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat dos Cursos</h1>
          <p className="text-muted-foreground">
            Gerencie tópicos de discussão dos seus cursos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateTopicModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Tópico
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar tópicos, cursos ou autores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Cursos</SelectItem>
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status do Curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({topicCounts.all})</SelectItem>
            <SelectItem value="approved">Aprovados ({topicCounts.approved})</SelectItem>
            <SelectItem value="pending">Pendentes ({topicCounts.pending})</SelectItem>
            <SelectItem value="draft">Rascunhos ({topicCounts.draft})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Tópicos */}
      <div className="space-y-4">
        {filteredTopics.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum tópico encontrado</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || courseFilter !== 'all' || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Ainda não há tópicos criados'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTopics.map((topic) => (
                <Card key={topic.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(topic.courseStatus)}
                          <Badge variant="outline">{topic.courseName}</Badge>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{topic.title}</CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{topic.createdByName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(topic.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              <span>{topic.messagesCount} mensagens</span>
                            </div>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewTopic(topic)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Discussão
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3 mb-4">
                      {topic.description}
                    </p>
                    
                    {topic.lastActivity && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Última atividade: {formatDate(topic.lastActivity)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>

      {/* Modal para Criar Tópico */}
      <Dialog open={isCreateTopicModalOpen} onOpenChange={setIsCreateTopicModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Tópico</DialogTitle>
            <DialogDescription>
              Crie um novo tópico de discussão para seus cursos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
               <Label htmlFor="topic-course">Curso</Label>
               <select
                 id="topic-course"
                 value={selectedCourseId}
                 onChange={(e) => setSelectedCourseId(e.target.value)}
                 className="w-full p-2 border rounded-md"
               >
                 <option value="">Selecione um curso</option>
                 {courses.map((course) => (
                   <option key={course.id} value={course.id}>
                     {course.title}
                   </option>
                 ))}
               </select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="topic-title">Título</Label>
               <Input
                 id="topic-title"
                 placeholder="Digite o título do tópico"
                 value={newTopicTitle}
                 onChange={(e) => setNewTopicTitle(e.target.value)}
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="topic-description">Descrição</Label>
               <Textarea
                 id="topic-description"
                 placeholder="Digite a descrição do tópico"
                 value={newTopicDescription}
                 onChange={(e) => setNewTopicDescription(e.target.value)}
                 rows={4}
                 className="resize-none"
               />
             </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTopicModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
               onClick={handleCreateTopic}
               disabled={!selectedCourseId || !newTopicTitle.trim() || !newTopicDescription.trim()}
             >
              <Plus className="mr-2 h-4 w-4" />
              Criar Tópico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Visualizar Tópico e Mensagens */}
      <Dialog open={isViewTopicModalOpen} onOpenChange={setIsViewTopicModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Discussão do Tópico</DialogTitle>
          </DialogHeader>
          
          {selectedTopic && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTopic.courseStatus)}
                <Badge variant="outline">{selectedTopic.courseName}</Badge>
              </div>
              
              <div>
                <h4 className="font-medium text-lg mb-2">{selectedTopic.title}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{selectedTopic.createdByName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(selectedTopic.createdAt)}</span>
                  </div>
                </div>
                <p className="text-muted-foreground">{selectedTopic.description}</p>
              </div>
              
              <Separator />
              
              {/* Mensagens */}
              <div className="max-h-[300px] overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma mensagem ainda. Seja o primeiro a participar!
                  </p>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-sm">{message.authorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))
                )}
              </div>
              
              <Separator />
              
              {/* Enviar nova mensagem */}
              <div className="space-y-2">
                <Label htmlFor="new-message">Nova mensagem</Label>
                <Textarea
                  id="new-message"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewTopicModalOpen(false)}>
              Fechar
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfessorForum;