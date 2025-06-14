
import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveEditorWrapperProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
}

export const ResponsiveEditorWrapper = ({ 
  children, 
  className,
  showSidebar = true 
}: ResponsiveEditorWrapperProps) => {
  return (
    <div className={cn(
      "editor-responsive-wrapper",
      "w-full h-full min-h-0 min-w-0",
      "grid grid-rows-[auto_1fr_auto]",
      "overflow-hidden",
      className
    )}>
      {children}
    </div>
  );
};
