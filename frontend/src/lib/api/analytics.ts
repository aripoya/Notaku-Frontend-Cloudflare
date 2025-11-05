import { AnalyticsAPI } from '@/lib/analytics-api';

export interface AnalyticsSummary {
  total_spending: number;
  receipt_count: number;
  biggest_expense: {
    merchant: string;
    amount: number;
    date: string;
  };
  average_per_transaction: number;
}

export interface AnalyticsTrend {
  trend: Array<{ date: string; total: number }>; // total maps from amount
  period_change?: number;
  percentage_change?: number;
}

export interface CategoryData {
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
}

export interface MerchantsData {
  merchants: Array<{
    name: string;
    total: number;
    count: number;
  }>;
}

export async function fetchAnalyticsSummary(
  userId: string,
  startDate: string,
  endDate?: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<AnalyticsSummary> {
  const s = await AnalyticsAPI.getSummary(userId, startDate, endDate || startDate);
  return {
    total_spending: s.total_spending,
    receipt_count: (s as any).total_receipts ?? (s as any).receipt_count ?? 0,
    biggest_expense: {
      merchant: s?.biggest_expense?.merchant || 'Unknown',
      amount: s?.biggest_expense?.amount || 0,
      date: s?.biggest_expense?.date || startDate,
    },
    average_per_transaction: s.average_per_transaction,
  };
}

export async function fetchAnalyticsTrend(
  userId: string,
  startDate: string,
  endDate?: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<AnalyticsTrend> {
  const t = await AnalyticsAPI.getTrend(userId, startDate, endDate || startDate, interval);
  const data = Array.isArray(t?.data) ? t.data : [];
  return {
    trend: data.map((d: any) => ({ date: d.date, total: d.amount })),
  };
}

export async function fetchCategoryData(
  userId: string,
  startDate: string,
  endDate?: string
): Promise<CategoryData> {
  const c = await AnalyticsAPI.getByCategory(userId, startDate, endDate || startDate);
  const cats = Array.isArray(c?.categories) ? c.categories : [];
  return {
    categories: cats.map((it: any) => ({
      name: it.name || it.category || 'Unknown',
      amount: it.amount ?? it.total ?? 0,
      percentage: it.percentage ?? 0,
    })),
  };
}

export async function fetchMerchantsData(
  userId: string,
  startDate: string,
  endDate?: string
): Promise<MerchantsData> {
  const m = await AnalyticsAPI.getTopMerchants(userId, startDate, endDate || startDate, 10);
  const list = Array.isArray(m?.merchants) ? m.merchants : [];
  return {
    merchants: list.map((it: any) => ({
      name: it.name || 'Unknown',
      total: it.amount ?? it.total ?? 0,
      count: it.count ?? 0,
    })),
  };
}
