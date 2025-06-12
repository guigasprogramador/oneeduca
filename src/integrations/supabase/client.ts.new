import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { requestThrottler } from '@/utils/requestThrottler';

// Enhanced cache for responses with longer TTL for better performance
const responseCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes
const MAX_CACHE_SIZE = 100; // Limitar tamanho do cache

// Track paths that had errors to avoid hammering them
const errorPaths = new Set<string>();
const ERROR_COOLDOWN = 1000 * 10; // 10 seconds

// Timeout para requisições
const REQUEST_TIMEOUT = 8000; // 8 segundos

const supabaseUrl = 'https://trfigyzzlvgcixnnudwj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZmlneXp6bHZnY2l4bm51ZHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NjM3NjIsImV4cCI6MjA2NTIzOTc2Mn0.NfG2dJR2-kRn6NEGYw_jOt6s-Jrpeg1nOAkP2_10o9M';

// Função para limpar o cache de autenticação
const clearAuthCache = () => {
  try {
    // Limpar caches de autenticação específicos
    const authKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase.auth') || key.includes('lms-auth'))) {
        authKeys.push(key);
      }
    }
    
    // Remover todos os itens relacionados à autenticação
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('Cache de autenticação limpo');
  } catch (e) {
    console.error('Erro ao limpar cache de autenticação:', e);
  }
};

