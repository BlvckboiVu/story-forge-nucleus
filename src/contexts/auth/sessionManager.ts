
// Enhanced session management with security features
import { User } from '../../types';
import * as crypto from 'crypto';

interface SessionData {
  user: User;
  createdAt: number;
  lastActivity: number;
  sessionId: string;
  isRefreshScheduled?: boolean;
}

class SessionManager {
  private sessionData: SessionData | null = null;
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private readonly ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
  private readonly WARNING_THRESHOLD = 5 * 60 * 1000; // Warn 5 minutes before expiry
  
  private timeoutWarningCallback?: () => void;
  private sessionExpiredCallback?: () => void;
  private activityTimer?: NodeJS.Timeout;
  
  setSessionCallbacks(
    onWarning?: () => void,
    onExpired?: () => void
  ) {
    this.timeoutWarningCallback = onWarning;
    this.sessionExpiredCallback = onExpired;
  }
  
  createSession(user: User): void {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    this.sessionData = {
      user,
      createdAt: now,
      lastActivity: now,
      sessionId,
    };
    
    this.startActivityMonitoring();
    this.scheduleSessionChecks();
  }
  
  updateActivity(): void {
    if (this.sessionData) {
      this.sessionData.lastActivity = Date.now();
      this.startActivityMonitoring(); // Reset activity timer
    }
  }
  
  getSession(): SessionData | null {
    if (!this.sessionData) return null;
    
    const now = Date.now();
    
    // Check if session has expired
    if (now - this.sessionData.createdAt > this.SESSION_TIMEOUT) {
      this.clearSession();
      this.sessionExpiredCallback?.();
      return null;
    }
    
    // Check if user has been inactive too long
    if (now - this.sessionData.lastActivity > this.ACTIVITY_TIMEOUT) {
      this.clearSession();
      this.sessionExpiredCallback?.();
      return null;
    }
    
    return this.sessionData;
  }
  
  clearSession(): void {
    this.sessionData = null;
    this.clearTimers();
  }
  
  getTimeUntilExpiry(): number {
    if (!this.sessionData) return 0;
    
    const sessionExpiry = this.sessionData.createdAt + this.SESSION_TIMEOUT;
    const activityExpiry = this.sessionData.lastActivity + this.ACTIVITY_TIMEOUT;
    const earliestExpiry = Math.min(sessionExpiry, activityExpiry);
    
    return Math.max(0, earliestExpiry - Date.now());
  }
  
  isNearExpiry(): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    return timeUntilExpiry > 0 && timeUntilExpiry < this.WARNING_THRESHOLD;
  }
  
  private generateSessionId(): string {
    // Use crypto.randomBytes for cryptographically secure session ID
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `session_${Date.now()}_${randomPart}`;
  }
  
  private startActivityMonitoring(): void {
    this.clearTimers();
    
    this.activityTimer = setTimeout(() => {
      if (this.isNearExpiry()) {
        this.timeoutWarningCallback?.();
      }
      
      // Check again in 1 minute
      this.startActivityMonitoring();
    }, 60 * 1000);
  }
  
  private scheduleSessionChecks(): void {
    // Check session validity every 5 minutes
    setInterval(() => {
      if (this.sessionData) {
        const session = this.getSession();
        if (!session) {
          console.log('Session expired during periodic check');
        }
      }
    }, 5 * 60 * 1000);
  }
  
  private clearTimers(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = undefined;
    }
  }
}

export const sessionManager = new SessionManager();

// Track user activity
export const trackUserActivity = () => {
  sessionManager.updateActivity();
};

// Set up global activity tracking
if (typeof window !== 'undefined') {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.addEventListener(event, trackUserActivity, { passive: true });
  });
}
