import { useState, useCallback, useEffect } from 'react';

interface UseFocusModeOptions {
  onFocusModeChange?: (isFocusMode: boolean) => void;
  onPanelCollapseChange?: (isCollapsed: boolean) => void;
}

export function useFocusMode({ 
  onFocusModeChange,
  onPanelCollapseChange 
}: UseFocusModeOptions = {}) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    // Load panel state from localStorage
    const saved = localStorage.getItem('editor_panel_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save panel state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('editor_panel_collapsed', JSON.stringify(isPanelCollapsed));
  }, [isPanelCollapsed]);

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