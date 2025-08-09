
import { environment } from '../config/environment';

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

// --- Encryption utilities for API key ---
// In a real app, use a user-supplied passphrase. Here, we use a static key for demo.
const ENCRYPTION_KEY = 'openrouter_demo_static_key_32bytes!!'; // 32 bytes for AES-256
const ENCRYPTION_KEY_NAME = 'openrouter_encryption_key';

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await window.crypto.subtle.importKey(
    'raw',
    enc.encode(ENCRYPTION_KEY),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptApiKey(apiKey: string): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getCryptoKey();
  const enc = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(apiKey)
  );
  // Store iv + ciphertext as base64
  const buf = new Uint8Array(iv.length + ciphertext.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...buf));
}

async function decryptApiKey(data: string): Promise<string> {
  try {
    const raw = atob(data);
    const buf = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
    const iv = buf.slice(0, 12);
    const ciphertext = buf.slice(12);
    const key = await getCryptoKey();
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return '';
  }
}

export const MODELS = {
  STANDARD: 'openai/gpt-3.5-turbo',
  LOW_TOKEN: 'meta-llama/llama-3.2-3b-instruct:free',
};

class OpenRouterAPI {
  private apiKey: string = '';
  private readonly apiUrl: string;

  constructor() {
    const stored = localStorage.getItem('openrouter_api_key');
    if (stored) {
      // Decrypt asynchronously, but constructor can't be async, so use a sync fallback
      // We'll update apiKey after construction if needed
      decryptApiKey(stored).then((decrypted) => {
        this.apiKey = decrypted;
      });
    }
    this.apiUrl = environment.isProduction 
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';
  }

  async setApiKey(key: string) {
    // Validate API key format
    if (!key || key.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }
    
    // Basic format validation (OpenRouter keys start with 'sk-or-')
    if (!key.startsWith('sk-or-')) {
      throw new Error('Invalid OpenRouter API key format');
    }

    this.apiKey = key.trim();
    const encrypted = await encryptApiKey(this.apiKey);
    localStorage.setItem('openrouter_api_key', encrypted);
  }

  async getApiKey(): Promise<string> {
    if (this.apiKey) return this.apiKey;
    const stored = localStorage.getItem('openrouter_api_key');
    if (stored) {
      const decrypted = await decryptApiKey(stored);
      this.apiKey = decrypted;
      return decrypted;
    }
    return '';
  }

  private validatePrompt(prompt: string): void {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }
    
    if (prompt.length > 50000) {
      throw new Error('Prompt is too long (max 50,000 characters)');
    }

    // Basic XSS prevention
    if (/<script|javascript:|on\w+=/i.test(prompt)) {
      throw new Error('Invalid characters in prompt');
    }
  }

  private getCacheKey(prompt: string, model: string): string {
    // Create a hash-like key from prompt and model
    const key = `${prompt.substring(0, 100)}_${model}`;
    return btoa(key).substring(0, 32); // Base64 encode and truncate
  }

  private getCache(): CachedResponse[] {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (!cache) return [];
      
      const parsed = JSON.parse(cache) as CachedResponse[];
      const now = Date.now();
      
      // Filter out expired entries
      return parsed.filter(item => (now - item.timestamp) < CACHE_EXPIRY);
    } catch (error) {
      console.warn('Failed to parse cache:', error);
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
    const cacheKey = this.getCacheKey(prompt, model);
    const filtered = cache.filter(item => 
      this.getCacheKey(item.prompt, item.model) !== cacheKey
    );
    
    filtered.push(newEntry);
    this.setCache(filtered);
  }

  async sendPrompt(prompt: string, model: string = MODELS.STANDARD): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    this.validatePrompt(prompt);

    // Validate model
    if (!Object.values(MODELS).includes(model)) {
      throw new Error('Invalid model specified');
    }

    // Check cache first
    const cachedResponse = this.findCachedResponse(prompt, model);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const response = await fetch(this.apiUrl, {
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
