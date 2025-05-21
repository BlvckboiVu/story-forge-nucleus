
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

// Initialize the Supabase client
const supabaseUrl = 'https://jpisccbabnzzkrzevetw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaXNjY2JhYm56emtyemV2ZXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjM5NjQsImV4cCI6MjA2MzM5OTk2NH0.wc3BIQQqVxEr_3hA5quy1X_AP0Fc4-bYLceUUQbv8mE';

/**
 * Supabase client initialization
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Authentication helpers
 */

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Data sync helpers
 * These functions will sync local IndexedDB data with Supabase when online
 */

export const syncProjects = async () => {
  // Will be implemented to sync local projects to Supabase
};

export const syncDrafts = async () => {
  // Will be implemented to sync local drafts to Supabase
};

export const syncOutlines = async () => {
  // Will be implemented to sync local outlines to Supabase
};
