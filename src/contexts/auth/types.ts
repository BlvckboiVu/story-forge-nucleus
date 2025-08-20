
import { User } from '../../types';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  warning?: string;
  requiresEmailConfirmation?: boolean;
  message?: string;
  isOffline?: boolean;
}

export interface SignUpResult extends AuthResult {
  requiresEmailConfirmation?: boolean;
  message?: string;
}

export interface SignInResult extends AuthResult {}

export interface SignOutResult extends Omit<AuthResult, 'user' | 'warning' | 'requiresEmailConfirmation' | 'message' | 'isOffline'> {}

export interface GuestLoginResult extends AuthResult {
  isOffline?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName?: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<SignOutResult>;
  guestLogin: () => Promise<GuestLoginResult>;
}
