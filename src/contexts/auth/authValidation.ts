
// Input validation helpers
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Valid email is required';
  }
  if (!email.includes('@')) {
    return 'Valid email is required';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateSignUpPassword = (password: string): string | null => {
  const basicValidation = validatePassword(password);
  if (basicValidation) return basicValidation;
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};
