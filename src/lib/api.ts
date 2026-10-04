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
  PriceTrend,
  RefreshTokenRequest,
  RegisterRequest,
  SyncRequest,
  SyncResponse,
  User,
} from './types';

// ============================================================================
// Configuration
// ============================================================================

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1';
const RAW_WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8001/ws';

/**
 * Normalise a raw backend URL so it always uses the correct scheme.
 *
 * Rules (in priority order):
 *  1. localhost / 127.0.0.1 — keep as-is (dev server, never upgraded).
 *  2. Vite production build (import.meta.env.PROD === true) — unconditionally
 *     upgrade http → https / ws → wss.  Vercel bakes env vars at build time,
 *     so window.location is not reliable here.
 *  3. Runtime (dev preview, SSR) — check window.location.protocol and upgrade
 *     only when the page is already served over HTTPS.
 *
 * This prevents "Mixed Content" errors where the frontend (HTTPS on Vercel)
 * tries to call the backend over plain HTTP.
 */
function normalizeBackendUrl(rawUrl: string, secureProtocol: 'https:' | 'wss:'): string {
  const isSecurePage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  // import.meta.env.PROD is true in `vite build` output, false in `vite dev`
  const isProductionBuild = import.meta.env.PROD === true;
  try {
    const parsed = new URL(rawUrl);
    const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);

    if (!isLocalHost && (isProductionBuild || isSecurePage)) {
      parsed.protocol = secureProtocol;
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    const shouldUpgrade = isProductionBuild || isSecurePage;
    if (shouldUpgrade && rawUrl.startsWith('http://')) {
      return rawUrl.replace(/^http:\/\//, 'https://').replace(/\/$/, '');
    }
    if (shouldUpgrade && rawUrl.startsWith('ws://')) {
      return rawUrl.replace(/^ws:\/\//, 'wss://').replace(/\/$/, '');
    }
    return rawUrl.replace(/\/$/, '');
  }
}

export const API_BASE_URL = normalizeBackendUrl(RAW_API_BASE_URL, 'https:');
export const WS_BASE_URL = normalizeBackendUrl(RAW_WS_BASE_URL, 'wss:');

// Derive the server origin (e.g. https://127.0.0.1:8000) from the API base URL
export const API_SERVER_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://127.0.0.1:8000';
  }
})();

/**
 * Extract a raw path string from whatever shape the Django API returns for an
 * image entry. Handles:
 *   - plain string:                 "/media/listings/abc.jpg"
 *   - {image: "/media/..."}         (DRF ImageField default)
 *   - {url: "/media/..."}           (some serialisers use `url`)
 *   - {file: "/media/..."}          (another common variant)
 *   - {image_url: "..."}            (prefetched absolute URL variant)
 *   - any object whose first string value looks like a file path / URL
 */
function extractRawPath(entry: unknown): string {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && entry !== null) {
    const obj = entry as Record<string, unknown>;
    // Try well-known keys first (order matters — most specific first)
    const knownKeys = [
      'image_url', 'url', 'image', 'file',
      'photo', 'src', 'path', 'thumbnail',
      'image_file', 'photo_url', 'file_url',
    ];
    for (const key of knownKeys) {
      const val = obj[key];
      if (typeof val === 'string' && val) return val;
    }
    // Last resort: return the first string value that looks like a path/URL
    for (const val of Object.values(obj)) {
      if (
        typeof val === 'string' &&
        val &&
        (val.startsWith('/') || val.startsWith('http'))
      ) {
        return val;
      }
    }
  }
  return '';
}

function isThumbnailLikePath(rawPath: string): boolean {
  return /(^|[\/_-])(thumb|thumbnail|preview|small)([\/_-]|\.|$)/i.test(rawPath);
}

function scoreImageEntry(entry: unknown): number {
  const raw = extractRawPath(entry);
  if (!raw) return -1000;

  let score = 0;
  const normalized = raw.toLowerCase();
  const obj = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : null;

  if (obj?.is_primary === true) score += 100;
  if (normalized.startsWith('https://')) score += 15;
  if (normalized.startsWith('http://')) score += 5;
  if (normalized.startsWith('/media/')) score += 10;
  if (!isThumbnailLikePath(normalized)) score += 30;
  if (typeof obj?.order === 'number') score += Math.max(0, 10 - obj.order);

  return score;
}

