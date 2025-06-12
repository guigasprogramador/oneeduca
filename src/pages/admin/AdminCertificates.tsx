import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Certificate, User, Course } from "@/types";
import { certificateService } from "@/services";
import { userService } from "@/services";
import { courseService } from "@/services";
import { getEnrolledUsers } from "@/services/courses/enrollmentService";
import { toast } from "sonner";
import { Plus, Download, Search, RefreshCw, Loader2, MoreHorizontal, Eye, Edit, Trash } from "lucide-react";
import { CreateCertificateData } from "@/services/certificateService";

// Interface para usuários com status de certificado
interface EnrolledUser extends User {
  hasCertificate: boolean;
  progress?: number;
  enrolledAt?: string;
}

// Interface para os dados do formulário de certificado
interface CertificateFormData {
  userId: string;
  courseId: string;
  userName: string;
  courseName: string;
}

const defaultFormData: CertificateFormData = {
  userId: "",
  courseId: "",
  userName: "",
  courseName: "",
};

const AdminCertificates = () => {
  // Estado para certificados
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([]);
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEnrolledUsers, setIsLoadingEnrolledUsers] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CertificateFormData>(defaultFormData);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCertificateId, setEditingCertificateId] = useState<string | null>(null);
  const [showEnrolledUsers, setShowEnrolledUsers] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    fetchCertificates();
    fetchUsers();
    fetchCourses();
  }, []);

  // Buscar certificados
  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await certificateService.getCertificates();
      setCertificates(data || []);
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setError("Não foi possível carregar os certificados");
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Buscar cursos
  const fetchCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  // Função para buscar alunos matriculados em um curso específico
  const fetchEnrolledUsers = async (courseId: string) => {
    if (courseId === 'all') {
      setEnrolledUsers([]);
      setShowEnrolledUsers(false);
      return;
    }
    
    try {
      setIsLoadingEnrolledUsers(true);
      setShowEnrolledUsers(true);
      
      console.log('Buscando alunos matriculados para o curso ID:', courseId);
      
      // Verificar se o usuário atual tem um perfil válido
      try {
        const { data: currentUserProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .single();
          
        if (profileError || !currentUserProfile) {
          console.log('Perfil do usuário atual não encontrado, tentando criar automaticamente...');
          
          // Buscar dados do usuário autenticado
          const { data: authData } = await supabase.auth.getUser();
          
          if (authData?.user) {
            // Criar perfil do usuário automaticamente
            const { error: createError } = await supabase
              .from('profiles')
              .upsert({
                id: authData.user.id,
                name: authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || 'Usuário',
                email: authData.user.email,
                role: authData.user.user_metadata?.role || 'student',
                created_at: new Date().toISOString()
              });
              
            if (createError) {
              console.error('Erro ao criar perfil do usuário atual:', createError);
            } else {
              console.log('Perfil do usuário atual criado automaticamente');
            }
          }
        } else {
          console.log('Perfil do usuário atual encontrado:', currentUserProfile);
        }
      } catch (profileCheckError) {
        console.error('Erro ao verificar perfil do usuário atual:', profileCheckError);
      }
      
      // Buscar certificados para este curso
      const certificates = await certificateService.getCertificates(undefined, courseId);
      console.log('Certificados encontrados para o curso:', certificates);
      
      // Buscar alunos matriculados no curso usando a função aprimorada
      const enrolledStudents = await getEnrolledUsers(courseId);
      console.log('Alunos matriculados encontrados:', enrolledStudents);
      
      if (!enrolledStudents || enrolledStudents.length === 0) {
        console.log('Nenhum aluno matriculado retornado pela função getEnrolledUsers');
        setEnrolledUsers([]);
        toast.warning("Nenhum aluno matriculado encontrado neste curso.");
        setIsLoadingEnrolledUsers(false);
        return;
      }
      
      // Criar um conjunto com os IDs dos usuários que têm certificados
      const userIdsWithCertificates = new Set(certificates.map(cert => cert.userId));
      console.log('IDs de usuários com certificados:', [...userIdsWithCertificates]);
      
      // Marcar os usuários que têm certificados
      const usersWithCertificateStatus = enrolledStudents.map(user => ({
        ...user,
        hasCertificate: userIdsWithCertificates.has(user.id)
      })) as EnrolledUser[];
      
      console.log('Usuários matriculados com status de certificado:', usersWithCertificateStatus);
      
      // Definir os usuários matriculados
      setEnrolledUsers(usersWithCertificateStatus);
      
      // A mensagem de toast já é exibida na função getEnrolledUsers
    } catch (err) {
      console.error(`Erro ao buscar alunos matriculados no curso ${courseId}:`, err);
      toast.error(`Erro ao carregar alunos matriculados: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setEnrolledUsers([]);
    } finally {
      setIsLoadingEnrolledUsers(false);
    }
  };

  // Filtrar certificados com base nos critérios de pesquisa
  const filteredCertificates = certificates.filter(cert => {
    if (!cert) return false;
    
    const matchesSearch = !searchTerm || 
      (cert.userName && cert.userName.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (cert.courseName && cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCourse = filterCourse === 'all' || cert.courseId === filterCourse;
    
    return matchesSearch && matchesCourse;
  });

  // Manipuladores de eventos
  const handleUserChange = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    setFormData(prev => ({
      ...prev,
      userId,
      userName: selectedUser?.name || "",
    }));
  };

  const handleCourseChange = (courseId: string) => {
    const selectedCourse = courses.find(course => course.id === courseId);
    setFormData(prev => ({
      ...prev,
      courseId,
      courseName: selectedCourse?.title || "",
    }));
    
    // Quando o curso é alterado no filtro, buscar alunos matriculados
    if (courseId !== 'all') {
      fetchEnrolledUsers(courseId);
    } else {
      setShowEnrolledUsers(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingCertificateId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.courseId) {
      toast.error("Selecione um aluno e um curso");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (editingCertificateId) {
        // Editar certificado existente
        await certificateService.updateCertificate(editingCertificateId, formData);
        toast.success("Certificado atualizado com sucesso!");
      } else {
        // Criar novo certificado
        await certificateService.createCertificate(formData);
        toast.success("Certificado criado com sucesso!");
      }
      
      // Recarregar certificados e resetar formulário
      fetchCertificates();
      resetForm();
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error saving certificate:", err);
      toast.error("Erro ao salvar certificado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateCertificate = async (userId: string, courseId: string) => {
    try {
      await certificateService.generateCertificate(courseId, userId);
      toast.success("Certificado gerado com sucesso!");
      fetchCertificates();
    } catch (err) {
      console.error("Error generating certificate:", err);
      toast.error("Erro ao gerar certificado");
    }
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setFormData({
      userId: certificate.userId,
      courseId: certificate.courseId,
      userName: certificate.userName,
      courseName: certificate.courseName,
    });
    setEditingCertificateId(certificate.id);
    setIsDialogOpen(true);
  };

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!confirm("Tem certeza que deseja excluir este certificado?")) return;
    
    try {
      await certificateService.deleteCertificate(certificateId);
      toast.success("Certificado excluído com sucesso!");
      fetchCertificates();
    } catch (err) {
      console.error("Error deleting certificate:", err);
      toast.error("Erro ao excluir certificado");
    }
  };

  const handleDownloadCertificate = (certificateUrl: string) => {
    window.open(certificateUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Certificados</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Certificado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCertificateId ? "Editar" : "Novo"} Certificado</DialogTitle>
              <DialogDescription>
                {editingCertificateId
                  ? "Edite os detalhes do certificado."
                  : "Preencha os detalhes para criar um novo certificado."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user" className="text-right">
                    Aluno
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.userId}
                      onValueChange={handleUserChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="course" className="text-right">
                    Curso
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.courseId}
                      onValueChange={handleCourseChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um curso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre os certificados por curso ou pesquise por nome</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select
                value={filterCourse}
                onValueChange={(value) => {
                  setFilterCourse(value);
                  handleCourseChange(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um curso" />
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
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterCourse('all');
                setShowEnrolledUsers(false);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de certificados */}
      <Card>
        <CardHeader>
          <CardTitle>Certificados Emitidos</CardTitle>
          <CardDescription>
            {filteredCertificates.length} certificados encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/15 p-4 text-center">
              <p className="text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchCertificates}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum certificado encontrado.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Data de Emissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates.map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell>{certificate.userName}</TableCell>
                      <TableCell>{certificate.courseName}</TableCell>
                      <TableCell>
                        {new Date(certificate.issueDate).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {certificate.certificateUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadCertificate(certificate.certificateUrl || '')}
                            >
                              <Download className="h-4 w-4 mr-1" /> Baixar
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCertificate(certificate)}>
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteCertificate(certificate.id)}>
                                <Trash className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de alunos matriculados */}
      {showEnrolledUsers && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Alunos Matriculados</CardTitle>
            <CardDescription>
              {courses.find(c => c.id === filterCourse)?.title || ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEnrolledUsers ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : enrolledUsers.length === 0 ? (
              <p className="text-muted-foreground py-4">Nenhum aluno matriculado neste curso.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Data de Matrícula</TableHead>
                      <TableHead>Status do Certificado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.enrolledAt ? new Date(user.enrolledAt).toLocaleDateString('pt-BR') : new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          {user.hasCertificate ? (
                            <Badge className="bg-green-500">Certificado Emitido</Badge>
                          ) : (
                            <Badge variant="outline">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.hasCertificate ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Aqui você pode implementar a lógica para visualizar o certificado
                                  toast.info(`Visualizando certificado de ${user.name}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" /> Ver Certificado
                              </Button>
                            ) : (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => {
                                  // Preencher o formulário com os dados do usuário e do curso
                                  setFormData({
                                    ...formData,
                                    userId: user.id,
                                    userName: user.name,
                                    courseId: filterCourse,
                                    courseName: courses.find(c => c.id === filterCourse)?.title || ''
                                  });
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Emitir Certificado
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCertificates;
