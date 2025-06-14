
import { useCallback, useEffect, useRef } from 'react';
import { useToast } from './use-toast';

export interface AccessibilityOptions {
  announceChanges?: boolean;
  keyboardNavigation?: boolean;
  highContrast?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'x-large';
  screenReaderOptimized?: boolean;
}

export function useAccessibility(options: AccessibilityOptions = {}) {
  const { toast } = useToast();
  const announceRef = useRef<HTMLDivElement | null>(null);
  const lastAnnouncementRef = useRef<string>('');

  const {
    announceChanges = true,
    keyboardNavigation = true,
    highContrast = false,
    fontSize = 'medium',
    screenReaderOptimized = true,
  } = options;

  // Create screen reader announcement area
  useEffect(() => {
    if (!announceRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);
      announceRef.current = announcer;
    }

    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
        announceRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges || !announceRef.current || message === lastAnnouncementRef.current) {
      return;
    }

    announceRef.current.setAttribute('aria-live', priority);
    announceRef.current.textContent = message;
    lastAnnouncementRef.current = message;

    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = '';
      }
    }, 1000);
  }, [announceChanges]);

  const announceWordCount = useCallback((count: number) => {
    if (count % 100 === 0 && count > 0) {
      announce(`${count} words written`);
    }
  }, [announce]);

  const announceSaveStatus = useCallback((status: 'saving' | 'saved' | 'error') => {
    const messages = {
      saving: 'Saving document',
      saved: 'Document saved successfully',
      error: 'Error saving document',
    };
    announce(messages[status], status === 'error' ? 'assertive' : 'polite');
  }, [announce]);

  const announceValidationError = useCallback((errors: string[]) => {
    if (errors.length > 0) {
      announce(`Content validation error: ${errors[0]}`, 'assertive');
    }
  }, [announce]);

  // Enhanced keyboard navigation
  const setupKeyboardNavigation = useCallback((element: HTMLElement) => {
    if (!keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enhanced keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            announce('Bold formatting toggled');
            break;
          case 'i':
            e.preventDefault();
            announce('Italic formatting toggled');
            break;
          case 'u':
            e.preventDefault();
            announce('Underline formatting toggled');
            break;
          case 's':
            e.preventDefault();
            announce('Saving document');
            break;
          case 'z':
            e.preventDefault();
            announce(e.shiftKey ? 'Redo' : 'Undo');
            break;
          case 'f':
            e.preventDefault();
            announce('Find in document');
            break;
        }
      }

      // Navigate with arrow keys + Alt for sections
      if (e.altKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            announce('Previous paragraph');
            break;
          case 'ArrowDown':
            e.preventDefault();
            announce('Next paragraph');
            break;
          case 'Home':
            e.preventDefault();
            announce('Beginning of document');
            break;
          case 'End':
            e.preventDefault();
            announce('End of document');
            break;
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavigation, announce]);

  // Apply accessibility styles
  useEffect(() => {
    const root = document.documentElement;
    
    // Font size
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'x-large': '20px',
    };
    root.style.setProperty('--editor-font-size', fontSizes[fontSize]);

    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Screen reader optimizations
    if (screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
  }, [fontSize, highContrast, screenReaderOptimized]);

  return {
    announce,
    announceWordCount,
    announceSaveStatus,
    announceValidationError,
    setupKeyboardNavigation,
  };
}
