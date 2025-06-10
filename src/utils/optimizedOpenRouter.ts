
import { openRouterAPI, MODELS } from './openrouter';

export const OPTIMIZED_MODELS = {
  STANDARD: MODELS.STANDARD,
  LOW_TOKEN: MODELS.LOW_TOKEN,
};

class OptimizedOpenRouterAPI {
  setApiKey(key: string) {
    return openRouterAPI.setApiKey(key);
  }

  getApiKey(): string {
    return openRouterAPI.getApiKey();
  }

  async sendPrompt(prompt: string, model: string = OPTIMIZED_MODELS.STANDARD): Promise<string> {
    return openRouterAPI.sendPrompt(prompt, model);
  }

  clearCache() {
    return openRouterAPI.clearCache();
  }

  getCacheStats() {
    return openRouterAPI.getCacheStats();
  }
}

export const optimizedOpenRouterAPI = new OptimizedOpenRouterAPI();
