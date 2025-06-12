import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wifi, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
    
    // Log when the component is created for diagnostic purposes
    console.log('NetworkErrorBoundary initialized');
  }

  static getDerivedStateFromError(error: Error): State {
    // Primeiro, registrar todos os detalhes do erro para diagnóstico
    console.log('NetworkErrorBoundary recebeu erro:', error);
    console.log('Tipo do erro:', typeof error);
    console.log('Mensagem de erro:', error.message);
    console.log('Stack trace:', error.stack);
    
    // Agora determinar se devemos capturar este erro
    
    // DESABILITAR TEMPORARIAMENTE A CAPTURA DE ERROS PARA DIAGNÓSTICO
    // Isso permitirá que todos os erros se propaguem para vermos o erro real
    // em vez de ser capturado pelo error boundary
    return { hasError: false, error };
    
    /*
    // Verificar se é um erro de rede
    const isNetworkError = (
      error.message.includes('network') ||
      error.message.includes('Network') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('conexão') ||
      error.message.includes('internet') ||
      (error.message.includes('supabase') && error.message.includes('fetch'))
    );
    
    // Ignorar erros relacionados a certificados ou validações de negócio
    const isCertificateOrBusinessError = (
      error.message.includes('certificado') ||
      error.message.includes('certificate') ||
      error.message.includes('elegível') ||
      error.message.includes('Já existe') ||
      error.message.includes('constraint') ||
      error.message.includes('violation') ||
      error.message.includes('23505')
    );

    // Apenas capturar erros de rede e ignorar erros de negócio
    if (isNetworkError && !isCertificateOrBusinessError) {
      console.log('Erro de rede capturado pelo NetworkErrorBoundary:', error.message);
      return { hasError: true, error };
    }

    // Para outros tipos de erro, deixar o erro propagar
    console.log('Erro não capturado pelo NetworkErrorBoundary:', error.message);
    throw error;
    */
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Erro capturado pelo NetworkErrorBoundary:', error);
    console.error('Detalhes adicionais:', errorInfo);
    
    // Registrar o erro para análise
    // Em uma aplicação de produção, poderia enviar para um serviço de monitoramento
    try {
      // Persistência local do erro para debug
      localStorage.setItem('lastNetworkError', JSON.stringify({
        message: error.message,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }));
    } catch (e) {
      // Ignorar erros de localStorage
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    
    // Tentar primeiro restaurar o estado sem recarregar a página
    // (isso é mais suave para o usuário do que um reload completo)
    try {
      // Checar se há dados em cache que podem ser usados
      if (navigator.onLine) {
        // Se estiver online, tente reconectar e revalidar os dados
        window.location.reload();
      } else {
        // Se offline, mostre uma mensagem mais específica
        alert('Você parece estar offline. Conecte-se à internet e tente novamente.');
      }
    } catch (e) {
      // Fallback para recarregar a página
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback personalizado fornecido como prop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão para erros de rede
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <Card className="w-full max-w-md p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <Wifi className="h-6 w-6 text-red-600" />
              </div>
              
              <h2 className="text-xl font-semibold">Problema de conexão</h2>
              
              <p className="text-muted-foreground">
                {this.state.error?.message || 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.'}
              </p>
              
              <p className="text-sm text-muted-foreground mt-2">
                Se o problema persistir, tente limpar o cache do navegador ou entre em contato com o suporte.
              </p>
              
              <Button 
                onClick={this.handleRetry}
                className="mt-4 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;
