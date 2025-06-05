
/**
 * Environment configuration for the application
 */

// Get Supabase URL from environment or use default
const getSupabaseUrl = (): string => {
  // Check for Vite environment variables first
  if (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SUPABASE_URL) {
    return (window as any).__ENV__.VITE_SUPABASE_URL;
  }
  
  // Use direct project URL as fallback
  return 'https://jpisccbabnzzkrzevetw.supabase.co';
};

// Get Supabase anon key from environment or use default
const getSupabaseKey = (): string => {
  // Check for Vite environment variables first
  if (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY) {
    return (window as any).__ENV__.VITE_SUPABASE_ANON_KEY;
  }
  
  // Use the anon key as fallback
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaXNjY2JhYm56emtyemV2ZXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjM5NjQsImV4cCI6MjA2MzM5OTk2NH0.wc3BIQQqVxEr_3hA5quy1X_AP0Fc4-bYLceUUQbv8mE';
};

export const environment = {
  supabaseUrl: getSupabaseUrl(),
  supabaseKey: getSupabaseKey(),
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
} as const;

// Export individual values for easier access
export const { supabaseUrl, supabaseKey, isProduction, isDevelopment } = environment;
