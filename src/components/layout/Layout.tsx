import * as React from 'react';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
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

function LayoutContent({
  children,
  mode = 'default',
  className,
  showNavigation = true,
}: LayoutProps) {
  const isMobile = useIsMobile();
  const { state } = useSidebar();

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
          <div className="container py-3 sm:py-6 w-full max-w-full px-3 sm:px-4">
            {children}
          </div>
        </main>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background w-full max-w-full overflow-hidden">
        <main className={cn("w-full h-screen", getLayoutClasses(), className)}>
          {mode === 'editor' ? (
            <div className="w-full h-full overflow-hidden">
              {children}
            </div>
          ) : (
            <div className="container py-3 sm:py-6 w-full max-w-full px-3 sm:px-4 h-full overflow-auto">
              {children}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={cn("sidebar-layout w-full", state === 'collapsed' && 'data-sidebar-collapsed')} data-sidebar-collapsed={state === 'collapsed'}>
      <AppSidebar />
      <SidebarInset className="main-content">
        <main className={cn("w-full h-full", getLayoutClasses(), className)}>
          {mode === 'editor' ? (
            <div className="w-full h-full overflow-hidden">
              {children}
            </div>
          ) : (
            <div className="p-3 lg:p-4 w-full h-full overflow-auto">
              {children}
            </div>
          )}
        </main>
      </SidebarInset>
    </div>
  );
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

  if (isMobile || !showNavigation) {
    return (
      <LayoutContent 
        children={children}
        mode={mode}
        className={className}
        showNavigation={showNavigation}
        showEditorPanels={showEditorPanels}
        onInsertLLMResponse={onInsertLLMResponse}
      />
    );
  }

  return (
    <SidebarProvider>
      <LayoutContent 
        children={children}
        mode={mode}
        className={className}
        showNavigation={showNavigation}
        showEditorPanels={showEditorPanels}
        onInsertLLMResponse={onInsertLLMResponse}
      />
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
