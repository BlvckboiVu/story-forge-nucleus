import * as React from 'react';
import { cn } from '@/lib/utils';
import { Navigation } from './Navigation';

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
  const getLayoutClasses = () => {
    switch (mode) {
      case 'full-width':
        return 'max-w-none';
      case 'contained':
        return 'max-w-7xl mx-auto';
      case 'editor':
        return 'max-w-[2000px] mx-auto';
      default:
        return 'max-w-5xl mx-auto';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {showNavigation && (
        <Navigation
          showEditorPanels={showEditorPanels}
          onInsertLLMResponse={onInsertLLMResponse}
        />
      )}
      
      <main className={cn(
        "flex-1",
        showNavigation && "md:pl-64",
        getLayoutClasses(),
        className
      )}>
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
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