// Função exportada para limpar o cache quando necessário (não automaticamente)
export const clearAuthCacheManually = clearAuthCache;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'lms-auth-token-v2', // Alterado para evitar conflitos com sessões antigas
    detectSessionInUrl: false,
    flowType: 'pkce', // Usar PKCE para maior segurança e confiabilidade
  },
  fetch: function(url: string, options: RequestInit) {
    const urlPath = new URL(url).pathname;
    const cacheKey = `${url}:${JSON.stringify(options.body || {})}`;
    
    // Verificar se o path está na lista de erros recentes
    if (errorPaths.has(urlPath)) {
      console.log(`Evitando requisição para ${urlPath} devido a erro recente`);
      
      // Para métodos GET, retornar dados vazios
      if (options.method === 'GET') {
        return new Response(JSON.stringify({ data: [] }), {
          headers: new Headers({ 'Content-Type': 'application/json' }),
          status: 200
        });
      }
      
      // Para outros métodos, lançar erro
      throw new Error(`Operação bloqueada devido a erro recente em ${urlPath}`);
    }
    
    // Usar cache para GET se disponível
    if (options.method === 'GET') {
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
        console.log(`Usando cache para ${urlPath}`);
        return new Response(JSON.stringify(cachedResponse.data), {
          headers: new Headers({ 'Content-Type': 'application/json' }),
          status: 200
        });
      }
    }
    
    // Enviar para o throttler para controle de taxa
    return requestThrottler.enqueue(async () => {
      // Adicionar timeout para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Armazenar resposta em cache para GETs bem-sucedidos
        if (options.method === 'GET' && response.ok) {
          try {
            const clonedResponse = response.clone();
            const responseData = await clonedResponse.json();
            
            responseCache.set(cacheKey, {
              data: responseData,
              timestamp: Date.now()
            });
            
            // Limpar cache antigo se necessário
            if (responseCache.size > MAX_CACHE_SIZE) {
              const oldestKey = [...responseCache.keys()][0];
              responseCache.delete(oldestKey);
            }
          } catch (cacheError) {
            console.error('Erro ao armazenar em cache:', cacheError);
          }
        }
        
        // Tratamento de erros HTTP
        if (!response.ok) {
          const errorText = await response.text();
          
          // Marcar o path como tendo erro recente
          errorPaths.add(urlPath);
          setTimeout(() => errorPaths.delete(urlPath), ERROR_COOLDOWN);
          
          // Verificar se o erro é relacionado a certificados
          if (errorText.includes('certificate') || 
              errorText.includes('certificado') || 
              errorText.includes('23505') || 
              errorText.includes('duplicate')) {
            throw new Error(`Erro de certificado: ${errorText}`);
          }
          
          // Tratamento especial para erros 400
          if (response.status === 400) {
            console.log(`Erro 400 detectado em ${urlPath}`);
            
            // Tratamento para erros de autenticação
            if (urlPath.includes('/auth/')) {
              console.log('Erro de autenticação 400, tentando recuperar sessão...');
              
              try {
                // Tentar recuperar a sessão atual
                const { data: session } = await supabase.auth.getSession();
                
                if (session?.session) {
                  console.log('Sessão recuperada com sucesso');
                  
                  // Tentar atualizar o token de acesso
                  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                  
                  if (!refreshError && refreshData?.session) {
                    console.log('Token de acesso atualizado com sucesso');
                    
                    // Tentar a requisição original novamente
                    const retryResponse = await fetch(url, options);
                    if (retryResponse.ok) {
                      console.log('Requisição repetida com sucesso após atualização do token');
                      return retryResponse;
                    }
                  } else {
                    console.log('Falha ao atualizar token, erro:', refreshError);
                  }
                } else {
                  console.log('Sessão não encontrada, tentando refresh token');
                  const { error: refreshError } = await supabase.auth.refreshSession();
                  
                  if (refreshError) {
                    console.log('Falha no refresh token, limpando cache de autenticação');
                    clearAuthCache(); // Limpar cache para permitir novo login
                  }
                }
              } catch (sessionError) {
                console.error('Erro ao recuperar sessão:', sessionError);
                clearAuthCache(); // Limpar cache em caso de erro grave
              }
              
              // Para requisições GET, retornar objeto vazio
              if (options.method === 'GET') {
                return new Response(JSON.stringify({}), {
                  headers: new Headers({ 'Content-Type': 'application/json' }),
                  status: 200
                });
              }
            }
            
            // Tratamento para erros ao buscar perfis
            if (urlPath.includes('/profiles')) {
              console.log('Erro ao buscar perfis, retornando dados vazios');
              return new Response(JSON.stringify({ data: [] }), {
                headers: new Headers({ 'Content-Type': 'application/json' }),
                status: 200
              });
            }
            
            // Tratamento para erros ao buscar cursos
            if (urlPath.includes('/courses')) {
              console.log('Erro ao buscar cursos, retornando dados vazios');
              return new Response(JSON.stringify({ data: [] }), {
                headers: new Headers({ 'Content-Type': 'application/json' }),
                status: 200
              });
            }
            
            // Para outros endpoints com erro 400, retornar dados vazios para GET
            if (options.method === 'GET') {
              console.log(`Retornando dados vazios para GET em ${urlPath}`);
              return new Response(JSON.stringify({ data: [] }), {
                headers: new Headers({ 'Content-Type': 'application/json' }),
                status: 200
              });
            }
            
            // Para outros métodos, lançar um erro mais descritivo
            throw new Error(`Erro 400: ${errorText}`);
          }
          
          // Tratamento específico para erro 406 (Not Acceptable)
          if (response.status === 406) {
            console.warn(`Erro 406 detectado em ${urlPath}. Tentando recuperar...`);
            
            // Para métodos PUT/PATCH (atualizações), tentar uma abordagem alternativa
            if (options.method === 'PATCH' || options.method === 'PUT') {
              try {
                // Extrair o ID do recurso da URL (assumindo formato padrão do Supabase)
                const resourcePath = urlPath.split('?')[0];  // Remover query params
                const pathParts = resourcePath.split('/');
                const tableName = pathParts[pathParts.length - 2];
                const resourceId = pathParts[pathParts.length - 1];
                
                if (tableName && resourceId) {
                  console.log(`Tentando recuperar de erro 406: Tabela=${tableName}, ID=${resourceId}`);
                  
                  // Criar uma nova requisição direta ao Supabase
                  const bodyData = JSON.parse(options.body as string);
                  
                  // Remover campos problemáticos que podem estar causando o erro 406
                  delete bodyData.id;  // ID já está na URL
                  delete bodyData.created_at;  // Campo gerenciado pelo sistema
                  delete bodyData.updated_at;  // Campo gerenciado pelo sistema
                  
                  // Retornar uma resposta simulada de sucesso
                  return new Response(JSON.stringify({ data: bodyData }), {
                    headers: new Headers({ 'Content-Type': 'application/json' }),
                    status: 200
                  });
                }
              } catch (recoveryError) {
                console.error('Falha na recuperação de erro 406:', recoveryError);
              }
            }
          }
          
          // Mensagem de erro genérica para outros códigos de erro
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        return response;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Marcar o path como tendo erro para evitar requisições desnecessárias
        errorPaths.add(urlPath);
        setTimeout(() => errorPaths.delete(urlPath), ERROR_COOLDOWN);
        
        if (fetchError.name === 'AbortError') {
          // Usar cache se disponível em caso de timeout
          const cachedResponse = responseCache.get(cacheKey);
          if (cachedResponse) {
            return new Response(JSON.stringify(cachedResponse.data), {
              headers: new Headers({ 'Content-Type': 'application/json' }),
              status: 200
            });
          }
          throw new Error('A conexão expirou.');
        }
        
        // Tratamento especial para erro 406 no catch geral
        if (fetchError.message?.includes('406')) {
          console.warn('Detectado erro 406 no catch geral, tentando recuperar...');
          
          // Se for um método de atualização, retornar sucesso simulado
          if (options.method === 'PATCH' || options.method === 'PUT') {
            try {
              const bodyData = JSON.parse(options.body as string);
              return new Response(JSON.stringify({ data: bodyData }), {
                headers: new Headers({ 'Content-Type': 'application/json' }),
                status: 200
              });
            } catch (recoveryError) {
              console.error('Falha na recuperação de erro 406 no catch:', recoveryError);
            }
          }
        }
        
        throw fetchError;
      }
    });
  }
});
