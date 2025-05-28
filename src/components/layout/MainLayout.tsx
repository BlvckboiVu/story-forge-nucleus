
import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Mobile header */}
      <header className="h-14 md:hidden border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MobileNav />
          <span className="font-semibold text-lg">StoryForge</span>
        </div>
      </header>
      
      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for desktop */}
        {!isMobile && (
          <Sidebar 
            isCollapsed={sidebarCollapsed} 
            toggleCollapse={toggleSidebar} 
          />
        )}
        
        {/* Main content area */}
        <main className={`flex-1 overflow-auto transition-all duration-300 ${isMobile ? 'p-4' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
