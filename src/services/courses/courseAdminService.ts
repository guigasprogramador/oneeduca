
import { Course } from '@/types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Create a new course (admin)
 */
export const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'modules'>): Promise<Course> => {
  try {
    console.log('Creating course with data:', courseData);
    
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        description: courseData.description,
        thumbnail: courseData.thumbnail || '/placeholder.svg',
        duration: courseData.duration ? `${courseData.duration} horas` : '',
        instructor: courseData.instructor,
        enrolledcount: courseData.enrolledCount || 0,
        rating: courseData.rating || 0
      })
      .select()
      .single();

    if (error) {
      console.error("Detalhes do erro:", error);
      throw new Error(`Falha ao criar curso: ${error.message}`);
    }

    if (!data) {
      throw new Error('Nenhum dado retornado da operação de inserção');
    }

    // Transform the response to match the Course type
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      thumbnail: data.thumbnail || '/placeholder.svg',
      duration: data.duration || '',
      instructor: data.instructor,
      enrolledCount: data.enrolledcount || 0,
      rating: data.rating || 0,
      modules: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      progress: 0,
      isEnrolled: false
    };
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

/**
 * Update a course (admin)
 */
export const updateCourse = async (courseId: string, course: Partial<Course>): Promise<void> => {
  try {
    console.log('Updating course:', courseId, 'with data:', course);
    
    // Map frontend fields to database column names
    const updateData: Record<string, any> = {};
    
    if (course.title !== undefined) updateData.title = course.title;
    if (course.description !== undefined) updateData.description = course.description;
    if (course.thumbnail !== undefined) updateData.thumbnail = course.thumbnail;
    if (course.duration !== undefined) updateData.duration = course.duration ? `${course.duration} horas` : '';
    if (course.instructor !== undefined) updateData.instructor = course.instructor;
    if (course.rating !== undefined) updateData.rating = course.rating;
    if (course.enrolledCount !== undefined) updateData.enrolledcount = course.enrolledCount;

    const { error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId);

    if (error) {
      console.error("Detalhes do erro:", error);
      throw new Error(`Falha ao atualizar curso: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

/**
 * Delete a course (admin)
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    console.log('Deleting course:', courseId);
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error("Detalhes do erro:", error);
      throw new Error(`Falha ao excluir curso: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};
