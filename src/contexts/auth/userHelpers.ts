
import { User } from '../../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Helper function to convert Supabase User to our User type
export const convertSupabaseUser = (supabaseUser: SupabaseUser): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  displayName: supabaseUser.user_metadata?.display_name,
  avatarUrl: supabaseUser.user_metadata?.avatar_url,
  createdAt: new Date(supabaseUser.created_at),
  updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
  role: supabaseUser.user_metadata?.role || 'user',
  isOnline: navigator.onLine
});

// Helper function to create local guest users
export const createLocalGuestUser = (): User => {
  return {
    id: 'local-guest',
    email: 'guest@storyforge.com',
    displayName: 'Guest User',
    avatarUrl: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'guest' as const,
    isOnline: navigator.onLine
  };
};
