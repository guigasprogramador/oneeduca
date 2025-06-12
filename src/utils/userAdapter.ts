
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types';

export const adaptSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email || '',
    role: supabaseUser.user_metadata?.role || 'student',
    avatar: supabaseUser.user_metadata?.avatar || undefined,
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  };
};
