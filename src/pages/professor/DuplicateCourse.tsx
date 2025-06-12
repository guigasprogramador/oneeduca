import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
// Interface para os dados do curso do banco de dados
interface DatabaseCourse {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: string | null;
  duration_hours: number | null;
  price: number | null;
  expiration_date: string | null;
  image_url: string | null;
  instructor_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const DuplicateCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [originalCourse, setOriginalCourse] = useState<DatabaseCourse | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    duration_hours: "",
    price: "",
    expiration_date: "",
    image_url: ""
  });

  const categories = [
    "Tecnologia",
    "Negócios",
    "Design",
    "Marketing",
    "Desenvolvimento Pessoal",
    "Idiomas",
    "Saúde",
    "Música",
    "Arte",
    "Outros"
  ];

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    } else {
      navigate('/professor/courses');
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Curso não encontrado');

      const courseData = data as unknown as DatabaseCourse;
      setOriginalCourse(courseData);
      setFormData({
        title: `${courseData.title} (Cópia)`,
        description: courseData.description || "",
        category: courseData.category || "",
        level: courseData.level || "beginner",
        duration_hours: courseData.duration_hours?.toString() || "",
        price: courseData.price?.toString() || "",
        expiration_date: courseData.expiration_date || "",
        image_url: courseData.image_url || ""
      });
    } catch (error: any) {
      console.error('Erro ao buscar curso:', error);
      toast.error("Erro ao carregar curso");
      navigate('/professor/courses');
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !courseId) {
      toast.error("Dados insuficientes para duplicação");
      return;
    }

    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('duplicate_course', {
        p_course_id: courseId,
        p_new_title: formData.title,
        p_new_description: formData.description,
        p_new_category: formData.category,
        p_new_level: formData.level,
        p_new_duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
        p_new_price: formData.price ? parseFloat(formData.price) : 0,
        p_new_expiration_date: formData.expiration_date || null,
        p_new_image_url: formData.image_url || null
      });

      if (error) throw error;

      toast.success("Curso duplicado com sucesso!");
      navigate('/professor/courses');
    } catch (error: any) {
      console.error('Erro ao duplicar curso:', error);
      toast.error(error.message || "Erro ao duplicar curso");
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/professor/courses')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Copy className="h-8 w-8" />
          Duplicar Curso
        </h1>
      </div>

      {originalCourse && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Curso Original</CardTitle>
            <CardDescription>
              {originalCourse.title} - {originalCourse.category || 'Sem categoria'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações do Novo Curso</CardTitle>
          <CardDescription>
            Ajuste as informações para o curso duplicado. Todos os módulos e lições serão copiados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDuplicate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Curso *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Digite o título do curso"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Nível</Label>
                <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_hours">Duração (horas)</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => handleInputChange('duration_hours', e.target.value)}
                  placeholder="Ex: 10"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration_date">Data de Expiração</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o conteúdo e objetivos do curso"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/professor/courses')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Copy className="mr-2 h-4 w-4" />
                Duplicar Curso
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DuplicateCourse;