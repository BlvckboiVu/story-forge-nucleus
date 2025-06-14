
import { User } from '../../types';

const GUEST_USER_KEY = 'storyforge_guest_user';

// Helper function to save guest user to localStorage
export const saveGuestUserToStorage = (user: User): void => {
  try {
    localStorage.setItem(GUEST_USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save guest user to storage:', error);
  }
};

// Helper function to load guest user from localStorage
export const loadGuestUserFromStorage = (): User | null => {
  try {
    const stored = localStorage.getItem(GUEST_USER_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        isOnline: navigator.onLine
      };
    }
  } catch (error) {
    console.error('Failed to load guest user from storage:', error);
    clearGuestUserFromStorage();
  }
  return null;
};

// Helper function to clear guest user from localStorage
export const clearGuestUserFromStorage = (): void => {
  try {
    localStorage.removeItem(GUEST_USER_KEY);
  } catch (error) {
    console.error('Failed to clear guest user from storage:', error);
  }
};
