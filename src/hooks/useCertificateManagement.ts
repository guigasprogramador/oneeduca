import { useState, useCallback, useEffect } from 'react';
import { useCertificateContext } from '@/contexts/CertificateContext';
import { Certificate } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CertificateFormData {
  userId: string;
  courseId: string;
  userName: string;
  courseName: string;
  issueDate?: string;
  expiryDate?: string;
  certificateUrl?: string;
}

const defaultFormData: CertificateFormData = {
  userId: "",
  courseId: "",
  userName: "",
  courseName: "",
  issueDate: new Date().toISOString(),
  expiryDate: undefined,
  certificateUrl: undefined
};

export function useCertificateManagement() {
  const { 
    state, 
    fetchCertificates, 
    fetchCoursesWithEnrollments, 
    fetchEnrolledUsersForCourse,
    filterCertificates,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    generateCertificate
  } = useCertificateContext();
  
  const { isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CertificateFormData>(defaultFormData);
  const [editingCertificateId, setEditingCertificateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('all');

  // Carregar dados iniciais
  useEffect(() => {
    console.log('Inicializando hook useCertificateManagement...');
    // Os dados já são carregados pelo contexto, não precisamos fazer isso novamente aqui
    // Isso evita o loop infinito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
    setEditingCertificateId(null);
  }, []);

  // Handlers para mudanças de formulário
  const handleUserChange = useCallback((userId: string, userName: string) => {
    console.log(`Selecionado usuário: ${userName} (${userId})`);
    setFormData(prev => ({
      ...prev,
      userId,
      userName
    }));
  }, []);

  const handleCourseChange = useCallback((courseId: string, courseName: string) => {
    console.log(`Selecionado curso: ${courseName} (${courseId})`);
    
    // Reset o userId quando mudar de curso para evitar seleção inválida
    setFormData(prev => ({
      ...prev,
      courseId,
      courseName,
      userId: "",  // Limpar a seleção de usuário quando trocar de curso
      userName: ""
    }));

    // Buscar alunos matriculados no curso selecionado diretamente do contexto
    console.log(`Buscando alunos matriculados no curso: ${courseId}`);
    fetchEnrolledUsersForCourse(courseId);
  }, [fetchEnrolledUsersForCourse]);

  // Handler para submit do formulário
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin()) {
      toast.error("Você não tem permissão para gerenciar certificados");
      return;
    }
    
    if (!formData.userId || !formData.courseId) {
      toast.error("Selecione um aluno e um curso");
      return;
    }
    
    console.log('Dados do formulário antes do envio:', formData);
    
    try {
      console.log('Iniciando criação/atualização de certificado:', formData);
      setIsSubmitting(true);
      
      if (editingCertificateId) {
        console.log(`Atualizando certificado com ID: ${editingCertificateId}`);
        await updateCertificate(editingCertificateId, formData);
        toast.success("Certificado atualizado com sucesso");
      } else {
        console.log('Criando novo certificado');
        await createCertificate(formData);
        toast.success("Certificado criado com sucesso");
      }
      
      // Atualizar a lista de certificados
      await fetchCertificates();
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao processar certificado:", error);
      toast.error("Erro ao processar certificado");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingCertificateId, isAdmin, createCertificate, updateCertificate, resetForm, fetchCertificates]);

  // Handler para editar certificado
  const handleEditCertificate = useCallback((certificate: Certificate) => {
    setEditingCertificateId(certificate.id);
    setFormData({
      userId: certificate.userId,
      courseId: certificate.courseId,
      userName: certificate.userName,
      courseName: certificate.courseName,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      certificateUrl: certificate.certificateUrl
    });
    setIsDialogOpen(true);
  }, []);

  // Handler para excluir certificado
  const handleDeleteCertificate = useCallback(async (certificateId: string) => {
    if (!isAdmin()) {
      toast.error("Você não tem permissão para excluir certificados");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este certificado?")) {
      return;
    }

    try {
      await deleteCertificate(certificateId);
    } catch (error) {
      console.error("Erro ao excluir certificado:", error);
    }
  }, [isAdmin, deleteCertificate]);

  // Handler para gerar certificado
  const handleGenerateCertificate = useCallback(async (userId: string, courseId: string) => {
    if (!isAdmin()) {
      toast.error("Você não tem permissão para gerar certificados");
      return;
    }

    try {
      await generateCertificate(courseId, userId);
    } catch (error) {
      console.error("Erro ao gerar certificado:", error);
    }
  }, [isAdmin, generateCertificate]);

  // Handler para busca e filtro
  const handleSearch = useCallback((term: string) => {
    console.log(`Buscando por: "${term}"`);
    setSearchTerm(term);
    filterCertificates(term, filterCourseId);
  }, [filterCourseId, filterCertificates]);

  const handleFilterCourse = useCallback((courseId: string) => {
    console.log(`Filtrando por curso: ${courseId}`);
    setFilterCourseId(courseId);
    filterCertificates(searchTerm, courseId);
  }, [searchTerm, filterCertificates]);

  return {
    certificates: state.filteredCertificates,
    courses: state.courses,
    selectedCourse: state.courses.find(course => course.id === state.selectedCourseId),
    isLoading: state.isLoading,
    error: state.error,
    isDialogOpen,
    setIsDialogOpen,
    formData,
    editingCertificateId,
    isSubmitting,
    searchTerm,
    filterCourseId,
    handleUserChange,
    handleCourseChange,
    handleSubmit,
    handleEditCertificate,
    handleDeleteCertificate,
    handleGenerateCertificate,
    handleSearch,
    handleFilterCourse,
    resetForm,
    fetchCertificates,
    fetchCoursesWithEnrollments,
    fetchEnrolledUsersForCourse
  };
}
