import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { environment } from '../config/environment';

/**
 * Supabase client initialization with environment configuration
 */
export const supabase = createClient<Database>(
  environment.supabaseUrl,
  environment.supabaseKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

/**
 * Authentication helpers with proper error handling
 */

export const signUp = async (email: string, password: string) => {
  // Input validation
  if (!email || !email.includes('@')) {
    throw new Error('Valid email is required');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  // Input validation
  if (!email || !email.includes('@')) {
    throw new Error('Valid email is required');
  }
  if (!password) {
    throw new Error('Password is required');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: environment.isProduction 
        ? 'https://yourdomain.com/auth/callback'
        : 'http://localhost:8080/auth/callback'
    }
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

/**
 * Create a profile entry in the profiles table
 */
export const createProfile = async (id: string, email: string) => {
  const { error } = await supabase.from('profiles').insert([
    {
      id,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  if (error) throw error;
};
