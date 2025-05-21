
/**
 * Count words in a string
 * @param text - The text to count words in
 * @returns Number of words
 */
export const countWords = (text: string): number => {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).length;
};

/**
 * Count characters in a string
 * @param text - The text to count characters in
 * @param includeSpaces - Whether to include spaces in the count
 * @returns Number of characters
 */
export const countCharacters = (text: string, includeSpaces = true): number => {
  if (!text) return 0;
  return includeSpaces ? text.length : text.replace(/\s+/g, '').length;
};

/**
 * Calculate reading time in minutes
 * @param text - The text to calculate reading time for
 * @param wordsPerMinute - Words per minute reading speed
 * @returns Reading time in minutes
 */
export const calculateReadingTime = (text: string, wordsPerMinute = 200): number => {
  const words = countWords(text);
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes > 0 ? minutes : 1; // Minimum reading time is 1 minute
};

/**
 * Truncate text to a maximum length
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add to truncated text
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength = 100, suffix = '...'): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Generate a slug from a string
 * @param text - The text to generate a slug from
 * @returns Slug
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove all non-word characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/--+/g, '-')     // Replace multiple hyphens with a single hyphen
    .trim();                   // Remove whitespace from both ends
};

/**
 * Highlight search terms in a text
 * @param text - The text to highlight terms in
 * @param query - The search query
 * @returns Text with highlighted search terms (HTML string)
 */
export const highlightText = (text: string, query: string): string => {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};
