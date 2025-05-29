import { supabase } from '../lib/supabase';

/**
 * Script to create an admin user in Supabase
 * Run this script once to set up the admin account
 */
export async function createAdminUser(email: string, password: string) {
  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin',
          displayName: 'Admin'
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned from signup');

    // Create the admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) throw profileError;

    console.log('Admin user created successfully:', email);
    return authData.user;
  } catch (error) {
    console.error('Failed to create admin user:', error);
    throw error;
  }
}

// Example usage:
// createAdminUser('admin@storyforge.com', 'your-secure-password'); 