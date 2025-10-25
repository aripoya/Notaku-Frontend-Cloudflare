// Analytics Types

export interface AnalyticsSummary {
  total_spending: number;
  total_receipts: number;
  average_per_transaction: number;
  biggest_expense: {
    merchant: string;
    amount: number;
    date: string;
  };
}

export interface TrendDataPoint {
  date: string;
  amount: number;
}

export interface TrendResponse {
  data: TrendDataPoint[];
}

export interface CategoryData {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface CategoryResponse {
  categories: CategoryData[];
}

export interface MerchantData {
  name: string;
  amount: number;
  count: number;
}

export interface MerchantResponse {
  merchants: MerchantData[];
}

export type DateRangePreset = 'this_month' | 'last_30_days' | 'last_3_months' | 'this_year' | 'custom';

export type TrendInterval = 'daily' | 'weekly' | 'monthly';

export interface DateRange {
  start: string; // ISO date string
  end: string;   // ISO date string
}

// Helper functions
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_30_days':
      start.setDate(start.getDate() - 30);
      break;
    case 'last_3_months':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'this_year':
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      // custom - don't modify
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
}
