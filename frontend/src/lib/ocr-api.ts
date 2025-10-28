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
   * Upload receipt image for processing (SYNCHRONOUS)
   * 
   * ⚡ IMPORTANT: This is SYNCHRONOUS processing, NOT async!
   * - Single request - waits for complete result (~20-40 seconds)
   * - No job_id or polling needed
   * - Returns full result immediately when done
   * 
   * ✅ Pipeline: Upload → OCR → Vision → Structure → RAG Indexing
   * 
   * Expected response:
   * {
   *   success: true,
   *   receipt_id: "receipt_1761676565",  // NOT job_id!
   *   processing_time: "30.08s",
   *   results: {
   *     merchant: string,
   *     date: string,
   *     total: number,
   *     items_count: number,
   *     quality_score: number,
   *     merchant_type: string,
   *     items: [...],  // Full item list
   *   },
   *   indexed: true  // ← Confirms RAG indexing complete
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
   * @deprecated Integration Service is SYNCHRONOUS - no status polling needed
   * 
   * This method is kept for backward compatibility but should NOT be used.
   * The uploadReceipt() method now returns the complete result immediately.
   */
  static async checkStatus(jobId: string): Promise<JobStatus> {
    console.warn('[Integration API] ⚠️ checkStatus() is deprecated - Integration Service is synchronous');
    throw new Error(
      'Status polling not supported. Integration Service processes receipts synchronously. ' +
      'Use uploadReceipt() which returns the complete result.'
    );
  }

  /**
   * @deprecated Integration Service is SYNCHRONOUS - no result fetching needed
   * 
   * This method is kept for backward compatibility but should NOT be used.
   * The uploadReceipt() method now returns the complete result immediately.
   */
  static async getResult(jobId: string): Promise<OCRResult> {
    console.warn('[Integration API] ⚠️ getResult() is deprecated - Integration Service is synchronous');
    throw new Error(
      'Result fetching not supported. Integration Service processes receipts synchronously. ' +
      'Use uploadReceipt() which returns the complete result.'
    );
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
   * @deprecated Integration Service is SYNCHRONOUS - no polling needed
   * 
   * This method is kept for backward compatibility but should NOT be used.
   * The uploadReceipt() method now blocks until processing is complete (~20-40s).
   */
  static async pollStatus(
    jobId: string,
    onUpdate?: (status: JobStatus) => void,
    interval: number = 500,
    maxAttempts: number = 120
  ): Promise<JobStatus> {
    console.warn('[Integration API] ⚠️ pollStatus() is deprecated - Integration Service is synchronous');
    throw new Error(
      'Status polling not supported. Integration Service processes receipts synchronously. ' +
      'Use uploadReceipt() and wait for the result (~20-40 seconds).'
    );
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
