// ============================================================================
// API Service Layer for Village to Market
// ============================================================================

import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  ApiError,
  AuthResponse,
  Conversation,
  CreateListingRequest,
  Listing,
  ListingsQueryParams,
  LoginRequest,
  MarketPrice,
  MarketPricesQueryParams,
  Message,
  Notification,
  Order,
  RefreshTokenRequest,
  RegisterRequest,
  SyncRequest,
  SyncResponse,
  User,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws';

// ============================================================================
// Axios Instance Configuration
// ============================================================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Request Interceptor - Add Auth Token
// ============================================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const isAuthEndpoint = config.url?.includes('/auth/');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Request with token:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        tokenPreview: token.substring(0, 20) + '...'
      });
    } else if (!isAuthEndpoint) {
      // Only warn about missing token for non-auth endpoints
      console.warn('⚠️ No token found for request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// Response Interceptor - Handle Token Refresh
// ============================================================================

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest: any = error.config;

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue the request while token is being refreshed
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      // No refresh token, logout
      handleLogout();
      return Promise.reject(error);
    }

    try {
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      );

      const { access_token, refresh_token: newRefreshToken } = response.data;
      
      // Store new tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', newRefreshToken);

      // Update authorization header
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      processQueue(null, access_token);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      handleLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

const handleApiError = (error: any): never => {
  let errorMessage = 'An unexpected error occurred';
  
  if (axios.isAxiosError(error) && error.response) {
    const apiError: ApiError = error.response.data;
    errorMessage = apiError.error || (apiError.details ? JSON.stringify(apiError.details) : '') || `Error: ${error.response.status}`;
    
    // Log 403 errors with more detail
    if (error.response.status === 403) {
      console.error('🚫 403 Forbidden Error:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        hasToken: !!localStorage.getItem('access_token'),
        response: error.response.data
      });
    }
  } else if (error.request) {
    errorMessage = 'Network error. Please check your connection.';
  } else {
    errorMessage = error.message || 'An unexpected error occurred';
  }
  
  throw new Error(errorMessage);
};

// ============================================================================
// Authentication API
// ============================================================================

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);
      console.log('✅ Registration response:', response.data);
      
      const { access_token, refresh_token, user } = response.data;
      
      if (!access_token) {
        console.error('❌ No access_token in response:', response.data);
        throw new Error('Invalid server response: missing access_token');
      }
      
      // Store tokens and user info
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('💾 Stored token:', access_token.substring(0, 20) + '...');
      
      return response.data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      console.log('✅ Login response:', response.data);
      
      const { access_token, refresh_token, user } = response.data;
      
      if (!access_token) {
        console.error('❌ No access_token in response:', response.data);
        throw new Error('Invalid server response: missing access_token');
      }
      
      // Store tokens and user info
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('💾 Stored token:', access_token.substring(0, 20) + '...');
      
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      return handleApiError(error);
    }
  },

  /**
   * Refresh access token
   */
  refresh: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/refresh', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    handleLogout();
  },
};

// ============================================================================
// Users API
// ============================================================================

export const usersApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<User>('/users/me');
      // Update stored user info
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      const response = await api.patch<User>('/users/me', data);
      // Update stored user info
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Listings API
// ============================================================================

export const listingsApi = {
  /**
   * Get all listings (with optional filters)
   */
  list: async (params?: ListingsQueryParams): Promise<Listing[]> => {
    try {
      const response = await api.get<Listing[]>('/listings/', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get a single listing by ID
   */
  get: async (id: string): Promise<Listing> => {
    try {
      const response = await api.get<Listing>(`/listings/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Create a new listing (farmers only)
   */
  create: async (data: CreateListingRequest): Promise<Listing> => {
    try {
      const response = await api.post<Listing>('/listings/', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Delete a listing (owner only)
   */
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/listings/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Upload images for a listing
   */
  uploadImages: async (listingId: string, files: File[]): Promise<string[]> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.post<{ images: string[] }>(
        `/listings/${listingId}/images/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.images;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Messaging API
// ============================================================================

export const messagingApi = {
  /**
   * Get all conversations for current user
   */
  listConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await api.get<Conversation[]>('/messaging/conversations');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get messages in a conversation
   */
  getMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      const response = await api.get<Message[]>(
        `/messaging/conversations/${conversationId}/messages`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Create WebSocket connection for real-time chat
   */
  connectWebSocket: (conversationId: string): WebSocket => {
    const token = localStorage.getItem('access_token');
    const wsUrl = `${WS_BASE_URL}/messaging/${conversationId}/?token=${token}`;
    return new WebSocket(wsUrl);
  },
};

// ============================================================================
// Pricing API
// ============================================================================

export const pricingApi = {
  /**
   * Get current market prices
   */
  getMarketPrices: async (params?: MarketPricesQueryParams): Promise<MarketPrice[]> => {
    try {
      const response = await api.get<MarketPrice[]>('/pricing/market-prices', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Notifications API
// ============================================================================

export const notificationsApi = {
  /**
   * Get all notifications for current user
   */
  list: async (): Promise<Notification[]> => {
    try {
      const response = await api.get<Notification[]>('/notifications/');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    try {
      await api.post(`/notifications/${id}/read`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (ids: string[]): Promise<void> => {
    try {
      await Promise.all(ids.map((id) => api.post(`/notifications/${id}/read`)));
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Orders API
// ============================================================================

export const ordersApi = {
  /**
   * Get all orders for current user
   */
  list: async (): Promise<Order[]> => {
    try {
      const response = await api.get<Order[]>('/marketplace/orders');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Offline Sync API
// ============================================================================

export const syncApi = {
  /**
   * Sync offline changes with server
   */
  sync: async (data: SyncRequest): Promise<SyncResponse> => {
    try {
      const response = await api.post<SyncResponse>('/sync/', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ============================================================================
// Export default API instance
// ============================================================================

export default api;
