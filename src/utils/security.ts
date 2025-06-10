import DOMPurify from 'dompurify';

/**
 * Security utilities for input sanitization, validation, and secure storage
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

// Web Crypto API utilities for secure storage
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// Generate a cryptographic key for encryption/decryption
async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Derive a key from a password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data using AES-GCM
async function encryptData(data: string, password: string): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
}> {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await deriveKey(password, salt);
    const encodedData = encoder.encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encodedData
    );
    
    return {
      encryptedData: arrayBufferToBase64(encrypted),
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data using AES-GCM
async function decryptData(
  encryptedData: string,
  password: string,
  salt: string,
  iv: string
): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const saltBytes = base64ToArrayBuffer(salt);
    const ivBytes = base64ToArrayBuffer(iv);
    const encryptedBytes = base64ToArrayBuffer(encryptedData);
    
    const key = await deriveKey(password, new Uint8Array(saltBytes));
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: new Uint8Array(ivBytes),
      },
      key,
      encryptedBytes
    );
    
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Utility functions for base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a random password for encryption
function generateEncryptionPassword(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return arrayBufferToBase64(array.buffer);
}

// Secure storage wrapper for API keys and sensitive data
export class SecureStorage {
  private static instance: SecureStorage;
  private password: string | null = null;
  
  private constructor() {}
  
  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }
  
  async initialize(): Promise<void> {
    // Try to get existing password from sessionStorage (temporary session-based)
    this.password = sessionStorage.getItem('enc_session_key');
    
    if (!this.password) {
      // Generate new password for this session
      this.password = generateEncryptionPassword();
      sessionStorage.setItem('enc_session_key', this.password);
    }
  }
  
  async storeApiKey(service: string, apiKey: string): Promise<void> {
    if (!this.password) {
      await this.initialize();
    }
    
    if (!this.password) {
      throw new Error('Encryption not initialized');
    }
    
    const encrypted = await encryptData(apiKey, this.password);
    
    // Store in IndexedDB (more secure than localStorage)
    const request = indexedDB.open('SecureStorage', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['apiKeys'], 'readwrite');
        const store = transaction.objectStore('apiKeys');
        
        store.put({
          service,
          ...encrypted,
          timestamp: Date.now(),
        });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('apiKeys')) {
          db.createObjectStore('apiKeys', { keyPath: 'service' });
        }
      };
    });
  }
  
  async getApiKey(service: string): Promise<string | null> {
    if (!this.password) {
      await this.initialize();
    }
    
    if (!this.password) {
      throw new Error('Encryption not initialized');
    }
    
    const request = indexedDB.open('SecureStorage', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      
      request.onsuccess = async () => {
        const db = request.result;
        const transaction = db.transaction(['apiKeys'], 'readonly');
        const store = transaction.objectStore('apiKeys');
        const getRequest = store.get(service);
        
        getRequest.onsuccess = async () => {
          const result = getRequest.result;
          if (!result) {
            resolve(null);
            return;
          }
          
          try {
            const decrypted = await decryptData(
              result.encryptedData,
              this.password!,
              result.salt,
              result.iv
            );
            resolve(decrypted);
          } catch (error) {
            console.error('Failed to decrypt API key:', error);
            resolve(null);
          }
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }
  
  async removeApiKey(service: string): Promise<void> {
    const request = indexedDB.open('SecureStorage', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['apiKeys'], 'readwrite');
        const store = transaction.objectStore('apiKeys');
        
        store.delete(service);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
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
