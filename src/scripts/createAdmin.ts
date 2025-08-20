import { localAuthProvider } from '@/services/auth/localAuthProvider';

/**
 * Script to create an admin user in local auth storage
 * Run this script once to set up the admin account
 */
export async function createAdminUser(email: string, password: string) {
  try {
    const { user } = await localAuthProvider.signUp(email, password, 'Admin');
    // Update role locally
    const updatedUser = { ...user, role: 'admin' as const };
    console.log('Admin user created successfully:', email);
    return updatedUser;
  } catch (error) {
    console.error('Failed to create admin user:', error);
    throw error;
  }
}

// Example usage:
// createAdminUser('admin@storyforge.com', 'your-secure-password'); 