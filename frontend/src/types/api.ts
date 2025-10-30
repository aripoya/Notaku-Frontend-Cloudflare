// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Backend API Response Format
export interface BackendResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  subscription_tier: 'free' | 'premium';
  created_at: string;
  is_active: boolean;
}

export interface UserRegistration {
  email: string;
  name: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  token_type: 'bearer';
}

// Note Types
export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  isPublic?: boolean;
}

// Receipt Types
export interface Receipt {
  id: string;
  user_id: string;
  merchant_name: string;
  total_amount: string;
  currency: string;
  transaction_date: string;
  category?: string;
  notes?: string;
  ocr_text?: string;
  ocr_confidence?: number;
  image_path?: string;
  image_url?: string;
  is_edited: boolean;
  rag_indexed: boolean;
  created_at: string;
  updated_at: string;
  items: ReceiptItem[];
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  item_name: string;
  quantity?: number;
  unit_price?: number;
  total_price: number;
  created_at: string;
}

export interface CreateReceiptInput {
  merchant_name: string;
  total_amount: number;
  currency?: string;
  transaction_date: string;
  category?: string;
  notes?: string;
}

export interface UpdateReceiptInput {
  merchant_name?: string;
  total_amount?: number;
  transaction_date?: string;
  category?: string;
  notes?: string;
}

export interface ReceiptsResponse {
  receipts: Receipt[];
  total: number;
  has_more: boolean;
}

// Attachment Types
export interface Attachment {
  id: string;
  noteId: string;
  userId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Health & System Types
export interface HealthResponse {
  status: string;
  app: string;
  environment: string;
}

export interface SystemInfo {
  message: string;
  version: string;
  status: string;
  services: {
    postgresql: string;
    redis: string;
    minio: string;
    ocr: string;
    ai: string;
  };
}

export interface ApiInfo {
  name: string;
  version: string;
  endpoints: {
    health: string;
    docs: string;
    openapi: string;
  };
}

// AI Chat Types
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: string;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  statusCode?: number;
}

// File Upload Types
export interface FileUploadResponse {
  filename: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  url?: string;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface NoteQueryParams extends PaginationParams {
  tags?: string[];
  search?: string;
  isPublic?: boolean;
}

export interface ReceiptQueryParams extends PaginationParams {
  start_date?: string;
  end_date?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
