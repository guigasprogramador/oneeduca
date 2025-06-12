import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Event bus for broadcasting database changes
export const realtimeEvents = {
  listeners: new Map<string, Set<Function>>(),

  // Subscribe to a specific event
  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  },

  // Publish an event with data
  publish(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
};

// Initialize Supabase realtime subscriptions
export function initializeRealtimeSubscriptions() {
  console.log('Initializing realtime subscriptions...');
  
  // Subscribe to courses table changes
  const coursesSubscription = supabase
    .channel('public:courses')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'courses' 
    }, (payload) => {
      console.log('Courses change detected:', payload);
      realtimeEvents.publish('courses-changed', payload);
    })
    .subscribe((status) => {
      console.log('Courses subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to courses table');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe to courses table');
        toast.error('Falha ao conectar com atualizações em tempo real dos cursos');
      }
    });

  // Subscribe to modules table changes
  const modulesSubscription = supabase
    .channel('public:modules')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'modules' 
    }, (payload) => {
      console.log('Modules change detected:', payload);
      realtimeEvents.publish('modules-changed', {
        ...payload,
        courseId: payload.new?.course_id || payload.old?.course_id
      });
    })
    .subscribe((status) => {
      console.log('Modules subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to modules table');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe to modules table');
        toast.error('Falha ao conectar com atualizações em tempo real dos módulos');
      }
    });

  // Subscribe to lessons table changes
  const lessonsSubscription = supabase
    .channel('public:lessons')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'lessons' 
    }, (payload) => {
      console.log('Lessons change detected:', payload);
      realtimeEvents.publish('lessons-changed', {
        ...payload,
        moduleId: payload.new?.module_id || payload.old?.module_id
      });
    })
    .subscribe((status) => {
      console.log('Lessons subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to lessons table');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe to lessons table');
        toast.error('Falha ao conectar com atualizações em tempo real das aulas');
      }
    });

  // Return unsubscribe function
  return () => {
    coursesSubscription.unsubscribe();
    modulesSubscription.unsubscribe();
    lessonsSubscription.unsubscribe();
  };
}
