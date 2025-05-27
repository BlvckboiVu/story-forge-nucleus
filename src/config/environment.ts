
interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  apiUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
}

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Configuration with fallbacks
export const environment: EnvironmentConfig = {
  isDevelopment,
  isProduction,
  
  // API Configuration - use environment variables in production
  apiUrl: import.meta.env.VITE_API_URL || (isProduction ? 'https://api.yourdomain.com' : 'http://localhost:3000'),
  
  // Supabase Configuration - these should be set via environment variables
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://jpisccbabnzzkrzevetw.supabase.co',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaXNjY2JhYm56emtyemV2ZXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjM5NjQsImV4cCI6MjA2MzM5OTk2NH0.wc3BIQQqVxEr_3hA5quy1X_AP0Fc4-bYLceUUQbv8mE',
};

// Validation for production
if (isProduction) {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
  }
}
