
import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@/types";
import { adaptSupabaseUser } from "@/utils/userAdapter";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAdmin: () => boolean;
  isProfessor: () => boolean;
  isStudent: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAdmin: () => false,
  isProfessor: () => false,
  isStudent: () => false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Track last admin role update time to limit frequency
  const [lastAdminRoleUpdate, setLastAdminRoleUpdate] = useState<number>(0);
  
  // Função para garantir que o papel de admin esteja definido no JWT
  const ensureAdminRole = async (currentUser: User | null) => {
    if (!currentUser) return;
    
    // Only attempt role update once every 5 minutes max
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - lastAdminRoleUpdate < fiveMinutes) {
      // Skip update if we've done it recently
      return;
    }

    // Verifica se o usuário é admin com base no email
    if (currentUser.email === "guigasprogramador@gmail.com" || 
        currentUser.email === "admin@example.com") {
      
      // Verificar se já é admin para evitar chamadas redundantes
      if (currentUser.role !== 'admin') {
        try {
          setLastAdminRoleUpdate(now); // Set this immediately to prevent parallel calls
          await supabase.auth.updateUser({
            data: { role: 'admin' }
          });
        } catch (error) {
          console.error("Erro ao definir papel de admin:", error);
        }
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth state changed: ${event}`);
        setSession(session);
        const adaptedUser = adaptSupabaseUser(session?.user ?? null);
        setUser(adaptedUser);
        
        // Verifica e atualiza o papel de admin quando o estado de autenticação muda
        if (session && adaptedUser) {
          setTimeout(() => {
            ensureAdminRole(adaptedUser);
          }, 0);
        }
        
        // Reset login attempts when auth state changes successfully
        if (event === 'SIGNED_IN') {
          setLoginAttempts(0);
          setIsRetrying(false);
        }
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Try to refresh the session if there was an error
          await supabase.auth.refreshSession();
          const refreshResult = await supabase.auth.getSession();
          setSession(refreshResult.data.session);
          setUser(adaptSupabaseUser(refreshResult.data.session?.user ?? null));
        } else {
          setSession(data.session);
          const adaptedUser = adaptSupabaseUser(data.session?.user ?? null);
          setUser(adaptedUser);
          
          // Verifica e atualiza o papel de admin na inicialização
          if (data.session && adaptedUser) {
            ensureAdminRole(adaptedUser);
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = (): boolean => {
    if (!user) return false;
    
    // Check for admin role in user metadata
    if (user.role === "admin") {
      return true;
    }
    
    // Caso especial para o usuário com email específico
    if (user.email === "guigasprogramador@gmail.com") {
      return true;
    }
    
    // Fallback para o teste
    if (user.email === "admin@example.com") {
      console.log("Usuário é admin pelo email de teste");
      return true;
    }
    
    console.log("Usuário NÃO é admin");
    return false;
  };

  const isProfessor = (): boolean => {
    if (!user) return false;
    return user.role === "professor" || isAdmin();
  };

  const isStudent = (): boolean => {
    if (!user) return false;
    return user.role === "student";
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setIsRetrying(false);
      console.log("Tentando login com:", email);
      
      // Não vamos mais limpar as sessões existentes para evitar problemas de logout
      // O Supabase gerencia isso automaticamente
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Incrementar tentativas de login
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // Se for a primeira ou segunda tentativa, tentar novamente automaticamente
        if (newAttempts <= 2 && !isRetrying) {
          console.log(`Tentativa ${newAttempts}: Erro ao fazer login. Tentando novamente automaticamente...`);
          setIsRetrying(true);
          
          // Esperar um pouco antes de tentar novamente
          setTimeout(async () => {
            try {
              // Tentar refresh token primeiro
              await supabase.auth.refreshSession();
              
              // Tentar login novamente
              const retryResult = await supabase.auth.signInWithPassword({ email, password });
              
              if (retryResult.error) {
                throw retryResult.error;
              }
              
              console.log("Login bem-sucedido na tentativa automática");
              toast.success("Login realizado com sucesso!");
              
              // Atualizar estado após login bem-sucedido
              setSession(retryResult.data.session);
              const adaptedUser = adaptSupabaseUser(retryResult.data.user);
              setUser(adaptedUser);
              
              if (adaptedUser) {
                await ensureAdminRole(adaptedUser);
              }
              
              setIsRetrying(false);
            } catch (retryError: any) {
              console.error("Erro na tentativa automática de login:", retryError);
              setIsRetrying(false);
              throw retryError;
            } finally {
              setIsLoading(false);
            }
          }, 1000);
          
          return; // Retornar para evitar que o erro seja lançado agora
        }
        
        throw error;
      }
      
      console.log("Login bem-sucedido");
      toast.success("Login realizado com sucesso!");
      
      // Atualizar estado após login bem-sucedido
      setSession(data.session);
      const adaptedUser = adaptSupabaseUser(data.user);
      setUser(adaptedUser);
      
      // Após o login bem-sucedido, verifica se o usuário é admin
      if (data.user) {
        await ensureAdminRole(adaptedUser);
      }
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(`Erro ao fazer login: ${error.message}`);
      throw error;
    } finally {
      if (!isRetrying) {
        setIsLoading(false);
      }
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log("Tentando registrar com:", email, name);
      
      // Register the user com o papel padrão de 'student'
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'student', // Define o papel padrão como 'student'
          },
        },
      });

      if (signUpError) throw signUpError;
      
      // Se for um email de administrador, atualize o papel para 'admin'
      if (email === 'admin@example.com' || email === 'guigasprogramador@gmail.com') {
        console.log("Definindo usuário como admin:", email);
        if (data.user) {
          await supabase.auth.updateUser({
            data: { role: 'admin' }
          });
        }
      }
      
      console.log("Registro bem-sucedido");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(`Erro ao registrar: ${error.message}`);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Usar o método signOut com scope 'local' para manter tokens de refresh
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      
      // Limpar estados locais
      setSession(null);
      setUser(null);
      setLoginAttempts(0);
      setIsRetrying(false);
      
      // Não vamos mais limpar o cache manualmente para evitar problemas
      // O Supabase já gerencia isso corretamente com signOut({ scope: 'local' })
      
      toast.success("Logout realizado com sucesso!");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(`Erro ao sair: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isAdmin,
        isProfessor,
        isStudent,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
