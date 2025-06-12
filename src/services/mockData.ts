
import { Course, Module, Lesson, User, Certificate, Profile } from "@/types";

// Mock courses data
export const mockCourses: Course[] = [
  {
    id: "1",
    title: "Introdução ao React",
    description: "Aprenda os fundamentos do React, incluindo componentes, props e state.",
    thumbnail: "/placeholder.svg",
    duration: "10 horas",
    instructor: "João Silva",
    enrolledCount: 1250,
    rating: 4.8,
    modules: [],
    createdAt: "2023-01-15T10:00:00Z",
    updatedAt: "2023-02-20T14:30:00Z",
  },
  {
    id: "2",
    title: "JavaScript Avançado",
    description: "Domine os conceitos avançados de JavaScript, incluindo closures, promises e async/await.",
    thumbnail: "/placeholder.svg",
    duration: "12 horas",
    instructor: "Maria Santos",
    enrolledCount: 980,
    rating: 4.6,
    modules: [],
    createdAt: "2023-02-10T09:00:00Z",
    updatedAt: "2023-03-15T16:45:00Z",
  },
  {
    id: "3",
    title: "Node.js para Iniciantes",
    description: "Aprenda a construir aplicações backend com Node.js e Express.",
    thumbnail: "/placeholder.svg",
    duration: "8 horas",
    instructor: "Carlos Oliveira",
    enrolledCount: 750,
    rating: 4.5,
    modules: [],
    createdAt: "2023-03-05T11:30:00Z",
    updatedAt: "2023-04-10T13:15:00Z",
  },
  {
    id: "4",
    title: "Desenvolvimento Full Stack",
    description: "Aprenda a construir aplicações web completas com React e Node.js.",
    thumbnail: "/placeholder.svg",
    duration: "20 horas",
    instructor: "Ana Pereira",
    enrolledCount: 1500,
    rating: 4.9,
    modules: [],
    createdAt: "2023-04-12T14:00:00Z",
    updatedAt: "2023-05-18T10:30:00Z",
  },
  {
    id: "5",
    title: "TypeScript do Zero",
    description: "Aprenda TypeScript e eleve seu JavaScript para o próximo nível.",
    thumbnail: "/placeholder.svg",
    duration: "6 horas",
    instructor: "Paulo Costa",
    enrolledCount: 650,
    rating: 4.7,
    modules: [],
    createdAt: "2023-05-20T09:15:00Z",
    updatedAt: "2023-06-25T17:00:00Z",
  }
];

// Mock modules data
export const mockModules: Module[] = [
  {
    id: "1",
    courseId: "1",
    title: "Fundamentos do React",
    description: "Aprenda os conceitos básicos do React",
    order: 1,
    lessons: [],
  },
  {
    id: "2",
    courseId: "1",
    title: "Componentes e Props",
    description: "Como criar e usar componentes no React",
    order: 2,
    lessons: [],
  },
  {
    id: "3",
    courseId: "1",
    title: "Estado e Ciclo de Vida",
    description: "Gerenciamento de estado e ciclo de vida dos componentes",
    order: 3,
    lessons: [],
  },
  {
    id: "4",
    courseId: "2",
    title: "Closures e Escopos",
    description: "Entenda closures e escopos em JavaScript",
    order: 1,
    lessons: [],
  },
  {
    id: "5",
    courseId: "2",
    title: "Promises e Async/Await",
    description: "Programação assíncrona em JavaScript",
    order: 2,
    lessons: [],
  }
];

// Mock lessons data
export const mockLessons: Lesson[] = [
  {
    id: "1",
    moduleId: "1",
    title: "O que é React?",
    description: "Introdução ao React e sua filosofia",
    duration: "20 minutos",
    videoUrl: "https://example.com/video1",
    content: "Conteúdo detalhado da aula sobre o que é React e sua filosofia.",
    order: 1,
  },
  {
    id: "2",
    moduleId: "1",
    title: "Configurando o Ambiente",
    description: "Como configurar seu ambiente de desenvolvimento",
    duration: "30 minutos",
    videoUrl: "https://example.com/video2",
    content: "Passo a passo para configurar o ambiente de desenvolvimento React.",
    order: 2,
  },
  {
    id: "3",
    moduleId: "2",
    title: "Criando Componentes",
    description: "Como criar componentes reutilizáveis",
    duration: "25 minutos",
    videoUrl: "https://example.com/video3",
    content: "Aprenda a criar componentes reutilizáveis em React.",
    order: 1,
  },
  {
    id: "4",
    moduleId: "2",
    title: "Props em Detalhes",
    description: "Como usar props efetivamente",
    duration: "35 minutos",
    videoUrl: "https://example.com/video4",
    content: "Um guia completo sobre props em componentes React.",
    order: 2,
  }
];

