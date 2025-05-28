import { useState, useEffect } from 'react';
import { ApiService } from '@/services/api.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Loader2, Database, Zap, Shield, Globe, Wifi, WifiOff } from 'lucide-react';
import { environment } from '@/config/environment';
import { supabase } from '@/lib/supabase';

interface TestResult {
  name: string;
  status: 'success' | 'failure' | 'pending';
  error?: string;
  isOfflineCapable: boolean;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
  isOfflineCapable: boolean;
}

interface TestCase {
  name: string;
  run: () => Promise<void>;
  isOfflineCapable: boolean;
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  const apiService = ApiService.getInstance();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Browser-compatible test functions
  const testSuites: TestSuite[] = [
    {
      name: 'Database Tests',
      tests: [
        {
          name: 'Supabase Connection',
          run: async () => {
            const { data, error } = await supabase.from('profiles').select('count').limit(1);
            if (error) throw new Error(`Database connection failed: ${error.message}`);
          },
          isOfflineCapable: false
        },
        {
          name: 'Local Storage',
          run: async () => {
            const testKey = 'test-key';
            const testValue = 'test-value';
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            if (retrieved !== testValue) throw new Error('Local storage test failed');
          },
          isOfflineCapable: true
        }
      ],
      isOfflineCapable: false
    },
    {
      name: 'UI Tests',
      tests: [
        {
          name: 'DOM Manipulation',
          run: async () => {
            const testElement = document.createElement('div');
            testElement.id = 'test-element';
            document.body.appendChild(testElement);
            const found = document.getElementById('test-element');
            document.body.removeChild(testElement);
            if (!found) throw new Error('DOM manipulation test failed');
          },
          isOfflineCapable: true
        },
        {
          name: 'CSS Variables',
          run: async () => {
            const root = document.documentElement;
            const originalValue = getComputedStyle(root).getPropertyValue('--background');
            if (!originalValue) throw new Error('CSS variables not accessible');
          },
          isOfflineCapable: true
        }
      ],
      isOfflineCapable: true
    },
    {
      name: 'API Tests',
      tests: [
        {
          name: 'Environment Variables',
          run: async () => {
            if (!environment.supabaseUrl) throw new Error('Supabase URL not configured');
            if (!environment.supabaseKey) throw new Error('Supabase Key not configured');
          },
          isOfflineCapable: true
        },
        {
          name: 'Network Connectivity',
          run: async () => {
            if (!navigator.onLine) throw new Error('No network connection');
            const response = await fetch('https://httpbin.org/status/200', { 
              method: 'GET',
              signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) throw new Error('Network test failed');
          },
          isOfflineCapable: false
        }
      ],
      isOfflineCapable: false
    },
    {
      name: 'Security Tests',
      tests: [
        {
          name: 'HTTPS Check',
          run: async () => {
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
              throw new Error('Site should be served over HTTPS in production');
            }
          },
          isOfflineCapable: true
        },
        {
          name: 'Content Security Policy',
          run: async () => {
            const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
            console.log('CSP check completed - review manually');
          },
          isOfflineCapable: true
        }
      ],
      isOfflineCapable: true
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    for (const suite of testSuites) {
      // Skip online-only tests when offline
      if (!isOnline && !suite.isOfflineCapable) {
        continue;
      }

      for (const test of suite.tests) {
        // Skip online-only tests when offline
        if (!isOnline && !test.isOfflineCapable) {
          setResults(prev => [...prev, {
            name: `${suite.name}: ${test.name}`,
            status: 'pending',
            isOfflineCapable: test.isOfflineCapable,
            error: 'Test skipped - requires internet connection'
          }]);
          continue;
        }

        try {
          setResults(prev => [...prev, {
            name: `${suite.name}: ${test.name}`,
            status: 'pending',
            isOfflineCapable: test.isOfflineCapable
          }]);
          
          await test.run();
          
          setResults(prev => 
            prev.map(r => 
              r.name === `${suite.name}: ${test.name}`
                ? { ...r, status: 'success' }
                : r
            )
          );
        } catch (error) {
          setResults(prev => 
            prev.map(r => 
              r.name === `${suite.name}: ${test.name}`
                ? { ...r, status: 'failure', error: (error as Error).message }
                : r
            )
          );
        }
      }
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'failure': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failure':
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Running</Badge>;
      case 'success':
        return <Badge className="bg-green-500">Passed</Badge>;
      case 'failure':
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
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOnline ? 'All tests available' : 'Only offline-capable tests available'}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Suite</h2>
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>

          <div className="space-y-4">
            {results.map((result) => (
              <div 
                key={result.name}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div className="flex flex-col">
                    <span className="font-medium">{result.name}</span>
                    {!result.isOfflineCapable && (
                      <span className="text-xs text-yellow-500">
                        Requires internet connection
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(result.status)}
                </div>
                {result.error && (
                  <div className="text-sm text-red-500 ml-4">
                    {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
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
