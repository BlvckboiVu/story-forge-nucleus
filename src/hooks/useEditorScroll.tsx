
import { useCallback, useRef, useEffect } from 'react';
import { throttle } from 'lodash';

interface UseEditorScrollOptions {
  editorRef: React.RefObject<any>;
  containerRef: React.RefObject<HTMLDivElement>;
  onScrollPositionChange?: (position: number) => void;
  throttleMs?: number;
}

export function useEditorScroll({
  editorRef,
  containerRef,
  onScrollPositionChange,
  throttleMs = 100
}: UseEditorScrollOptions) {
  const scrollPositionRef = useRef(0);

  const throttledScrollHandler = useCallback(
    throttle((scrollTop: number) => {
      scrollPositionRef.current = scrollTop;
      onScrollPositionChange?.(scrollTop);
    }, throttleMs),
    [onScrollPositionChange, throttleMs]
  );

  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    if (target) {
      throttledScrollHandler(target.scrollTop);
    }
  }, [throttledScrollHandler]);

  const scrollToPosition = useCallback((position: number) => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = position;
      scrollPositionRef.current = position;
    }
  }, [containerRef]);

  const scrollToTop = useCallback(() => {
    scrollToPosition(0);
  }, [scrollToPosition]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      scrollToPosition(container.scrollHeight);
    }
  }, [containerRef, scrollToPosition]);

  const handleCursorScroll = useCallback(() => {
    const quill = editorRef.current?.getEditor?.();
    if (!quill) return;

    const selection = quill.getSelection();
    if (!selection) return;

    const bounds = quill.getBounds(selection.index);
    const container = containerRef.current;
    
    if (!container || !bounds) return;

    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const viewportHeight = containerRect.height;
    
    const elementTop = bounds.top + scrollTop;
    const elementBottom = elementTop + bounds.height;
    
    // Scroll if cursor is outside viewport
    if (elementTop < scrollTop) {
      scrollToPosition(elementTop - 50); // 50px padding
    } else if (elementBottom > scrollTop + viewportHeight) {
      scrollToPosition(elementBottom - viewportHeight + 50);
    }
  }, [editorRef, containerRef, scrollToPosition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      throttledScrollHandler.cancel();
    };
  }, [containerRef, handleScroll, throttledScrollHandler]);

  return {
    scrollPosition: scrollPositionRef.current,
    scrollToPosition,
    scrollToTop,
    scrollToBottom,
    handleCursorScroll
  };
}