// Mock users data
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    createdAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "João Aluno",
    email: "joao@example.com",
    role: "student",
    createdAt: "2023-01-15T10:30:00Z",
  },
  {
    id: "3",
    name: "Maria Estudante",
    email: "maria@example.com",
    role: "student",
    createdAt: "2023-02-10T14:45:00Z",
  }
];

// Mock certificates data
export const mockCertificates: Certificate[] = [
  {
    id: "1",
    userId: "2",
    courseId: "1",
    courseName: "Introdução ao React",
    userName: "João Aluno",
    issueDate: "2023-02-20T15:30:00Z",
  },
  {
    id: "2",
    userId: "2",
    courseId: "2",
    courseName: "JavaScript Avançado",
    userName: "João Aluno",
    issueDate: "2023-03-25T11:45:00Z",
  },
  {
    id: "3",
    userId: "3",
    courseId: "1",
    courseName: "Introdução ao React",
    userName: "Maria Estudante",
    issueDate: "2023-04-10T09:15:00Z",
  }
];

// Mock profiles data
export const mockProfiles: Profile[] = [
  {
    id: "1",
    userId: "1",
    fullName: "Admin User",
    bio: "Administrador da plataforma LMS",
    jobTitle: "Administrador de Sistema",
    company: "LMS Company",
    location: "São Paulo, Brasil",
  },
  {
    id: "2",
    userId: "2",
    fullName: "João Aluno",
    bio: "Estudante de desenvolvimento web",
    jobTitle: "Desenvolvedor Frontend",
    company: "Tech Company",
    location: "Rio de Janeiro, Brasil",
  },
  {
    id: "3",
    userId: "3",
    fullName: "Maria Estudante",
    bio: "Apaixonada por tecnologia e programação",
    jobTitle: "Engenheira de Software",
    company: "Software Inc",
    location: "Belo Horizonte, Brasil",
  }
];

// Initialize modules with lessons
mockModules.forEach(module => {
  module.lessons = mockLessons.filter(lesson => lesson.moduleId === module.id);
});

// Initialize courses with modules
mockCourses.forEach(course => {
  course.modules = mockModules.filter(module => module.courseId === course.id);
});

// Helper functions to get mock data with optional filters
export const getCourses = () => {
  return Promise.resolve([...mockCourses]);
};

export const getCourseById = (id: string) => {
  const course = mockCourses.find(course => course.id === id);
  if (!course) return Promise.reject(new Error("Course not found"));
  return Promise.resolve({ ...course });
};

export const getEnrolledCourses = (userId: string) => {
  // In a real app, this would fetch enrolled courses from a database
  // For now, we'll just return the first two courses as "enrolled"
  const enrolledCourses = mockCourses.slice(0, 2).map(course => ({
    ...course,
    isEnrolled: true,
    progress: Math.floor(Math.random() * 100),
  }));
  return Promise.resolve(enrolledCourses);
};

export const getModulesByCourseId = (courseId: string) => {
  const modules = mockModules.filter(module => module.courseId === courseId);
  return Promise.resolve([...modules]);
};

export const getLessonsByModuleId = (moduleId: string) => {
  const lessons = mockLessons.filter(lesson => lesson.moduleId === moduleId);
  return Promise.resolve([...lessons]);
};

export const getUsers = () => {
  return Promise.resolve([...mockUsers]);
};

export const getCertificates = (userId?: string) => {
  if (userId) {
    const certificates = mockCertificates.filter(cert => cert.userId === userId);
    return Promise.resolve([...certificates]);
  }
  return Promise.resolve([...mockCertificates]);
};

export const getCertificateById = (id: string) => {
  const certificate = mockCertificates.find(cert => cert.id === id);
  if (!certificate) return Promise.reject(new Error("Certificate not found"));
  return Promise.resolve({ ...certificate });
};

export const getProfiles = () => {
  return Promise.resolve([...mockProfiles]);
};

export const getProfileByUserId = (userId: string) => {
  const profile = mockProfiles.find(profile => profile.userId === userId);
  if (!profile) return Promise.reject(new Error("Profile not found"));
  return Promise.resolve({ ...profile });
};
