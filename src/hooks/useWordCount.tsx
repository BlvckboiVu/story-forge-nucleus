
import { useState, useCallback } from 'react';

export const useWordCount = () => {
  const [wordCount, setWordCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const calculateWordCount = useCallback((text: string) => {
    if (!text) return 0;
    const plainText = text.replace(/<[^>]*>/g, ' ');
    const words = plainText.trim().split(/\s+/).filter(word => word !== '');
    const count = words.length;
    
    setWordCount(count);
    const pageNum = Math.max(1, Math.ceil(count / 250)); // 250 words per page
    setCurrentPage(pageNum);
    
    return count;
  }, []);

  return {
    wordCount,
    currentPage,
    calculateWordCount,
  };
};
