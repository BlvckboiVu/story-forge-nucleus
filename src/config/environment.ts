
/**
 * Environment configuration for the application
 */

export const environment = {
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
} as const;

// Export individual values for easier access
export const { isProduction, isDevelopment } = environment;
