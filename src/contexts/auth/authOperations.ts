
import { createLocalGuestUser } from './userHelpers';
import { saveGuestUserToStorage, clearGuestUserFromStorage } from './storageHelpers';
import { validateEmail, validatePassword, validateSignUpPassword, sanitizeAuthInput, validateDisplayName } from './authValidation';
import { authRateLimiter } from './rateLimiter';
import { authLogger } from './authLogger';
import { sessionManager } from './sessionManager';
import { SignUpResult, SignInResult, SignOutResult, GuestLoginResult } from './types';
import { auth } from '@/services/auth';

export const performSignUp = async (email: string, password: string, displayName?: string): Promise<SignUpResult> => {
  // Sanitize inputs
  const sanitizedEmail = sanitizeAuthInput(email);
  const sanitizedDisplayName = displayName ? sanitizeAuthInput(displayName) : undefined;
  
  // Validate inputs
  const emailError = validateEmail(sanitizedEmail);
  if (emailError) {
    authLogger.log({
      type: 'signup_failure',
      email: sanitizedEmail,
      details: `Email validation failed: ${emailError}`,
    });
    return { success: false, error: emailError };
  }

  const passwordError = validateSignUpPassword(password);
  if (passwordError) {
    authLogger.log({
      type: 'signup_failure',
      email: sanitizedEmail,
      details: `Password validation failed: ${passwordError}`,
    });
    return { success: false, error: passwordError };
  }

  if (sanitizedDisplayName) {
    const displayNameError = validateDisplayName(sanitizedDisplayName);
    if (displayNameError) {
      authLogger.log({
        type: 'signup_failure',
        email: sanitizedEmail,
        details: `Display name validation failed: ${displayNameError}`,
      });
      return { success: false, error: displayNameError };
    }
  }

  // Check rate limiting
  const rateLimitCheck = authRateLimiter.isAllowed(sanitizedEmail);
  if (!rateLimitCheck.allowed) {
    const lockTimeMs = authRateLimiter.getRemainingLockTime(sanitizedEmail);
    const lockTimeMinutes = Math.ceil(lockTimeMs / (60 * 1000));
    
    authLogger.log({
      type: 'rate_limit_exceeded',
      email: sanitizedEmail,
      details: `Account locked for ${lockTimeMinutes} minutes`,
    });
    
    return { 
      success: false, 
      error: `Too many failed attempts. Account locked for ${lockTimeMinutes} minutes.` 
    };
  }

  try {
    const { user } = await auth.signUp(sanitizedEmail, password, sanitizedDisplayName);
    authRateLimiter.recordAttempt(sanitizedEmail, true);
    authLogger.log({
      type: 'signup_success',
      email: sanitizedEmail,
      userId: user.id,
    });
    // Create session
    sessionManager.createSession(user);
    return { success: true, user };
  } catch (e) {
    console.error('Error signing up:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to sign up';
    
    authRateLimiter.recordAttempt(sanitizedEmail, false);
    authLogger.log({
      type: 'signup_failure',
      email: sanitizedEmail,
      details: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

export const performSignIn = async (email: string, password: string): Promise<SignInResult> => {
  // Sanitize inputs
  const sanitizedEmail = sanitizeAuthInput(email);
  
  // Validate inputs
  const emailError = validateEmail(sanitizedEmail);
  if (emailError) {
    authLogger.log({
      type: 'signin_failure',
      email: sanitizedEmail,
      details: `Email validation failed: ${emailError}`,
    });
    return { success: false, error: emailError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    authLogger.log({
      type: 'signin_failure',
      email: sanitizedEmail,
      details: `Password validation failed: ${passwordError}`,
    });
    return { success: false, error: passwordError };
  }

  // Check rate limiting
  const rateLimitCheck = authRateLimiter.isAllowed(sanitizedEmail);
  if (!rateLimitCheck.allowed) {
    const lockTimeMs = authRateLimiter.getRemainingLockTime(sanitizedEmail);
    const lockTimeMinutes = Math.ceil(lockTimeMs / (60 * 1000));
    
    authLogger.log({
      type: 'rate_limit_exceeded',
      email: sanitizedEmail,
      details: `Account locked for ${lockTimeMinutes} minutes`,
    });
    
    return { 
      success: false, 
      error: `Too many failed attempts. Account locked for ${lockTimeMinutes} minutes.` 
    };
  }

  try {
    const { user } = await auth.signIn(sanitizedEmail, password);
    authRateLimiter.recordAttempt(sanitizedEmail, true);
    authLogger.log({
      type: 'signin_success',
      email: sanitizedEmail,
      userId: user.id,
    });
    clearGuestUserFromStorage();
    sessionManager.createSession(user);
    return { success: true, user };
  } catch (e) {
    console.error('Error signing in:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to sign in';
    
    authRateLimiter.recordAttempt(sanitizedEmail, false);
    authLogger.log({
      type: 'signin_failure',
      email: sanitizedEmail,
      details: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
};

export const performSignOut = async (currentUserId?: string): Promise<SignOutResult> => {
  try {
    clearGuestUserFromStorage();
    sessionManager.clearSession();
    
    await auth.signOut();
    
    authLogger.log({
      type: 'signout',
      userId: currentUserId,
      details: 'User signed out successfully',
    });
    
    return { success: true };
  } catch (e) {
    console.error('Error signing out:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to sign out';
    
    authLogger.log({
      type: 'signout',
      userId: currentUserId,
      details: `Signout error: ${errorMessage}`,
    });
    
    return { success: false, error: errorMessage };
  }
};

export const performGuestLogin = async (): Promise<GuestLoginResult> => {
  try {
    const localGuestUser = createLocalGuestUser();
    saveGuestUserToStorage(localGuestUser);
    sessionManager.createSession(localGuestUser);
    
    authLogger.log({
      type: 'signin_success',
      userId: localGuestUser.id,
      details: 'Guest login successful',
    });
    
    return { 
      success: true, 
      user: localGuestUser,
      warning: 'You are logged in as a guest. Sign up for a full account to save your work and access all features.'
    };
  } catch (e) {
    console.error('Error with guest login:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to login as guest';
    
    authLogger.log({
      type: 'signin_failure',
      details: `Guest login failed: ${errorMessage}`,
    });
    
    return { success: false, error: errorMessage };
  }
};
