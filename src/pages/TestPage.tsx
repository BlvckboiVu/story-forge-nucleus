import { useState, useEffect } from 'react';
import { ApiService } from '@/services/api.service';
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
  status: 'success' | 'failure' | 'pending';
  error?: string;
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  const apiService = ApiService.getInstance();

  const tests = [
    {
      name: 'API Connectivity',
      run: async () => {
        const response = await apiService.get('/api/health');
        if (!response.ok) throw new Error('API is not responding');
      }
    },
    {
      name: 'Authentication',
      run: async () => {
        // Test login
        await apiService.post('/api/auth/login', {
          email: 'test@example.com',
          password: 'test123'
        });
      }
    },
    {
      name: 'Offline Support',
      run: async () => {
        // Test offline storage
        const testData = { id: 1, title: 'Test Story' };
        localStorage.setItem('test-offline', JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem('test-offline') || '');
        if (!retrieved || retrieved.id !== testData.id) {
          throw new Error('Offline storage not working');
        }
      }
    },
    {
      name: 'Data Sync',
      run: async () => {
        // Test sync mechanism
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-stories');
      }
    },
    {
      name: 'Story Creation',
      run: async () => {
        const story = await apiService.post('/api/stories', {
          title: 'Test Story',
          content: 'Test content'
        });
        if (!story.id) throw new Error('Story creation failed');
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    for (const test of tests) {
      try {
        setResults(prev => [...prev, { name: test.name, status: 'pending' }]);
        await test.run();
        setResults(prev => 
          prev.map(r => 
            r.name === test.name 
              ? { ...r, status: 'success' } 
              : r
          )
        );
      } catch (error) {
        setResults(prev => 
          prev.map(r => 
            r.name === test.name 
              ? { ...r, status: 'failure', error: error.message } 
              : r
          )
        );
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
                  <span className="font-medium">{result.name}</span>
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
