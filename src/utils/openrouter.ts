interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface CachedResponse {
  prompt: string;
  response: string;
  timestamp: number;
  model: string;
}

const CACHE_KEY = 'llm_cache';
const CACHE_MAX_SIZE = 10;
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const MODELS = {
  STANDARD: 'openai/gpt-3.5-turbo',
  LOW_TOKEN: 'meta-llama/llama-3.2-3b-instruct:free',
};

class OpenRouterAPI {
  private apiKey: string = '';

  constructor() {
    this.apiKey = localStorage.getItem('openrouter_api_key') || '';
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('openrouter_api_key', key);
  }

  getApiKey(): string {
    return this.apiKey;
  }

  private getCacheKey(prompt: string, model: string): string {
    return `${prompt.substring(0, 100)}_${model}`;
  }

  private getCache(): CachedResponse[] {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (!cache) return [];
      
      const parsed = JSON.parse(cache) as CachedResponse[];
      const now = Date.now();
      
      // Filter out expired entries
      return parsed.filter(item => (now - item.timestamp) < CACHE_EXPIRY);
    } catch {
      return [];
    }
  }

  private setCache(cache: CachedResponse[]) {
    try {
      // Keep only the most recent entries
      const trimmed = cache.slice(-CACHE_MAX_SIZE);
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  private findCachedResponse(prompt: string, model: string): string | null {
    const cache = this.getCache();
    const cacheKey = this.getCacheKey(prompt, model);
    
    const cached = cache.find(item => 
      this.getCacheKey(item.prompt, item.model) === cacheKey
    );
    
    return cached ? cached.response : null;
  }

  private cacheResponse(prompt: string, response: string, model: string) {
    const cache = this.getCache();
    const newEntry: CachedResponse = {
      prompt,
      response,
      timestamp: Date.now(),
      model,
    };
    
    // Remove existing entry with same prompt/model if exists
    const filtered = cache.filter(item => 
      this.getCacheKey(item.prompt, item.model) !== this.getCacheKey(prompt, model)
    );
    
    filtered.push(newEntry);
    this.setCache(filtered);
  }

  async sendPrompt(prompt: string, model: string = MODELS.STANDARD): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    // Check cache first
    const cachedResponse = this.findCachedResponse(prompt, model);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Story Forge AI',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: model === MODELS.LOW_TOKEN ? 512 : 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response received from the model');
      }

      const responseText = data.choices[0].message.content;
      
      // Cache the response
      this.cacheResponse(prompt, responseText, model);
      
      return responseText;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to OpenRouter API');
    }
  }

  clearCache() {
    localStorage.removeItem(CACHE_KEY);
  }

  getCacheStats() {
    const cache = this.getCache();
    return {
      size: cache.length,
      maxSize: CACHE_MAX_SIZE,
      oldestEntry: cache.length > 0 ? new Date(Math.min(...cache.map(c => c.timestamp))) : null,
    };
  }
}

export const openRouterAPI = new OpenRouterAPI();
