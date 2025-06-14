
// Enhanced input validation helpers with industry standards
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Valid email is required';
  }
  
  // More robust email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  if (email.length > 254) {
    return 'Email address is too long';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  return null;
};

export const validateSignUpPassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  
  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    'password123', 'admin123', 'welcome123', 'letmein123'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return 'This password is too common. Please choose a more secure password';
  }
  
  return null;
};

export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');
  
  if (password.length >= 12) score += 1;
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('Add special characters');
  
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score <= 2) strength = 'weak';
  else if (score <= 3) strength = 'fair';
  else if (score <= 4) strength = 'good';
  else strength = 'strong';
  
  return { strength, score, feedback };
};

export const sanitizeAuthInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 255); // Limit length
};

export const validateDisplayName = (displayName: string): string | null => {
  const sanitized = sanitizeAuthInput(displayName);
  
  if (!sanitized) {
    return 'Display name is required';
  }
  
  if (sanitized.length < 2) {
    return 'Display name must be at least 2 characters';
  }
  
  if (sanitized.length > 50) {
    return 'Display name must be less than 50 characters';
  }
  
  // Allow letters, numbers, spaces, hyphens, and underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
    return 'Display name can only contain letters, numbers, spaces, hyphens, and underscores';
  }
  
  return null;
};
