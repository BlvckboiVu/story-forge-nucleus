
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openRouterAPI, MODELS } from '@/utils/openrouter';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('OpenRouter API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Key Management', () => {
    it('should set and get API key', () => {
      const testKey = 'test-api-key';
      openRouterAPI.setApiKey(testKey);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('openrouter_api_key', testKey);
      expect(openRouterAPI.getApiKey()).toBe(testKey);
    });

    it('should return empty string if no API key is set', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(openRouterAPI.getApiKey()).toBe('');
    });
  });

  describe('API Calls', () => {
    beforeEach(() => {
      openRouterAPI.setApiKey('test-key');
    });

    it('should send prompt successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test response'
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await openRouterAPI.sendPrompt('Test prompt');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Test prompt')
        })
      );
      
      expect(result).toBe('Test response');
    });

    it('should throw error when API key is missing', async () => {
      openRouterAPI.setApiKey('');
      
      await expect(openRouterAPI.sendPrompt('Test prompt')).rejects.toThrow('OpenRouter API key is required');
    });

    it('should throw error when prompt is empty', async () => {
      await expect(openRouterAPI.sendPrompt('')).rejects.toThrow('Prompt cannot be empty');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } })
      });

      await expect(openRouterAPI.sendPrompt('Test prompt')).rejects.toThrow('Invalid API key');
    });

    it('should use different models', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await openRouterAPI.sendPrompt('Test', MODELS.LOW_TOKEN);
      
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.model).toBe(MODELS.LOW_TOKEN);
      expect(requestBody.max_tokens).toBe(512);
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      openRouterAPI.setApiKey('test-key');
      openRouterAPI.clearCache();
    });

    it('should cache responses', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Cached response' } }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // First call should hit API
      const result1 = await openRouterAPI.sendPrompt('Test prompt');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toBe('Cached response');

      // Second call should use cache
      const result2 = await openRouterAPI.sendPrompt('Test prompt');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2).toBe('Cached response');
    });

    it('should respect cache size limit', () => {
      const stats = openRouterAPI.getCacheStats();
      expect(stats.maxSize).toBe(10);
    });

    it('should clear cache', () => {
      openRouterAPI.clearCache();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('llm_cache');
    });
  });
});
