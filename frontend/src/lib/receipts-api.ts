// Receipts API Client

import type { Receipt, ReceiptUpdateData } from "@/types/receipt";

// API Configuration
const API_BASE_URL = "https://backend.notaku.cloud";
const API_VERSION = "v1";
const API_PREFIX = `/api/${API_VERSION}`;

// Debug mode
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

// Custom Error Class
export class ReceiptsAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ReceiptsAPIError";
  }
}

// Helper Functions
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
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
      console.error('[Receipts API] 401 Unauthorized - clearing token and redirecting to login');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        window.location.href = '/login?error=session_expired';
      }
    }

    throw new ReceiptsAPIError(
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
  options: RequestInit = {},
  timeoutMs: number = 30000 // ✅ 30 second timeout
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // ✅ Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
    mode: "cors",
    signal: controller.signal, // ✅ Add abort signal
  };

  const url = `${API_BASE_URL}${endpoint}`;

  if (DEBUG) {
    console.log(`[Receipts API] ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log(`[Receipts API] Body:`, JSON.parse(options.body as string));
    }
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId); // ✅ Clear timeout if successful
    return handleResponse<T>(response);
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // ✅ Handle timeout
    if (error.name === 'AbortError') {
      console.error(`[Receipts API] ⏱️ Request timeout after ${timeoutMs}ms:`, endpoint);
      throw new ReceiptsAPIError(
        `Request timeout. Server tidak merespons dalam ${timeoutMs / 1000} detik.`,
        408,
        'TIMEOUT'
      );
    }
    
    if (DEBUG) {
      console.error(`[Receipts API Error] ${endpoint}:`, error);
    }
    throw error;
  }
}

// Receipts API Client Class
export class ReceiptsAPI {
  /**
   * Get a single receipt by ID
   */
  static async getReceipt(receiptId: string): Promise<Receipt> {
    return request<Receipt>(`${API_PREFIX}/receipts/${receiptId}`);
  }

  /**
   * Create a new receipt
   */
  static async createReceipt(data: { merchant_name: string; total_amount: number; currency?: string; transaction_date: string; category?: string; notes?: string; }): Promise<Receipt> {
    console.log('[ReceiptsAPI] 📝 Creating new receipt');
    console.log('[ReceiptsAPI] API_BASE_URL:', API_BASE_URL);
    console.log('[ReceiptsAPI] Full URL:', `${API_BASE_URL}${API_PREFIX}/receipts`);
    console.log('[ReceiptsAPI] Request data:', data);
    
    const response = await request<Receipt>(`${API_PREFIX}/receipts`, {
      method: "POST",
      body: JSON.stringify({
        ...data,
        currency: data.currency || "IDR",
      }),
    });
    
    console.log('[ReceiptsAPI] ✅ Receipt created:', response);
    return response;
  }

  /**
   * Update a receipt
   */
  static async updateReceipt(
    receiptId: string,
    data: { merchant_name?: string; total_amount?: number; transaction_date?: string; category?: string; notes?: string; }
  ): Promise<Receipt> {
    console.log('[ReceiptsAPI] 🔄 Updating receipt');
    console.log('[ReceiptsAPI] Receipt ID:', receiptId);
    console.log('[ReceiptsAPI] Request data:', data);
    
    if (!receiptId || receiptId === 'undefined') {
      console.error('[ReceiptsAPI] ❌ ERROR: Invalid receiptId:', receiptId);
      throw new ReceiptsAPIError('Invalid receipt ID', 400, 'INVALID_ID');
    }
    
    const response = await request<Receipt>(`${API_PREFIX}/receipts/${receiptId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    
    console.log('[ReceiptsAPI] ✅ Receipt updated:', response);
    return response;
  }

  /**
   * Delete a receipt
   */
  static async deleteReceipt(receiptId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `${API_PREFIX}/receipts/${receiptId}`,
      {
        method: "DELETE",
      }
    );
  }

  /**
   * Get all receipts for current user
   */
  static async getReceipts(
    params?: {
      limit?: number;
      offset?: number;
      category?: string;
      start_date?: string;
      end_date?: string;
      search?: string;
    }
  ): Promise<{ receipts: Receipt[]; total: number; has_more: boolean }> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.category) queryParams.append("category", params.category);
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);
    if (params?.search) queryParams.append("search", params.search);

    return request<{ receipts: Receipt[]; total: number; has_more: boolean }>(
      `${API_PREFIX}/receipts?${queryParams.toString()}`
    );
  }
}

// Export singleton instance
export default ReceiptsAPI;
