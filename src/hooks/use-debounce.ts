
import { useCallback, useRef } from 'react';

/**
 * Custom hook that debounces function calls to improve performance
 * Prevents rapid successive executions by delaying execution until after delay period
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds before execution
 * @returns Debounced version of the callback function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout to reset delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout to execute callback after delay
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}
