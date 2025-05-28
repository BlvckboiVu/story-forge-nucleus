
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { supabase, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
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
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session check error:', error);
          // Fall back to localStorage for demo purposes
          const storedUser = localStorage.getItem('storyforge_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else if (session?.user) {
          setUser(convertSupabaseUser(session.user));
        } else {
          // Check localStorage as fallback
          const storedUser = localStorage.getItem('storyforge_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
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
      console.log('Auth state changed:', event, session?.user?.email);
      if (session?.user) {
        const convertedUser = convertSupabaseUser(session.user);
        setUser(convertedUser);
        localStorage.setItem('storyforge_user', JSON.stringify(convertedUser));
      } else {
        setUser(null);
        localStorage.removeItem('storyforge_user');
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
      if (result.user) {
        const convertedUser = convertSupabaseUser(result.user);
        setUser(convertedUser);
        localStorage.setItem('storyforge_user', JSON.stringify(convertedUser));
      }
    } catch (e) {
      console.error('Error signing up:', e);
      setError(e instanceof Error ? e.message : 'Failed to sign up');
      // Fallback to mock user for demo
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      localStorage.setItem('storyforge_user', JSON.stringify(mockUser));
      setUser(mockUser as User);
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
        localStorage.setItem('storyforge_user', JSON.stringify(convertedUser));
      }
    } catch (e) {
      console.error('Error signing in:', e);
      setError(e instanceof Error ? e.message : 'Failed to sign in');
      // Fallback to mock user for demo
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      localStorage.setItem('storyforge_user', JSON.stringify(mockUser));
      setUser(mockUser as User);
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
