import type {
  ApiResponse,
  PaginatedResponse,
  User,
  UserRegistration,
  UserLogin,
  AuthResponse,
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  Receipt,
  CreateReceiptInput,
  UpdateReceiptInput,
  ReceiptsResponse,
  Attachment,
  HealthResponse,
  SystemInfo,
  ApiInfo,
  ChatRequest,
  ChatResponse,
  FileUploadResponse,
  NoteQueryParams,
  ReceiptQueryParams,
  UploadProgress,
  ApiError,
} from "@/types/api";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend.notaku.cloud";
const API_VERSION = "v1";
const API_PREFIX = `/api/${API_VERSION}`;

// Debug mode
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

// Token storage key
const TOKEN_KEY = "auth_token";

// Request Configuration
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const REQUEST_CONFIG: RequestInit = {
  credentials: "include", // Include cookies for session management
  mode: "cors",
};

// Custom Error Class
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

// Helper Functions
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
  }
  
  return url.toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    let errorDetails;
    
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
        errorDetails = errorData.details;
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    
    // Handle authentication errors
    if (response.status === 401) {
      console.error('[API] 401 Unauthorized - clearing token and redirecting to login');
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('current_user');
        window.location.href = '/login?error=session_expired';
      }
    }
    
    throw new ApiClientError(
      errorMessage,
      response.status,
      response.status.toString(),
      errorDetails
    );
  }
  
  if (isJson) {
    return response.json();
  }
  
  return response.text() as any;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get token from localStorage if available
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem(TOKEN_KEY);
  }

  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...REQUEST_CONFIG,
    ...options,
    headers,
  };
  
  const url = buildUrl(endpoint);
  
  if (DEBUG) {
    console.log(`[API] ${options.method || "GET"} ${url}`);
  }
  
  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (DEBUG) {
      console.error(`[API Error] ${endpoint}:`, error);
    }
    throw error;
  }
}

// API Client Class
export class ApiClient {
  // ==================== Health & System ====================
  
