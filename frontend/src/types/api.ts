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

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface UserRegistration {
  email: string;
  username: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message: string;
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
  userId: string;
  merchantName: string;
  totalAmount: number;
  currency: string;
  transactionDate: string;
  ocrData: OCRData;
  imagePath: string;
  createdAt: string;
}

export interface OCRData {
  merchantName?: string;
  totalAmount?: number;
  items?: OCRItem[];
  date?: string;
  tax?: number;
  subtotal?: number;
  rawText?: string;
  confidence?: number;
}

export interface OCRItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CreateReceiptInput {
  merchantName?: string;
  totalAmount?: number;
  currency?: string;
  transactionDate?: string;
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
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  merchantName?: string;
}