export function selectPreferredImageEntry(images: unknown[] | undefined | null): unknown {
  if (!Array.isArray(images) || images.length === 0) return null;
  return [...images].sort((left, right) => scoreImageEntry(right) - scoreImageEntry(left))[0];
}

/**
 * Resolve an image entry returned by the API to a fully-qualified URL.
 * Accepts plain strings OR image-object shapes and handles relative paths.
 */
export function resolveImageUrl(
  entry: unknown,
  fallback: string
): string {
  const raw = extractRawPath(entry);
  if (!raw) return fallback;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  // Relative path — prepend the backend server origin
  return `${API_SERVER_ORIGIN}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

/**
 * Returns the correct local fallback image path based on the produce type name.
 *
 * - Goat-related produce  → /images/goat.jpg
 * - Cattle-related produce → /images/Boran-female-calve.jpg
 * - Anything else          → the provided genericFallback URL
 *
 * Usage:
 *   const fallback = getProduceFallbackImage(listing.produce_type?.name);
 *   resolveImageUrl(preferredImg, fallback);
 */
export function getProduceFallbackImage(
  produceName?: string | null,
  genericFallback = 'https://images.unsplash.com/photo-1761370980657-22586ea44093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080'
): string {
  if (!produceName) return genericFallback;
  const name = produceName.toLowerCase();

  const GOAT_KEYWORDS = ['goat', 'goats', 'chevon', 'kid', 'caprine', 'boer goat', 'doe', 'buck'];
  const CATTLE_KEYWORDS = [
    'cattle', 'cow', 'bull', 'beef', 'heifer', 'calf', 'calves', 'boran',
    'brahman', 'nguni', 'hereford', 'ox', 'oxen', 'steer', 'bovine',
  ];

  if (GOAT_KEYWORDS.some(k => name.includes(k))) {
    return '/images/goat.jpg';
  }
  if (CATTLE_KEYWORDS.some(k => name.includes(k))) {
    return '/images/Boran-female-calve.jpg';
  }
  return genericFallback;
}

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ── Mixed-Content safety net ──────────────────────────────────────────
    // Vercel does NOT read .env.production from the repo at build time —
    // it only uses env vars set in the Vercel dashboard.  If VITE_API_URL
    // is missing from the dashboard, Vite bakes in the http:// fallback.
    // This interceptor rewrites any http:// request URL to https:// for
    // non-localhost hosts so mixed-content errors can never occur.
    if (window.location.protocol === 'https:') {
      const url = config.url || '';
      const base = config.baseURL || '';
      const isLocalhost = (s: string) =>
        s.includes('localhost') || s.includes('127.0.0.1') || s.includes('[::1]');

      if (base.startsWith('http://') && !isLocalhost(base)) {
        config.baseURL = base.replace(/^http:\/\//, 'https://');
      }
      if (url.startsWith('http://') && !isLocalhost(url)) {
        config.url = url.replace(/^http:\/\//, 'https://');
      }
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
    const details = error.response.data as any;
    const validationIssues = Array.isArray(details?.detail)
      ? details.detail
          .map((item: any) => item?.msg)
          .filter(Boolean)
          .join(', ')
      : null;

    errorMessage =
      apiError?.error ||
      details?.detail ||
      validationIssues ||
      (apiError.details ? JSON.stringify(apiError.details) : '') ||
      `Error: ${error.response.status}`;
    
    // Log 403 errors with more detail
    if (error.response.status === 403) {
      // 403 Forbidden — token may be invalid or expired
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
      const { access_token, refresh_token, user } = response.data;
      
      if (!access_token) {
        throw new Error('Invalid server response: missing access_token');
      }
      
      // Store tokens and user info
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      const { access_token, refresh_token, user } = response.data;
      
      if (!access_token) {
        throw new Error('Invalid server response: missing access_token');
      }
      
      // Store tokens and user info
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
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

  /**
   * Request a password reset token for a phone number.
   * In dev the token is returned directly; in production it would be sent via SMS.
   */
  passwordResetRequest: async (
    phone_number: string
  ): Promise<{ message: string; reset_token: string | null; display_for_seconds: number }> => {
    try {
      const response = await api.post<{
        message: string;
        reset_token: string | null;
        display_for_seconds: number;
      }>('/auth/password-reset/request', { phone_number });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Confirm password reset using the token from passwordResetRequest.
   * Returns fresh auth tokens so the user is logged in immediately.
   */
  passwordResetConfirm: async (
    reset_token: string,
    new_password: string
  ): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/password-reset/confirm', {
        reset_token,
        new_password,
      });
      const { access_token, refresh_token, user } = response.data;
      if (access_token) {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
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

  /**
   * Switch between farmer and buyer mode
   */
  switchMode: async (mode: 'farmer' | 'buyer'): Promise<{ user_type: string; message: string }> => {
    try {
      const response = await api.post<{ user_type: string; message: string }>('/users/switch-mode', { mode });
      // Update stored user with new mode
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.user_type = response.data.user_type;
        localStorage.setItem('user', JSON.stringify(user));
      }
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get public farmer profile by username
   */
  getPublicFarmerProfile: async (username: string): Promise<any> => {
    try {
      const response = await api.get(`/users/farmer/${username}`);
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
   * Get all listings (public marketplace feed – for buyers browsing).
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
   * Get the authenticated farmer's own listings.
   * Calls GET /listings/my-listings — requires a valid farmer JWT.
   * Optional filters: status, page, page_size.
   */
  myListings: async (params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<Listing[]> => {
    try {
      const response = await api.get<Listing[]>('/listings/my-listings', { params });
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
   * Partially update a listing (owner only) — generic PATCH.
   */
  update: async (id: string, data: Partial<Listing>): Promise<Listing> => {
    try {
      const response = await api.patch<Listing>(`/listings/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Update listing status (active | sold | expired) — owner only.
   */
  updateStatus: async (id: string, status: 'active' | 'sold' | 'expired'): Promise<Listing> => {
    try {
      const response = await api.patch<Listing>(`/listings/${id}`, { status });
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
   * Upload images for a listing — posts each file individually to match
   * the backend endpoint which accepts a single `image` file per request.
   */
  uploadImages: async (listingId: string, files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        // Backend parameter name is 'image' (singular), not 'images'
        formData.append('image', file);

        const response = await api.post<{
          id: string | null;
          url: string | null;
          caption?: string;
          is_primary?: boolean;
        }>(
          `/listings/${listingId}/images/`,
          formData,
          {
            // Let the browser set the correct multipart boundary;
            // removing the default JSON Content-Type is required.
            headers: { 'Content-Type': undefined },
          }
        );

        if (response.data?.url) {
          uploadedUrls.push(response.data.url);
        }
      } catch (err) {
        // Log but don't abort — continue uploading remaining files
        console.error(`Failed to upload image "${file.name}":`, err);
      }
    }

    return uploadedUrls;
  },
};

// ============================================================================
// Produce Types API
// ============================================================================

export const produceTypesApi = {
  /**
   * List all produce types registered in the backend.
   * Used to resolve a produce name string to its numeric produce_type_id
   * before creating a listing.
   */
  list: async (): Promise<import('./types').ProduceType[]> => {
    try {
      const response = await api.get<import('./types').ProduceType[]>('/produce-types');
      return response.data;
    } catch {
      // Non-fatal – callers handle an empty array gracefully
      return [];
    }
  },
};

// ============================================================================
// Messaging API
// ============================================================================

export const messagingApi = {
  /**
   * Get a single conversation by ID (includes other_user and optional listing).
   */
  getConversation: async (conversationId: string): Promise<import('./types').Conversation> => {
    try {
      const response = await api.get<import('./types').Conversation>(
        `/messaging/conversations/${conversationId}/`
      );
      return response.data;
    } catch {
      // If 404 or error, fall through to the list-based lookup in the component
      throw new Error('Conversation not found');
    }
  },

  /**
   * Start or retrieve an existing conversation with another user.
   * POST /messaging/conversations/ — returns the conversation (existing or newly created).
   */
  startConversation: async (otherUserId: string, listingId?: string): Promise<import('./types').Conversation> => {
    try {
      const response = await api.post<Conversation>('/messaging/conversations/', {
        recipient_id: otherUserId,
        ...(listingId ? { listing_id: listingId } : {}),
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get all conversations for current user
   */
  listConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await api.get<Conversation[]>('/messaging/conversations/');
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

  getPriceTrends: async (params?: {
    produce_type?: string;
    district?: string;
    days?: number;
    limit?: number;
  }): Promise<PriceTrend[]> => {
    try {
      const response = await api.get<PriceTrend[]>('/pricing/trends', { params });
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
