/**
 * Utility to handle request throttling and rate limiting
 */

// Queue for pending requests
interface QueuedRequest {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retryCount: number;
}

export class RequestThrottler {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private requestsInLastMinute = 0;
  private lastRequestTime = 0;
  private rateLimitResetTime = 0;
  
  // Configuration
  private maxRequestsPerMinute: number;
  private minTimeBetweenRequests: number;
  private maxRetries: number;
  private backoffFactor: number;

  constructor(
    maxRequestsPerMinute = 60, // Increased from 30 to 60
    minTimeBetweenRequests = 50, // Reduced from 100 to 50
    maxRetries = 2, // Reduced from 3 to 2
    backoffFactor = 2 // Increased from 1.5 to 2 for faster recovery
  ) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.minTimeBetweenRequests = minTimeBetweenRequests;
    this.maxRetries = maxRetries;
    this.backoffFactor = backoffFactor;
    
    // Reset counters every minute
    setInterval(() => {
      this.requestsInLastMinute = 0;
    }, 60000);
  }

  /**
   * Enqueue a request to be executed with throttling
   */
  async enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: requestFn,
        resolve: resolve as (value: any) => void,
        reject,
        retryCount: 0
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue of requests with throttling
   */
  // Cache to avoid re-fetching content that has already hit rate limits
  private rateLimitedPaths = new Set<string>();
  private pathCache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  
  /**
   * Mark a path as rate-limited to avoid excessive requests
   */
  markPathAsRateLimited(path: string): void {
    if (path) {
      this.rateLimitedPaths.add(path);
      // Clear this path from rate-limited list after 30 seconds
      setTimeout(() => {
        this.rateLimitedPaths.delete(path);
      }, 30000);
    }
  }
  
  /**
   * Check if a path is currently marked as rate-limited
   */
  isPathRateLimited(path: string): boolean {
    return path ? this.rateLimitedPaths.has(path) : false;
  }
  
  /**
   * Add an item to the cache
   */
  cacheItem(path: string, data: any): void {
    if (path) {
      this.pathCache.set(path, {
        data,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Get an item from the cache if still valid
   */
  getCachedItem(path: string): any {
    if (!path) return null;
    
    const cachedItem = this.pathCache.get(path);
    if (cachedItem && (Date.now() - cachedItem.timestamp) < this.CACHE_TTL) {
      return cachedItem.data;
    }
    
    // Remove expired item
    if (cachedItem) {
      this.pathCache.delete(path);
    }
    
    return null;
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    
    // Check if we need to wait for rate limit to reset
    if (this.rateLimitResetTime > Date.now()) {
      const waitTime = Math.min(5000, this.rateLimitResetTime - Date.now() + 500); // Max 5s wait with 500ms buffer
      console.log(`Waiting ${waitTime}ms for rate limit to reset`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimitResetTime = 0; // Reset after waiting
    }
    
    // Check if we're below rate limit in a non-blocking way
    if (this.requestsInLastMinute >= this.maxRequestsPerMinute) {
      // Instead of waiting the full minute, just pause briefly and reduce counter
      this.requestsInLastMinute = Math.max(0, this.requestsInLastMinute - 5);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check if we need to delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minTimeBetweenRequests) {
      const waitTime = this.minTimeBetweenRequests - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Get the next request
    const request = this.queue.shift();
    if (!request) {
      this.processQueue();
      return;
    }
    
    // Try to identify the request URL (for caching purposes)
    let requestPath = '';
    try {
      // This assumes the first parameter to fetch is the URL
      // We're trying to extract path from the function to be executed
      const requestFnStr = request.execute.toString();
      const urlMatch = requestFnStr.match(/fetch\(['"](.*?)['"]/);
      if (urlMatch && urlMatch[1]) {
        requestPath = urlMatch[1];
      }
    } catch (e) {
      // Ignore errors in path extraction
    }
    
    // Check if this path is rate-limited and we have a cached response
    if (requestPath && this.isPathRateLimited(requestPath)) {
      const cachedData = this.getCachedItem(requestPath);
      if (cachedData) {
        // console.log(`Using cached response for rate-limited path: ${requestPath}`);
        request.resolve(cachedData);
        setTimeout(() => this.processQueue(), 0);
        return;
      }
      
      // If path is rate-limited but no cache, let's resolve with empty data for GET requests
      // to prevent timeouts on UI components
      if (requestPath.includes('/auth/v1/user') || requestPath.includes('/rest/v1/') && requestPath.includes('select=')) {
        const emptyResponse = requestPath.includes('auth') ? {} : { data: [] };
        request.resolve(emptyResponse);
        setTimeout(() => this.processQueue(), 0);
        return;
      }
    }
    
    try {
      // Execute the request with reduced counter increment
      this.requestsInLastMinute = this.requestsInLastMinute + 0.5; // Count requests as half to allow more parallel requests
      this.lastRequestTime = Date.now();
      
      const result = await request.execute();
      
      // Cache successful results if we have a path
      if (requestPath) {
        this.cacheItem(requestPath, result);
      }
      
      request.resolve(result);
    } catch (error: any) {
      // Only log critical errors, not rate limits which are expected
      if ((error.message?.includes('429') || error.code === 429) && !requestPath.includes('/auth/v1/user')) {
        console.warn('Rate limit error:', error.message || 'Unknown rate limit error');
      }
      
      // Handle rate limiting errors
      if (error.message?.includes('429') || error.code === 429 || 
          error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
        
        // Mark path as rate-limited if we have one
        if (requestPath) {
          this.markPathAsRateLimited(requestPath);
        }
        
        // Extract rate limit reset time if available
        const resetAfterMatch = error.message?.match(/Reset after (\d+)s/i);
        if (resetAfterMatch) {
          const resetSeconds = parseInt(resetAfterMatch[1], 10);
          this.rateLimitResetTime = Date.now() + (resetSeconds * 1000);
        } else {
          // Use a more modest default (10 seconds instead of 60)
          this.rateLimitResetTime = Date.now() + 10000;
        }
        
        // Retry with shorter exponential backoff
        if (request.retryCount < this.maxRetries) {
          const retryDelay = Math.min(
            10000, // Max 10 seconds (down from 60)
            500 * Math.pow(this.backoffFactor, request.retryCount)
          );
          
          // Only log first retry to reduce console noise
          if (request.retryCount === 0) {
            console.log(`Rate limit hit. Retrying in ${retryDelay}ms (attempt ${request.retryCount + 1}/${this.maxRetries})`);
          }
          
          this.queue.unshift({
            ...request,
            retryCount: request.retryCount + 1
          });
          
          // Use setTimeout instead of await to prevent blocking
          setTimeout(() => this.processQueue(), retryDelay);
          return;
        } else {
          // Max retries reached, resolve with cached data if available or reject
          if (requestPath) {
            const cachedData = this.getCachedItem(requestPath);
            if (cachedData) {
              console.log(`Using cached data for ${requestPath} after max retries`);
              request.resolve(cachedData);
              setTimeout(() => this.processQueue(), 0);
              return;
            }
          }
          
          request.reject(new Error(`Rate limit exceeded`));
        }
      } else {
        // Not a rate limit error, just reject
        request.reject(error);
      }
    }
    
    // Process next request with a shorter delay
    // Using setTimeout to make it non-blocking
    setTimeout(() => this.processQueue(), 5);
  }
}

// Create singleton instance for the application
export const requestThrottler = new RequestThrottler();
