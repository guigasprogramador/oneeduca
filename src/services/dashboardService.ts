import { supabase } from '@/integrations/supabase/client';
import { Course, Certificate } from '@/types';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
let dashboardCache = {
  courses: [] as Course[],
  certificates: [] as Certificate[],
  timestamp: 0
};

export const dashboardService = {
  async getDashboardData(userId: string): Promise<{ courses: Course[], certificates: Certificate[] }> {
    const now = Date.now();
    
    // Verificar se temos dados em cache válidos
    if (dashboardCache.timestamp && (now - dashboardCache.timestamp < CACHE_DURATION)) {
      console.log('Using dashboard cache');
      return {
        courses: dashboardCache.courses,
        certificates: dashboardCache.certificates
      };
    }

    try {
      // Usar uma única consulta com JOIN para otimizar o carregamento
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          thumbnail,
          duration,
          instructor,
          enrolledcount,
          rating,
          created_at,
          updated_at,
          modules (
            id,
            title,
            lessons (
              id,
              title,
              duration,
              content_type,
              content_url,
              position
            )
          ),
          enrollments (
            id,
            progress,
            enrolled_at
          )
        `)
        .eq('enrollments.user_id', userId)
        .order('enrolled_at', { ascending: false });

      if (coursesError) throw coursesError;

      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (certificatesError) throw certificatesError;

      // Transformar os dados em uma única operação
      const courses = coursesData.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        thumbnail: course.thumbnail || '/placeholder.svg',
        duration: course.duration || '',
        instructor: course.instructor,
        enrolledCount: course.enrolledcount || 0,
        rating: course.rating || 0,
        modules: course.modules || [],
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        isEnrolled: true,
        progress: course.enrollments?.[0]?.progress || 0,
        enrolledAt: course.enrollments?.[0]?.enrolled_at
      }));

      // Atualizar cache
      dashboardCache = {
        courses,
        certificates: certificatesData || [],
        timestamp: now
      };

      return { courses, certificates: certificatesData || [] };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};
