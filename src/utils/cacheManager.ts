/**
 * Gerenciador de cache para reduzir requisições ao servidor
 */

type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiry: number; // Tempo de expiração em ms
};

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultExpiry = 5 * 60 * 1000; // 5 minutos em ms

  /**
   * Obtém um item do cache
   * @param key Chave do item
   * @returns O item armazenado ou null se não existir ou estiver expirado
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Verificar se o item expirou
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  /**
   * Armazena um item no cache
   * @param key Chave do item
   * @param data Dados a serem armazenados
   * @param expiry Tempo de expiração em ms (opcional)
   */
  set<T>(key: string, data: T, expiry: number = this.defaultExpiry): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  /**
   * Remove um item do cache
   * @param key Chave do item
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpa todos os itens expirados do cache
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Obtém ou define um item no cache
   * @param key Chave do item
   * @param fetchFn Função para buscar os dados se não estiverem no cache
   * @param expiry Tempo de expiração em ms (opcional)
   * @returns Os dados armazenados ou buscados
   */
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    expiry: number = this.defaultExpiry
  ): Promise<T> {
    // Verificar se o item está no cache
    const cachedItem = this.get<T>(key);
    if (cachedItem !== null) {
      console.log(`[Cache] Hit para a chave: ${key}`);
      return cachedItem;
    }

    // Se não estiver no cache, buscar os dados
    console.log(`[Cache] Miss para a chave: ${key}`);
    try {
      const data = await fetchFn();
      this.set(key, data, expiry);
      return data;
    } catch (error) {
      console.error(`[Cache] Erro ao buscar dados para a chave ${key}:`, error);
      throw error;
    }
  }
}

// Exportar uma instância única para toda a aplicação
export const cacheManager = new CacheManager();
