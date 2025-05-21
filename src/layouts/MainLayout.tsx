
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { currentProject, loading: projectLoading } = useProjects();
  
  const isLoading = authLoading || projectLoading;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">StoryForge</h1>
            {currentProject && (
              <span className="text-muted-foreground">
                / {currentProject.title}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <span className="text-sm text-muted-foreground">{user.email}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Not logged in</span>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          children
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} StoryForge - Write. Create. Publish.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
