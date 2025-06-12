import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Certificate, Course } from '@/types';
import { certificateService } from '@/services/certificateService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Tipos
interface EnrolledUser {
  userId: string;
  userName: string;
  progress: number;
  enrolledAt: string;
  hasCertificate?: boolean;
  isEligible?: boolean;
}

interface CourseWithEnrollments extends Course {
  enrolledUsers?: EnrolledUser[];
}

interface CertificateState {
  certificates: Certificate[];
  filteredCertificates: Certificate[];
  courses: CourseWithEnrollments[];
  selectedCourseId: string | null;
  isLoading: boolean;
  error: string | null;
}

type CertificateAction =
  | { type: 'SET_CERTIFICATES'; payload: Certificate[] }
  | { type: 'SET_COURSES'; payload: CourseWithEnrollments[] }
  | { type: 'SET_SELECTED_COURSE'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ENROLLED_USERS'; payload: { courseId: string; users: EnrolledUser[] } };

// Estado inicial
const initialState: CertificateState = {
  certificates: [],
  filteredCertificates: [],
  courses: [],
  selectedCourseId: null,
  isLoading: false,
  error: null
};

// Reducer
const certificateReducer = (state: CertificateState, action: CertificateAction): CertificateState => {
  switch (action.type) {
    case 'SET_CERTIFICATES':
      return { ...state, certificates: action.payload, filteredCertificates: action.payload };
    
    case 'SET_COURSES':
      return { ...state, courses: action.payload };
    
    case 'SET_SELECTED_COURSE':
      return { ...state, selectedCourseId: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'ADD_ENROLLED_USERS':
      const updatedCourses = state.courses.map(course =>
        course.id === action.payload.courseId
          ? { ...course, enrolledUsers: action.payload.users }
          : course
      );
      return { ...state, courses: updatedCourses };
    
    default:
      return state;
  }
};

// Contexto
const CertificateContext = createContext<any>(undefined);

export function CertificateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(certificateReducer, initialState);

  // Função para buscar certificados
  const fetchCertificates = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await certificateService.getCertificates();
      dispatch({ type: 'SET_CERTIFICATES', payload: data });
    } catch (error) {
      console.error("Erro ao buscar certificados:", error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Função para buscar cursos
  const fetchCoursesWithEnrollments = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Buscando cursos disponíveis...');
      const { data, error } = await supabase
        .from('courses')
        .select('*');

      if (error) throw error;
      
      const courses = data.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        duration: course.duration,
        instructor: course.instructor,
        enrolledCount: course.enrolledcount,
        rating: course.rating,
        modules: [],
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        isEnrolled: false,
        progress: 0
      }));
      
      dispatch({ type: 'SET_COURSES', payload: courses });
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Função para buscar alunos matriculados
  const fetchEnrolledUsersForCourse = useCallback(async (courseId: string) => {
    if (!courseId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_SELECTED_COURSE', payload: courseId });
      
      console.log(`TESTE: Adicionando alunos mockados para o curso ${courseId}`);
      
      // Dados de teste temporários
      const mockUsers = [
        {
          userId: 'user1',
          userName: 'Aluno Teste 1',
          progress: 85,
          enrolledAt: new Date().toISOString(),
          hasCertificate: false,
          isEligible: true
        },
        {
          userId: 'user2',
          userName: 'Aluno Teste 2',
          progress: 60,
          enrolledAt: new Date().toISOString(),
          hasCertificate: false,
          isEligible: false
        },
        {
          userId: 'user3',
          userName: 'Aluno Teste 3',
          progress: 100,
          enrolledAt: new Date().toISOString(),
          hasCertificate: true,
          isEligible: true
        }
      ];
      
      dispatch({ 
        type: 'ADD_ENROLLED_USERS', 
        payload: { courseId, users: mockUsers }
      });
      
      // Tentativa de buscar dados reais para diagnóstico
      console.log('Tentando buscar matrículas reais para diagnóstico...');
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId);
        
      console.log('Resultado real de enrollments:', enrollmentsData);
      console.log('Erro (se houver):', enrollmentsError);
    } catch (error) {
      console.error(`Erro ao buscar alunos matriculados:`, error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    console.log('Inicializando contexto temporário...');
    fetchCertificates();
    fetchCoursesWithEnrollments();
  }, [fetchCertificates, fetchCoursesWithEnrollments]);

  // Valor do contexto
  const contextValue = {
    state,
    dispatch,
    fetchCertificates,
    fetchCoursesWithEnrollments,
    fetchEnrolledUsersForCourse
  };

  return (
    <CertificateContext.Provider value={contextValue}>
      {children}
    </CertificateContext.Provider>
  );
}

// Hook para usar o contexto
export function useCertificateContext() {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error('useCertificateContext deve ser usado dentro de um CertificateProvider');
  }
  return context;
}
