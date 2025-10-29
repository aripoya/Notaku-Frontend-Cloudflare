// Subscription API Client

import type {
  QuotaResponse,
  QuotaInfo,
  PermissionResponse,
  PermissionResult,
  AIPermissionResponse,
  AIPermissionResult,
  TiersResponse,
  CheckPermissionRequest,
} from "@/types/subscription";
import { SubscriptionTier, SubscriptionStatus } from "@/types/subscription";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_VERSION = "v1";
const API_PREFIX = `/api/${API_VERSION}`;

// Debug mode
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

// Custom Error Class
export class SubscriptionAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "SubscriptionAPIError";
  }
}

// Helper Functions
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function buildUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
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

    throw new SubscriptionAPIError(
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

  const url = buildUrl(endpoint);

  if (DEBUG) {
    console.log(`[Subscription API] ${options.method || "GET"} ${url}`);
  }

  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (DEBUG) {
      console.error(`[Subscription API Error] ${endpoint}:`, error);
    }
    throw error;
  }
}

// Subscription API Client Class
export class SubscriptionAPI {
  /**
   * Get all subscription tiers
   */
  static async getTiers(): Promise<TiersResponse> {
    return request<TiersResponse>(`${API_PREFIX}/subscription/tiers`, {
      method: "GET",
    });
  }

  /**
   * Get user quota information
   * 
   * ❌ TEMPORARILY DISABLED: Quota endpoint not available yet
   * Returns mock data until backend is ready
   */
  static async getQuota(userId: string): Promise<QuotaInfo> {
    console.log('[Subscription API] ⚠️ Quota endpoint not available - returning mock data');
    
    // Return mock quota data
    return {
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.ACTIVE,
      monthly_limit: 10,
      used: 0,
      remaining: 10,
      can_use_ai_premium: false,
      ai_queries_limit: 50,
      ai_queries_used: 0,
      total_cost: 0,
      price: 0,
    };
    
    /* DISABLED UNTIL BACKEND READY:
    const response = await request<QuotaResponse>(
      `${API_PREFIX}/subscription/quota/${userId}`,
      {
        method: "GET",
      }
    );
    return response.quota;
    */
  }

  /**
   * Check OCR permission before upload
   * 
   * ❌ TEMPORARILY DISABLED: Permission endpoint not available yet
   * Always allows uploads until backend is ready
   */
  static async checkOCRPermission(
    userId: string,
    provider: "paddle" | "google"
  ): Promise<PermissionResult> {
    console.log('[Subscription API] ⚠️ Permission check not available - allowing upload');
    
    // Always allow for now
    return {
      allowed: true,
      message: 'Permission check temporarily disabled - allowing all uploads',
    };
    
    /* DISABLED UNTIL BACKEND READY:
    const body: CheckPermissionRequest = {
      user_id: userId,
      provider,
    };

    const response = await request<PermissionResponse>(
      `${API_PREFIX}/subscription/check-permission`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    return response.permission;
    */
  }

  /**
   * Check AI permission before sending chat message
   * 
   * ❌ TEMPORARILY DISABLED: AI permission endpoint not available yet
   * Always allows chat until backend is ready
   */
  static async checkAIPermission(userId: string): Promise<AIPermissionResult> {
    console.log('[Subscription API] ⚠️ AI permission check not available - allowing chat');
    
    // Always allow for now
    return {
      allowed: true,
      remaining: 999,
      message: 'AI permission check temporarily disabled - allowing all queries',
    };
    
    /* DISABLED UNTIL BACKEND READY:
    const response = await request<AIPermissionResponse>(
      `${API_PREFIX}/subscription/ai-permission/${userId}`,
      {
        method: "GET",
      }
    );

    return response.permission;
    */
  }

  /**
   * Helper: Check if user can use AI Premium
   */
  static async canUseGoogleVision(userId: string): Promise<boolean> {
    try {
      const quota = await this.getQuota(userId);
      return quota.can_use_ai_premium;
    } catch (error) {
      console.error("[Subscription API] Error checking AI Premium access:", error);
      return false;
    }
  }

  /**
   * Helper: Get remaining receipts count
   */
  static async getRemainingReceipts(userId: string): Promise<number> {
    try {
      const quota = await this.getQuota(userId);
      return quota.remaining;
    } catch (error) {
      console.error("[Subscription API] Error getting remaining receipts:", error);
      return 0;
    }
  }

  /**
   * Helper: Get remaining AI queries
   */
  static async getRemainingAIQueries(userId: string): Promise<number> {
    try {
      const quota = await this.getQuota(userId);
      return quota.ai_queries_limit - quota.ai_queries_used;
    } catch (error) {
      console.error("[Subscription API] Error getting remaining AI queries:", error);
      return 0;
    }
  }
}

// Export singleton instance
export default SubscriptionAPI;
