
// Simple secure storage wrapper for API keys
export class SecureStorage {
  private static instance: SecureStorage;
  private isInitialized = false;

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  initialize(): void {
    this.isInitialized = true;
  }

  async storeApiKey(service: string, apiKey: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SecureStorage not initialized');
    }
    
    try {
      // In a real app, this would use proper encryption
      // For now, we'll use localStorage with a prefix
      const key = `secure_${service}_api_key`;
      localStorage.setItem(key, apiKey);
    } catch (error) {
      throw new Error('Failed to store API key securely');
    }
  }

  async getApiKey(service: string): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error('SecureStorage not initialized');
    }
    
    try {
      const key = `secure_${service}_api_key`;
      return localStorage.getItem(key);
    } catch (error) {
      throw new Error('Failed to retrieve API key');
    }
  }

  async removeApiKey(service: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SecureStorage not initialized');
    }
    
    try {
      const key = `secure_${service}_api_key`;
      localStorage.removeItem(key);
    } catch (error) {
      throw new Error('Failed to remove API key');
    }
  }
}

// Rate limiter for API requests
export class RateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(private maxRequests: number, private windowMs: number) {}

  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const clientRequests = this.requests.get(clientId) || [];
    
    // Remove old requests outside the window
    const validRequests = clientRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(clientId, validRequests);
    
    return true;
  }

  reset(clientId: string): void {
    this.requests.delete(clientId);
  }
}
