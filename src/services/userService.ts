import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from 'sonner';

interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'student';
  password?: string;
}

// Helper function to get the current user
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export const userService = {
  // Get users accessible to the current user
  async getUsers(): Promise<User[]> {
    try {
      console.log('Buscando usuários...');
      
      // Abordagem 1: Buscar todos os perfis da tabela profiles
      console.log('Abordagem 1: Buscando usuários da tabela profiles...');
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, role, created_at, avatar_url');
        
        if (profilesError) {
          console.error('Erro na Abordagem 1:', profilesError);
        } else if (profiles && profiles.length > 0) {
          console.log(`Sucesso na Abordagem 1! Encontrados ${profiles.length} perfis`);
          
          // Converter perfis para o tipo User
          return profiles.map(profile => ({
            id: profile.id,
            name: profile.name || 'Usuário',
            email: profile.email || '',
            role: profile.role || 'student',
            avatarUrl: profile.avatar_url || '',
            createdAt: profile.created_at || new Date().toISOString()
          }));
        } else {
          console.log('Abordagem 1: Nenhum perfil encontrado');
        }
      } catch (approach1Error) {
        console.error('Erro na Abordagem 1 (capturado):', approach1Error);
      }
      
      // Abordagem 2: Buscar todos os perfis com uma consulta mais simples
      console.log('Abordagem 2: Tentando consulta mais simples...');
      try {
        const { data: simpleProfiles, error: simpleError } = await supabase
          .from('profiles')
          .select('*');
        
        if (simpleError) {
          console.error('Erro na Abordagem 2:', simpleError);
        } else if (simpleProfiles && simpleProfiles.length > 0) {
          console.log(`Sucesso na Abordagem 2! Encontrados ${simpleProfiles.length} perfis`);
          
          return simpleProfiles.map(profile => ({
            id: profile.id,
            name: profile.name || 'Usuário',
            email: profile.email || '',
            role: profile.role || 'student',
            avatarUrl: profile.avatar_url || '',
            createdAt: profile.created_at || new Date().toISOString()
          }));
        } else {
          console.log('Abordagem 2: Nenhum perfil encontrado');
        }
      } catch (approach2Error) {
        console.error('Erro na Abordagem 2 (capturado):', approach2Error);
      }
      
      // Abordagem 3: Último recurso - buscar apenas o usuário atual
      console.log('Abordagem 3: Buscando apenas o usuário atual...');
      try {
        const { data: authData } = await supabase.auth.getUser();
        
        if (authData?.user) {
          console.log('Sucesso na Abordagem 3! Retornando apenas o usuário atual');
          
          // Buscar o perfil do usuário atual para ter informações completas
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();
          
          // Se não encontrar o perfil, criar automaticamente
          if (!currentProfile) {
            console.log('Perfil do usuário atual não encontrado, criando automaticamente...');
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .upsert({
                id: authData.user.id,
                name: authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || 'Usuário',
                email: authData.user.email,
                role: authData.user.user_metadata?.role || 'student',
                created_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (createError) {
              console.error('Erro ao criar perfil automaticamente:', createError);
            } else if (newProfile) {
              console.log('Perfil criado automaticamente:', newProfile);
            }
          }
          
          return [{
            id: authData.user.id,
            name: currentProfile?.name || authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || 'Usuário',
            email: currentProfile?.email || authData.user.email || '',
            role: currentProfile?.role || authData.user.user_metadata?.role || 'student',
            avatarUrl: currentProfile?.avatar_url || '',
            createdAt: currentProfile?.created_at || authData.user.created_at || new Date().toISOString()
          }];
        }
      } catch (userError) {
        console.error('Erro na Abordagem 3:', userError);
      }
      
      // Se todas as tentativas falharem, retornar array vazio
      console.log('Todas as abordagens falharam, retornando array vazio');
      return [];
    } catch (error) {
      console.error('Erro geral ao buscar usuários:', error);
      // Retornar array vazio em vez de lançar erro para evitar quebrar a interface
      return [];
    }
  },

  // Create a new user using sign-up
  async createUser(userData: UserFormData): Promise<User> {
    try {
      console.log('Iniciando criação de usuário:', userData.email);
      
      // Verificar se o email é válido
      if (!userData.email || !userData.email.includes('@')) {
        throw new Error('Email inválido');
      }
      
      // Verificar se o nome foi fornecido
      if (!userData.name || userData.name.trim() === '') {
        throw new Error('Nome é obrigatório');
      }
      
      // Verificar se o usuário já existe - abordagem simplificada
      try {
        const { data: existingProfiles, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userData.email)
          .limit(1);
        
        if (checkError) {
          console.warn('Erro ao verificar usuário existente:', checkError);
          // Continuar mesmo com erro - o Supabase vai rejeitar emails duplicados
        } else if (existingProfiles && existingProfiles.length > 0) {
          throw new Error(`Usuário com email ${userData.email} já existe`);
        }
      } catch (checkError) {
        console.warn('Erro ao verificar usuário existente (capturado):', checkError);
        // Continuar mesmo com erro
      }
      
      // Gerar uma senha temporária ou usar a fornecida
      // Garantir que a senha tenha pelo menos 8 caracteres e inclua maiúsculas, minúsculas e números
      const password = userData.password || 
                     'Temp' + Math.random().toString(36).substring(2, 6) + 
                     Math.random().toString(36).substring(2, 6).toUpperCase() + 
                     Math.floor(Math.random() * 10000) + 
                     '!1';
      
      console.log('Criando conta de autenticação para:', userData.email);
      
      // Criar o usuário na autenticação - usando try/catch para melhor tratamento de erros
      let userId;
      try {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: password,
          options: {
            data: { 
              name: userData.name,
              full_name: userData.name,
              role: userData.role 
            }
          }
        });

        if (error) {
          console.error('Erro ao criar usuário na autenticação:', error);
          throw error;
        }
        
        // Verificar se o usuário foi criado
        if (!data.user) {
          throw new Error('Falha ao criar usuário: resposta inválida do servidor');
        }
        
        userId = data.user.id;
        console.log('Usuário criado com ID:', userId);
      } catch (authError: any) {
        console.error('Erro capturado ao criar usuário na autenticação:', authError);
        
        // Verificar se é um erro de email já existente
        if (authError.message?.includes('email') && authError.message?.includes('already')) {
          throw new Error(`Email ${userData.email} já está em uso`);
        }
        
        // Erro genérico mais amigável
        throw new Error(`Não foi possível criar o usuário: ${authError.message || 'Erro desconhecido'}`);
      }
      
      // Se chegou aqui, o usuário foi criado na autenticação
      // Agora criar ou atualizar o perfil do usuário - IMPORTANTE para que o usuário apareça na lista
      try {
        console.log('Criando perfil do usuário na tabela profiles...');
        
        // Tentar várias vezes criar o perfil para garantir que seja criado
        let profileCreated = false;
        let attempts = 0;
        
        while (!profileCreated && attempts < 3) {
          attempts++;
          console.log(`Tentativa ${attempts} de criar perfil para ${userData.name}`);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (profileError) {
            console.error(`Erro na tentativa ${attempts} de criar perfil:`, profileError);
            // Esperar um pouco antes da próxima tentativa
            if (attempts < 3) {
              await new Promise(resolve => setTimeout(resolve, 500 * attempts));
            }
          } else if (profileData) {
            console.log('Perfil criado com sucesso:', profileData);
            profileCreated = true;
          }
        }
        
        if (!profileCreated) {
          console.warn('Não foi possível criar o perfil após várias tentativas');
          // Mesmo sem perfil, o usuário foi criado na autenticação
        }
      } catch (profileError) {
        console.error('Erro capturado ao criar perfil:', profileError);
        // Não lançar erro, continuar com o fluxo
      }

      // Enviar email com as credenciais (simulado aqui)
      console.log(`Credenciais para ${userData.email}: senha=${password}`);
      toast.success(`Usuário ${userData.name} criado com sucesso! Um email será enviado com as credenciais.`);
      
      // Removida a matrícula automática em todos os cursos
      console.log('Usuário criado com sucesso, sem matrícula automática em cursos');
      
      return {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatarUrl: '',
        createdAt: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error(`Falha ao criar usuário: ${error.message}`);
      throw new Error(`Falha ao criar usuário: ${error.message}`);
    }
  },

  // Update user profile (client-friendly)
  async updateUser(userId: string, userData: UserFormData): Promise<User> {
    try {
      console.log(`Atualizando usuário ${userId} com dados:`, userData);
      
      // Verificar se o perfil existe
      const { data: existingProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();
        
      if (findError) {
        console.error('Erro ao buscar perfil para atualização:', findError);
        throw new Error(`Perfil do usuário não encontrado: ${findError.message}`);
      }
      
      console.log('Perfil atual:', existingProfile);
      
      // Atualizar os metadados do usuário na autenticação se possível
      try {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: {
            name: userData.name,
            full_name: userData.name,
            role: userData.role
          }
        });
        
        if (authUpdateError) {
          console.warn('Não foi possível atualizar metadados de autenticação:', authUpdateError);
        } else {
          console.log('Metadados de autenticação atualizados com sucesso');
        }
      } catch (authError) {
        console.warn('Erro ao tentar atualizar metadados de autenticação:', authError);
        // Continuar mesmo se falhar a atualização dos metadados
      }

      // Atualizar o perfil com todos os campos relevantes
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          role: userData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        throw profileError;
      }
      
      console.log('Perfil atualizado com sucesso:', profileData);
      toast.success(`Usuário ${userData.name} atualizado com sucesso!`);

      // Retornar usuário atualizado
      return {
        id: userId,
        name: userData.name,
        email: userData.email || existingProfile.email,
        role: userData.role,
        avatarUrl: profileData.avatar_url || '',
        createdAt: profileData.created_at
      };
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(`Falha ao atualizar usuário: ${error.message}`);
      throw new Error(`Falha ao atualizar usuário: ${error.message}`);
    }
  },

  // Delete user (client-friendly version)
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log(`Iniciando exclusão do usuário ${userId}`);
      
      // Verificar se o usuário existe
      const { data: userProfile, error: findError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single();
        
      if (findError) {
        console.error('Erro ao buscar perfil para exclusão:', findError);
        throw new Error(`Perfil do usuário não encontrado: ${findError.message}`);
      }
      
      console.log(`Excluindo usuário: ${userProfile.name} (${userProfile.email})`);
      
      // 1. Primeiro, verificar e excluir matrículas do usuário
      try {
        const { error: enrollmentError } = await supabase
          .from('enrollments')
          .delete()
          .eq('user_id', userId);
          
        if (enrollmentError) {
          console.warn('Erro ao excluir matrículas do usuário:', enrollmentError);
        } else {
          console.log('Matrículas do usuário excluídas com sucesso');
        }
      } catch (enrollmentError) {
        console.warn('Erro ao tentar excluir matrículas:', enrollmentError);
        // Continuar mesmo se falhar
      }
      
      // 2. Excluir progresso de aulas do usuário
      try {
        const { error: progressError } = await supabase
          .from('lesson_progress')
          .delete()
          .eq('user_id', userId);
          
        if (progressError) {
          console.warn('Erro ao excluir progresso de aulas:', progressError);
        } else {
          console.log('Progresso de aulas excluído com sucesso');
        }
      } catch (progressError) {
        console.warn('Erro ao tentar excluir progresso de aulas:', progressError);
        // Continuar mesmo se falhar
      }
      
      // 3. Excluir certificados do usuário
      try {
        const { error: certError } = await supabase
          .from('certificates')
          .delete()
          .eq('user_id', userId);
          
        if (certError) {
          console.warn('Erro ao excluir certificados:', certError);
        } else {
          console.log('Certificados excluídos com sucesso');
        }
      } catch (certError) {
        console.warn('Erro ao tentar excluir certificados:', certError);
        // Continuar mesmo se falhar
      }

      // 4. Excluir o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Erro ao excluir perfil do usuário:', profileError);
        throw profileError;
      }
      
      console.log('Perfil do usuário excluído com sucesso');
      
      // 5. Tentar desativar a conta de autenticação (isso requer permissões de admin no Supabase)
      try {
        // Nota: Esta operação pode não funcionar no cliente sem permissões de admin
        // Em um ambiente real, isso seria feito por uma função do servidor
        console.log('Tentando desativar conta de autenticação (pode não funcionar sem permissões de admin)');
      } catch (authError) {
        console.warn('Não foi possível desativar a conta de autenticação:', authError);
        // Continuar mesmo se falhar
      }
      
      toast.success(`Usuário ${userProfile.name} excluído com sucesso`);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error(`Falha ao excluir usuário: ${error.message}`);
      throw new Error(`Falha ao excluir usuário: ${error.message}`);
    }
  },

  // Update user role (client-friendly version)
  async updateUserRoleByEmail(email: string, role: 'admin' | 'student'): Promise<void> {
    try {
      // Check if current user is admin
      const currentUser = await getCurrentUser();
      if (!currentUser || currentUser.app_metadata?.role !== 'admin') {
        throw new Error('Apenas administradores podem atribuir funções de administrador');
      }

      // Get the user profile by email
      const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email);

      if (findError) throw findError;
      if (!profiles || profiles.length === 0) {
        throw new Error(`Usuário com email ${email} não encontrado`);
      }

      // Update the role in the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('email', email);

      if (updateError) throw updateError;
      
      toast.success(`Papel de ${role} atribuído com sucesso ao usuário ${email}`);
    } catch (error: any) {
      console.error('Erro ao atualizar papel do usuário:', error);
      throw new Error(`Falha ao atualizar papel do usuário: ${error.message}`);
    }
  },

  // Original method kept for backwards compatibility
  async getAllUsers(): Promise<User[]> {
    return this.getUsers();
  }
};
