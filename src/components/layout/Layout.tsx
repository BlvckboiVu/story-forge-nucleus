
import * as React from 'react';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

type LayoutMode = 'default' | 'full-width' | 'contained' | 'editor';

interface LayoutProps {
  children: React.ReactNode;
  mode?: LayoutMode;
  className?: string;
  showNavigation?: boolean;
  showEditorPanels?: boolean;
  onInsertLLMResponse?: (text: string) => void;
}

export function Layout({
  children,
  mode = 'default',
  className,
  showNavigation = true,
  showEditorPanels = false,
  onInsertLLMResponse
}: LayoutProps) {
  const isMobile = useIsMobile();

  const getLayoutClasses = () => {
    switch (mode) {
      case 'full-width':
        return 'w-full max-w-full';
      case 'contained':
        return 'max-w-7xl mx-auto w-full';
      case 'editor':
        return 'w-full max-w-full h-full min-h-0';
      default:
        return 'max-w-5xl mx-auto w-full';
    }
  };

  if (!showNavigation) {
    return (
      <div className="min-h-screen bg-background w-full max-w-full overflow-hidden">
        <main className={cn("flex-1 w-full", getLayoutClasses(), className)}>
          <div className="container py-6 w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background w-full max-w-full overflow-hidden">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full flex-shrink-0">
          <div className="flex h-14 items-center px-4 w-full">
            <MobileNav />
            <div className="flex items-center space-x-2 ml-2">
              <h1 className="font-semibold">StoryForge</h1>
            </div>
          </div>
        </header>
        
        <main className={cn("w-full", getLayoutClasses(), className)} style={{ height: 'calc(100vh - 3.5rem)' }}>
          {mode === 'editor' ? (
            <div className="w-full h-full overflow-hidden">
              {children}
            </div>
          ) : (
            <div className="container py-6 w-full max-w-full px-4 h-full overflow-auto">
              {children}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="sidebar-layout">
        <AppSidebar />
        <SidebarInset className="main-content">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">StoryForge</h1>
            </div>
          </header>
          <main className={cn("w-full", getLayoutClasses(), className)}>
            {mode === 'editor' ? (
              <div className="w-full h-full overflow-hidden">
                {children}
              </div>
            ) : (
              <div className="p-4 w-full h-full overflow-auto">
                {children}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

// Layout context for nested layouts
interface LayoutContextType {
  mode: LayoutMode;
  setMode: (mode: LayoutMode) => void;
}

const LayoutContext = React.createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

interface LayoutProviderProps {
  children: React.ReactNode;
  initialMode?: LayoutMode;
}

export function LayoutProvider({
  children,
  initialMode = 'default'
}: LayoutProviderProps) {
  const [mode, setMode] = React.useState<LayoutMode>(initialMode);

  return (
    <LayoutContext.Provider value={{ mode, setMode }}>
      {children}
    </LayoutContext.Provider>
  );
}
