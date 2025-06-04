
import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import { MobileNav } from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header for both mobile and desktop */}
      <header className="h-12 sm:h-14 border-b border-border flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-base sm:text-lg">StoryForge</span>
        </div>
        {/* Mobile nav only shown on mobile */}
        {isMobile && <MobileNav />}
      </header>
      
      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Main content area */}
        <main className="flex-1 overflow-hidden p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
