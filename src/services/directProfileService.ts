import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from 'sonner';

/**
 * Serviço para buscar usuários diretamente da tabela de perfis
 * Esta abordagem contorna as limitações de permissão da API de autenticação
 */
export const directProfileService = {
  /**
   * Busca todos os perfis diretamente da tabela profiles
   */
  async getAllProfiles(): Promise<User[]> {
    try {
      console.log('Buscando perfis diretamente da tabela profiles...');
      
      // Buscar todos os perfis com uma consulta simples
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error('Erro ao buscar perfis:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('Nenhum perfil encontrado');
        return [];
      }
      
      console.log(`Encontrados ${data.length} perfis`);
      
      // Converter os dados para o formato User
      const users = data.map(profile => ({
        id: profile.id,
        name: profile.name || 'Usuário',
        email: profile.email || '',
        role: profile.role || 'student',
        avatarUrl: profile.avatar_url || '',
        createdAt: profile.created_at || new Date().toISOString()
      }));
      
      return users;
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      return [];
    }
  }
};
