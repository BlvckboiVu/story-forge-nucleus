import DOMPurify from 'dompurify';

/**
 * Security utilities for input sanitization and validation
 */

// XSS Protection
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a'
    ],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
  });
};

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SAFE_TEXT: /^[a-zA-Z0-9\s\-_.,!?'"()[\]{}]+$/,
} as const;

// Rate limiting for API calls
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Secure storage wrapper
export class SecureStorage {
  private static encrypt(data: string): string {
    // Simple base64 encoding for basic obfuscation
    // In production, use proper encryption
    return btoa(data);
  }
  
  private static decrypt(data: string): string {
    try {
      return atob(data);
    } catch {
      return '';
    }
  }
  
  static setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, this.encrypt(value));
    } catch (error) {
      console.warn('Failed to store secure item:', error);
    }
  }
  
  static getItem(key: string): string {
    try {
      const item = sessionStorage.getItem(key);
      return item ? this.decrypt(item) : '';
    } catch (error) {
      console.warn('Failed to retrieve secure item:', error);
      return '';
    }
  }
  
  static removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }
}

// Input sanitization helpers
export const sanitizeText = (text: string, maxLength: number = 1000): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
};

export const validateInput = (
  input: string,
  pattern: RegExp,
  maxLength: number = 255
): boolean => {
  if (!input || typeof input !== 'string') return false;
  if (input.length > maxLength) return false;
  return pattern.test(input);
};
