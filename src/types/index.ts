
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  instructor: string;
  professor_id?: string;
  enrolledCount: number;
  rating: number;
  modules: Module[];
  createdAt: string;
  updatedAt: string;
  isEnrolled?: boolean;
  progress?: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  content?: string;
  order: number;
  isCompleted?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "professor" | "student";
  avatar?: string | null;
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  userName: string;
  courseHours?: number; // Carga horária do curso em horas
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  certificateHtml?: string; // HTML do certificado renderizado
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  avatar?: string;
  website?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}
