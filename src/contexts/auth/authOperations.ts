
import { supabase } from '../../lib/supabase';
import { convertSupabaseUser, createLocalGuestUser } from './userHelpers';
import { saveGuestUserToStorage, clearGuestUserFromStorage } from './storageHelpers';
import { validateEmail, validatePassword, validateSignUpPassword } from './authValidation';
import { SignUpResult, SignInResult, SignOutResult, GuestLoginResult } from './types';

export const performSignUp = async (email: string, password: string): Promise<SignUpResult> => {
  const emailError = validateEmail(email);
  if (emailError) {
    return { success: false, error: emailError };
  }

  const passwordError = validateSignUpPassword(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

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
    return { success: false, error: errorMessage };
  }
};

export const performSignIn = async (email: string, password: string): Promise<SignInResult> => {
  const emailError = validateEmail(email);
  if (emailError) {
    return { success: false, error: emailError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

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
      clearGuestUserFromStorage();
      return { success: true, user: convertedUser };
    } else {
      return { success: false, error: 'Login failed: No user returned' };
    }
  } catch (e) {
    console.error('Error signing in:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to sign in';
    return { success: false, error: errorMessage };
  }
};

export const performSignOut = async (currentUserId?: string): Promise<SignOutResult> => {
  try {
    clearGuestUserFromStorage();
    
    if (currentUserId !== 'local-guest') {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
    }
    
    return { success: true };
  } catch (e) {
    console.error('Error signing out:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to sign out';
    return { success: false, error: errorMessage };
  }
};

export const performGuestLogin = async (): Promise<GuestLoginResult> => {
  try {
    const localGuestUser = createLocalGuestUser();
    saveGuestUserToStorage(localGuestUser);
    return { 
      success: true, 
      user: localGuestUser,
      warning: 'You are logged in as a guest. Sign up for a full account to save your work and access all features.'
    };
  } catch (e) {
    console.error('Error with guest login:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to login as guest';
    return { success: false, error: errorMessage };
  }
};
