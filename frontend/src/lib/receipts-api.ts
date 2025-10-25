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
  options: RequestInit = {}
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

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
    mode: "cors",
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
    return handleResponse<T>(response);
  } catch (error) {
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
   * Update a receipt
   */
  static async updateReceipt(
    receiptId: string,
    data: ReceiptUpdateData
  ): Promise<Receipt> {
    return request<Receipt>(`${API_PREFIX}/receipts/${receiptId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
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
