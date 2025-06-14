// Authentication event logging for security monitoring
export interface AuthEvent {
  type: 'signin_success' | 'signin_failure' | 'signup_success' | 'signup_failure' | 'signout' | 'rate_limit_exceeded' | 'suspicious_activity';
  email?: string;
  userId?: string;
  timestamp: number;
  userAgent: string;
  ipAddress?: string;
  details?: string;
  sessionId?: string;
}

class AuthLogger {
  private events: AuthEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  
  log(event: Omit<AuthEvent, 'timestamp' | 'userAgent'>): void {
    const authEvent: AuthEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
    };
    
    // Add to local storage for persistence
    this.events.push(authEvent);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
    
    // Store in localStorage (in production, this would go to a secure logging service)
    try {
      const storedEvents = JSON.parse(localStorage.getItem('auth_security_log') || '[]');
      storedEvents.push(authEvent);
      
      // Keep only last 100 events in localStorage
      const recentEvents = storedEvents.slice(-100);
      localStorage.setItem('auth_security_log', JSON.stringify(recentEvents));
    } catch (error) {
      console.error('Failed to store auth event:', error);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Event:', authEvent);
    }
    
    // Check for suspicious patterns
    this.detectSuspiciousActivity(event.email);
  }
  
  private detectSuspiciousActivity(email?: string): void {
    if (!email) return;
    
    const recentEvents = this.getRecentEvents(5 * 60 * 1000); // Last 5 minutes
    const failureCount = recentEvents.filter(
      e => e.email === email && e.type === 'signin_failure'
    ).length;
    
    if (failureCount >= 3) {
      this.log({
        type: 'suspicious_activity',
        email,
        details: `Multiple failed login attempts: ${failureCount} in 5 minutes`,
      });
    }
  }
  
  getRecentEvents(timeWindowMs: number = 60 * 60 * 1000): AuthEvent[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.events.filter(e => e.timestamp > cutoff);
  }
  
  getFailedAttempts(email: string, timeWindowMs: number = 15 * 60 * 1000): number {
    const cutoff = Date.now() - timeWindowMs;
    return this.events.filter(
      e => e.email === email && e.type === 'signin_failure' && e.timestamp > cutoff
    ).length;
  }
  
  exportLogs(): AuthEvent[] {
    return [...this.events];
  }
  
  clearLogs(): void {
    this.events = [];
    localStorage.removeItem('auth_security_log');
  }
}

export const authLogger = new AuthLogger();
