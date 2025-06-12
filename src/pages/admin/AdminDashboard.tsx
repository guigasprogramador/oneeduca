import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { courseService } from "@/services/api";
import { moduleService } from "@/services/moduleService";
import { lessonService } from "@/services/lessonService";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Award, Users, FileText, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalModules: 0,
    totalLessons: 0,
    totalUsers: 0,
    totalCertificates: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const handleNavigateToCourses = () => {
    navigate("/admin/courses");
  };
  
  const handleNavigateToUsers = () => {
    navigate("/admin/users");
  };
  
  const handleNavigateToCertificados = () => {
    navigate("/admin/gerenciador-certificados");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          // Buscar cursos
          const courses = await courseService.getCourses();
          
          // Buscar módulos diretamente do banco de dados
          const { data: modulesData, error: modulesError } = await supabase
            .from('modules')
            .select('id, course_id');
            
          if (modulesError) {
            console.error("Erro ao buscar módulos:", modulesError);
          }
          
          // Buscar aulas diretamente do banco de dados
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('id, module_id');
            
          if (lessonsError) {
            console.error("Erro ao buscar aulas:", lessonsError);
          }
          
          // Calcular totais
          const totalModules = modulesData?.length || 0;
          const totalLessons = lessonsData?.length || 0;
          
          // Obter estatísticas de usuários e certificados do Supabase
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' });
            
          if (usersError) {
            console.error("Erro ao buscar usuários:", usersError);
          }
            
          const { data: certificatesData, error: certificatesError } = await supabase
            .from('certificates')
            .select('id', { count: 'exact' });
          
          if (certificatesError) {
            console.error("Erro ao buscar certificados:", certificatesError);
          }
          
          setStats({
            totalCourses: courses.length,
            totalModules,
            totalLessons,
            totalUsers: usersData?.length || 0,
            totalCertificates: certificatesData?.length || 0,
          });
          
          console.log("Estatísticas do dashboard:", {
            cursos: courses.length,
            modulos: totalModules,
            aulas: totalLessons,
            usuarios: usersData?.length || 0,
            certificados: certificatesData?.length || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Bem-vindo(a) ao painel administrativo, {user?.name}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200" 
          onClick={handleNavigateToCourses}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalModules} módulos, {stats.totalLessons} aulas
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200" 
          onClick={handleNavigateToUsers}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Alunos matriculados na plataforma
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200" 
          onClick={handleNavigateToCertificados}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificados</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCertificates}</div>
            <p className="text-xs text-muted-foreground">
              Certificados emitidos
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Ferramentas Administrativas</CardTitle>
          <CardDescription>
            Acesse as principais ferramentas para gerenciar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate("/admin/courses")}
            >
              <Layers className="h-6 w-6" />
              <span>Gerenciar Cursos</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate("/admin/users")}
            >
              <Users className="h-6 w-6" />
              <span>Gerenciar Usuários</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border-amber-200"
              onClick={() => navigate("/admin/gerenciador-certificados")}
            >
              <Award className="h-6 w-6 text-amber-600" />
              <span className="text-amber-800">Gerenciador de Certificados</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate("/admin/certificates")}
            >
              <FileText className="h-6 w-6" />
              <span>Certificados Antigos</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
