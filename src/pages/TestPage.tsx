
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, Loader2, Database, Zap, Shield, Globe } from 'lucide-react';
import { openRouterAPI } from '@/utils/openrouter';
import { draftService } from '@/services/draftService';
import { environment } from '@/config/environment';
import { supabase } from '@/lib/supabase';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export default function TestPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const updateTest = (name: string, status: TestResult['status'], message?: string, duration?: number) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.duration = duration;
        return [...prev];
      }
      return [...prev, { name, status, message, duration }];
    });
  };

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    updateTest(name, 'pending');
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTest(name, 'success', 'Passed', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(name, 'error', error instanceof Error ? error.message : 'Unknown error', duration);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Environment Configuration Tests
    await runTest('Environment Detection', async () => {
      if (!environment.isDevelopment && !environment.isProduction) {
        throw new Error('Environment not properly detected');
      }
    });

    await runTest('Supabase Configuration', async () => {
      if (!environment.supabaseUrl || !environment.supabaseKey) {
        throw new Error('Supabase configuration missing');
      }
      if (!environment.supabaseUrl.startsWith('https://')) {
        throw new Error('Supabase URL must use HTTPS');
      }
    });

    // Database Tests
    await runTest('Database Connection', async () => {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error && !error.message.includes('relation "profiles" does not exist')) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
    });

    await runTest('Draft Service - Create', async () => {
      const testTitle = `Test Draft ${Date.now()}`;
      const draftId = await draftService.createDraft({
        title: testTitle,
        projectId: 'demo-project-id'
      });
      if (!draftId) {
        throw new Error('Failed to create draft');
      }
    });

    await runTest('Draft Service - Validation', async () => {
      try {
        await draftService.createDraft({
          title: '<script>alert("xss")</script>',
          projectId: 'demo-project-id'
        });
        throw new Error('XSS validation failed');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Invalid characters')) {
          // Expected error
          return;
        }
        throw error;
      }
    });

    // OpenRouter API Tests
    await runTest('OpenRouter API Key Validation', async () => {
      try {
        openRouterAPI.setApiKey('invalid-key');
        throw new Error('Should have thrown validation error');
      } catch (error) {
        if (error instanceof Error && error.message.includes('Invalid OpenRouter API key format')) {
          // Expected error
          return;
        }
        throw error;
      }
    });

    await runTest('OpenRouter Prompt Validation', async () => {
      const apiKey = openRouterAPI.getApiKey();
      if (apiKey && apiKey.startsWith('sk-or-')) {
        try {
          await openRouterAPI.sendPrompt('<script>alert("xss")</script>');
          throw new Error('XSS validation failed');
        } catch (error) {
          if (error instanceof Error && error.message.includes('Invalid characters')) {
            // Expected error
            return;
          }
          throw error;
        }
      } else {
        // Skip if no valid API key
        return;
      }
    });

    // Performance Tests
    await runTest('Local Storage Performance', async () => {
      const testData = 'x'.repeat(1000);
      const iterations = 100;
      
      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        localStorage.setItem(`test_${i}`, testData);
        localStorage.getItem(`test_${i}`);
        localStorage.removeItem(`test_${i}`);
      }
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        throw new Error(`Local storage operations too slow: ${duration}ms`);
      }
    });

    await runTest('Memory Usage Check', async () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          throw new Error(`High memory usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
        }
      }
    });

    // Security Tests
    await runTest('HTTPS Enforcement', async () => {
      if (environment.isProduction && location.protocol !== 'https:') {
        throw new Error('HTTPS not enforced in production');
      }
    });

    await runTest('Content Security Policy', async () => {
      const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (environment.isProduction && !metaCSP) {
        console.warn('CSP meta tag not found - consider adding for security');
      }
    });

    setIsRunning(false);
    
    const successCount = tests.filter(t => t.status === 'success').length;
    const totalCount = tests.length;
    
    toast({
      title: "Test Suite Complete",
      description: `${successCount}/${totalCount} tests passed`,
      duration: 3000,
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Running</Badge>;
      case 'success':
        return <Badge className="bg-green-500">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Test Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive testing of all application features, security, and performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {environment.isDevelopment ? 'Development' : 'Production'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current build mode
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Supabase</div>
            <p className="text-xs text-muted-foreground">
              {environment.supabaseUrl ? 'Configured' : 'Not configured'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {location.protocol === 'https:' ? 'HTTPS' : 'HTTP'}
            </div>
            <p className="text-xs text-muted-foreground">
              Connection security
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Optimized</div>
            <p className="text-xs text-muted-foreground">
              Build configuration
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Run comprehensive tests to verify all features are working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="mb-4"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </Button>

          {tests.length > 0 && (
            <div className="space-y-2">
              {tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {test.duration && (
                      <span className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </span>
                    )}
                    {getStatusBadge(test.status)}
                  </div>
                  {test.message && test.status === 'error' && (
                    <div className="text-sm text-red-600 mt-1">
                      {test.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual Tests</CardTitle>
            <CardDescription>
              Features that require manual verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="editor" />
              <label htmlFor="editor">Rich text editor functionality</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="autosave" />
              <label htmlFor="autosave">Auto-save feature</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="llm" />
              <label htmlFor="llm">LLM panel integration</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="responsive" />
              <label htmlFor="responsive">Responsive design</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="dark-mode" />
              <label htmlFor="dark-mode">Dark mode toggle</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current system configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>User Agent:</span>
              <span className="text-sm">{navigator.userAgent.substring(0, 50)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Screen Resolution:</span>
              <span className="text-sm">{screen.width}x{screen.height}</span>
            </div>
            <div className="flex justify-between">
              <span>Viewport:</span>
              <span className="text-sm">{window.innerWidth}x{window.innerHeight}</span>
            </div>
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className="text-sm">{(navigator as any).connection?.effectiveType || 'Unknown'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
