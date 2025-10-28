// OCR API Client - Now uses Integration Service
import { UploadResponse, JobStatus, OCRResult, ClusterStats } from '@/types/ocr';
import { getIntegrationUrl, API_CONFIG } from '@/config/services';

// ⚠️ IMPORTANT: Now uses Integration Service (not OCR directly)
// Integration Service URL - handles complete pipeline:
// Upload → OCR → Vision → Structure Extraction → RAG Indexing
// ✨ Public HTTPS endpoint via Cloudflare Tunnel
const INTEGRATION_URL = process.env.NEXT_PUBLIC_INTEGRATION_URL || 'https://upload.notaku.cloud';

// Legacy URLs (DO NOT USE - for reference only)
// const OCR_BASE_URL = 'http://172.16.1.7:8001'; // Old internal OCR
// const OLD_INTEGRATION_URL = 'http://172.16.1.9:8005'; // Old private IP

// Helper function to handle fetch errors
async function handleFetchError(error: any, endpoint: string): Promise<never> {
  console.error(`[Integration API] ❌ Error on ${endpoint}:`, error);
  console.error(`[Integration API] Integration URL:`, INTEGRATION_URL);
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new Error(
      `Cannot connect to Integration Service at ${INTEGRATION_URL}. ` +
      `Please check if Cloudflare Tunnel is active and the service is accessible.`
    );
  }
  
  throw error;
}

export class OCRApiClient {
  /**
   * Upload receipt image for processing
   * 
   * ✅ NEW: Uses Integration Service for complete pipeline:
   * - Upload → OCR extraction
   * - Vision analysis (merchant type, quality score)
   * - Structure extraction (items, totals)
   * - RAG indexing (makes receipt searchable in chat)
   * 
   * Expected response:
   * {
   *   success: true,
   *   receipt_id: "receipt_1761676565",
   *   processing_time: "30.08s",
   *   results: { merchant, date, total, items_count, quality_score },
   *   indexed: true  // ← Confirms data is in RAG
   * }
   */
  static async uploadReceipt(file: File, userId?: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userId) {
        formData.append('user_id', userId);
      }

      // ✅ Use Integration Service endpoint
      const uploadUrl = `${INTEGRATION_URL}/api/v1/receipt/process`;
      console.log(`[Integration API] 🚀 Processing receipt via Integration Service`);
      console.log(`[Integration API] URL: ${uploadUrl}`);
      console.log(`[Integration API] File: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        console.error(`[Integration API] ❌ Upload failed:`, error);
        throw new Error(error.message || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[Integration API] ✅ Receipt processed successfully`);
      console.log(`[Integration API] Receipt ID: ${result.receipt_id}`);
      console.log(`[Integration API] Indexed in RAG: ${result.indexed}`);
      console.log(`[Integration API] Processing time: ${result.processing_time}`);
      
      // ⚠️ Verify RAG indexing
      if (!result.indexed) {
        console.warn(`[Integration API] ⚠️ WARNING: Receipt not indexed in RAG!`);
        console.warn(`[Integration API] Chat will not be able to answer questions about this receipt`);
      }
      
      return result;
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

      // Note: Premium OCR might have different endpoint
      // For now, using same Integration Service endpoint
      const uploadUrl = `${INTEGRATION_URL}/api/v1/receipt/process`;
      
      console.log(`[Integration API] 🚀 Uploading to Premium Processing: ${uploadUrl}`);
      
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
      // Note: Status endpoint may need to be updated based on Integration Service API
      const statusUrl = `${INTEGRATION_URL}/api/v1/receipt/status/${jobId}`;
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
      // Note: Result endpoint may need to be updated based on Integration Service API
      const resultUrl = `${INTEGRATION_URL}/api/v1/receipt/result/${jobId}`;
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
   * Health check - Integration Service
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const healthUrl = `${INTEGRATION_URL}/health`;
      console.log(`[Integration API] 🏥 Health check: ${healthUrl}`);
      
      const response = await fetch(healthUrl);

      if (!response.ok) {
        throw new Error('Integration Service unavailable');
      }

      const result = await response.json();
      console.log(`[Integration API] ✅ Service healthy:`, result);
      return result;
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

/**
 * Get Integration Service stats
 */
export async function getStats() {
  const statsUrl = `${INTEGRATION_URL}/stats`;
  console.log(`[Integration API] 📊 Fetching stats: ${statsUrl}`);
  
  const response = await fetch(statsUrl);
  if (!response.ok) throw new Error('Failed to fetch stats');
  
  const stats = await response.json();
  console.log(`[Integration API] Stats:`, stats);
  return stats;
}
