import { QueryClient } from '@tanstack/react-query';

// Cria uma instância global do QueryClient para ser usada em toda a aplicação
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações padrão para todas as queries
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (substituindo cacheTime que está obsoleto)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Funções auxiliares para invalidar queries após mutações
export const invalidateQueries = {
  // Invalidar todas as queries relacionadas a cursos
  courses: () => {
    console.log('Invalidando queries de cursos');
    return queryClient.invalidateQueries({ queryKey: ['courses'] });
  },
  
  // Invalidar queries relacionadas a um curso específico
  course: (courseId: string) => {
    console.log(`Invalidando queries do curso: ${courseId}`);
    return queryClient.invalidateQueries({ queryKey: ['courses', courseId] });
  },
  
  // Invalidar queries relacionadas a módulos
  modules: (courseId?: string) => {
    if (courseId) {
      console.log(`Invalidando queries de módulos do curso: ${courseId}`);
      return queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
    } else {
      console.log('Invalidando todas as queries de módulos');
      return queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  },
  
  // Invalidar queries relacionadas a aulas
  lessons: (moduleId?: string) => {
    if (moduleId) {
      console.log(`Invalidando queries de aulas do módulo: ${moduleId}`);
      return queryClient.invalidateQueries({ queryKey: ['lessons', moduleId] });
    } else {
      console.log('Invalidando todas as queries de aulas');
      return queryClient.invalidateQueries({ queryKey: ['lessons'] });
    }
  },
  
  // Invalidar todas as queries relacionadas a conteúdo do curso
  allCourseContent: () => {
    console.log('Invalidando todas as queries de conteúdo de cursos');
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['courses'] }),
      queryClient.invalidateQueries({ queryKey: ['modules'] }),
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
    ]);
  }
};
