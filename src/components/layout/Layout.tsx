
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
        return 'max-w-none';
      case 'contained':
        return 'max-w-7xl mx-auto';
      case 'editor':
        return 'max-w-none w-full';
      default:
        return 'max-w-5xl mx-auto';
    }
  };

  if (!showNavigation) {
    return (
      <div className="min-h-screen bg-background">
        <main className={cn("flex-1", getLayoutClasses(), className)}>
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="flex h-14 items-center px-4">
            <MobileNav />
            <div className="flex items-center space-x-2 ml-2">
              <h1 className="font-semibold">StoryForge</h1>
            </div>
          </div>
        </header>
        
        <main className={cn("flex-1", getLayoutClasses(), className)}>
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">StoryForge</h1>
            </div>
          </header>
          <main className={cn("flex-1 p-4", getLayoutClasses(), className)}>
            {children}
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
