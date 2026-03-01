// ============================================================================
// Authentication Hook
// ============================================================================

import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { authApi, usersApi } from './api';
import type { LoginRequest, RegisterRequest, User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
}

/** Returns true when the error is a pure network/connectivity failure. */
const isNetworkError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    // No response means the request never reached the server
    return !error.response;
  }
  return false;
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isOffline: !navigator.onLine,
  });

  // Keep isOffline in sync with the browser's connectivity state
  useEffect(() => {
    const handleOnline = () =>
      setState((prev) => ({ ...prev, isOffline: false }));
    const handleOffline = () =>
      setState((prev) => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize - Check if user is logged in
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        // If we are offline, trust the cached user rather than hitting the network
        if (!navigator.onLine) {
          try {
            const user: User = JSON.parse(storedUser);
            setState((prev) => ({ ...prev, user, loading: false, error: null }));
          } catch {
            setState((prev) => ({ ...prev, user: null, loading: false, error: null }));
          }
          return;
        }

        try {
          // Verify token is still valid by fetching user profile
          const user = await usersApi.getProfile();
          setState((prev) => ({ ...prev, user, loading: false, error: null }));
        } catch (error) {
          if (isNetworkError(error)) {
            // Network issue — fall back to cached user so offline use keeps working
            try {
              const user: User = JSON.parse(storedUser);
              setState((prev) => ({
                ...prev,
                user,
                loading: false,
                error: null,
                isOffline: true,
              }));
            } catch {
              setState((prev) => ({ ...prev, user: null, loading: false, error: null }));
            }
          } else {
            // Token is genuinely invalid — clear storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setState((prev) => ({ ...prev, user: null, loading: false, error: null }));
          }
        }
      } else {
        setState((prev) => ({ ...prev, user: null, loading: false, error: null }));
      }
    };

    initializeAuth();
  }, []);

  // Login – supports offline mode via cached credentials
  const login = useCallback(async (data: LoginRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    // ── Offline path ─────────────────────────────────────────────────────────
    if (!navigator.onLine) {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('access_token');

      if (storedUser && storedToken) {
        try {
          const user: User = JSON.parse(storedUser);
          // Verify the phone number matches the cached account
          if (user.phone_number === data.phone_number) {
            setState({ user, loading: false, error: null, isOffline: true });
            return user;
          }
        } catch {
          // corrupted cache – fall through to error
        }
      }
      const offlineError =
        'You are offline. Please connect to the internet to log in for the first time.';
      setState((prev) => ({ ...prev, loading: false, error: offlineError }));
      throw new Error(offlineError);
    }

    // ── Online path ──────────────────────────────────────────────────────────
    try {
      const response = await authApi.login(data);
      setState({ user: response.user, loading: false, error: null, isOffline: false });
      return response.user;
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Register
  const register = useCallback(async (data: RegisterRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authApi.register(data);
      setState({ user: response.user, loading: false, error: null, isOffline: false });
      return response.user;
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    authApi.logout();
    setState({ user: null, loading: false, error: null, isOffline: !navigator.onLine });
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: Partial<User>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedUser = await usersApi.updateProfile(data);
      setState((prev) => ({ ...prev, user: updatedUser, loading: false, error: null }));
      return updatedUser;
    } catch (error: any) {
      const errorMessage = error.message || 'Profile update failed';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const user = await usersApi.getProfile();
      setState((prev) => ({ ...prev, user }));
      return user;
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isOffline: state.isOffline,
    isAuthenticated: !!state.user,
    isFarmer: state.user?.user_type === 'farmer',
    isBuyer: state.user?.user_type === 'buyer',
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };
};
