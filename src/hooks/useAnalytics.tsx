import { useState, useCallback, useEffect } from 'react';

export interface UserBehaviorData {
  sessionId: string;
  userId?: string;
  events: AnalyticsEvent[];
  sessionStart: Date;
  sessionDuration: number;
  totalKeystrokes: number;
  totalWords: number;
  documentsCreated: number;
  documentsEdited: number;
  featuresUsed: string[];
  errors: ErrorEvent[];
}

export interface AnalyticsEvent {
  id: string;
  type: 'user_action' | 'system_event' | 'performance' | 'error';
  action: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  duration?: number;
}

export interface ErrorEvent {
  id: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface WritingMetrics {
  wordsPerMinute: number;
  averageSessionLength: number;
  peakWritingTime: string;
  documentsCompleted: number;
  totalWritingTime: number;
  totalWords: number;
  distractionEvents: number;
  revisionCount: number;
  mostUsedFeatures: string[];
}

export function useAnalytics() {
  const [sessionData, setSessionData] = useState<UserBehaviorData>(() => ({
    sessionId: crypto.randomUUID(),
    events: [],
    sessionStart: new Date(),
    sessionDuration: 0,
    totalKeystrokes: 0,
    totalWords: 0,
    documentsCreated: 0,
    documentsEdited: 0,
    featuresUsed: [],
    errors: [],
  }));

  const [writingMetrics, setWritingMetrics] = useState<WritingMetrics>({
    wordsPerMinute: 0,
    averageSessionLength: 0,
    peakWritingTime: '',
    documentsCompleted: 0,
    totalWritingTime: 0,
    totalWords: 0,
    distractionEvents: 0,
    revisionCount: 0,
    mostUsedFeatures: [],
  });

  const trackEvent = useCallback((
    type: AnalyticsEvent['type'],
    action: string,
    metadata?: Record<string, any>,
    duration?: number
  ) => {
    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      type,
      action,
      timestamp: new Date(),
      metadata,
      duration,
    };

    setSessionData(prev => ({
      ...prev,
      events: [...prev.events, event],
      featuresUsed: prev.featuresUsed.includes(action) 
        ? prev.featuresUsed 
        : [...prev.featuresUsed, action],
    }));

    // Store in localStorage for persistence
    try {
      const stored = localStorage.getItem('analytics_events') || '[]';
      const events = JSON.parse(stored);
      events.push(event);
      localStorage.setItem('analytics_events', JSON.stringify(events.slice(-1000))); // Keep last 1000 events
    } catch (error) {
      console.error('Failed to store analytics event:', error);
    }
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    const errorEvent: ErrorEvent = {
      id: crypto.randomUUID(),
      type: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      context,
    };

    setSessionData(prev => ({
      ...prev,
      errors: [...prev.errors, errorEvent],
    }));

    trackEvent('error', error.name, { message: error.message, context });
  }, [trackEvent]);

  const trackUserAction = useCallback((action: string, metadata?: Record<string, any>) => {
    trackEvent('user_action', action, metadata);
  }, [trackEvent]);

  const trackKeystroke = useCallback(() => {
    setSessionData(prev => ({
      ...prev,
      totalKeystrokes: prev.totalKeystrokes + 1,
    }));
  }, []);

  const trackWordCount = useCallback((wordCount: number) => {
    setSessionData(prev => ({
      ...prev,
      totalWords: Math.max(prev.totalWords, wordCount),
    }));
  }, []);

  const calculateWritingMetrics = useCallback(() => {
    const now = new Date();
    const sessionDuration = now.getTime() - sessionData.sessionStart.getTime();
    const sessionMinutes = sessionDuration / (1000 * 60);
    
    const wpm = sessionMinutes > 0 ? sessionData.totalWords / sessionMinutes : 0;
    
    // Get peak writing time from stored data
    const storedSessions = JSON.parse(localStorage.getItem('writing_sessions') || '[]');
    const hourCounts = new Array(24).fill(0);
    
    storedSessions.forEach((session: any) => {
      const hour = new Date(session.start).getHours();
      hourCounts[hour] += session.words;
    });
    
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakWritingTime = `${peakHour}:00 - ${peakHour + 1}:00`;

    const metrics: WritingMetrics = {
      wordsPerMinute: Math.round(wpm),
      averageSessionLength: sessionMinutes,
      peakWritingTime,
      documentsCompleted: sessionData.documentsCreated,
      totalWritingTime: sessionMinutes,
      totalWords: sessionData.totalWords,
      distractionEvents: sessionData.events.filter(e => e.action === 'window_blur').length,
      revisionCount: sessionData.events.filter(e => e.action === 'undo' || e.action === 'redo').length,
      mostUsedFeatures: sessionData.featuresUsed.slice(0, 5),
    };

    setWritingMetrics(metrics);
    return metrics;
  }, [sessionData]);

  const getInsights = useCallback(() => {
    const metrics = calculateWritingMetrics();
    const insights = [];

    if (metrics.wordsPerMinute < 20) {
      insights.push('Your writing speed could improve. Try focusing on getting thoughts down first, then editing.');
    }
    
    if (metrics.distractionEvents > 5) {
      insights.push('Consider using Focus Mode to reduce distractions during writing sessions.');
    }
    
    if (metrics.revisionCount > metrics.totalWords / 10) {
      insights.push('You might be over-editing while writing. Try separating writing and editing phases.');
    }
    
    if (sessionData.errors.length > 0) {
      insights.push('Technical issues detected. Check your internet connection and browser performance.');
    }

    return insights;
  }, [calculateWritingMetrics, sessionData.errors]);

  const exportAnalytics = useCallback(() => {
    const data = {
      session: sessionData,
      metrics: writingMetrics,
      insights: getInsights(),
      exportDate: new Date(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `writing-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessionData, writingMetrics, getInsights]);

  // Update session duration periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionData(prev => ({
        ...prev,
        sessionDuration: Date.now() - prev.sessionStart.getTime(),
      }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Save session data on unload
  useEffect(() => {
    const handleUnload = () => {
      const sessionInfo = {
        id: sessionData.sessionId,
        start: sessionData.sessionStart,
        duration: Date.now() - sessionData.sessionStart.getTime(),
        words: sessionData.totalWords,
        keystrokes: sessionData.totalKeystrokes,
      };
      
      const sessions = JSON.parse(localStorage.getItem('writing_sessions') || '[]');
      sessions.push(sessionInfo);
      localStorage.setItem('writing_sessions', JSON.stringify(sessions.slice(-100))); // Keep last 100 sessions
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [sessionData]);

  return {
    sessionData,
    writingMetrics,
    trackEvent,
    trackError,
    trackUserAction,
    trackKeystroke,
    trackWordCount,
    calculateWritingMetrics,
    getInsights,
    exportAnalytics,
  };
}
