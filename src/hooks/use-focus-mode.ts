import { useState, useCallback } from 'react';

interface UseFocusModeOptions {
  onFocusModeChange?: (isFocusMode: boolean) => void;
  onPanelCollapseChange?: (isCollapsed: boolean) => void;
}

export function useFocusMode({ 
  onFocusModeChange,
  onPanelCollapseChange 
}: UseFocusModeOptions = {}) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
      const newValue = !prev;
      onFocusModeChange?.(newValue);
      
      // When entering focus mode, collapse the panel
      if (newValue) {
        setIsPanelCollapsed(true);
        onPanelCollapseChange?.(true);
      } else {
        // When exiting focus mode, restore panel state
        setIsPanelCollapsed(false);
        onPanelCollapseChange?.(false);
      }
      
      return newValue;
    });
  }, [onFocusModeChange, onPanelCollapseChange]);

  const togglePanel = useCallback(() => {
    setIsPanelCollapsed(prev => {
      const newValue = !prev;
      onPanelCollapseChange?.(newValue);
      return newValue;
    });
  }, [onPanelCollapseChange]);

  return {
    isFocusMode,
    isPanelCollapsed,
    toggleFocusMode,
    togglePanel
  };
} 