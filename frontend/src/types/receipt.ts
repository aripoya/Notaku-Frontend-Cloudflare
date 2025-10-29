// Receipt Types for Edit Form

export interface Receipt {
  id: string;
  user_id: string;
  merchant: string | null;
  total_amount: number | null;
  date: string | null;
  category?: string | null;
  notes?: string | null;
  ocr_text: string;
  ocr_confidence: number;
  ocr_data?: any;
  image_path: string;
  image_base64?: string; // ✅ For sending to backend (not stored in DB)
  items?: any[]; // ✅ Items array from OCR extraction
  is_edited: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ReceiptUpdateData {
  merchant: string;
  total_amount: number;
  date: string;
  category?: string | null;
  notes?: string | null;
}

export interface ReceiptCreateData extends ReceiptUpdateData {
  user_id: string;
  ocr_text: string;
  ocr_confidence: number;
  image_path?: string; // ✅ Optional - backend will generate if image_base64 provided
  image_base64?: string; // ✅ Send base64 image to backend
}

export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Utilities',
  'Education',
  'Groceries',
  'Office Supplies',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

// Helper to format currency
export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper to parse currency input
export function parseCurrency(value: string): number {
  // Remove all non-digit characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
}

// Helper to format date for input
export function formatDateForInput(date: string | null): string {
  if (!date) return new Date().toISOString().split('T')[0];
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Helper to format date for display
export function formatDateDisplay(date: string | null): string {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}
