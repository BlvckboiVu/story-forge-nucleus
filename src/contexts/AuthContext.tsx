
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
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setUser(null);
        } else if (data.session?.user) {
          setUser(convertSupabaseUser(data.session.user));
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error checking authentication:', e);
        setError('Failed to retrieve user session');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const convertedUser = convertSupabaseUser(session.user);
        setUser(convertedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    
    return () => { subscription.unsubscribe(); };
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
            // Don't fail the signup if profile creation fails
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
      
      if (data.user) {
        const convertedUser = convertSupabaseUser(data.user);
        setUser(convertedUser);
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

  // Guest login function with proper result handling
  const guestLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!navigator.onLine) {
        const localGuestUser = {
          id: 'local-guest',
          email: 'local-guest@storyforge.com',
          displayName: 'Guest',
          avatarUrl: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'guest' as const,
          isOnline: false
        };
        setUser(localGuestUser);
        return { success: true, user: localGuestUser, isOffline: true };
      }

      const guestEmail = `guest_${Date.now()}@storyforge.com`;
      const guestPassword = crypto.randomUUID().slice(0, 16);
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email: guestEmail,
          password: guestPassword,
        });
        
        if (error) {
          return { success: false, error: error.message };
        }
        
        if (data?.user) {
          const convertedUser = convertSupabaseUser(data.user);
          convertedUser.role = 'guest';
          setUser(convertedUser);
          
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: convertedUser.id,
              email: convertedUser.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
          
          if (profileError) {
            console.error('Guest profile creation failed:', profileError);
          }
          
          return { success: true, user: convertedUser };
        }
        
        return { success: false, error: 'Guest login failed: No user returned' };
      } catch (e: any) {
        if (e?.message?.toLowerCase().includes('rate limit')) {
          const localGuestUser = {
            id: 'local-guest',
            email: 'local-guest@storyforge.com',
            displayName: 'Guest',
            avatarUrl: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'guest' as const,
            isOnline: true
          };
          setUser(localGuestUser);
          return { 
            success: true, 
            user: localGuestUser, 
            warning: 'Using local guest mode due to rate limits' 
          };
        } else {
          throw e;
        }
      }
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      
      localStorage.removeItem('storyforge_user');
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
