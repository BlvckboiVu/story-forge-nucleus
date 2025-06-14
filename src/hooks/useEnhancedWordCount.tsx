
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface WordCountStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  pages: number;
  readingTime: number; // in minutes
}

interface UseEnhancedWordCountOptions {
  wordsPerPage?: number;
  wordsPerMinute?: number;
  warningThreshold?: number;
  limitThreshold?: number;
  onThresholdReached?: (threshold: 'warning' | 'limit', stats: WordCountStats) => void;
}

export const useEnhancedWordCount = ({
  wordsPerPage = 250,
  wordsPerMinute = 200,
  warningThreshold = 45000,
  limitThreshold = 50000,
  onThresholdReached
}: UseEnhancedWordCountOptions = {}) => {
  const [stats, setStats] = useState<WordCountStats>({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    sentences: 0,
    paragraphs: 0,
    pages: 0,
    readingTime: 0,
  });
  const [hasWarned, setHasWarned] = useState(false);
  const [hasLimitWarned, setHasLimitWarned] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const calculateStats = useCallback((text: string): WordCountStats => {
    if (!text || !text.trim()) {
      return {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        pages: 0,
        readingTime: 0,
      };
    }

    // Remove HTML tags for accurate counting
    const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Word count
    const words = plainText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Character counts
    const characters = plainText.length;
    const charactersNoSpaces = plainText.replace(/\s/g, '').length;
    
    // Sentence count (approximate)
    const sentences = plainText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    
    // Paragraph count (from original text with HTML)
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0).length;
    
    // Page estimation
    const pages = Math.max(1, Math.ceil(words / wordsPerPage));
    
    // Reading time estimation
    const readingTime = Math.ceil(words / wordsPerMinute);

    return {
      words,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      pages,
      readingTime,
    };
  }, [wordsPerPage, wordsPerMinute]);

  const updateWordCount = useCallback((text: string) => {
    const newStats = calculateStats(text);
    setStats(newStats);

    // Warning threshold check
    if (newStats.words >= warningThreshold && newStats.words < limitThreshold && !hasWarned) {
      setHasWarned(true);
      onThresholdReached?.('warning', newStats);
      toast({
        title: t('approachingWordLimit'),
        description: t('approachingWordLimitDescription', { 
          count: newStats.words,
          limit: limitThreshold
        }),
        duration: 4000,
      });
    }

    // Limit threshold check
    if (newStats.words >= limitThreshold && !hasLimitWarned) {
      setHasLimitWarned(true);
      onThresholdReached?.('limit', newStats);
      toast({
        title: t('wordLimitExceeded'),
        description: t('wordLimitExceededDescription', { 
          count: newStats.words,
          limit: limitThreshold
        }),
        variant: "destructive",
        duration: 5000,
      });
    }

    // Reset warnings if word count drops below thresholds
    if (newStats.words < warningThreshold) {
      setHasWarned(false);
      setHasLimitWarned(false);
    }

    return newStats;
  }, [calculateStats, warningThreshold, limitThreshold, hasWarned, hasLimitWarned, onThresholdReached, toast, t]);

  // Format stats for display
  const getFormattedStats = useCallback(() => ({
    words: stats.words.toLocaleString(),
    characters: stats.characters.toLocaleString(),
    charactersNoSpaces: stats.charactersNoSpaces.toLocaleString(),
    sentences: stats.sentences.toLocaleString(),
    paragraphs: stats.paragraphs.toLocaleString(),
    pages: stats.pages.toLocaleString(),
    readingTime: stats.readingTime === 1 ? t('oneMinute') : t('minutesRead', { count: stats.readingTime }),
  }), [stats, t]);

  // Get progress towards limits
  const getProgress = useCallback(() => ({
    warningProgress: Math.min(100, (stats.words / warningThreshold) * 100),
    limitProgress: Math.min(100, (stats.words / limitThreshold) * 100),
    isApproachingWarning: stats.words >= warningThreshold * 0.9,
    isApproachingLimit: stats.words >= warningThreshold,
    isOverLimit: stats.words >= limitThreshold,
  }), [stats.words, warningThreshold, limitThreshold]);

  return {
    stats,
    updateWordCount,
    getFormattedStats,
    getProgress,
    hasWarned,
    hasLimitWarned,
  };
};
