
import { User } from '../../types';

// Helper function to create local guest users
export const createLocalGuestUser = (): User => {
  return {
    id: 'local-guest',
    email: 'guest@storyforge.com',
    displayName: 'Guest User',
    avatarUrl: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: 'guest' as const,
    isOnline: navigator.onLine
  };
};
