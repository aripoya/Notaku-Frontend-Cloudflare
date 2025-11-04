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
import { API_BASE_URL, API_PREFIX } from "./api-config";

// Debug mode
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

// Token storage key
const TOKEN_KEY = "auth_token";

// Request Configuration (default)
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

const REQUEST_CONFIG: RequestInit = {
  credentials: "include", // default: kirim cookie utk same-origin / backend kita
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
        errorMessage =
          errorData.message ||
          errorData.error ||
          errorData.detail ||
          errorMessage;
        errorDetails = errorData.details;
      } catch {
        // ignore
      }
    }

    if (response.status === 401) {
      console.error(
        "[API] 401 Unauthorized - clearing token and redirecting to login"
      );
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("current_user");
        window.location.href = "/login?error=session_expired";
      }
    }

    throw new ApiClientError(
      errorMessage,
      response.status,
      response.status.toString(),
      errorDetails
    );
  }

  if (isJson) return response.json();
  return response.text() as unknown as T;
}

/**
 * Unified request helper
 * - params: query string
 * - withCredentials: override default credentials behavior (omit/include)
 * - Skip Content-Type for FormData
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, any>,
  extra?: { withCredentials?: boolean }
): Promise<T> {
  // Resolve token preference: NextAuth session accessToken > localStorage
  let token: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const sessionResp = await fetch('/api/auth/session');
      if (sessionResp.ok) {
        const sess = await sessionResp.json().catch(() => null);
        token = sess?.accessToken || null;
      }
    } catch (_) {
      // Ignore and fallback to localStorage
    }
    if (!token) {
      token = localStorage.getItem(TOKEN_KEY);
    }
  }

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : (DEFAULT_HEADERS as Record<string, string>)),
    ...(options.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  console.log("API Request Headers:", token);

  const config: RequestInit = {
    ...REQUEST_CONFIG,
    ...options,
    headers,
    // IMPORTANT: allow per-request override to avoid CORS issue with wildcard
    credentials:
      extra?.withCredentials === false
        ? "omit"
        : options.credentials ?? REQUEST_CONFIG.credentials,
  };

  const url = buildUrl(endpoint, params);

  if (DEBUG) {
    console.log(
      `[API] ${config.method || "GET"} ${url} ${
        extra?.withCredentials === false ? "(omit creds)" : ""
      }`
    );
  }

  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (DEBUG) console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// API Client Class
export class ApiClient {
  // ==================== Health & System ====================

  /**
   * NOTE: withCredentials=false to bypass CORS wildcard issue on Cloudflare/3rd-party
   * (tidak kirim cookie/sesi)
   */
  static async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/health", { method: "GET" }, undefined, {
      withCredentials: false,
    });
  }

  static async getSystemInfo(): Promise<SystemInfo> {
    return request<SystemInfo>("/", { method: "GET" });
  }

  static async getApiInfo(): Promise<ApiInfo> {
    return request<ApiInfo>(`${API_PREFIX}/info`, { method: "GET" });
  }

  // ==================== Authentication ====================

  static async register(data: UserRegistration): Promise<AuthResponse> {
    const response = await request<AuthResponse>(
      `${API_PREFIX}/auth/register`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (response.token && typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem("current_user", JSON.stringify(response.user));
    }

    return response;
  }

  static async login(data: UserLogin): Promise<AuthResponse> {
    const response = await request<AuthResponse>(`${API_PREFIX}/auth/login`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.token && typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem("current_user", JSON.stringify(response.user));
    }

    return response;
  }

  static async logout(): Promise<ApiResponse> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("current_user");
      localStorage.removeItem("mock_user");
    }
    return { success: true, message: "Logout successful" };
  }

  static async getCurrentUser(): Promise<User> {
    console.log('[Auth] Resolving current user (session preferred)');
    // Prefer NextAuth session user
    if (typeof window !== 'undefined') {
      try {
        const resp = await fetch('/api/auth/session');
        if (resp.ok) {
          const sess = await resp.json();
          if (sess?.user) {
            return sess.user as User;
          }
        }
      } catch (_) {
        // ignore
      }
      // Fallback to stored user
      const stored = localStorage.getItem('current_user');
      if (stored) {
        try {
          return JSON.parse(stored) as User;
        } catch (_) {
          // ignore parse error and continue
        }
      }

      // Legacy mock_user fallback
      const legacy = localStorage.getItem('mock_user');
      if (legacy) {
        try {
          const mockUser = JSON.parse(legacy);
          const convertedUser: User = {
            id: mockUser.id || mockUser.user_id || mockUser.sub || '',
            email: mockUser.email || '',
            name:
              mockUser.preferred_name ||
              mockUser.full_name ||
              mockUser.name ||
              mockUser.username ||
              mockUser.email ||
              'User',
            subscription_tier: mockUser.subscription_tier || mockUser.tier || 'free',
            businessName: mockUser.businessName || mockUser.business_name || null,
          };

          localStorage.setItem('current_user', JSON.stringify(convertedUser));
          localStorage.removeItem('mock_user');
          return convertedUser;
        } catch (_) {
          // ignore parse error and continue
        }
      }
    }

    throw new ApiClientError('Not authenticated', 401);
  }

  static async refreshToken(): Promise<AuthResponse> {
    console.log('[Auth] ⚠️ Token refresh not implemented yet');

    // For now, return the current user with existing token
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

  static async getNotes(
    params?: NoteQueryParams
  ): Promise<PaginatedResponse<Note>> {
    return request<PaginatedResponse<Note>>(
      `${API_PREFIX}/notes`,
      { method: "GET" },
      params
    );
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

  static async updateNote(
    noteId: string,
    data: UpdateNoteInput
  ): Promise<Note> {
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

  static async getReceipts(
    params?: ReceiptQueryParams
  ): Promise<ReceiptsResponse> {
    return request<ReceiptsResponse>(
      `${API_PREFIX}/receipts`,
      { method: "GET" },
      params
    );
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

  static async updateReceipt(
    receiptId: string,
    data: UpdateReceiptInput
  ): Promise<Receipt> {
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
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
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
          } catch {
            reject(
              new ApiClientError(`Upload failed: ${xhr.statusText}`, xhr.status)
            );
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new ApiClientError("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new ApiClientError("Upload aborted"));
      });

      xhr.open("POST", buildUrl(`${API_PREFIX}/receipts/upload`));
      xhr.withCredentials = true;
      xhr.send(formData);
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
          } catch {
            reject(new ApiClientError("Invalid JSON response", xhr.status));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(
              new ApiClientError(
                errorData.message || "Upload failed",
                xhr.status
              )
            );
          } catch {
            reject(
              new ApiClientError(`Upload failed: ${xhr.statusText}`, xhr.status)
            );
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
      const token =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

      const headers: Record<string, string> = {
        Accept: "text/event-stream, application/json",
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Jika endpoint ini ke domain yang balas CORS wildcard (*), dan kamu tidak butuh cookie,
      // set credentials: "omit" untuk lolos CORS.
      const response = await fetch(buildUrl(`${API_PREFIX}/chat`), {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: "include", // ganti ke "omit" jika target pakai wildcard CORS
      });

      if (!response.ok) {
        throw new ApiClientError(
          `HTTP Error ${response.status}`,
          response.status
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new ApiClientError("No response body");

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
          } catch {
            reject(new ApiClientError("Invalid JSON response", xhr.status));
          }
        } else {
          reject(
            new ApiClientError(`Upload failed: ${xhr.statusText}`, xhr.status)
          );
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
