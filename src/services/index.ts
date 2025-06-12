// Exportação centralizada de todos os serviços

// Serviços principais
export { default as courseService } from './courseService';
export { moduleService } from './moduleService';
export { lessonService } from './lessonService';
export { lessonProgressService } from './lessonProgressService';
export { certificateService } from './certificateService';
export { profileService } from './profileService';
export { userService } from './userService';

// Serviços de integração
export { integrationService } from './integrationService';
export { databaseRelationsService } from './databaseRelationsService';

// Serviços de cursos
export * from './courses/courseQueries';
export * from './courses/courseAdminService';
export * from './courses/enrollmentService';

// Cliente Supabase
export { supabase } from '@/integrations/supabase/client';
