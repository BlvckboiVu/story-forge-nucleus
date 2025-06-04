
import { SecureStorage } from '@/utils/encryption';

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

class OpenRouterService {
  private baseUrl = 'https://openrouter.ai/api/v1';
  private secureStorage = SecureStorage.getInstance();
  private abortController: AbortController | null = null;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimitState = {
    requestCount: 0,
    windowStart: Date.now(),
    isThrottled: false,
  };

  constructor() {
    this.secureStorage.initialize();
  }

  // Debounced request to prevent spam
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => resolve(func(...args)), delay);
      });
    };
  }

  // Rate limiting with exponential backoff
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 60000; // 1 minute window
    const maxRequests = 20; // Max requests per window

    // Reset window if it's been more than 1 minute
    if (now - this.rateLimitState.windowStart > windowDuration) {
      this.rateLimitState.requestCount = 0;
      this.rateLimitState.windowStart = now;
      this.rateLimitState.isThrottled = false;
    }

    // Check if we're hitting rate limits
    if (this.rateLimitState.requestCount >= maxRequests) {
      this.rateLimitState.isThrottled = true;
      const waitTime = windowDuration - (now - this.rateLimitState.windowStart);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    this.rateLimitState.requestCount++;
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

  // Generate completion with retry logic
  async generateCompletion(
    messages: OpenRouterMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<OpenRouterResponse> {
    await this.checkRateLimit();
    
    const apiKey = await this.getApiKey();
    
    const requestBody: OpenRouterRequest = {
      model: options.model || 'meta-llama/llama-3.2-3b-instruct:free',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      stream: options.stream ?? false,
    };

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
    await this.checkRateLimit();
    
    const apiKey = await this.getApiKey();
    
    const requestBody: OpenRouterRequest = {
      model: options.model || 'meta-llama/llama-3.2-3b-instruct:free',
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
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  // Make HTTP request with retry logic
  private async makeRequest(apiKey: string, requestBody: OpenRouterRequest): Promise<OpenRouterResponse> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
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
          signal: this.abortController?.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          
          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(errorMessage);
          }
          
          throw new Error(errorMessage);
        }

        const data: OpenRouterResponse = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request was cancelled');
        }

        // Wait before retry with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  // Get available models
  async getModels(): Promise<Array<{ id: string; name: string; context_length: number }>> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // Return default models if fetch fails
      return [
        { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', context_length: 131072 },
        { id: 'meta-llama/llama-3.2-1b-instruct:free', name: 'Llama 3.2 1B (Free)', context_length: 131072 },
        { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B (Free)', context_length: 8192 },
      ];
    }
  }
}

export const openRouterService = new OpenRouterService();
