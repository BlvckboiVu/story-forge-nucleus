
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { MainLayout } from "@/components/layout/MainLayout";

// Lazy load pages for better performance
const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Editor = lazy(() => import("@/pages/Editor"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const TestPage = lazy(() => import("@/pages/TestPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AuthError = lazy(() => import("@/pages/AuthError"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ProjectProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/auth/error" element={<AuthError />} />
                    <Route path="/test" element={<TestPage />} />
                    <Route
                      path="/app/*"
                      element={
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
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Toaster />
              </div>
            </BrowserRouter>
          </ProjectProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
