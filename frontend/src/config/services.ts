/**
 * NotaKu Services Configuration
 * 
 * ✨ CLOUDFLARE TUNNEL - Public HTTPS Endpoints
 * All services are exposed via Cloudflare Tunnel for secure, public access
 * 
 * Backend Architecture:
 * - Integration Service: upload.notaku.cloud → 172.16.1.9:8005 (RTX 3090)
 * - RAG Service: api.notaku.cloud → 172.16.1.9:8000 (RTX 3090)
 * - OCR Service: Internal only (172.16.1.7:8001)
 * - Vision Service: Internal only (172.16.1.9:8002)
 * 
 * Benefits:
 * ✅ HTTPS secure connections
 * ✅ No mixed content errors
 * ✅ Public internet accessible
 * ✅ DDoS protection
 * ✅ Automatic SSL/TLS
 */

// Service URLs - Public HTTPS endpoints via Cloudflare Tunnel
const INTEGRATION_SERVICE_URL = process.env.NEXT_PUBLIC_INTEGRATION_URL || 'https://upload.notaku.cloud';
const RAG_SERVICE_URL = process.env.NEXT_PUBLIC_RAG_URL || 'https://api.notaku.cloud';
const COMPRESSION_SERVICE_URL = process.env.NEXT_PUBLIC_COMPRESSION_URL || 'https://compress.notaku.cloud';

// Legacy/Internal URLs (for reference - DO NOT USE DIRECTLY)
const OCR_SERVICE_URL = 'http://172.16.1.7:8001'; // Internal use only
const VISION_SERVICE_URL = 'http://172.16.1.9:8002'; // Internal use only

/**
 * API Configuration
 */
export const API_CONFIG = {
  /**
   * Integration Service - Handles upload pipeline
   * Flow: Upload → OCR → Vision → Structure Extraction → RAG Indexing
   */
  INTEGRATION: {
    BASE_URL: INTEGRATION_SERVICE_URL,
    ENDPOINTS: {
      // Receipt processing (complete pipeline)
      PROCESS_RECEIPT: '/api/v1/receipt/process',
      
      // Health check
      HEALTH: '/health',
      
      // Stats
      STATS: '/stats',
    }
  },
  
  /**
   * RAG Service - Handles chat/query
   * Powered by: Qwen 3.2 14B (vLLM) + Qdrant + BGE-M3 embeddings
   */
  RAG: {
    BASE_URL: RAG_SERVICE_URL,
    ENDPOINTS: {
      // Query endpoint (non-streaming)
      QUERY: '/query',
      
      // Query endpoint (streaming with SSE)
      QUERY_STREAM: '/query/stream',
      
      // Search endpoint (retrieve only, no LLM)
      SEARCH: '/search',
      
      // Health check
      HEALTH: '/health',
      
      // Collections management
      COLLECTIONS: '/collections',
      COLLECTION_INFO: '/collections/{name}',
      CREATE_COLLECTION: '/collections',
      DELETE_COLLECTION: '/collections/{name}',
      
      // Index management
      INDEX_RECEIPT: '/index/receipt',
      INDEX_BATCH: '/index/batch',
    }
  },
  
  /**
   * Compression Service - Optimizes images before upload
   * Reduces file size by 50-70% for faster uploads
   */
  COMPRESSION: {
    BASE_URL: COMPRESSION_SERVICE_URL,
    ENDPOINTS: {
      // Optimize image for upload (JPEG Q70, resize if needed)
      OPTIMIZE: '/api/optimize-for-upload',
      
      // General compression endpoint
      COMPRESS: '/api/compress',
      
      // Health check
      HEALTH: '/health',
    }
  }
} as const;

/**
 * Default query parameters for RAG
 */
export const RAG_DEFAULTS = {
  COLLECTION_NAME: 'receipts',
  TOP_K: 5,
  RERANK_TOP_K: 3,
  INCLUDE_CONTEXT: true,
} as const;

/**
 * Helper functions
 */

/**
 * Get full URL for Integration Service endpoint
 */
export function getIntegrationUrl(endpoint: keyof typeof API_CONFIG.INTEGRATION.ENDPOINTS): string {
  return `${API_CONFIG.INTEGRATION.BASE_URL}${API_CONFIG.INTEGRATION.ENDPOINTS[endpoint]}`;
}

/**
 * Get full URL for RAG Service endpoint
 */
export function getRAGUrl(endpoint: keyof typeof API_CONFIG.RAG.ENDPOINTS, params?: Record<string, string>): string {
  let url = `${API_CONFIG.RAG.BASE_URL}${API_CONFIG.RAG.ENDPOINTS[endpoint]}`;
  
  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });
  }
  
  return url;
}

/**
 * Get full URL for Compression Service endpoint
 */
export function getCompressionUrl(endpoint: keyof typeof API_CONFIG.COMPRESSION.ENDPOINTS): string {
  return `${API_CONFIG.COMPRESSION.BASE_URL}${API_CONFIG.COMPRESSION.ENDPOINTS[endpoint]}`;
}

/**
 * Check if Integration Service is available
 */
export async function checkIntegrationHealth(): Promise<boolean> {
  try {
    const response = await fetch(getIntegrationUrl('HEALTH'), {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('[Integration Service] Health check failed:', error);
    return false;
  }
}

/**
 * Check if RAG Service is available
 */
export async function checkRAGHealth(): Promise<boolean> {
  try {
    const response = await fetch(getRAGUrl('HEALTH'), {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error('[RAG Service] Health check failed:', error);
    return false;
  }
}

/**
 * Check if Compression Service is available
 */
export async function checkCompressionHealth(): Promise<boolean> {
  try {
    const response = await fetch(getCompressionUrl('HEALTH'), {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error('[Compression Service] Health check failed:', error);
    return false;
  }
}

/**
 * Export service URLs for direct access if needed
 */
export const SERVICE_URLS = {
  INTEGRATION: INTEGRATION_SERVICE_URL,
  RAG: RAG_SERVICE_URL,
  COMPRESSION: COMPRESSION_SERVICE_URL,
  // Internal services (reference only)
  OCR: OCR_SERVICE_URL,
  VISION: VISION_SERVICE_URL,
} as const;
