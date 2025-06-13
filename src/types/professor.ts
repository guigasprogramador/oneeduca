// =====================================================
// TIPOS TYPESCRIPT PARA FUNCIONALIDADES DO PROFESSOR
// =====================================================

export type UserRole = 'admin' | 'professor' | 'student';

export type CourseStatus = 'pending' | 'approved' | 'rejected' | 'draft';

export interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
  location?: string;
  website?: string;
}

export interface ExtendedCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  instructor: string;
  enrolledCount: number;
  rating: number;
  modules: ExtendedModule[];
  createdAt: string;
  updatedAt: string;
  isEnrolled?: boolean;
  progress?: number;
  // Novas propriedades para professor
  professorId?: string;
  status: CourseStatus;
  expiryDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface ExtendedModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: ExtendedLesson[];
  // Novas propriedades para quiz
  hasQuiz: boolean;
  quizData?: QuizData;
}

export interface ExtendedLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  content?: string;
  order: number;
  isCompleted?: boolean;
  // Nova propriedade para anexos
  attachments?: LessonAttachment[];
}

export interface LessonAttachment {
  id: string;
  lessonId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export interface QuizData {
  title: string;
  description?: string;
  timeLimit?: number; // em minutos
  passingScore: number; // porcentagem mínima para passar
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[]; // Para multiple choice
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface QuizResponse {
  id: string;
  userId: string;
  moduleId: string;
  responses: Record<string, string>; // questionId -> answer
  score: number;
  maxScore: number;
  completedAt: string;
}

export interface CourseDuplication {
  id: string;
  originalCourseId: string;
  duplicatedCourseId: string;
  duplicatedBy: string;
  createdAt: string;
}

export interface CourseForum {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  messagesCount?: number;
  lastActivity?: string;
}

export interface ForumMessage {
  id: string;
  forumId: string;
  userId: string;
  message: string;
  parentMessageId?: string;
  createdAt: string;
  updatedAt: string;
  // Dados do usuário (para exibição)
  userName?: string;
  userAvatar?: string;
  userRole?: UserRole;
  // Respostas aninhadas
  replies?: ForumMessage[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'course_approved' | 'course_rejected' | 'new_enrollment' | 'forum_message' | 'quiz_completed';
  read: boolean;
  createdAt: string;
}

export interface ProfessorStats {
  professorId: string;
  professorName: string;
  totalCourses: number;
  approvedCourses: number;
  pendingCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  averageRating: number;
}

export interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalProfessors: number;
  totalAdmins: number;
  totalCourses: number;
  approvedCourses: number;
  pendingCourses: number;
  rejectedCourses: number;
  totalEnrollments: number;
  totalCertificates: number;
  coursesExpiringSoon: number;
}

export interface CourseApprovalRequest {
  courseId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export interface FileUploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

// Tipos para formulários
export interface CreateCourseForm {
  title: string;
  description: string;
  thumbnail?: string;
  duration: string;
  instructor: string;
  expiryDate?: string;
}

export interface CreateModuleForm {
  title: string;
  description: string;
  order: number;
  hasQuiz: boolean;
  quizData?: QuizData;
}

export interface CreateLessonForm {
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  content?: string;
  order: number;
  attachments?: File[];
}

export interface CreateForumForm {
  title: string;
  description?: string;
}

export interface CreateMessageForm {
  message: string;
  parentMessageId?: string;
}

// Tipos para filtros e busca
export interface CourseFilters {
  status?: CourseStatus[];
  professorId?: string;
  expiryStatus?: 'active' | 'expiring_soon' | 'expired';
  search?: string;
}

export interface ProfessorFilters {
  role?: UserRole[];
  search?: string;
  sortBy?: 'name' | 'totalCourses' | 'totalStudents' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Tipos para respostas da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para contextos React
export interface ProfessorContextType {
  courses: ExtendedCourse[];
  stats: ProfessorStats | null;
  isLoading: boolean;
  createCourse: (courseData: CreateCourseForm) => Promise<ExtendedCourse>;
  updateCourse: (courseId: string, courseData: Partial<CreateCourseForm>) => Promise<ExtendedCourse>;
  duplicateCourse: (courseId: string, newTitle?: string) => Promise<ExtendedCourse>;
  deleteCourse: (courseId: string) => Promise<void>;
  refreshCourses: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export interface AdminContextType {
  pendingCourses: ExtendedCourse[];
  systemStats: SystemStats | null;
  professors: ExtendedUser[];
  isLoading: boolean;
  approveCourse: (courseId: string) => Promise<void>;
  rejectCourse: (courseId: string, reason?: string) => Promise<void>;
  promoteToprofessor: (userId: string) => Promise<void>;
  demoteProfessor: (userId: string) => Promise<void>;
  refreshPendingCourses: () => Promise<void>;
  refreshSystemStats: () => Promise<void>;
  refreshProfessors: () => Promise<void>;
}

export interface ForumContextType {
  forums: CourseForum[];
  currentForum: CourseForum | null;
  messages: ForumMessage[];
  isLoading: boolean;
  createForum: (courseId: string, forumData: CreateForumForm) => Promise<CourseForum>;
  selectForum: (forumId: string) => Promise<void>;
  sendMessage: (forumId: string, messageData: CreateMessageForm) => Promise<ForumMessage>;
  refreshForums: (courseId: string) => Promise<void>;
  refreshMessages: (forumId: string) => Promise<void>;
}

// Tipos para hooks personalizados
export interface UseFileUploadOptions {
  maxSize?: number; // em bytes
  allowedTypes?: string[];
  multiple?: boolean;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File, path: string) => Promise<FileUploadResult>;
  uploadFiles: (files: File[], path: string) => Promise<FileUploadResult[]>;
  isUploading: boolean;
  progress: number;
}

export interface UseQuizOptions {
  moduleId: string;
  autoSave?: boolean;
  timeLimit?: number;
}

export interface UseQuizReturn {
  quizData: QuizData | null;
  responses: Record<string, string>;
  timeRemaining: number;
  isSubmitted: boolean;
  score: number | null;
  updateResponse: (questionId: string, answer: string) => void;
  submitQuiz: () => Promise<QuizResponse>;
  resetQuiz: () => void;
}

// Constantes úteis
export const USER_ROLES: Record<UserRole, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  student: 'Estudante'
};

export const COURSE_STATUSES: Record<CourseStatus, string> = {
  draft: 'Rascunho',
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado'
};

export const NOTIFICATION_TYPES = {
  course_approved: 'Curso Aprovado',
  course_rejected: 'Curso Rejeitado',
  new_enrollment: 'Nova Matrícula',
  forum_message: 'Nova Mensagem no Chat',
  quiz_completed: 'Quiz Concluído'
};

export const ALLOWED_FILE_TYPES = {
  documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a'],
  presentations: ['.ppt', '.pptx', '.odp'],
  spreadsheets: ['.xls', '.xlsx', '.ods', '.csv']
};

export const MAX_FILE_SIZE = {
  document: 10 * 1024 * 1024, // 10MB
  image: 5 * 1024 * 1024,     // 5MB
  video: 100 * 1024 * 1024,   // 100MB
  audio: 20 * 1024 * 1024,    // 20MB
  default: 10 * 1024 * 1024   // 10MB
};