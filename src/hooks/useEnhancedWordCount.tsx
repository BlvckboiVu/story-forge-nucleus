import { useState, useEffect, useCallback, useMemo } from 'react';

export interface WordCountStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  paragraphs: number;
  sentences: number;
  pages: number;
  readingTime: number; // in minutes
}

interface WordCountOptions {
  wordsPerPage?: number;
  wordsPerMinute?: number;
  warningThreshold?: number;
  limitThreshold?: number;
}

const DEFAULT_OPTIONS: Required<WordCountOptions> = {
  wordsPerPage: 250,
  wordsPerMinute: 200,
  warningThreshold: 45000,
  limitThreshold: 50000
};

export function useEnhancedWordCount(options: WordCountOptions = {}) {
  const [stats, setStats] = useState<WordCountStats>({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    paragraphs: 0,
    sentences: 0,
    pages: 0,
    readingTime: 0
  });

  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);

  const calculateStats = useCallback((content: string): WordCountStats => {
    if (!content) {
      return {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        paragraphs: 0,
        sentences: 0,
        pages: 0,
        readingTime: 0
      };
    }

    // Remove HTML tags for accurate counting
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Word count
    const words = plainText ? plainText.split(/\s+/).filter(word => word.length > 0).length : 0;
    
    // Character counts
    const characters = plainText.length;
    const charactersNoSpaces = plainText.replace(/\s/g, '').length;
    
    // Paragraph count (split by double newlines or paragraph tags)
    const paragraphs = Math.max(1, (content.match(/<\/p>|(\n\s*\n)/g) || []).length);
    
    // Sentence count (basic approximation)
    const sentences = Math.max(1, (plainText.match(/[.!?]+/g) || []).length);
    
    // Page count
    const pages = Math.max(1, Math.ceil(words / config.wordsPerPage));
    
    // Reading time
    const readingTime = Math.ceil(words / config.wordsPerMinute);

    return {
      words,
      characters,
      charactersNoSpaces,
      paragraphs,
      sentences,
      pages,
      readingTime
    };
  }, [config]);

  const updateWordCount = useCallback((content: string) => {
    const newStats = calculateStats(content);
    setStats(newStats);
  }, [calculateStats]);

  const getWarningLevel = useCallback((wordCount: number): 'none' | 'warning' | 'danger' => {
    if (wordCount >= config.limitThreshold) return 'danger';
    if (wordCount >= config.warningThreshold) return 'warning';
    return 'none';
  }, [config]);

  return {
    stats,
    updateWordCount,
    getWarningLevel: (wordCount?: number) => getWarningLevel(wordCount ?? stats.words),
    isNearLimit: stats.words >= config.warningThreshold,
    isAtLimit: stats.words >= config.limitThreshold,
    config
  };
}
