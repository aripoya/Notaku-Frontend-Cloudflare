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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.notaku.cloud";
const API_VERSION = "v1";
const API_PREFIX = `/api/${API_VERSION}`;

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
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData.details;
      } catch (e) {
        // Ignore JSON parse errors
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
  const config: RequestInit = {
    ...REQUEST_CONFIG,
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  };
  
  const url = buildUrl(endpoint);
  const response = await fetch(url, config);
  return handleResponse<T>(response);
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
    return request<AuthResponse>(`${API_PREFIX}/auth/register`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  
  static async login(data: UserLogin): Promise<AuthResponse> {
    return request<AuthResponse>(`${API_PREFIX}/auth/login`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  
  static async logout(): Promise<ApiResponse> {
    return request<ApiResponse>(`${API_PREFIX}/auth/logout`, {
      method: "POST",
    });
  }
  
  static async getCurrentUser(): Promise<User> {
    return request<User>(`${API_PREFIX}/auth/me`);
  }
  
  static async refreshToken(): Promise<AuthResponse> {
    return request<AuthResponse>(`${API_PREFIX}/auth/refresh`, {
      method: "POST",
    });
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
  
  static async getReceipts(params?: ReceiptQueryParams): Promise<PaginatedResponse<Receipt>> {
    const endpoint = `${API_PREFIX}/receipts`;
    const url = buildUrl(endpoint, params);
    const response = await fetch(url, {
      ...REQUEST_CONFIG,
      headers: DEFAULT_HEADERS,
    });
    return handleResponse<PaginatedResponse<Receipt>>(response);
  }
  
  static async getReceipt(receiptId: string): Promise<Receipt> {
    return request<Receipt>(`${API_PREFIX}/receipts/${receiptId}`);
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
  
  static async updateReceipt(receiptId: string, data: Partial<Receipt>): Promise<Receipt> {
    return request<Receipt>(`${API_PREFIX}/receipts/${receiptId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
  
  static async deleteReceipt(receiptId: string): Promise<ApiResponse> {
    return request<ApiResponse>(`${API_PREFIX}/receipts/${receiptId}`, {
      method: "DELETE",
    });
  }
  
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
      const response = await fetch(buildUrl(`${API_PREFIX}/chat/stream`), {
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
}

// Export singleton instance
export default ApiClient;
