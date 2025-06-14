
import { useEffect } from 'react';

interface UseWordCountProps {
  content: string;
  onWordCountChange?: (count: number) => void;
  setWordCount: (count: number) => void;
  wordLimit?: number;
}

export function useWordCount({
  content,
  onWordCountChange,
  setWordCount,
  wordLimit = 100000,
}: UseWordCountProps) {
  useEffect(() => {
    const count = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(count);
    onWordCountChange?.(count);
  }, [content, onWordCountChange, setWordCount]);
}
