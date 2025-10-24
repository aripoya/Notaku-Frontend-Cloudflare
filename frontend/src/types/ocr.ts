// OCR API Types
export interface UploadResponse {
  job_id: string;
  status: string;
  message: string;
  uploaded_at: string;
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'started' | 'finished' | 'failed';
  progress?: string;
  created_at?: string;
  started_at?: string;
  ended_at?: string;
}

export interface ExtractedData {
  // Merchant/Store name (various possible field names)
  merchant?: string;
  merchant_name?: string;
  store?: string;
  store_name?: string;
  
  // Total amount (various possible field names)
  total_amount?: number;
  total?: number;
  grand_total?: number;
  amount?: number;
  
  // Date (various possible field names)
  date?: string;
  transaction_date?: string;
  receipt_date?: string;
  
  // Other fields
  category?: string;
  tax?: number;
  subtotal?: number;
  items?: any[];
  
  // Allow any other fields from backend
  [key: string]: any;
}

export interface OCRResult {
  job_id: string;
  status: string;
  receipt_id: string;
  ocr_text?: string;
  ocr_confidence?: number;
  line_count?: number;
  processing_time_ms?: number;
  extracted?: ExtractedData;
  error?: string;
}

export interface ClusterStats {
  workers: number;
  requests_per_second: number;
  active_jobs: number;
}
