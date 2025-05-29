import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { supabase, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut, createProfile } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  guestLogin: async () => {},
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (user) {
        setUser({ ...user, isOnline: true });
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setUser(null);
        } else if (session?.user) {
          setUser(convertSupabaseUser(session.user));
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

  // Sign up function
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseSignUp(email, password);
      console.log('Supabase signUp result:', result);
      if (result.user) {
        const convertedUser = convertSupabaseUser(result.user);
        setUser(convertedUser);
        try {
          await createProfile(convertedUser.id, convertedUser.email);
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          setError('Account created, but failed to create user profile. Please contact support.');
          throw profileError;
        }
      } else if (result.session === null && result.user === null && result.error === null && result.data) {
        // Supabase may require email confirmation
        setError('Check your email to confirm your account before logging in.');
        throw new Error('Email confirmation required.');
      } else {
        throw new Error('Signup failed: No user returned');
      }
    } catch (e) {
      console.error('Error signing up:', e);
      setError(e instanceof Error ? e.message : 'Failed to sign up');
      setUser(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseSignIn(email, password);
      if (result.user) {
        const convertedUser = convertSupabaseUser(result.user);
        setUser(convertedUser);
      } else {
        throw new Error('Login failed: No user returned');
      }
    } catch (e) {
      console.error('Error signing in:', e);
      setError(e instanceof Error ? e.message : 'Failed to sign in');
      setUser(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Guest login function with improved offline handling
  const guestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!navigator.onLine) {
        // Always use local guest in offline mode
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
        return;
      }

      const guestEmail = `guest_${Date.now()}@storyforge.com`;
      const guestPassword = crypto.randomUUID().slice(0, 16);
      
      try {
        const result = await supabaseSignUp(guestEmail, guestPassword);
        if (result?.user) {
          const convertedUser = convertSupabaseUser(result.user);
          // Ensure guest role
          convertedUser.role = 'guest';
          setUser(convertedUser);
          await createProfile(convertedUser.id, convertedUser.email);
        }
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
          setError('Rate limit reached. Using local guest mode.');
        } else {
          throw e;
        }
      }
    } catch (e) {
      console.error('Error with guest login:', e);
      setError(e instanceof Error ? e.message : 'Failed to login as guest');
      setUser(null);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await supabaseSignOut();
      // Always clear local storage and state
      localStorage.removeItem('storyforge_user');
      setUser(null);
    } catch (e) {
      console.error('Error signing out:', e);
      setError(e instanceof Error ? e.message : 'Failed to sign out');
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
