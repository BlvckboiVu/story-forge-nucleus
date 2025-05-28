
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { supabase, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

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
          setUser(session.user as User);
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
        setUser(session.user as User);
        localStorage.setItem('storyforge_user', JSON.stringify(session.user));
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
      const { data, error } = await supabaseSignUp(email, password);
      if (error) {
        console.error('Supabase signup error:', error);
        // Fallback to mock user for demo
        const mockUser = {
          id: crypto.randomUUID(),
          email,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        localStorage.setItem('storyforge_user', JSON.stringify(mockUser));
        setUser(mockUser as User);
      } else if (data.user) {
        setUser(data.user as User);
        localStorage.setItem('storyforge_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Error signing up:', e);
      setError(e instanceof Error ? e.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabaseSignIn(email, password);
      if (error) {
        console.error('Supabase signin error:', error);
        // Fallback to mock user for demo
        const mockUser = {
          id: crypto.randomUUID(),
          email,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        localStorage.setItem('storyforge_user', JSON.stringify(mockUser));
        setUser(mockUser as User);
      } else if (data.user) {
        setUser(data.user as User);
        localStorage.setItem('storyforge_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Error signing in:', e);
      setError(e instanceof Error ? e.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabaseSignOut();
      if (error) {
        console.error('Supabase signout error:', error);
      }
      
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
