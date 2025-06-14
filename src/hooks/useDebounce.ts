
import { useCallback, useRef } from 'react';

/**
 * Custom hook that debounces a callback function to prevent excessive executions
 * Useful for search inputs, API calls, and performance optimization
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds before executing the callback
 * @returns Debounced version of the callback function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout to reset the delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout to execute callback after delay
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
} 
