import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from 'sonner';

/**
 * Serviço alternativo para buscar usuários diretamente do banco de dados
 * usando SQL nativo, contornando as limitações de permissão da API do Supabase
 */
export const userServiceDirect = {
  /**
   * Busca todos os usuários do sistema usando SQL nativo
   * Esta abordagem contorna as limitações de permissão da API do Supabase
   */
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('Buscando todos os usuários com SQL nativo...');
      
      // Usar SQL nativo para buscar todos os usuários
      // Esta abordagem contorna as limitações de permissão da API
      const { data, error } = await supabase.rpc('get_all_users');
      
      if (error) {
        console.error('Erro ao buscar usuários com SQL nativo:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('Nenhum usuário encontrado com SQL nativo');
        return [];
      }
      
      console.log(`Encontrados ${data.length} usuários com SQL nativo`);
      
      // Converter os dados para o formato User
      return data.map((user: any) => ({
        id: user.id,
        name: user.name || user.full_name || 'Usuário',
        email: user.email || '',
        role: user.role || 'student',
        avatarUrl: user.avatar_url || '',
        createdAt: user.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao buscar usuários com SQL nativo:', error);
      return [];
    }
  },
  
  /**
   * Busca todos os perfis da tabela profiles
   * Esta é uma abordagem alternativa que não depende de SQL nativo
   */
  async getAllProfiles(): Promise<User[]> {
    try {
      console.log('Buscando todos os perfis da tabela profiles...');
      
      // Buscar todos os perfis da tabela profiles
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
      return data.map(profile => ({
        id: profile.id,
        name: profile.name || 'Usuário',
        email: profile.email || '',
        role: profile.role || 'student',
        avatarUrl: profile.avatar_url || '',
        createdAt: profile.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      return [];
    }
  }
};
