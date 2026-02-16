// ============================================================================
// Authentication Hook
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { authApi, usersApi } from './api';
import type { LoginRequest, RegisterRequest, User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Initialize - Check if user is logged in
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token is still valid by fetching user profile
          const user = await usersApi.getProfile();
          setState({ user, loading: false, error: null });
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setState({ user: null, loading: false, error: null });
        }
      } else {
        setState({ user: null, loading: false, error: null });
      }
    };

    initializeAuth();
  }, []);

  // Login
  const login = useCallback(async (data: LoginRequest) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await authApi.login(data);
      setState({ user: response.user, loading: false, error: null });
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
      setState({ user: response.user, loading: false, error: null });
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
    setState({ user: null, loading: false, error: null });
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: Partial<User>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedUser = await usersApi.updateProfile(data);
      setState({ user: updatedUser, loading: false, error: null });
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
