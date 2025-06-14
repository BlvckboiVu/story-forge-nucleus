
import { useCallback, useEffect } from 'react';
import ReactQuill from 'react-quill';

interface UseEditorScrollProps {
  editorRef: React.RefObject<ReactQuill>;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const useEditorScroll = ({ editorRef, containerRef }: UseEditorScrollProps) => {
  const handleCursorScroll = useCallback(() => {
    const quill = editorRef.current?.getEditor();
    const container = containerRef.current;
    if (!quill || !container) return;

    const selection = quill.getSelection();
    if (!selection) return;

    try {
      const bounds = quill.getBounds(selection.index);
      const containerRect = container.getBoundingClientRect();
      const editorRect = quill.root.getBoundingClientRect();
      
      const cursorTop = editorRect.top + bounds.top - containerRect.top;
      const cursorBottom = cursorTop + bounds.height;
      
      const scrollThreshold = containerRect.height - 100;
      const topThreshold = 50;
      
      if (cursorBottom > scrollThreshold) {
        const targetScrollTop = container.scrollTop + (cursorBottom - scrollThreshold) + 50;
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      } else if (cursorTop < topThreshold) {
        const targetScrollTop = Math.max(0, container.scrollTop - (topThreshold - cursorTop) - 50);
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    } catch (error) {
      console.error('Error handling cursor scroll:', error);
    }
  }, [editorRef, containerRef]);

  useEffect(() => {
    const quill = editorRef.current?.getEditor();
    if (!quill) return;

    const handleSelectionChange = () => {
      handleCursorScroll();
    };

    const handleTextChange = () => {
      setTimeout(() => {
        handleCursorScroll();
      }, 50);
    };

    quill.on('selection-change', handleSelectionChange);
    quill.on('text-change', handleTextChange);

    return () => {
      quill.off('selection-change', handleSelectionChange);
      quill.off('text-change', handleTextChange);
    };
  }, [handleCursorScroll, editorRef]);

  return { handleCursorScroll };
};
