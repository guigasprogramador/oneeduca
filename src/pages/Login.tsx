
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase, clearAuthCacheManually } from "@/integrations/supabase/client";
import { adaptSupabaseUser } from "@/utils/userAdapter";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, user, session } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  
  // Verificar se o usuário já está logado e redirecionar baseado no papel
  useEffect(() => {
    if (user && session) {
      // Redirecionar baseado no papel do usuário
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'professor') {
        navigate('/professor/dashboard');
      } else {
        navigate('/dashboard'); // Estudantes vão para o dashboard padrão
      }
    }
  }, [user, session, navigate]);
  
  // Verificar se há uma sessão ativa ao carregar a página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          // Se houver uma sessão válida, redirecionar baseado no papel do usuário
          const adaptedUser = adaptSupabaseUser(data.session.user);
          
          if (adaptedUser?.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (adaptedUser?.role === 'professor') {
            navigate('/professor/dashboard');
          } else {
            navigate('/dashboard'); // Estudantes vão para o dashboard padrão
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
      }
    };
    
    checkSession();
  }, [navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    // Incrementar contador de tentativas
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    setLastAttemptTime(Date.now());
    
    try {
      // Se houver muitas tentativas em pouco tempo, podemos tentar uma abordagem diferente
      // mas não vamos limpar o cache automaticamente para evitar problemas de logout
      if (newAttempts > 1 && Date.now() - lastAttemptTime < 10000) {
        console.log('Múltiplas tentativas de login em um curto período de tempo');
      }
      
      // Tentar fazer login
      await login(data.email, data.password);
      
      // Verificar se o login foi bem-sucedido
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        // Login bem-sucedido - redirecionar baseado no papel do usuário
        toast.success("Login realizado com sucesso!");
        
        // Usar o adaptador para obter dados do usuário
        const adaptedUser = adaptSupabaseUser(sessionData.session.user);
        
        // Redirecionar baseado no papel
        if (adaptedUser?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (adaptedUser?.role === 'professor') {
          navigate('/professor/dashboard');
        } else {
          navigate('/dashboard'); // Estudantes vão para o dashboard padrão
        }
      } else {
        // Se não houver sessão após o login, algo deu errado
        throw new Error("Falha ao estabelecer sessão");
      }
    } catch (error: any) {
      console.error("Erro de login:", error);
      
      // Mensagem de erro mais específica
      if (error.message?.includes('Invalid login credentials')) {
        toast.error("Credenciais inválidas. Verifique seu email e senha.");
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error("Email não confirmado. Verifique sua caixa de entrada.");
      } else {
        toast.error("Falha ao fazer login. Tente novamente.");
      }
      
      // Se for a terceira tentativa, sugerir ao usuário limpar o cache
      if (newAttempts >= 3) {
        toast.error(
          "Múltiplas tentativas de login falharam. Tente limpar o cache do navegador ou usar uma janela anônima.", 
          { duration: 6000 }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8 px-2 sm:px-4">
      <Card className="w-full max-w-md shadow-lg dark:bg-gray-800">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center mb-4">
            <img src="/favicon.svg" alt="OneEduca Logo" className="h-16 w-16 mb-2" />
            <h1 className="text-xl font-bold text-blue-700 dark:text-gray-100">OneEduca</h1>
          </div>
          <CardTitle className="text-2xl text-center font-bold text-blue-700 dark:text-gray-100">Entrar na plataforma</CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-300">
            Entre com suas credenciais abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} className="dark:bg-gray-700 dark:text-gray-100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-200">Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} className="dark:bg-gray-700 dark:text-gray-100" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-blue-600 text-white dark:bg-blue-700 dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-blue-800" 
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
              
              {/* Botão alternativo para limpar cache e tentar novamente */}
              {loginAttempts > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full mt-2" 
                  onClick={() => {
                    // Usar a função exportada para limpar o cache de autenticação
                    clearAuthCacheManually();
                    toast.info("Cache de autenticação limpo. Tente fazer login novamente.");
                    // Resetar formulário
                    form.reset();
                    setLoginAttempts(0);
                  }}
                >
                  Limpar cache e tentar novamente
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
            Não tem uma conta?{" "}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
              Registrar
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
