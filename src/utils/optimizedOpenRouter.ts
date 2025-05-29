
import { SecureStorage, RateLimiter } from './security';

export const OPTIMIZED_MODELS = {
  STANDARD: 'openai/gpt-3.5-turbo',
  LOW_TOKEN: 'meta-llama/llama-2-7b-chat',
  FAST: 'anthropic/claude-3-haiku',
} as const;

class OptimizedOpenRouterAPI {
  private cache = new Map<string, { response: string; timestamp: number }>();
  private rateLimiter = new RateLimiter(20, 60000); // 20 requests per minute
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private readonly maxCacheSize = 50;

  private getCacheKey(prompt: string, model: string): string {
    // Create a hash-like key to avoid storing sensitive data
    return btoa(`${prompt.slice(0, 100)}:${model}`).slice(0, 32);
  }

  private pruneCache(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10 entries
    for (let i = 0; i < 10 && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  setApiKey(apiKey: string): void {
    if (!apiKey?.trim()) {
      throw new Error('API key cannot be empty');
    }
    
    // Validate API key format
    if (!/^sk-[a-zA-Z0-9]{32,}$/.test(apiKey)) {
      console.warn('API key format may be invalid');
    }
    
    SecureStorage.setItem('openrouter_api_key', apiKey);
  }

  getApiKey(): string {
    return SecureStorage.getItem('openrouter_api_key');
  }

  async sendPrompt(
    prompt: string, 
    model: string = OPTIMIZED_MODELS.STANDARD,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<string> {
    // Input validation
    if (!prompt?.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    if (prompt.length > 4000) {
      throw new Error('Prompt too long. Maximum 4000 characters allowed.');
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key is required. Please set it in the panel.');
    }

    // Rate limiting
    const clientId = 'user'; // In a real app, use user ID
    if (!this.rateLimiter.isAllowed(clientId)) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    // Check cache first
    const cacheKey = this.getCacheKey(prompt, model);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('Returning cached response');
      return cached.response;
    }

    // Sanitize prompt to prevent injection
    const sanitizedPrompt = prompt
      .replace(/[<>]/g, '') // Remove potential HTML
      .slice(0, 4000); // Enforce length limit

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StoryForge Writing Assistant',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful writing assistant. Provide constructive feedback and suggestions for creative writing.'
            },
            {
              role: 'user',
              content: sanitizedPrompt
            }
          ],
          max_tokens: options.maxTokens || (model === OPTIMIZED_MODELS.LOW_TOKEN ? 512 : 1024),
          temperature: options.temperature || 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API request failed: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from API');
      }

      const result = data.choices[0].message.content;
      
      // Cache the response
      this.pruneCache();
      this.cache.set(cacheKey, {
        response: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      
      if (error instanceof Error) {
        // Provide user-friendly error messages
        if (error.message.includes('401')) {
          throw new Error('Invalid API key. Please check your OpenRouter API key.');
        } else if (error.message.includes('429')) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.message.includes('insufficient_quota')) {
          throw new Error('API quota exceeded. Please check your OpenRouter account.');
        }
        throw error;
      }
      
      throw new Error('Network error. Please check your internet connection.');
    }
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }

  clearCache(): void {
    this.cache.clear();
    SecureStorage.removeItem('llm_cache');
  }

  // Batch processing for multiple prompts
  async sendBatchPrompts(
    prompts: string[], 
    model: string = OPTIMIZED_MODELS.STANDARD
  ): Promise<string[]> {
    if (prompts.length > 5) {
      throw new Error('Maximum 5 prompts allowed in batch');
    }

    const results = await Promise.allSettled(
      prompts.map(prompt => this.sendPrompt(prompt, model))
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : `Error: ${result.reason.message}`
    );
  }
}

export const optimizedOpenRouterAPI = new OptimizedOpenRouterAPI();
