
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { AuthContextType } from './auth/types';
import { supabase } from '../lib/supabase';
import { convertSupabaseUser } from './auth/userHelpers';
import { loadGuestUserFromStorage, clearGuestUserFromStorage } from './auth/storageHelpers';
import { performSignUp, performSignIn, performSignOut, performGuestLogin } from './auth/authOperations';
import { sessionManager } from './auth/sessionManager';

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

  // Set up session timeout handling
  useEffect(() => {
    sessionManager.setSessionCallbacks(
      undefined, // Warning handled by SessionTimeoutWarning component
      () => {
        // Session expired - sign out user
        setUser(null);
        clearGuestUserFromStorage();
        setError('Session expired due to inactivity');
      }
    );
  }, []);

  // Simplified auth initialization
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          const convertedUser = convertSupabaseUser(session.user);
          setUser(convertedUser);
          sessionManager.createSession(convertedUser);
          clearGuestUserFromStorage();
        } else {
          // No session exists, check for guest user
          const guestUser = loadGuestUserFromStorage();
          setUser(guestUser);
          if (guestUser) {
            sessionManager.createSession(guestUser);
          }
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('Auth state change:', event, session?.user?.id);
            
            if (!mounted) return;

            if (session?.user) {
              const convertedUser = convertSupabaseUser(session.user);
              setUser(convertedUser);
              sessionManager.createSession(convertedUser);
              clearGuestUserFromStorage();
            } else if (event === 'SIGNED_OUT') {
              const guestUser = loadGuestUserFromStorage();
              setUser(guestUser);
              if (guestUser) {
                sessionManager.createSession(guestUser);
              }
            }
          }
        );

        setLoading(false);

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

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await performSignUp(email, password, displayName);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to sign up';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await performSignIn(email, password);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to sign in';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const guestLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await performGuestLogin();
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to login as guest';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await performSignOut(user?.id);
      if (result.success) {
        setUser(null);
        sessionManager.clearSession();
      }
      return result;
    } catch (e) {
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
