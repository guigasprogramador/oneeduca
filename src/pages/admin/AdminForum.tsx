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
import { MessageSquare, Clock, CheckCircle, AlertCircle, Search, Filter, User, Calendar, Reply, Send, Eye, Plus, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { forumService } from '@/services/forumService';
import type { ForumTopic as ServiceForumTopic, ForumMessage as ServiceForumMessage } from '@/services/forumService';

interface Course {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  professor_name?: string;
}

interface ForumTopic {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  courseStatus: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
  lastActivity?: string;
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
  replies?: ForumMessage[];
}

const AdminForum = () => {
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
  }, [user?.id]);

  useEffect(() => {
    filterTopics();
  }, [topics, searchTerm, courseFilter, statusFilter]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      // Carregar cursos (incluindo não publicados para admin)
      const coursesData = await forumService.getAllCoursesForAdmin();
      setCourses(coursesData);
      
      // Carregar tópicos do fórum
      const topicsData = await forumService.getAllTopicsForAdmin();
      setTopics(topicsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do chat.",
        variant: "destructive",
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
        topic.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    if (!newTopicTitle.trim() || !selectedCourseId) {
      toast({
        title: "Erro",
        description: "Título e curso são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    try {
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
        title: "Sucesso",
        description: "Tópico criado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o tópico.",
        variant: "destructive",
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
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
        variant: "destructive",
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
        title: "Sucesso",
        description: "Mensagem enviada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie discussões de todos os cursos (incluindo não publicados)
          </p>
        </div>
        <Button onClick={() => setIsCreateTopicModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Tópico
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar tópicos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="course-filter">Curso</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cursos</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status do Curso</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tópicos */}
      <div className="grid gap-4">
        {filteredTopics.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum tópico encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || courseFilter !== 'all' || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros para encontrar tópicos.'
                  : 'Ainda não há tópicos criados. Crie o primeiro tópico!'}
              </p>
              <Button onClick={() => setIsCreateTopicModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Tópico
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTopics.map((topic) => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewTopic(topic)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{topic.title}</CardTitle>
                    <CardDescription>
                      {topic.description && (
                        <span className="block mb-2">{topic.description}</span>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {topic.courseName}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {topic.createdByName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(topic.createdAt)}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(topic.courseStatus)}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {topic.messagesCount}
                      </span>
                      {topic.lastActivity && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(topic.lastActivity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Modal para Criar Tópico */}
      <Dialog open={isCreateTopicModalOpen} onOpenChange={setIsCreateTopicModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Tópico</DialogTitle>
            <DialogDescription>
              Crie um novo tópico de discussão para um curso específico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-select">Curso *</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        {course.title}
                        {getStatusBadge(course.status)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topic-title">Título *</Label>
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
                placeholder="Descreva o objetivo deste tópico (opcional)"
                value={newTopicDescription}
                onChange={(e) => setNewTopicDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTopicModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTopic}>
              Criar Tópico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Visualizar Tópico */}
      <Dialog open={isViewTopicModalOpen} onOpenChange={setIsViewTopicModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedTopic?.title}
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-4">
                <span>Curso: {selectedTopic?.courseName}</span>
                {selectedTopic && getStatusBadge(selectedTopic.courseStatus)}
                <span>Por: {selectedTopic?.createdByName}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {selectedTopic?.description && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{selectedTopic.description}</p>
              </div>
            )}
            
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ainda não há mensagens neste tópico.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{message.userName}</span>
                        <Badge variant="outline" className="text-xs">
                          {message.userRole === 'admin' ? 'Admin' : 
                           message.userRole === 'professor' ? 'Professor' : 'Aluno'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyToMessage(message.id)}
                        className="text-xs"
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Responder
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {replyToMessage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Reply className="h-4 w-4" />
                Respondendo a mensagem
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyToMessage(null)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminForum;