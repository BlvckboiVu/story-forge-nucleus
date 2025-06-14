
// Rate limiting for authentication endpoints
export class AuthRateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number; lockedUntil?: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private lockoutMs: number = 30 * 60 * 1000 // 30 minutes lockout
  ) {}
  
  isAllowed(identifier: string): { allowed: boolean; remainingAttempts?: number; lockedUntil?: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) {
      return { allowed: true, remainingAttempts: this.maxAttempts - 1 };
    }
    
    // Check if still locked out
    if (record.lockedUntil && now < record.lockedUntil) {
      return { allowed: false, lockedUntil: record.lockedUntil };
    }
    
    // Reset if window has passed
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.delete(identifier);
      return { allowed: true, remainingAttempts: this.maxAttempts - 1 };
    }
    
    // Check if max attempts reached
    if (record.count >= this.maxAttempts) {
      const lockedUntil = now + this.lockoutMs;
      this.attempts.set(identifier, { ...record, lockedUntil });
      return { allowed: false, lockedUntil };
    }
    
    return { allowed: true, remainingAttempts: this.maxAttempts - record.count - 1 };
  }
  
  recordAttempt(identifier: string, success: boolean): void {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (success) {
      // Clear attempts on successful login
      this.attempts.delete(identifier);
      return;
    }
    
    if (!record) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
    } else {
      // Reset if window has passed
      if (now - record.firstAttempt > this.windowMs) {
        this.attempts.set(identifier, { count: 1, firstAttempt: now });
      } else {
        this.attempts.set(identifier, { ...record, count: record.count + 1 });
      }
    }
  }
  
  getRemainingLockTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record?.lockedUntil) return 0;
    
    const remaining = record.lockedUntil - Date.now();
    return Math.max(0, remaining);
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Global rate limiter instance
export const authRateLimiter = new AuthRateLimiter();
