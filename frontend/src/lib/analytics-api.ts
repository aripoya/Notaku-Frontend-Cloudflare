// Analytics API Client

import type {
  AnalyticsSummary,
  TrendResponse,
  CategoryResponse,
  MerchantResponse,
  TrendInterval,
} from "@/types/analytics";
import { API_BASE_URL, API_PREFIX } from "./api-config";

// Debug mode
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

// Custom Error Class
export class AnalyticsAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "AnalyticsAPIError";
  }
}

// Helper Functions
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
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

    throw new AnalyticsAPIError(
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
  params?: Record<string, string>,
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

  const url = buildUrl(endpoint, params);

  if (DEBUG) {
    console.log(`[Analytics API] GET ${url}`);
  }

  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (DEBUG) {
      console.error(`[Analytics API Error] ${endpoint}:`, error);
    }
    throw error;
  }
}

// Analytics API Client Class
export class AnalyticsAPI {
  /**
   * Get analytics summary for a date range
   */
  static async getSummary(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsSummary> {
    return request<AnalyticsSummary>(`${API_PREFIX}/analytics/summary`, {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get spending trend data
   */
  static async getTrend(
    userId: string,
    startDate: string,
    endDate: string,
    interval: TrendInterval = "daily"
  ): Promise<TrendResponse> {
    return request<TrendResponse>(`${API_PREFIX}/analytics/trend`, {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      interval,
    });
  }

  /**
   * Get spending by category
   */
  static async getByCategory(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<CategoryResponse> {
    return request<CategoryResponse>(`${API_PREFIX}/analytics/by-category`, {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get top merchants
   */
  static async getTopMerchants(
    userId: string,
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<MerchantResponse> {
    return request<MerchantResponse>(`${API_PREFIX}/analytics/top-merchants`, {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      limit: limit.toString(),
    });
  }

  /**
   * Get all analytics data at once (for efficiency)
   */
  static async getAllData(
    userId: string,
    startDate: string,
    endDate: string,
    interval: TrendInterval = "daily"
  ): Promise<{
    summary: AnalyticsSummary;
    trend: TrendResponse;
    categories: CategoryResponse;
    merchants: MerchantResponse;
  }> {
    // Fetch all data in parallel
    const [summary, trend, categories, merchants] = await Promise.all([
      this.getSummary(userId, startDate, endDate),
      this.getTrend(userId, startDate, endDate, interval),
      this.getByCategory(userId, startDate, endDate),
      this.getTopMerchants(userId, startDate, endDate, 10),
    ]);

    return { summary, trend, categories, merchants };
  }
}

// Export singleton instance
export default AnalyticsAPI;
