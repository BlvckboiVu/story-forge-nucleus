
import { useState, useEffect, useCallback, useRef } from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  saveTime: number;
  loadTime: number;
  memoryUsage: number;
  wordProcessingTime: number;
  errorCount: number;
  sessionDuration: number;
  keystrokeLatency: number;
  contentSize: number;
}

export interface PerformanceData {
  metrics: PerformanceMetrics;
  trends: {
    avgRenderTime: number;
    avgSaveTime: number;
    errorRate: number;
    performanceScore: number;
  };
  recommendations: string[];
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    saveTime: 0,
    loadTime: 0,
    memoryUsage: 0,
    wordProcessingTime: 0,
    errorCount: 0,
    sessionDuration: 0,
    keystrokeLatency: 0,
    contentSize: 0,
  });

  const sessionStartRef = useRef(Date.now());
  const lastKeystrokeRef = useRef(0);
  const metricsHistoryRef = useRef<PerformanceMetrics[]>([]);

  const measureRenderTime = useCallback((callback: () => void) => {
    const start = performance.now();
    callback();
    const end = performance.now();
    const renderTime = end - start;
    
    setMetrics(prev => ({ ...prev, renderTime }));
    return renderTime;
  }, []);

  const measureSaveTime = useCallback(async (saveOperation: () => Promise<void>) => {
    const start = performance.now();
    try {
      await saveOperation();
      const end = performance.now();
      const saveTime = end - start;
      setMetrics(prev => ({ ...prev, saveTime }));
      return saveTime;
    } catch (error) {
      setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
      throw error;
    }
  }, []);

  const trackKeystroke = useCallback(() => {
    const now = performance.now();
    if (lastKeystrokeRef.current > 0) {
      const latency = now - lastKeystrokeRef.current;
      setMetrics(prev => ({ ...prev, keystrokeLatency: latency }));
    }
    lastKeystrokeRef.current = now;
  }, []);

  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  }, []);

  const trackContentSize = useCallback((content: string) => {
    const contentSize = new Blob([content]).size;
    setMetrics(prev => ({ ...prev, contentSize }));
  }, []);

  // Calculate performance score and trends
  const getPerformanceData = useCallback((): PerformanceData => {
    metricsHistoryRef.current.push(metrics);
    if (metricsHistoryRef.current.length > 100) {
      metricsHistoryRef.current.shift();
    }

    const history = metricsHistoryRef.current;
    const avgRenderTime = history.reduce((sum, m) => sum + m.renderTime, 0) / history.length;
    const avgSaveTime = history.reduce((sum, m) => sum + m.saveTime, 0) / history.length;
    const errorRate = history.reduce((sum, m) => sum + m.errorCount, 0) / history.length;

    // Performance score (0-100)
    let score = 100;
    if (avgRenderTime > 100) score -= 20;
    if (avgSaveTime > 1000) score -= 20;
    if (errorRate > 0.1) score -= 30;
    if (metrics.memoryUsage > 100) score -= 15;
    if (metrics.keystrokeLatency > 50) score -= 15;

    const recommendations: string[] = [];
    if (avgRenderTime > 100) recommendations.push('Consider reducing content complexity or enabling virtualization');
    if (avgSaveTime > 1000) recommendations.push('Save operations are slow - check network or optimize content');
    if (errorRate > 0.1) recommendations.push('High error rate detected - review error logs');
    if (metrics.memoryUsage > 100) recommendations.push('High memory usage - consider clearing browser cache');

    return {
      metrics: {
        ...metrics,
        sessionDuration: Date.now() - sessionStartRef.current,
      },
      trends: {
        avgRenderTime,
        avgSaveTime,
        errorRate,
        performanceScore: Math.max(0, score),
      },
      recommendations,
    };
  }, [metrics]);

  // Monitor memory usage periodically
  useEffect(() => {
    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, [updateMemoryUsage]);

  return {
    metrics,
    measureRenderTime,
    measureSaveTime,
    trackKeystroke,
    trackContentSize,
    getPerformanceData,
  };
}
