// OCR API Client
import { UploadResponse, JobStatus, OCRResult, ClusterStats } from '@/types/ocr';

// OCR API Base URL
// Development: Use empty string to leverage Next.js rewrites (no CORS issues)
// Production: Use full URL from environment variable
const isDevelopment = process.env.NODE_ENV === 'development';
const OCR_BASE_URL = isDevelopment 
  ? '' // Use Next.js proxy in development
  : (process.env.NEXT_PUBLIC_OCR_API_URL || 'http://172.16.1.7:8001');

// Helper function to handle fetch errors
async function handleFetchError(error: any, endpoint: string): Promise<never> {
  console.error(`[OCR API] Error on ${endpoint}:`, error);
  console.error(`[OCR API] OCR_BASE_URL:`, OCR_BASE_URL);
  console.error(`[OCR API] isDevelopment:`, isDevelopment);
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    const displayUrl = OCR_BASE_URL || 'Next.js proxy (/api/ocr)';
    throw new Error(`Cannot connect to OCR service at ${displayUrl}. Please check if the service is running and accessible.`);
  }
  
  throw error;
}

export class OCRApiClient {
  /**
   * Upload receipt image for OCR processing (Standard)
   */
  static async uploadReceipt(file: File, userId?: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userId) {
        formData.append('user_id', userId);
      }

      const uploadUrl = OCR_BASE_URL ? `${OCR_BASE_URL}/api/v1/ocr/upload` : '/api/ocr/upload';
      console.log(`[OCR API] Uploading to ${uploadUrl}`);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || `Upload failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return handleFetchError(error, 'upload');
    }
  }

  /**
   * Upload receipt image for Premium OCR processing (Google Vision)
   * Requires premium subscription
   */
  static async uploadPremiumReceipt(file: File, token?: string): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadUrl = OCR_BASE_URL 
        ? `${OCR_BASE_URL}/api/v1/ocr/premium/upload` 
        : '/api/ocr/premium/upload';
      
      console.log(`[OCR API] Uploading to Premium OCR: ${uploadUrl}`);
      
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // Include cookies for auth
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Premium OCR upload failed' }));
        
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error('Premium subscription required. Please upgrade your account to use Premium OCR.');
        }
        
        throw new Error(error.message || error.detail || `Premium OCR failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[OCR API] Premium OCR result:', result);
      
      return result;
    } catch (error) {
      return handleFetchError(error, 'premium-upload');
    }
  }

  /**
   * Check OCR job status
   */
  static async checkStatus(jobId: string): Promise<JobStatus> {
    try {
      const statusUrl = OCR_BASE_URL ? `${OCR_BASE_URL}/api/v1/ocr/status/${jobId}` : `/api/ocr/status/${jobId}`;
      const response = await fetch(statusUrl);

      if (!response.ok) {
        throw new Error(`Failed to check status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return handleFetchError(error, 'checkStatus');
    }
  }

  /**
   * Get OCR result
   */
  static async getResult(jobId: string): Promise<OCRResult> {
    try {
      const resultUrl = OCR_BASE_URL ? `${OCR_BASE_URL}/api/v1/ocr/result/${jobId}` : `/api/ocr/result/${jobId}`;
      const response = await fetch(resultUrl);

      if (!response.ok) {
        throw new Error(`Failed to get result: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      return handleFetchError(error, 'getResult');
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const healthUrl = OCR_BASE_URL ? `${OCR_BASE_URL}/health` : '/api/ocr-health';
      const response = await fetch(healthUrl);

      if (!response.ok) {
        throw new Error('OCR service unavailable');
      }

      return await response.json();
    } catch (error) {
      return handleFetchError(error, 'healthCheck');
    }
  }

  /**
   * Poll status until finished or failed
   */
  static async pollStatus(
    jobId: string,
    onUpdate?: (status: JobStatus) => void,
    interval: number = 500,
    maxAttempts: number = 120 // 60 seconds with 500ms interval
  ): Promise<JobStatus> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const poll = async () => {
        try {
          attempts++;
          
          if (attempts > maxAttempts) {
            reject(new Error('OCR processing timeout. The job is taking too long. Please try again or contact support.'));
            return;
          }
          
          const status = await this.checkStatus(jobId);
          
          if (onUpdate) {
            onUpdate(status);
          }

          if (status.status === 'finished' || status.status === 'failed') {
            resolve(status);
          } else if (status.status === 'queued' && attempts > 20) {
            // If still queued after 10 seconds, show warning
            console.warn(`[OCR] Job still queued after ${attempts * interval}ms`);
            setTimeout(poll, interval);
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export async function getStats() {
  const response = await fetch(`${OCR_BASE_URL}/api/v1/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return await response.json();
}