  static async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/health");
  }
  
  static async getSystemInfo(): Promise<SystemInfo> {
    return request<SystemInfo>("/");
  }
  
  static async getApiInfo(): Promise<ApiInfo> {
    return request<ApiInfo>(`${API_PREFIX}/info`);
  }
  
  // ==================== Authentication ====================
  
  static async register(data: UserRegistration): Promise<AuthResponse> {
    console.log('[Auth] 🚀 Registering user with backend API');
    
    const response = await request<AuthResponse>(`${API_PREFIX}/auth/register`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    // Store token in localStorage
    if (response.token && typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem('current_user', JSON.stringify(response.user));
      console.log('[Auth] ✅ User registered and token stored');
    }
    
    return response;
  }
  
  static async login(data: UserLogin): Promise<AuthResponse> {
    console.log('[Auth] 🚀 Logging in user with backend API');
    
    const response = await request<AuthResponse>(`${API_PREFIX}/auth/login`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    // Store token and user in localStorage
    if (response.token && typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem('current_user', JSON.stringify(response.user));
      console.log('[Auth] ✅ User logged in and token stored');
    }
    
    return response;
  }
  
  static async logout(): Promise<ApiResponse> {
    console.log('[Auth] 🚀 Logging out user');
    
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('current_user');
      localStorage.removeItem('mock_user'); // Clean up old mock data
      console.log("[Auth] ✅ Token and user data cleared");
    }
    
    return {
      success: true,
      message: 'Logout successful',
    };
  }
  
  static async getCurrentUser(): Promise<User> {
    console.log('[Auth] Getting current user from localStorage');
    
    if (typeof window !== "undefined") {
      // Try new format first
      const stored = localStorage.getItem('current_user');
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Fallback to old mock format for migration
      const mockStored = localStorage.getItem('mock_user');
      if (mockStored) {
        const mockUser = JSON.parse(mockStored);
        // Convert mock format to new format
        const convertedUser: User = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.username || mockUser.name || mockUser.email.split('@')[0],
          subscription_tier: 'free',
          created_at: mockUser.createdAt || new Date().toISOString(),
          is_active: mockUser.isActive !== false,
        };
        // Store in new format and remove old
        localStorage.setItem('current_user', JSON.stringify(convertedUser));
        localStorage.removeItem('mock_user');
        return convertedUser;
      }
    }
    
    throw new ApiClientError('Not authenticated', 401);
  }
  
  static async refreshToken(): Promise<AuthResponse> {
    console.log('[Auth] ⚠️ Token refresh not implemented yet');
    
    // For now, just return current user with existing token
    const user = await this.getCurrentUser();
    const token = this.getToken();
    
    if (!token) {
      throw new ApiClientError('No token to refresh', 401);
    }
    
    return {
      user,
      token,
      token_type: 'bearer',
    };
    
    /* TODO: Implement when backend supports token refresh
    return request<AuthResponse>(`${API_PREFIX}/auth/refresh`, {
      method: "POST",
    });
    */
  }
  
  // ==================== Users ====================
  
  static async getUser(userId: string): Promise<User> {
    return request<User>(`${API_PREFIX}/users/${userId}`);
  }
  
  static async updateUser(userId: string, data: Partial<User>): Promise<User> {
    return request<User>(`${API_PREFIX}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
  
  static async deleteUser(userId: string): Promise<ApiResponse> {
    return request<ApiResponse>(`${API_PREFIX}/users/${userId}`, {
      method: "DELETE",
    });
  }
  
  // ==================== Notes ====================
  
  static async getNotes(params?: NoteQueryParams): Promise<PaginatedResponse<Note>> {
    const endpoint = `${API_PREFIX}/notes`;
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      ...REQUEST_CONFIG,
      headers: DEFAULT_HEADERS,
    });
    return handleResponse<PaginatedResponse<Note>>(response);
  }
  
  static async getNote(noteId: string): Promise<Note> {
    return request<Note>(`${API_PREFIX}/notes/${noteId}`);
  }
  
  static async createNote(data: CreateNoteInput): Promise<Note> {
    return request<Note>(`${API_PREFIX}/notes`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  
  static async updateNote(noteId: string, data: UpdateNoteInput): Promise<Note> {
    return request<Note>(`${API_PREFIX}/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
  
  static async deleteNote(noteId: string): Promise<ApiResponse> {
    return request<ApiResponse>(`${API_PREFIX}/notes/${noteId}`, {
      method: "DELETE",
    });
  }
  
  // ==================== Receipts ====================
  
  static async getReceipts(params?: ReceiptQueryParams): Promise<ReceiptsResponse> {
    const endpoint = `${API_PREFIX}/receipts`;
    const queryParams: Record<string, string> = {};
    
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.offset) queryParams.offset = params.offset.toString();
    if (params?.category) queryParams.category = params.category;
    if (params?.start_date) queryParams.start_date = params.start_date;
    if (params?.end_date) queryParams.end_date = params.end_date;
    if (params?.search) queryParams.search = params.search;
    
    const url = buildUrl(endpoint, queryParams);
    const response = await fetch(url, {
      ...REQUEST_CONFIG,
      headers: DEFAULT_HEADERS,
    });
    return handleResponse<ReceiptsResponse>(response);
  }
  
  static async getReceipt(receiptId: string): Promise<Receipt> {
    return request<Receipt>(`${API_PREFIX}/receipts/${receiptId}`);
  }
  
  static async createReceipt(data: CreateReceiptInput): Promise<Receipt> {
    return request<Receipt>(`${API_PREFIX}/receipts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  
  static async updateReceipt(receiptId: string, data: UpdateReceiptInput): Promise<Receipt> {
    return request<Receipt>(`${API_PREFIX}/receipts/${receiptId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  
  static async deleteReceipt(receiptId: string): Promise<ApiResponse> {
    return request<ApiResponse>(`${API_PREFIX}/receipts/${receiptId}`, {
      method: "DELETE",
    });
  }
  
  static async uploadReceipt(
    file: File,
    metadata?: CreateReceiptInput,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Receipt> {
    const formData = new FormData();
    formData.append("file", file);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });
      }
      
      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new ApiClientError("Invalid JSON response", xhr.status));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(
              new ApiClientError(
                errorData.message || "Upload failed",
                xhr.status,
                xhr.status.toString(),
                errorData.details
              )
            );
          } catch (e) {
            reject(new ApiClientError(`Upload failed: ${xhr.statusText}`, xhr.status));
          }
        }
      });
      
      // Handle errors
      xhr.addEventListener("error", () => {
        reject(new ApiClientError("Network error during upload"));
      });
      
      xhr.addEventListener("abort", () => {
        reject(new ApiClientError("Upload aborted"));
      });
      
      // Send request
      xhr.open("POST", buildUrl(`${API_PREFIX}/receipts/upload`));
      xhr.withCredentials = true; // Include cookies
      xhr.send(formData);
    });
  }
  
  // Receipt CRUD methods moved above - avoiding duplicates
  
  // ==================== Attachments ====================
  
  static async getAttachments(noteId: string): Promise<Attachment[]> {
    return request<Attachment[]>(`${API_PREFIX}/notes/${noteId}/attachments`);
  }
  
  static async uploadAttachment(
    noteId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Attachment> {
    const formData = new FormData();
    formData.append("file", file);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });
      }
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new ApiClientError("Invalid JSON response", xhr.status));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new ApiClientError(errorData.message || "Upload failed", xhr.status));
          } catch (e) {
            reject(new ApiClientError(`Upload failed: ${xhr.statusText}`, xhr.status));
          }
        }
      });
      
      xhr.addEventListener("error", () => {
        reject(new ApiClientError("Network error during upload"));
      });
      
      xhr.open("POST", buildUrl(`${API_PREFIX}/notes/${noteId}/attachments`));
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }
  
  static async deleteAttachment(attachmentId: string): Promise<ApiResponse> {
    return request<ApiResponse>(`${API_PREFIX}/attachments/${attachmentId}`, {
      method: "DELETE",
    });
  }
  
  // ==================== AI Chat ====================
  
  static async chat(data: ChatRequest): Promise<ChatResponse> {
    return request<ChatResponse>(`${API_PREFIX}/chat`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  
  static async chatStream(
    data: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(buildUrl(`${API_PREFIX}/chat`), {
        method: "POST",
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new ApiClientError(`HTTP Error ${response.status}`, response.status);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new ApiClientError("No response body");
      }
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      onError(error as Error);
    }
  }
  
  // ==================== File Storage (MinIO) ====================
  
  static async uploadFile(
    bucket: "uploads" | "avatars" | "exports" | "backups",
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });
      }
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new ApiClientError("Invalid JSON response", xhr.status));
          }
        } else {
          reject(new ApiClientError(`Upload failed: ${xhr.statusText}`, xhr.status));
        }
      });
      
      xhr.addEventListener("error", () => {
        reject(new ApiClientError("Network error during upload"));
      });
      
      xhr.open("POST", buildUrl(`${API_PREFIX}/files/upload`));
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }
  
  static getFileUrl(storagePath: string): string {
    return `${API_BASE_URL}${API_PREFIX}/files/${storagePath}`;
  }

  // ==================== Token Management ====================
  
  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }
  
  static setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }
  
  static clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

// Export singleton instance
export default ApiClient;
