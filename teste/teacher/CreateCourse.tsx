import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Upload, BookOpen, Clock, Users, ArrowLeft, Trash2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { teacherService } from '@/services';
import { toast } from '@/hooks/use-toast';
import { Separator } from "@/components/ui/separator";

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  hasAssessment: boolean;
  assessmentTitle: string;
  assessmentDescription: string;
  assessmentPassingScore: number;
  assessmentQuestions: AssessmentQuestion[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  content: string;
  hasFiles: boolean;
  complementaryFiles: File[];
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: string;
}

const CreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    duration: "",
    thumbnail: "",
    category: "",
  });
  
  const [modules, setModules] = useState<Module[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addModule = () => {
    const newModule: Module = {
      id: Date.now().toString(),
      title: "",
      description: "",
      lessons: [],
      hasAssessment: false,
      assessmentTitle: "",
      assessmentDescription: "",
      assessmentPassingScore: 70,
      assessmentQuestions: []
    };
    setModules(prev => [...prev, newModule]);
  };

  const updateModule = (moduleId: string, field: string, value: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, [field]: value }
        : module
    ));
  };

  const removeModule = (moduleId: string) => {
    setModules(prev => prev.filter(module => module.id !== moduleId));
  };

  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: Date.now().toString(),
      title: "",
      description: "",
      duration: "",
      videoUrl: "",
      content: "",
      hasFiles: false,
      complementaryFiles: []
    };
    
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    ));
  };

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            lessons: module.lessons.map(lesson => 
              lesson.id === lessonId 
                ? { ...lesson, [field]: value }
                : lesson
            )
          }
        : module
    ));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
          }
        : module
    ));
  };

  // Funções para gerenciar atividades avaliativas
  const addAssessmentQuestion = (moduleId: string) => {
    const newQuestion: AssessmentQuestion = {
      id: Date.now().toString(),
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: ""
    };
    
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, assessmentQuestions: [...module.assessmentQuestions, newQuestion] }
        : module
    ));
  };

  const removeAssessmentQuestion = (moduleId: string, questionId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            assessmentQuestions: module.assessmentQuestions.filter(q => q.id !== questionId)
          }
        : module
    ));
  };

  const updateAssessmentQuestion = (moduleId: string, questionId: string, field: string, value: any) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            assessmentQuestions: module.assessmentQuestions.map(question => 
              question.id === questionId 
                ? { ...question, [field]: value }
                : question
            )
          }
        : module
    ));
  };

  const updateQuestionOption = (moduleId: string, questionId: string, optionIndex: number, value: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            assessmentQuestions: module.assessmentQuestions.map(question => 
              question.id === questionId 
                ? {
                    ...question,
                    options: question.options.map((option, index) => 
                      index === optionIndex ? value : option
                    )
                  }
                : question
            )
          }
        : module
    ));
  };

  // Funções para gerenciar arquivos complementares
  const handleFileUpload = (moduleId: string, lessonId: string, files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            lessons: module.lessons.map(lesson => 
              lesson.id === lessonId 
                ? {
                    ...lesson,
                    complementaryFiles: [...lesson.complementaryFiles, ...fileArray]
                  }
                : lesson
            )
          }
        : module
    ));
  };

  const removeFile = (moduleId: string, lessonId: string, fileIndex: number) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            lessons: module.lessons.map(lesson => 
              lesson.id === lessonId 
                ? {
                    ...lesson,
                    complementaryFiles: lesson.complementaryFiles.filter((_, index) => index !== fileIndex)
                  }
                : lesson
            )
          }
        : module
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseData.title || !courseData.description || modules.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar se todos os módulos têm pelo menos uma aula
    const invalidModules = modules.filter(module => module.lessons.length === 0);
    if (invalidModules.length > 0) {
      toast({
        title: "Erro",
        description: "Todos os módulos devem ter pelo menos uma aula",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Transformar videoUrl para video_url para compatibilidade com o backend
      const transformedModules = modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          video_url: lesson.videoUrl,
          videoUrl: undefined // Remove o campo videoUrl
        }))
      }));
      
      const coursePayload = {
        ...courseData,
        modules: transformedModules
      };
      
      await teacherService.createCourse(user.id, coursePayload);
      
      toast({
        title: "Sucesso",
        description: "Curso criado com sucesso! Aguarde a aprovação do administrador."
      });
      navigate('/teacher/courses');
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar curso. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/teacher/courses");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Criar Novo Curso</h1>
          <p className="text-muted-foreground">
            Crie um novo curso que será enviado para aprovação
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas do Curso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Curso *</Label>
                <Input
                  id="title"
                  value={courseData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ex: Introdução ao React"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duração Estimada</Label>
                <Input
                  id="duration"
                  value={courseData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="Ex: 20 horas"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Curso *</Label>
              <Textarea
                id="description"
                value={courseData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descreva o que os alunos aprenderão neste curso..."
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programming">Programação</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Negócios</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="data-science">Ciência de Dados</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="thumbnail">URL da Imagem de Capa</Label>
                <Input
                  id="thumbnail"
                  value={courseData.thumbnail}
                  onChange={(e) => handleInputChange("thumbnail", e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  type="url"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Módulos do Curso</CardTitle>
            <Button type="button" onClick={addModule} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Módulo
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {modules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum módulo adicionado ainda.</p>
                <p>Clique em "Adicionar Módulo" para começar.</p>
              </div>
            ) : (
              modules.map((module, moduleIndex) => (
                <Card key={module.id} className="border-l-4 border-l-primary">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Módulo {moduleIndex + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeModule(module.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Título do Módulo</Label>
                        <Input
                          value={module.title}
                          onChange={(e) => updateModule(module.id, "title", e.target.value)}
                          placeholder="Ex: Fundamentos do React"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descrição do Módulo</Label>
                      <Textarea
                        value={module.description}
                        onChange={(e) => updateModule(module.id, "description", e.target.value)}
                        placeholder="Descreva o conteúdo deste módulo..."
                        rows={2}
                      />
                    </div>
                    
                    {/* Seção de Atividade Avaliativa */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`hasAssessment-${module.id}`}
                          checked={module.hasAssessment}
                          onChange={(e) => updateModule(module.id, "hasAssessment", e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`hasAssessment-${module.id}`} className="font-medium">
                          Adicionar Atividade Avaliativa
                        </Label>
                      </div>
                      
                      {module.hasAssessment && (
                        <div className="space-y-3 ml-6 border-l-2 border-blue-200 pl-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-sm">Título da Atividade</Label>
                              <Input
                                value={module.assessmentTitle}
                                onChange={(e) => updateModule(module.id, "assessmentTitle", e.target.value)}
                                placeholder="Ex: Quiz do Módulo 1"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm">Nota de Aprovação (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={module.assessmentPassingScore}
                                onChange={(e) => updateModule(module.id, "assessmentPassingScore", parseInt(e.target.value) || 70)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm">Descrição da Atividade</Label>
                            <Textarea
                              value={module.assessmentDescription}
                              onChange={(e) => updateModule(module.id, "assessmentDescription", e.target.value)}
                              placeholder="Descreva a atividade avaliativa..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Questões</Label>
                              <Button
                                type="button"
                                onClick={() => addAssessmentQuestion(module.id)}
                                variant="outline"
                                size="sm"
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Adicionar Questão
                              </Button>
                            </div>
                            
                            {module.assessmentQuestions.map((question, questionIndex) => (
                              <Card key={question.id} className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Questão {questionIndex + 1}</Label>
                                    <Button
                                      type="button"
                                      onClick={() => removeAssessmentQuestion(module.id, question.id)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <Input
                                    value={question.question}
                                    onChange={(e) => updateAssessmentQuestion(module.id, question.id, "question", e.target.value)}
                                    placeholder="Digite a pergunta..."
                                    className="text-xs"
                                  />
                                  <Select
                                    value={question.type}
                                    onValueChange={(value) => updateAssessmentQuestion(module.id, question.id, "type", value)}
                                  >
                                    <SelectTrigger className="text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                                      <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  {question.type === 'multiple_choice' && (
                                    <div className="space-y-1">
                                      {question.options.map((option, optionIndex) => (
                                        <div key={optionIndex} className="flex items-center space-x-2">
                                          <Input
                                            value={option}
                                            onChange={(e) => updateQuestionOption(module.id, question.id, optionIndex, e.target.value)}
                                            placeholder={`Opção ${optionIndex + 1}`}
                                            className="text-xs flex-1"
                                          />
                                          <input
                                            type="radio"
                                            name={`correct-${module.id}-${question.id}`}
                                            checked={question.correctAnswer === option}
                                            onChange={() => updateAssessmentQuestion(module.id, question.id, "correctAnswer", option)}
                                            className="text-xs"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {question.type === 'true_false' && (
                                    <div className="flex space-x-4">
                                      <label className="flex items-center space-x-1">
                                        <input
                                          type="radio"
                                          name={`correct-${module.id}-${question.id}`}
                                          checked={question.correctAnswer === 'true'}
                                          onChange={() => updateAssessmentQuestion(module.id, question.id, "correctAnswer", 'true')}
                                        />
                                        <span className="text-xs">Verdadeiro</span>
                                      </label>
                                      <label className="flex items-center space-x-1">
                                        <input
                                          type="radio"
                                          name={`correct-${module.id}-${question.id}`}
                                          checked={question.correctAnswer === 'false'}
                                          onChange={() => updateAssessmentQuestion(module.id, question.id, "correctAnswer", 'false')}
                                        />
                                        <span className="text-xs">Falso</span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Aulas do Módulo</h4>
                      <Button
                        type="button"
                        onClick={() => addLesson(module.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Aula
                      </Button>
                    </div>
                    
                    {module.lessons.map((lesson, lessonIndex) => (
                      <Card key={lesson.id} className="ml-4">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <h5 className="font-medium">Aula {lessonIndex + 1}</h5>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLesson(module.id, lesson.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-sm">Título da Aula</Label>
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateLesson(module.id, lesson.id, "title", e.target.value)}
                                placeholder="Ex: Componentes React"
                                className="text-sm"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-sm">Duração</Label>
                              <Input
                                value={lesson.duration}
                                onChange={(e) => updateLesson(module.id, lesson.id, "duration", e.target.value)}
                                placeholder="Ex: 15 min"
                                className="text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-sm">URL do Vídeo</Label>
                            <Input
                              value={lesson.videoUrl}
                              onChange={(e) => updateLesson(module.id, lesson.id, "videoUrl", e.target.value)}
                              placeholder="https://youtube.com/watch?v=..."
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-sm">Descrição da Aula</Label>
                            <Textarea
                              value={lesson.description}
                              onChange={(e) => updateLesson(module.id, lesson.id, "description", e.target.value)}
                              placeholder="Descreva o conteúdo desta aula..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                          
                          {/* Seção de Arquivos Complementares */}
                          <div className="space-y-2 border-t pt-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`hasFiles-${lesson.id}`}
                                checked={lesson.hasFiles}
                                onChange={(e) => updateLesson(module.id, lesson.id, "hasFiles", e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <Label htmlFor={`hasFiles-${lesson.id}`} className="text-sm font-medium">
                                Adicionar Arquivos Complementares
                              </Label>
                            </div>
                            
                            {lesson.hasFiles && (
                              <div className="ml-6 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="file"
                                    multiple
                                    onChange={(e) => handleFileUpload(module.id, lesson.id, e.target.files)}
                                    className="text-xs"
                                    accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                                  />
                                  <Upload className="h-4 w-4 text-gray-400" />
                                </div>
                                
                                {lesson.complementaryFiles.length > 0 && (
                                  <div className="space-y-1">
                                    <Label className="text-xs font-medium">Arquivos Selecionados:</Label>
                                    {lesson.complementaryFiles.map((file, fileIndex) => (
                                      <div key={fileIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                                        <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                                        <Button
                                          type="button"
                                          onClick={() => removeFile(module.id, lesson.id, fileIndex)}
                                          variant="outline"
                                          size="sm"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {module.lessons.length === 0 && (
                      <div className="text-center py-4 text-sm text-muted-foreground ml-4">
                        Nenhuma aula adicionada a este módulo.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={handleBack}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Criar Curso
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCourse;