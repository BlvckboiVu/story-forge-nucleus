
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import ErrorBoundary from './components/ErrorBoundary';
import { MainLayout } from './components/layout/MainLayout';
import './App.css';

// Lazy load pages for better performance
const Index = lazy(() => import('./pages/Index'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const StoryBible = lazy(() => import('./pages/StoryBible'));
const MCP = lazy(() => import('./pages/MCP'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AuthError = lazy(() => import('./pages/AuthError'));

// Create a stable query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Protected layout wrapper component
const ProtectedLayout = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ProjectProvider>
                <BrowserRouter>
                  <div className="min-h-screen bg-background">
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/auth-error" element={<AuthError />} />
                        
                        {/* Protected app routes */}
                        <Route path="/app" element={<ProtectedLayout />}>
                          <Route index element={<Navigate to="/app/dashboard" replace />} />
                          <Route path="dashboard" element={<Dashboard />} />
                          <Route path="editor" element={<Editor />} />
                          <Route path="editor/:documentId" element={<Editor />} />
                          <Route path="profile" element={<Profile />} />
                          <Route path="settings" element={<Settings />} />
                          <Route path="story-bible" element={<StoryBible />} />
                          <Route path="mcp" element={<MCP />} />
                        </Route>
                        
                        {/* Catch all route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    <Toaster />
                  </div>
                </BrowserRouter>
              </ProjectProvider>
            </AuthProvider>
          </QueryClientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
