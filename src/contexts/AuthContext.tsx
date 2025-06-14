
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signUp: async () => ({ success: false, error: 'Not implemented' }),
  signIn: async () => ({ success: false, error: 'Not implemented' }),
  signOut: async () => ({ success: false, error: 'Not implemented' }),
  guestLogin: async () => ({ success: false, error: 'Not implemented' }),
});

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to convert Supabase User to our User type
const convertSupabaseUser = (supabaseUser: SupabaseUser): User => ({
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
const createLocalGuestUser = (): User => {
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

// Helper function to save guest user to localStorage
const saveGuestUserToStorage = (user: User) => {
  localStorage.setItem('storyforge_guest_user', JSON.stringify(user));
};

// Helper function to load guest user from localStorage
const loadGuestUserFromStorage = (): User | null => {
  try {
    const stored = localStorage.getItem('storyforge_guest_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        isOnline: navigator.onLine
      };
    }
  } catch (error) {
    console.error('Failed to load guest user from storage:', error);
    localStorage.removeItem('storyforge_guest_user');
  }
  return null;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        setUser({ ...user, isOnline: true });
      }
    };

    const handleOffline = () => {
      if (user) {
        setUser({ ...user, isOnline: false });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // First, set up the auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session?.user?.id);
            
            if (!mounted) return;

            if (session?.user) {
              // User is authenticated with Supabase
              const convertedUser = convertSupabaseUser(session.user);
              setUser(convertedUser);
              // Clear any guest user data
              localStorage.removeItem('storyforge_guest_user');
            } else {
              // No Supabase session, check for guest user
              const guestUser = loadGuestUserFromStorage();
              setUser(guestUser);
            }
            
            if (mounted) {
              setLoading(false);
            }
          }
        );

        // Then check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          // Check for guest user fallback
          const guestUser = loadGuestUserFromStorage();
          setUser(guestUser);
        } else if (session?.user) {
          // User has active Supabase session
          const convertedUser = convertSupabaseUser(session.user);
          setUser(convertedUser);
          localStorage.removeItem('storyforge_guest_user');
        } else {
          // No active session, check for guest user
          const guestUser = loadGuestUserFromStorage();
          setUser(guestUser);
        }

        if (mounted) {
          setLoading(false);
        }

        // Cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (e) {
        console.error('Error initializing auth:', e);
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    const cleanup = initializeAuth();

    return () => {
      mounted = false;
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  // Sign up function with proper result handling
  const signUp = async (email: string, password: string) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Valid email is required' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      console.log('Supabase signUp result:', data);
      if (data.user) {
        const convertedUser = convertSupabaseUser(data.user);
        setUser(convertedUser);
        
        try {
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: convertedUser.id,
              email: convertedUser.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
          
          if (profileError) {
            console.error('Profile creation failed:', profileError);
            return { 
              success: true, 
              user: convertedUser,
              warning: 'Account created but profile setup incomplete' 
            };
          }
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          return { 
            success: true, 
            user: convertedUser,
            warning: 'Account created but profile setup incomplete' 
          };
        }
        
        return { success: true, user: convertedUser };
      } else if (data.session === null && data.user === null) {
        return { 
          success: true, 
          requiresEmailConfirmation: true,
          message: 'Check your email to confirm your account before logging in.' 
        };
      } else {
        return { success: false, error: 'Signup failed: No user returned' };
      }
    } catch (e) {
      console.error('Error signing up:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to sign up';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function with proper result handling
  const signIn = async (email: string, password: string) => {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Valid email is required' };
    }
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.user && data.session) {
        const convertedUser = convertSupabaseUser(data.user);
        setUser(convertedUser);
        // Clear any guest user data
        localStorage.removeItem('storyforge_guest_user');
        return { success: true, user: convertedUser };
      } else {
        return { success: false, error: 'Login failed: No user returned' };
      }
    } catch (e) {
      console.error('Error signing in:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to sign in';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Pure local guest login function
  const guestLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const localGuestUser = createLocalGuestUser();
      saveGuestUserToStorage(localGuestUser);
      setUser(localGuestUser);
      return { 
        success: true, 
        user: localGuestUser,
        warning: 'You are logged in as a guest. Sign up for a full account to save your work and access all features.'
      };
    } catch (e) {
      console.error('Error with guest login:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to login as guest';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function with proper result handling
  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Always clear local storage
      localStorage.removeItem('storyforge_guest_user');
      
      // Only call Supabase signOut if the user is not a local guest
      if (user?.id !== 'local-guest') {
        const { error } = await supabase.auth.signOut();
        if (error) {
          return { success: false, error: error.message };
        }
      }
      
      setUser(null);
      return { success: true };
    } catch (e) {
      console.error('Error signing out:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to sign out';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    guestLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
