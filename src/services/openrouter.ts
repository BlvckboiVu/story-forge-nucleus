import { SecureStorage } from '@/utils/encryption';
import { RateLimiter } from '@/utils/security';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const OPTIMIZED_MODELS = {
  STANDARD: 'openai/gpt-3.5-turbo',
  LOW_TOKEN: 'meta-llama/llama-2-7b-chat',
  FAST: 'anthropic/claude-3-haiku',
} as const;

class OpenRouterService {
  private baseUrl = 'https://openrouter.ai/api/v1';
  private secureStorage = SecureStorage.getInstance();
  private abortController: AbortController | null = null;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private cache = new Map<string, { response: string; timestamp: number }>();
  private rateLimiter = new RateLimiter(20, 60000); // 20 requests per minute
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private readonly maxCacheSize = 50;

  constructor() {
    this.secureStorage.initialize();
  }

  private getCacheKey(prompt: string, model: string): string {
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

  // Get API key with validation
  private async getApiKey(): Promise<string> {
    const apiKey = await this.secureStorage.getApiKey('openrouter');
    if (!apiKey) {
      throw new Error('OpenRouter API key not found. Please set your API key in settings.');
    }
    return apiKey;
  }

  // Store API key securely
  async setApiKey(apiKey: string): Promise<void> {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key provided');
    }
    
    // Basic validation for OpenRouter key format
    if (!apiKey.startsWith('sk-or-')) {
      throw new Error('Invalid OpenRouter API key format');
    }
    
    await this.secureStorage.storeApiKey('openrouter', apiKey);
  }

  // Remove API key
  async removeApiKey(): Promise<void> {
    await this.secureStorage.removeApiKey('openrouter');
  }

  // Check if API key exists
  async hasApiKey(): Promise<boolean> {
    try {
      const apiKey = await this.secureStorage.getApiKey('openrouter');
      return !!apiKey;
    } catch {
      return false;
    }
  }

  // Cancel ongoing request
  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Generate completion with retry logic and caching
  async generateCompletion(
    messages: OpenRouterMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<OpenRouterResponse> {
    const clientId = 'user'; // In a real app, use user ID
    if (!this.rateLimiter.isAllowed(clientId)) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }
    
    const apiKey = await this.getApiKey();
    
    const requestBody: OpenRouterRequest = {
      model: options.model || OPTIMIZED_MODELS.STANDARD,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      stream: options.stream ?? false,
    };

    // Check cache first for non-streaming requests
    if (!options.stream) {
      const cacheKey = this.getCacheKey(messages[0].content, requestBody.model);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('Returning cached response');
        return JSON.parse(cached.response);
      }
    }

    // Create new abort controller for this request
    this.abortController = new AbortController();

    const requestKey = JSON.stringify(requestBody);
    
    // Check if identical request is already in progress
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }

    const requestPromise = this.makeRequest(apiKey, requestBody);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache non-streaming responses
      if (!options.stream) {
        const cacheKey = this.getCacheKey(messages[0].content, requestBody.model);
        this.pruneCache();
        this.cache.set(cacheKey, {
          response: JSON.stringify(result),
          timestamp: Date.now(),
        });
      }
      
      return result;
    } finally {
      this.requestQueue.delete(requestKey);
      this.abortController = null;
    }
  }

  // Stream completion for real-time responses
  async *streamCompletion(
    messages: OpenRouterMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    const clientId = 'user';
    if (!this.rateLimiter.isAllowed(clientId)) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }
    
    const apiKey = await this.getApiKey();
    
    const requestBody: OpenRouterRequest = {
      model: options.model || OPTIMIZED_MODELS.STANDARD,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      stream: true,
    };

    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StoryForge AI Assistant',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (error) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Invalid API key. Please check your OpenRouter API key.');
        } else if (error.message.includes('429')) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.message.includes('insufficient_quota')) {
          throw new Error('API quota exceeded. Please check your OpenRouter account.');
        }
      }
      throw error;
    }
  }

  private async makeRequest(apiKey: string, requestBody: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'StoryForge AI Assistant',
      },
      body: JSON.stringify(requestBody),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }

  clearCache(): void {
    this.cache.clear();
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
      prompts.map(prompt => this.generateCompletion([{ role: 'user', content: prompt }], { model }))
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value.choices[0].message.content : `Error: ${result.reason.message}`
    );
  }
}

export const openRouterService = new OpenRouterService();
