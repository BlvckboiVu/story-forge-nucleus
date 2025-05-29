import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { MainLayout } from "@/components/layout/MainLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load pages for better performance
const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Editor = lazy(() => import("@/pages/Editor"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const TestPage = lazy(() => import("@/pages/admin/TestPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AuthError = lazy(() => import("@/pages/AuthError"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
  </div>
);

// Protected route wrapper for authenticated routes
const ProtectedRoute = ({ children, requiredRole = 'user' }: { children: React.ReactNode, requiredRole?: 'admin' | 'user' | 'guest' }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

// AdminRoute wrapper for admin-only pages
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Admin Access Only</h2>
          <p className="text-muted-foreground">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ProjectProvider>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/auth/error" element={<AuthError />} />
                    
                    {/* Admin section */}
                    <Route path="/app/admin/*" element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminRoute>
                          <MainLayout>
                            <Routes>
                              <Route path="test" element={<TestPage />} />
                              {/* Future admin tools here */}
                            </Routes>
                          </MainLayout>
                        </AdminRoute>
                      </ProtectedRoute>
                    } />

                    {/* Protected app routes */}
                    <Route
                      path="/app/*"
                      element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <MainLayout>
                              <Routes>
                                <Route index element={<Navigate to="/app/dashboard" replace />} />
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="editor" element={<Editor />} />
                                <Route path="editor/:documentId" element={<Editor />} />
                                <Route path="profile" element={<Profile />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </MainLayout>
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Toaster />
              </div>
            </ProjectProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
