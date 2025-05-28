
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { supabase, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut } from '../lib/supabase';

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
        // In a real implementation with Supabase connected:
        // const { data, error } = await supabase.auth.getSession();
        // if (data?.session) { setUser(data.session.user); }
        
        // For now, check localStorage for demo purposes
        const storedUser = localStorage.getItem('storyforge_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Error checking authentication:', e);
        setError('Failed to retrieve user session');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    
    // Set up auth state change listener (when Supabase is connected)
    // const { subscription } = supabase.auth.onAuthStateChange((event, session) => {
    //   setUser(session?.user ?? null);
    //   setLoading(false);
    // });
    
    // return () => { subscription.unsubscribe(); };
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // With Supabase integration:
      // const { data, error } = await supabaseSignUp(email, password);
      // if (error) throw error;
      // setUser(data.user);
      
      // For demo/local development:
      console.log('Sign up functionality will be implemented with Supabase integration');
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      localStorage.setItem('storyforge_user', JSON.stringify(mockUser));
      setUser(mockUser as User);
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
      // With Supabase integration:
      // const { data, error } = await supabaseSignIn(email, password);
      // if (error) throw error;
      // setUser(data.user);
      
      // For demo/local development:
      console.log('Sign in functionality will be implemented with Supabase integration');
      const mockUser = {
        id: crypto.randomUUID(),
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      localStorage.setItem('storyforge_user', JSON.stringify(mockUser));
      setUser(mockUser as User);
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
      // With Supabase integration:
      // await supabaseSignOut();
      
      // For demo/local development:
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
