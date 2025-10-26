// Receipts API Client

import type { Receipt, ReceiptUpdateData } from "@/types/receipt";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
  static async createReceipt(data: ReceiptUpdateData & { user_id: string; ocr_text?: string; ocr_confidence?: number; image_path?: string; image_base64?: string }): Promise<Receipt> {
    console.log('[ReceiptsAPI] 📝 Creating new receipt');
    console.log('[ReceiptsAPI] API_BASE_URL:', API_BASE_URL);
    console.log('[ReceiptsAPI] Full URL:', `${API_BASE_URL}${API_PREFIX}/receipts`);
    console.log('[ReceiptsAPI] Original frontend data:', {
      ...data,
      image_base64: data.image_base64 ? `${data.image_base64.substring(0, 50)}... (${data.image_base64.length} chars)` : undefined
    });
    
    // ✅ CRITICAL FIX: Send image_base64 to backend, NOT blob URL
    const backendData: any = {
      merchant_name: data.merchant,           // merchant → merchant_name
      transaction_date: data.date,            // date → transaction_date
      total_amount: data.total_amount,        // ✅ same
      currency: "IDR",                        // ✅ add currency
      category: data.category || null,        // ✅ same
      notes: data.notes || null,              // ✅ same
      user_id: data.user_id,                  // ✅ same
      ocr_text: data.ocr_text || "",          // ✅ same
      ocr_confidence: data.ocr_confidence || 0, // ✅ same
    };
    
    // ✅ Send image_base64 if available (backend will save to storage)
    if (data.image_base64) {
      backendData.image_base64 = data.image_base64;
      console.log('[ReceiptsAPI] ✅ Sending image_base64 to backend');
    }
    
    // ❌ DO NOT send image_path if it's a blob URL
    if (data.image_path && !data.image_path.startsWith('blob:')) {
      backendData.image_path = data.image_path;
      console.log('[ReceiptsAPI] ✅ Sending image_path:', data.image_path);
    } else if (data.image_path?.startsWith('blob:')) {
      console.warn('[ReceiptsAPI] ⚠️ SKIPPING blob URL image_path:', data.image_path);
    }
    
    console.log('[ReceiptsAPI] ✅ Mapped to backend format (without base64):', {
      ...backendData,
      image_base64: backendData.image_base64 ? '[BASE64 DATA]' : undefined
    });
    
    const response = await request<any>(`${API_PREFIX}/receipts`, {
      method: "POST",
      body: JSON.stringify(backendData),
    });
    
    console.log('[ReceiptsAPI] Backend response:', response);
    
    // ✅ MAP BACKEND RESPONSE BACK TO FRONTEND FORMAT
    const mappedReceipt: Receipt = {
      ...response,
      merchant: response.merchant_name || response.merchant,     // merchant_name → merchant
      date: response.transaction_date || response.date,          // transaction_date → date
    };
    
    console.log('[ReceiptsAPI] ✅ Mapped response to frontend format:', mappedReceipt);
    
    return mappedReceipt;
  }

  /**
   * Update a receipt
   */
  static async updateReceipt(
    receiptId: string,
    data: ReceiptUpdateData
  ): Promise<Receipt> {
    console.log('[ReceiptsAPI] 🔄 Updating receipt');
    console.log('[ReceiptsAPI] Receipt ID:', receiptId);
    console.log('[ReceiptsAPI] API_BASE_URL:', API_BASE_URL);
    console.log('[ReceiptsAPI] Full URL:', `${API_BASE_URL}${API_PREFIX}/receipts/${receiptId}`);
    console.log('[ReceiptsAPI] Original frontend data:', data);
    
    if (!receiptId || receiptId === 'undefined') {
      console.error('[ReceiptsAPI] ❌ ERROR: Invalid receiptId:', receiptId);
      throw new ReceiptsAPIError('Invalid receipt ID', 400, 'INVALID_ID');
    }
    
    // ✅ MAP FRONTEND FIELDS TO BACKEND FIELDS
    const backendData = {
      merchant_name: data.merchant,           // merchant → merchant_name
      transaction_date: data.date,            // date → transaction_date
      total_amount: data.total_amount,        // ✅ same
      currency: "IDR",                        // ✅ add currency
      category: data.category || null,        // ✅ same
      notes: data.notes || null,              // ✅ same
    };
    
    console.log('[ReceiptsAPI] ✅ Mapped to backend format:', backendData);
    console.log('[ReceiptsAPI] Backend data JSON:', JSON.stringify(backendData, null, 2));
    
    const response = await request<any>(`${API_PREFIX}/receipts/${receiptId}`, {
      method: "PUT",
      body: JSON.stringify(backendData),
    });
    
    console.log('[ReceiptsAPI] Backend response:', response);
    
    // ✅ MAP BACKEND RESPONSE BACK TO FRONTEND FORMAT
    const mappedReceipt: Receipt = {
      ...response,
      merchant: response.merchant_name || response.merchant,     // merchant_name → merchant
      date: response.transaction_date || response.date,          // transaction_date → date
    };
    
    console.log('[ReceiptsAPI] ✅ Mapped response to frontend format:', mappedReceipt);
    
    return mappedReceipt;
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
   * Get all receipts for a user
   */
  static async getReceipts(
    userId: string,
    params?: {
      limit?: number;
      offset?: number;
      category?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{ receipts: Receipt[]; total: number }> {
    const queryParams = new URLSearchParams();
    queryParams.append("user_id", userId);
    
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.category) queryParams.append("category", params.category);
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);

    return request<{ receipts: Receipt[]; total: number }>(
      `${API_PREFIX}/receipts?${queryParams.toString()}`
    );
  }
}

// Export singleton instance
export default ReceiptsAPI;
