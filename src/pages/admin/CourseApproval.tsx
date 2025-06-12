import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Eye, Clock, User, Calendar, DollarSign, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration_hours: number;
  price?: number; // não utilizado
  created_at: string;
  expiration_date?: string;
  image_url?: string;
  instructor?: {
    name: string;
    email: string;
    avatar_url?: string | null;
  };
  modules_count: number;
  lessons_count?: number;
}

const CourseApproval = () => {
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<PendingCourse | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  useEffect(() => {
    fetchPendingCourses();
  }, []);

  const fetchPendingCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          modules_count:modules(count)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos professores separadamente
      const professorIds = [...new Set((data || []).map((course: any) => course.professor_id).filter(Boolean))];
      const { data: instructors } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', professorIds);

      // Converte a estrutura retornada pelo Supabase para formatos simples
      const formattedCourses = (data as any[] || []).map((course) => {
        const instructor = instructors?.find(i => i.id === course.professor_id);
        return {
          ...course,
          instructor: instructor || { name: 'Professor não encontrado', email: '', avatar_url: '' },
          // `modules_count` vem como array com objeto { count }
          modules_count: course.modules_count?.[0]?.count ?? 0,
        };
      });

      setCourses(formattedCourses);
    } catch (error: any) {
      console.error('Erro ao buscar cursos pendentes:', error);
      toast.error("Erro ao carregar cursos pendentes");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    setActionLoading(courseId);

    try {
      const { error } = await supabase.rpc('approve_course', {
        p_course_id: courseId
      });

      if (error) throw error;

      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast.success("Curso aprovado com sucesso!");
    } catch (error: any) {
      console.error('Erro ao aprovar curso:', error);
      toast.error(error.message || "Erro ao aprovar curso");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCourse = async () => {
    if (!selectedCourse || !rejectionReason.trim()) {
      toast.error("Por favor, forneça um motivo para a rejeição");
      return;
    }

    setActionLoading(selectedCourse.id);

    try {
      const { error } = await supabase.rpc('reject_course', {
        p_course_id: selectedCourse.id,
        p_rejection_reason: rejectionReason
      });

      if (error) throw error;

      setCourses(prev => prev.filter(course => course.id !== selectedCourse.id));
      setIsRejectDialogOpen(false);
      setSelectedCourse(null);
      setRejectionReason("");
      toast.success("Curso rejeitado com sucesso!");
    } catch (error: any) {
      console.error('Erro ao rejeitar curso:', error);
      toast.error(error.message || "Erro ao rejeitar curso");
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return level;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CheckCircle className="h-8 w-8" />
          Aprovação de Cursos
        </h1>
        <p className="text-muted-foreground mt-2">
          Revise e aprove cursos enviados pelos professores
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum curso pendente</h3>
            <p className="text-muted-foreground text-center">
              Todos os cursos foram revisados. Novos cursos aparecerão aqui quando enviados pelos professores.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {course.image_url && (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
                      <div className="flex items-center gap-3 mb-3">
                        {course.instructor ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={course.instructor.avatar_url ?? undefined} />
                            <AvatarFallback>{getInitials(course.instructor.name)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="font-medium text-sm">{course.instructor?.name ?? 'Desconhecido'}</p>
                          <p className="text-xs text-muted-foreground">{course.instructor?.email ?? '-'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{course.category}</Badge>
                        <Badge className={getLevelBadgeColor(course.level)}>
                          {getLevelText(course.level)}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(course.created_at), { addSuffix: true, locale: ptBR })}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 text-base">
                  {course.description}
                </CardDescription>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{course.duration_hours}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{course.modules_count} módulos</span>
                  </div>
                  {course.lessons_count !== undefined && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{course.lessons_count} lições</span>
                    </div>
                  )}
                </div>

                {course.expiration_date && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Expira em: {new Date(course.expiration_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApproveCourse(course.id)}
                    disabled={actionLoading === course.id}
                    className="flex-1"
                  >
                    {actionLoading === course.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Aprovar
                  </Button>
                  
                  <Dialog open={isRejectDialogOpen && selectedCourse?.id === course.id} onOpenChange={(open) => {
                    setIsRejectDialogOpen(open);
                    if (open) setSelectedCourse(course);
                    else {
                      setSelectedCourse(null);
                      setRejectionReason("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rejeitar Curso</DialogTitle>
                        <DialogDescription>
                          Por favor, forneça um motivo para a rejeição do curso "{course.title}"
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reason">Motivo da Rejeição</Label>
                          <Textarea
                            id="reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explique por que o curso está sendo rejeitado..."
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsRejectDialogOpen(false);
                              setSelectedCourse(null);
                              setRejectionReason("");
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleRejectCourse}
                            disabled={actionLoading === course.id}
                          >
                            {actionLoading === course.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Rejeitar Curso
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseApproval;