/**
 * Utilitário para gerenciar uma fila de requisições e evitar problemas de rate limit
 */

type QueuedRequest = {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
};

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private concurrentRequests = 0;
  private maxConcurrentRequests = 2; // Aumentado para 2 para melhorar o desempenho
  private requestDelay = 300; // Reduzido para 300ms para acelerar o carregamento

  /**
   * Adiciona uma requisição à fila e a processa quando possível
   * @param requestFn Função que executa a requisição
   * @returns Promise que será resolvida quando a requisição for processada
   */
  enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Adicionar a requisição à fila
      this.queue.push({
        execute: requestFn,
        resolve,
        reject
      });

      // Iniciar o processamento se não estiver em andamento
      this.processQueue();
    });
  }

  /**
   * Processa a fila de requisições respeitando os limites
   */
  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.concurrentRequests < this.maxConcurrentRequests) {
      // Obter a próxima requisição da fila
      const request = this.queue.shift();
      if (!request) continue;

      // Incrementar o contador de requisições em andamento
      this.concurrentRequests++;

      // Executar a requisição com um pequeno delay
      setTimeout(async () => {
        try {
          const result = await request.execute();
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        } finally {
          // Decrementar o contador quando a requisição for concluída
          this.concurrentRequests--;
          // Continuar processando a fila
          this.processQueue();
        }
      }, this.requestDelay);
    }

    this.processing = false;
  }

  /**
   * Limpa a fila de requisições
   */
  clear() {
    this.queue = [];
  }
}

// Exportar uma instância única para toda a aplicação
export const requestQueue = new RequestQueue();
