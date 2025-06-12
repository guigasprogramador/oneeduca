import { useState, useEffect } from "react";
import { User } from "@/types";
import { userService } from "@/services/api";
import { directProfileService } from "@/services/directProfileService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserFormData {
  name: string;
  email: string;
  role: 'admin' | 'student';
  password?: string; // Campo opcional para senha
}

const defaultFormData: UserFormData = {
  name: "",
  email: "",
  role: "student",
};

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      console.log('Buscando usuários...');
      
      // Abordagem 1: Usar o serviço direto de perfis (mais confiável)
      try {
        console.log('Tentando buscar usuários com o serviço direto de perfis...');
        const profilesData = await directProfileService.getAllProfiles();
        
        if (profilesData && profilesData.length > 0) {
          console.log(`Sucesso! Encontrados ${profilesData.length} usuários com o serviço direto`);
          setUsers(profilesData);
          return;
        } else {
          console.log('Nenhum usuário encontrado com o serviço direto, tentando método alternativo...');
        }
      } catch (directError) {
        console.error('Erro ao buscar com serviço direto:', directError);
      }
      
      // Abordagem 2: Usar o serviço padrão como fallback
      try {
        console.log('Tentando buscar usuários com o serviço padrão...');
        const usersData = await userService.getUsers();
        
        if (usersData && usersData.length > 0) {
          console.log(`Sucesso! Encontrados ${usersData.length} usuários com o serviço padrão`);
          setUsers(usersData);
          return;
        } else {
          console.log('Nenhum usuário encontrado com o serviço padrão');
        }
      } catch (standardError) {
        console.error('Erro ao buscar com serviço padrão:', standardError);
      }
      
      // Abordagem 3: Buscar diretamente do Supabase como último recurso
      try {
        console.log('Tentando buscar diretamente do Supabase...');
        const { data, error } = await supabase.from('profiles').select('*');
        
        if (error) {
          console.error('Erro ao buscar diretamente do Supabase:', error);
        } else if (data && data.length > 0) {
          console.log(`Sucesso! Encontrados ${data.length} perfis diretamente do Supabase`);
          
          const formattedUsers = data.map(profile => ({
            id: profile.id,
            name: profile.name || 'Usuário',
            email: profile.email || '',
            role: profile.role || 'student',
            avatarUrl: profile.avatar_url || '',
            createdAt: profile.created_at || new Date().toISOString()
          }));
          
          setUsers(formattedUsers);
          return;
        } else {
          console.log('Nenhum perfil encontrado diretamente do Supabase');
        }
      } catch (supabaseError) {
        console.error('Erro ao buscar diretamente do Supabase:', supabaseError);
      }
      
      // Se chegou aqui, todas as tentativas falharam
      console.warn('Todas as abordagens falharam ao buscar usuários');
      toast.error("Não foi possível carregar a lista de usuários");
      setUsers([]);
    } catch (error) {
      console.error("Erro geral ao buscar usuários:", error);
      toast.error("Erro ao carregar usuários");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'student',
    });
    setEditingUserId(user.id);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Tem certeza de que deseja excluir este usuário?")) {
      try {
        setIsLoading(true);
        await userService.deleteUser(userId);
        toast.success("Usuário excluído com sucesso");
        
        // Atualizar a lista de usuários após a exclusão
        setTimeout(() => {
          fetchUsers();
        }, 500);
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Erro ao excluir o usuário");
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (data: UserFormData) => {
    // Validação básica dos dados
    if (!data.name || data.name.trim() === '') {
      toast.error('Nome é obrigatório');
      return false;
    }
    
    if (!data.email || !data.email.includes('@')) {
      toast.error('Email inválido');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      if (editingUserId) {
        // Atualizando usuário existente
        await userService.updateUser(editingUserId, data);
        toast.success(`Usuário ${data.name} atualizado com sucesso`);
      } else if (data.email) {
        if (data.role === 'admin') {
          // Concedendo privilégios de administrador
          await userService.updateUserRoleByEmail(data.email, 'admin');
          toast.success(`Privilégios de administrador concedidos para ${data.email}`);
        } else {
          // Criando novo usuário
          const newUser = await userService.createUser(data);
          toast.success(`Usuário ${data.name} criado com sucesso! ${data.password ? '' : 'Uma senha temporária foi gerada.'}`);
          
          // Mostrar a senha gerada se o usuário não forneceu uma
          if (!data.password && newUser) {
            toast.info('Lembre-se de compartilhar as credenciais com o usuário', {
              duration: 6000,
            });
          }
        }
      }
      
      // Garantir que a lista de usuários seja atualizada após a operação
      setTimeout(() => {
        fetchUsers(); // Recarregar a lista de usuários com um pequeno atraso
      }, 500);
      
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setEditingUserId(null);
      return true;
    } catch (error: any) {
      console.error("Error saving user:", error);
      
      // Mensagens de erro mais amigáveis
      if (error.message?.includes('já existe') || error.message?.includes('already')) {
        toast.error(`Este email já está em uso. Tente outro email.`);
      } else if (error.message?.includes('permissão') || error.message?.includes('permission')) {
        toast.error(`Você não tem permissão para realizar esta ação.`);
      } else {
        toast.error(`Erro ao salvar usuário: ${error.message || 'Erro desconhecido'}`);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingUserId(null);
  };

  const openNewUserDialog = () => {
    setFormData(defaultFormData);
    setEditingUserId(null);
    setIsDialogOpen(true);
  };

  return {
    users,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    formData,
    editingUserId,
    handleEditUser,
    handleDeleteUser,
    handleSubmit,
    resetForm,
    openNewUserDialog,
  };
}
