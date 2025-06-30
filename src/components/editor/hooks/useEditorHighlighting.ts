import { useEffect, useState, useCallback } from 'react';
import { debouncedHighlight, HighlightMatch } from '@/utils/highlighting';
import { StoryBibleEntry } from '@/lib/storyBibleDb';

export function useEditorHighlighting({
  quill,
  storyBibleEntries,
  isFocusMode
}: {
  quill: any;
  storyBibleEntries: StoryBibleEntry[];
  isFocusMode: boolean;
}) {
  const [highlightMatches, setHighlightMatches] = useState<HighlightMatch[]>([]);

  const triggerHighlighting = useCallback(() => {
    if (!quill || !storyBibleEntries.length || isFocusMode) return;
    try {
      debouncedHighlight(quill, storyBibleEntries, setHighlightMatches);
    } catch (error) {
      // Optionally handle error
    }
  }, [quill, storyBibleEntries, isFocusMode]);

  useEffect(() => {
    triggerHighlighting();
  }, [triggerHighlighting]);

  return {
    highlightMatches,
    triggerHighlighting
  };
} 