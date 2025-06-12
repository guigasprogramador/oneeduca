
// Define custom type for Supabase database interface
export interface Database {
  public: {
    Tables: {
      certificates: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          course_name: string;
          user_name: string;
          issue_date: string;
          expiry_date: string | null;
          certificate_url: string | null;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          thumbnail: string | null;
          duration: string | null;
          instructor: string;
          enrolledcount: number;
          rating: number;
          created_at: string;
          updated_at: string;
          professor_id: string | null;
          status: 'pending' | 'approved' | 'rejected';
          expiry_date: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
        };
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          order_number: number;
          created_at: string;
          updated_at: string;
          has_quiz: boolean;
          quiz_data: any | null;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          description: string | null;
          duration: string | null;
          video_url: string | null;
          content: string | null;
          order_number: number;
          created_at: string;
          updated_at: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          progress: number;
          enrolled_at: string;
          completed_at: string | null;
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          completed_at: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          bio: string | null;
          avatar_url: string | null;
          job_title: string | null;
          company: string | null;
          location: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
          role: 'admin' | 'professor' | 'student';
        };
      };
      recent_certificates: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          issue_date: string;
          course_name: string;
          user_name: string;
        };
      };
      lesson_attachments: {
        Row: {
          id: string;
          lesson_id: string;
          file_name: string;
          file_url: string;
          file_type: string;
          file_size: number | null;
          uploaded_by: string;
          created_at: string;
        };
      };
      course_duplications: {
        Row: {
          id: string;
          original_course_id: string;
          duplicated_course_id: string;
          duplicated_by: string;
          created_at: string;
        };
      };
      course_forums: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };
      forum_messages: {
        Row: {
          id: string;
          forum_id: string;
          user_id: string;
          message: string;
          parent_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      quiz_responses: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          responses: any;
          score: number | null;
          max_score: number | null;
          completed_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          created_at: string;
        };
      };
    };
  };
}
