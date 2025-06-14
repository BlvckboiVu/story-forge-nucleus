
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { environment } from '../config/environment';

/**
 * Supabase client initialization with environment configuration
 * Configured for authentication persistence and auto-refresh
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
 * User registration with email and password
 * Includes input validation for email format and password strength
 * @param email - User's email address
 * @param password - User's password (minimum 6 characters)
 * @returns Promise with authentication data
 * @throws Error if validation fails or registration fails
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

/**
 * User authentication with email and password
 * Includes input validation and email normalization
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with authentication data
 * @throws Error if validation fails or authentication fails
 */
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

/**
 * OAuth authentication with Google
 * Handles redirect URLs for both development and production environments
 * @returns Promise with OAuth data
 * @throws Error if OAuth authentication fails
 */
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

/**
 * Signs out the current user and clears session
 * @throws Error if sign out fails
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Syncs local IndexedDB projects with Supabase when online
 * TODO: Implementation pending for offline-first functionality
 */
export const syncProjects = async () => {
  // Will be implemented to sync local projects to Supabase
};

/**
 * Syncs local IndexedDB drafts with Supabase when online
 * TODO: Implementation pending for offline-first functionality
 */
export const syncDrafts = async () => {
  // Will be implemented to sync local drafts to Supabase
};

/**
 * Syncs local IndexedDB outlines with Supabase when online
 * TODO: Implementation pending for offline-first functionality
 */
export const syncOutlines = async () => {
  // Will be implemented to sync local outlines to Supabase
};

/**
 * Creates a user profile entry in the profiles table
 * Called after successful user registration
 * @param id - User's unique identifier
 * @param email - User's email address
 * @throws Error if profile creation fails
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
