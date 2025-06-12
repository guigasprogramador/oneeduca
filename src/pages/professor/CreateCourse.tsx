import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import courseService from "../../services/courseService";
import { moduleService } from "../../services/moduleService";
import { lessonService } from "../../services/lessonService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Checkbox } from "../../components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { toast } from "../../components/ui/use-toast";
import { 
  ArrowLeft, 
  BookOpen, 
  Plus, 
  Trash2, 
  X, 
  Save,
  FileText,
  Calendar,
  Copy,
  AlertCircle
} from "lucide-react";

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
  complementaryFiles: ComplementaryFile[];
}

interface ComplementaryFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  category: string;
  modules: Module[];
  expirationDate?: string;
  hasEvaluativeActivity: boolean;
  evaluativeActivityDescription?: string;
}

const CreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const [isLoading, setIsLoading] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    duration: "",
    thumbnail: "",
    category: "",
    expirationDate: "",
    hasEvaluativeActivity: false,
    evaluativeActivityDescription: ""
  });
  
  const [modules, setModules] = useState<Module[]>([]);

  // Carregar cursos disponíveis para duplicação
  useEffect(() => {
    loadAvailableCourses();
    if (duplicateId) {
      loadCourseForDuplication(duplicateId);
    }
  }, [duplicateId]);

  const loadAvailableCourses = async () => {
    try {
      // Aqui você implementaria a lógica para carregar os cursos do professor
      // const courses = await courseService.getProfessorCourses(user?.id);
      // setAvailableCourses(courses);
      
      // Mock data para demonstração
      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'Introdução ao React',
          description: 'Curso básico de React',
          duration: '10 horas',
          thumbnail: '',
          category: 'programacao',
          modules: [],
          hasEvaluativeActivity: true,
          evaluativeActivityDescription: 'Projeto final'
        },
        {
          id: '2',
          title: 'JavaScript Avançado',
          description: 'Conceitos avançados de JavaScript',
          duration: '15 horas',
          thumbnail: '',
          category: 'programacao',
          modules: [],
          hasEvaluativeActivity: false
        }
      ];
      setAvailableCourses(mockCourses);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
    }
  };

  const loadCourseForDuplication = async (courseId: string) => {
    try {
      // Aqui você implementaria a lógica para carregar o curso específico
      // const course = await courseService.getCourse(courseId);
      // duplicateCourse(course);
      
      // Mock para demonstração
      const mockCourse = availableCourses.find(c => c.id === courseId);
      if (mockCourse) {
        duplicateCourse(mockCourse);
      }
    } catch (error) {
      console.error('Erro ao carregar curso para duplicação:', error);
    }
  };

  const duplicateCourse = (course: Course) => {
    setCourseData({
      title: `${course.title} (Cópia)`,
      description: course.description,
      duration: course.duration,
      thumbnail: course.thumbnail,
      category: course.category,
      expirationDate: "",
      hasEvaluativeActivity: course.hasEvaluativeActivity,
      evaluativeActivityDescription: course.evaluativeActivityDescription || ""
    });
    setModules(course.modules);
    toast({
      title: "Curso duplicado!",
      description: "O curso foi carregado para edição. Faça as alterações necessárias."
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setCourseData(prev => ({
      ...prev,
      [field]: field === 'hasEvaluativeActivity' ? value === 'true' || value === true : value
    }));
  };

  // Adicionar useEffect para importar toast
  useEffect(() => {
    // Importar toast se necessário
  }, []);

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

  // Funções para gerenciar questões de avaliação
  const addAssessmentQuestion = (moduleId: string) => {
    const newQuestion: AssessmentQuestion = {
      id: Date.now().toString(),
      question: "",
      type: 'multiple_choice',
      options: ["", ""],
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

  const updateAssessmentQuestion = (moduleId: string, questionId: string, field: string, value: string) => {
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

  const addQuestionOption = (moduleId: string, questionId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            assessmentQuestions: module.assessmentQuestions.map(question => 
              question.id === questionId 
                ? { ...question, options: [...question.options, ""] }
                : question
            )
          }
        : module
    ));
  };

  const removeQuestionOption = (moduleId: string, questionId: string, optionIndex: number) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            assessmentQuestions: module.assessmentQuestions.map(question => 
              question.id === questionId 
                ? {
                    ...question,
                    options: question.options.filter((_, index) => index !== optionIndex)
                  }
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

  const handleFileUpload = (moduleId: string, lessonId: string, files: FileList | null) => {
    if (!files) return;
    
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const newFiles: ComplementaryFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo não permitido",
          description: `O arquivo ${file.name} não é um tipo permitido (PDF, JPEG, PNG, Word).`,
          variant: "destructive"
        });
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo ${file.name} excede o limite de 10MB.`,
          variant: "destructive"
        });
        continue;
      }
      
      newFiles.push({
        id: `${Date.now()}-${i}`,
        name: file.name,
        type: file.type,
        size: file.size,
        file: file
      });
    }
    
    if (newFiles.length > 0) {
      setModules(prev => prev.map(module => 
        module.id === moduleId 
          ? {
              ...module,
              lessons: module.lessons.map(lesson => 
                lesson.id === lessonId
                  ? {
                      ...lesson,
                      complementaryFiles: [...lesson.complementaryFiles, ...newFiles]
                    }
                  : lesson
              )
            }
          : module
      ));
      
      toast({
        title: "Arquivos adicionados!",
        description: `${newFiles.length} arquivo(s) foram adicionados à aula.`
      });
    }
  };

  const removeFile = (moduleId: string, lessonId: string, fileId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            lessons: module.lessons.map(lesson => 
              lesson.id === lessonId
                ? {
                    ...lesson,
                    complementaryFiles: lesson.complementaryFiles.filter(file => file.id !== fileId)
                  }
                : lesson
            )
          }
        : module
    ));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validação básica
      if (!courseData.title || !courseData.description || !courseData.category || modules.length === 0) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios e adicione pelo menos um módulo.",
          variant: "destructive"
        });
        return;
      }

      if (courseData.expirationDate) {
        const expirationDate = new Date(courseData.expirationDate);
        const today = new Date();
        if (expirationDate <= today) {
          toast({
            title: "Data de expiração inválida",
            description: "A data de expiração deve ser posterior à data atual.",
            variant: "destructive"
          });
          return;
        }
      }

      if (courseData.hasEvaluativeActivity && !courseData.evaluativeActivityDescription) {
        toast({
          title: "Descrição da atividade obrigatória",
          description: "Por favor, descreva a atividade avaliativa.",
          variant: "destructive"
        });
        return;
      }

      // Preparar dados do curso com os novos campos
      const coursePayload = {
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail || '/placeholder.svg',
        duration: courseData.duration || '60',
        instructor: courseData.instructor || user?.name || 'Professor',
        professor_id: user?.id,
        status: 'pending',
        expiry_date: courseData.expirationDate || null
      };
      
      console.log('Dados do curso a serem enviados:', coursePayload);
      
      // Criar o curso no banco de dados
      const result = await courseService.createCourse(coursePayload);
      
      console.log('Curso criado:', result);
      
      // Agora criar os módulos e aulas
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const module = modules[moduleIndex];
        
        // Preparar dados do quiz se existir
        let quizData = null;
        if (module.hasAssessment && module.assessmentQuestions.length > 0) {
          quizData = {
            title: module.assessmentTitle || 'Quiz do Módulo',
            description: module.assessmentDescription || '',
            passingScore: module.assessmentPassingScore || 70,
            timeLimit: 30, // 30 minutos por padrão
            questions: module.assessmentQuestions.map(q => ({
              id: q.id,
              type: q.type,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: '',
              points: 1
            }))
          };
        }
        
        // Criar módulo
        const modulePayload = {
          title: module.title,
          description: module.description,
          order: moduleIndex + 1,
          hasQuiz: module.hasAssessment,
          quizData: quizData
        };
        
        console.log(`Criando módulo ${moduleIndex + 1}:`, modulePayload);
        
        const moduleResult = await moduleService.createModule(result.id, modulePayload);
        
        console.log(`Módulo ${moduleIndex + 1} criado:`, moduleResult);
        
        // Criar aulas do módulo
        for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
          const lesson = module.lessons[lessonIndex];
          
          const lessonPayload = {
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            videoUrl: lesson.videoUrl,
            content: lesson.content,
            order: lessonIndex + 1,
            attachments: [] // Por enquanto vazio, pode ser implementado depois
          };
          
          console.log(`Criando aula ${lessonIndex + 1} do módulo ${moduleIndex + 1}:`, lessonPayload);
          
          const lessonResult = await lessonService.createLesson(moduleResult.id, lessonPayload);
          
          console.log(`Aula ${lessonIndex + 1} do módulo ${moduleIndex + 1} criada:`, lessonResult);
        }
      }
      
      toast({
        title: "Curso criado com sucesso!",
        description: "O curso com todos os módulos e aulas foi enviado para aprovação e aparecerá na lista de cursos pendentes."
      });
      
      navigate('/professor/courses');
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      toast({
        title: "Erro ao criar curso",
        description: "Ocorreu um erro ao criar o curso. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/professor/courses')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Criar Novo Curso</h1>
            <p className="text-muted-foreground">
              Crie um curso completo com módulos, aulas e avaliações
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas do Curso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Defina as informações principais do seu curso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Curso *</Label>
                <Input
                  id="title"
                  value={courseData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Introdução ao React"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={courseData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programacao">Programação</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="negocios">Negócios</SelectItem>
                    <SelectItem value="idiomas">Idiomas</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={courseData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o que os alunos aprenderão neste curso..."
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração Estimada</Label>
                <Input
                  id="duration"
                  value={courseData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="Ex: 10 horas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail">URL da Thumbnail</Label>
                <Input
                  id="thumbnail"
                  value={courseData.thumbnail}
                  onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expirationDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Expiração (Opcional)
                </Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={courseData.expirationDate}
                  onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco se o curso não tiver data de expiração
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDuplicateDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicar Curso Existente
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEvaluativeActivity"
                  checked={courseData.hasEvaluativeActivity}
                  onCheckedChange={(checked) => 
                    handleInputChange('hasEvaluativeActivity', checked.toString())
                  }
                />
                <Label htmlFor="hasEvaluativeActivity" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Este curso possui atividade avaliativa
                </Label>
              </div>
              
              {courseData.hasEvaluativeActivity && (
                <div className="space-y-2">
                  <Label htmlFor="evaluativeActivityDescription">Descrição da Atividade Avaliativa *</Label>
                  <Textarea
                    id="evaluativeActivityDescription"
                    value={courseData.evaluativeActivityDescription}
                    onChange={(e) => handleInputChange('evaluativeActivityDescription', e.target.value)}
                    placeholder="Descreva a atividade avaliativa que será aplicada aos alunos..."
                    rows={3}
                    required={courseData.hasEvaluativeActivity}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Módulos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Módulos do Curso</CardTitle>
                <CardDescription>
                  Organize seu curso em módulos com aulas e avaliações
                </CardDescription>
              </div>
              <Button type="button" onClick={addModule} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Módulo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum módulo adicionado ainda.</p>
                <p className="text-sm">Clique em "Adicionar Módulo" para começar.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {modules.map((module, moduleIndex) => (
                  <Card key={module.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Módulo {moduleIndex + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeModule(module.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Título do Módulo *</Label>
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(module.id, 'title', e.target.value)}
                            placeholder="Ex: Fundamentos do React"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Descrição do Módulo</Label>
                        <Textarea
                          value={module.description}
                          onChange={(e) => updateModule(module.id, 'description', e.target.value)}
                          placeholder="Descreva o que será abordado neste módulo..."
                          rows={3}
                        />
                      </div>

                      <Separator />

                      {/* Avaliação do Módulo */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`hasAssessment-${module.id}`}
                            checked={module.hasAssessment}
                            onCheckedChange={(checked) => updateModule(module.id, 'hasAssessment', checked)}
                          />
                          <Label htmlFor={`hasAssessment-${module.id}`} className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Este módulo possui quiz de avaliação
                          </Label>
                        </div>
                        
                        {module.hasAssessment && (
                          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Título da Avaliação *</Label>
                                <Input
                                  value={module.assessmentTitle}
                                  onChange={(e) => updateModule(module.id, 'assessmentTitle', e.target.value)}
                                  placeholder="Ex: Quiz - Fundamentos do React"
                                  required={module.hasAssessment}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Nota Mínima para Aprovação</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={module.assessmentPassingScore}
                                  onChange={(e) => updateModule(module.id, 'assessmentPassingScore', parseInt(e.target.value) || 0)}
                                  placeholder="70"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Descrição da Avaliação</Label>
                              <Textarea
                                value={module.assessmentDescription}
                                onChange={(e) => updateModule(module.id, 'assessmentDescription', e.target.value)}
                                placeholder="Descreva o objetivo desta avaliação..."
                                rows={2}
                              />
                            </div>
                            
                            {/* Questões do Quiz */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="font-medium">Questões do Quiz</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addAssessmentQuestion(module.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Questão
                                </Button>
                              </div>
                              
                              {module.assessmentQuestions.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                  Nenhuma questão adicionada ainda.
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {module.assessmentQuestions.map((question, questionIndex) => (
                                    <Card key={question.id} className="bg-background">
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <Badge variant="outline">Questão {questionIndex + 1}</Badge>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeAssessmentQuestion(module.id, question.id)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        
                                        <div className="space-y-3">
                                          <div className="space-y-2">
                                            <Label>Pergunta *</Label>
                                            <Textarea
                                              value={question.question}
                                              onChange={(e) => updateAssessmentQuestion(module.id, question.id, 'question', e.target.value)}
                                              placeholder="Digite a pergunta..."
                                              rows={2}
                                              required
                                            />
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <Label>Tipo de Questão</Label>
                                            <Select 
                                              value={question.type} 
                                              onValueChange={(value) => updateAssessmentQuestion(module.id, question.id, 'type', value)}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                                                <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          
                                          {question.type === 'multiple_choice' && (
                                            <div className="space-y-2">
                                              <Label>Opções de Resposta</Label>
                                              {question.options.map((option, optionIndex) => (
                                                <div key={optionIndex} className="flex items-center gap-2">
                                                  <Input
                                                    value={option}
                                                    onChange={(e) => updateQuestionOption(module.id, question.id, optionIndex, e.target.value)}
                                                    placeholder={`Opção ${optionIndex + 1}`}
                                                  />
                                                  {question.options.length > 2 && (
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="icon"
                                                      onClick={() => removeQuestionOption(module.id, question.id, optionIndex)}
                                                    >
                                                      <X className="h-4 w-4" />
                                                    </Button>
                                                  )}
                                                </div>
                                              ))}
                                              {question.options.length < 5 && (
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => addQuestionOption(module.id, question.id)}
                                                >
                                                  <Plus className="h-4 w-4 mr-2" />
                                                  Adicionar Opção
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                          
                                          <div className="space-y-2">
                                            <Label>Resposta Correta *</Label>
                                            {question.type === 'multiple_choice' ? (
                                              <Select 
                                                value={question.correctAnswer} 
                                                onValueChange={(value) => updateAssessmentQuestion(module.id, question.id, 'correctAnswer', value)}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Selecione a resposta correta" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {question.options.map((option, index) => (
                                                    <SelectItem key={index} value={option || `option_${index}`}>
                                                      {option || `Opção ${index + 1}`}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Select 
                                                value={question.correctAnswer} 
                                                onValueChange={(value) => updateAssessmentQuestion(module.id, question.id, 'correctAnswer', value)}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Selecione a resposta correta" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="true">Verdadeiro</SelectItem>
                                                  <SelectItem value="false">Falso</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Aulas do Módulo */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Aulas do Módulo</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addLesson(module.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Aula
                          </Button>
                        </div>
                        
                        {module.lessons.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            Nenhuma aula adicionada ainda.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <Card key={lesson.id} className="bg-muted/50">
                                <CardContent className="pt-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <Badge variant="outline">Aula {lessonIndex + 1}</Badge>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeLesson(module.id, lesson.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Título da Aula *</Label>
                                      <Input
                                        value={lesson.title}
                                        onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                                        placeholder="Ex: Componentes e Props"
                                        required
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Duração</Label>
                                      <Input
                                        value={lesson.duration}
                                        onChange={(e) => updateLesson(module.id, lesson.id, 'duration', e.target.value)}
                                        placeholder="Ex: 30 min"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2 mt-4">
                                    <Label>URL do Vídeo</Label>
                                    <Input
                                      value={lesson.videoUrl}
                                      onChange={(e) => updateLesson(module.id, lesson.id, 'videoUrl', e.target.value)}
                                      placeholder="https://youtube.com/watch?v=..."
                                    />
                                  </div>
                                  
                                  <div className="space-y-2 mt-4">
                                    <Label>Descrição da Aula</Label>
                                    <Textarea
                                      value={lesson.description}
                                      onChange={(e) => updateLesson(module.id, lesson.id, 'description', e.target.value)}
                                      placeholder="Descreva o conteúdo desta aula..."
                                      rows={2}
                                    />
                                  </div>
                                  
                                  {/* Arquivos Complementares */}
                                  <div className="space-y-3 mt-4">
                                    <div className="flex items-center justify-between">
                                      <Label className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Arquivos Complementares
                                      </Label>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="file"
                                          multiple
                                          accept=".pdf,.jpeg,.jpg,.png,.doc,.docx"
                                          onChange={(e) => handleFileUpload(module.id, lesson.id, e.target.files)}
                                          className="hidden"
                                          id={`file-upload-${module.id}-${lesson.id}`}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const input = document.getElementById(`file-upload-${module.id}-${lesson.id}`) as HTMLInputElement;
                                            input?.click();
                                          }}
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Adicionar Arquivos
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <p className="text-xs text-muted-foreground">
                                      Formatos aceitos: PDF, JPEG, PNG, Word (máx. 10MB por arquivo)
                                    </p>
                                    
                                    {lesson.complementaryFiles.length > 0 && (
                                      <div className="space-y-2">
                                        {lesson.complementaryFiles.map((file) => (
                                          <div key={file.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4 text-muted-foreground" />
                                              <div>
                                                <p className="text-sm font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                  {formatFileSize(file.size)}
                                                </p>
                                              </div>
                                            </div>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => removeFile(module.id, lesson.id, file.id)}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/professor/courses')}
          >
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
                <Save className="h-4 w-4 mr-2" />
                Criar Curso
              </>
            )}
          </Button>
        </div>
      </form>
      
      {/* Dialog para Duplicar Curso */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Duplicar Curso Existente
            </DialogTitle>
            <DialogDescription>
              Selecione um curso existente para usar como base. Você poderá modificar todas as informações após a duplicação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {availableCourses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum curso disponível para duplicação.</p>
                <p className="text-sm">Crie seu primeiro curso para poder duplicá-lo posteriormente.</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {availableCourses.map((course) => (
                  <Card 
                    key={course.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      duplicateCourse(course);
                      setIsDuplicateDialogOpen(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{course.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>📚 {course.category}</span>
                            <span>⏱️ {course.duration}</span>
                            {course.hasEvaluativeActivity && (
                              <span className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Com atividade avaliativa
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDuplicateDialogOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateCourse;