// ============================================================================
// Type Definitions for Village to Market API
// ============================================================================

export type UserType = 'farmer' | 'buyer';

export type ListingStatus = 'active' | 'sold' | 'expired';

export type NotificationType = 
  | 'new_message' 
  | 'new_listing' 
  | 'price_alert' 
  | 'inquiry' 
  | 'order_status' 
  | 'system';

export type OrderStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  user_type: UserType;
  district: string;
  ward: string;
  is_verified: boolean;
  profile?: FarmerProfile | BuyerProfile;
}

export interface FarmerProfile {
  farm_name: string;
  farm_size: string;
  verified: boolean;
}

export interface BuyerProfile {
  organization_name: string;
  buyer_type: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  phone_number: string;
  password: string;
  user_type: UserType;
  district: string;
  ward: string;
  email?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ============================================================================
// Listing Types
// ============================================================================

export interface ProduceType {
  id: number;
  name: string;
}

export interface Listing {
  id: string;
  title: string;
  produce_type: ProduceType;
  quantity_available: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  district: string;
  status: ListingStatus;
  is_organic: boolean;
  harvest_date?: string;
  description?: string;
  /** May be plain strings OR image objects depending on the API version */
  images: (string | { image?: string; url?: string; file?: string; image_url?: string })[]
  farmer_id?: string;
  farmer_name?: string;
  farmer_phone?: string;
  created_at?: string;
  updated_at?: string;
  views?: number;
  inquiries?: number;
}

export interface CreateListingRequest {
  produce_type_id: number;
  quantity_available: number;
  unit: string;
  price_per_unit: number;
  description?: string;
  is_organic?: boolean;
  harvest_date?: string;
}

export interface ListingsQueryParams {
  district?: string;
  produce_type?: number;
  status?: ListingStatus;
  farmer_id?: string;
  page?: number;
  page_size?: number;
}

// ============================================================================
// Messaging Types
// ============================================================================

export interface Conversation {
  id: string;
  other_user: {
    id: string;
    name: string;
  };
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  text: string;
  created_at: string;
  is_read: boolean;
  client_id?: string;
}

export interface WebSocketMessage {
  type: 'chat_message' | 'typing' | 'read_receipt' | 'error';
  message?: Message;
  user_id?: string;
  user_name?: string;
  is_typing?: boolean;
  message_id?: string;
  error?: string;
}

export interface SendMessageRequest {
  type: 'chat_message';
  message: string;
  client_id: string;
}

export interface SendTypingRequest {
  type: 'typing';
  is_typing: boolean;
}

export interface SendReadReceiptRequest {
  type: 'read_receipt';
  message_id: string;
}

// ============================================================================
// Pricing Types
// ============================================================================

export interface MarketPrice {
  produce_type: string;
  district: string;
  price_min: number;
  price_avg: number;
  price_max: number;
  unit: string;
  currency?: string;
  recorded_date: string;
}

export interface MarketPricesQueryParams {
  district?: string;
  produce_type?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  created_at: string;
  related_id?: string;
}

// ============================================================================
// Order Types
// ============================================================================

export interface Order {
  id: string;
  order_number: string;
  listing_id: string;
  listing_title: string;
  buyer_id: string;
  buyer_name?: string;
  farmer_id: string;
  farmer_name?: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Offline Sync Types
// ============================================================================

export interface SyncChange {
  entity_type: 'message' | 'listing' | 'order';
  entity_id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  client_id?: string;
}

export interface SyncRequest {
  last_sync: string;
  changes: SyncChange[];
}

export interface SyncResponse {
  success: boolean;
  conflicts: SyncChange[];
  server_changes: SyncChange[];
}

// ============================================================================
// API Error Types
// ============================================================================

export interface ApiError {
  error: string;
  status_code: number;
  details?: Record<string, any>;
}

// ============================================================================
// Common Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
