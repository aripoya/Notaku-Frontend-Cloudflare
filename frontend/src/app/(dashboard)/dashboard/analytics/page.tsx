"use client";

import { useState, useEffect } from "react";
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt as ReceiptIcon,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AnalyticsAPI } from "@/lib/analytics-api";
import type {
  AnalyticsSummary,
  TrendDataPoint,
  CategoryData,
  MerchantData,
  DateRangePreset,
  TrendInterval,
} from "@/types/analytics";
import {
  getDateRangeFromPreset,
  formatCurrency,
  formatCurrencyCompact,
  formatDateShort,
} from "@/types/analytics";

// Chart colors
const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#8b5cf6", // purple
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#6366f1", // indigo
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  
  // State
  const [datePreset, setDatePreset] = useState<DateRangePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [merchantData, setMerchantData] = useState<MerchantData[]>([]);

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Get date range
      const dateRange = datePreset === "custom" && customStartDate && customEndDate
        ? { start: customStartDate, end: customEndDate }
        : getDateRangeFromPreset(datePreset);

      // Determine interval based on date range
      const daysDiff = Math.ceil(
        (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24)
      );
      const interval: TrendInterval = daysDiff > 90 ? "monthly" : daysDiff > 30 ? "weekly" : "daily";

      console.log("[Analytics] Fetching data:", { dateRange, interval });

      // Fetch all data
      const data = await AnalyticsAPI.getAllData(
        user.id,
        dateRange.start,
        dateRange.end,
        interval
      );

      setSummary(data.summary);
      setTrendData(data.trend.data);
      setCategoryData(data.categories.categories);
      setMerchantData(data.merchants.merchants);

    } catch (err: any) {
      console.error("[Analytics] Error fetching data:", err);
      setError(err.message || "Failed to load analytics data");
      
      // Use mock data as fallback
      useMockData();
      
      toast.error("Failed to load analytics", {
        description: "Using sample data. Backend API may not be available.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock data fallback
  const useMockData = () => {
    setSummary({
      total_spending: 12450000,
      total_receipts: 84,
      average_per_transaction: 148214,
      biggest_expense: {
        merchant: "Supplier A",
        amount: 2500000,
        date: new Date().toISOString(),
      },
    });

    setTrendData(
      Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
        amount: Math.floor(Math.random() * 300000) + 200000,
      }))
    );

    setCategoryData([
      { name: "Bahan Baku", amount: 5200000, count: 32, percentage: 41.8 },
      { name: "Operasional", amount: 3100000, count: 25, percentage: 24.9 },
      { name: "Marketing", amount: 2400000, count: 15, percentage: 19.3 },
      { name: "Transportasi", amount: 1750000, count: 12, percentage: 14.0 },
    ]);

    setMerchantData(
      Array.from({ length: 10 }, (_, i) => ({
        name: `Supplier ${String.fromCharCode(65 + i)}`,
        amount: Math.floor(Math.random() * 2000000) + 500000,
        count: Math.floor(Math.random() * 20) + 5,
      })).sort((a, b) => b.amount - a.amount)
    );
  };

  // Fetch on mount and when date changes
  useEffect(() => {
    fetchAnalytics();
  }, [user?.id, datePreset, customStartDate, customEndDate]);

  // Export PDF handler
  const handleExportPDF = () => {
    toast.success("Export PDF", {
      description: "Laporan analitik sedang diproses",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Analitik Keuangan
          </h1>
          <p className="text-muted-foreground mt-1">
            Insights mendalam tentang pengeluaran bisnis Anda
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={datePreset === "this_month" ? "default" : "outline"}
              size="sm"
              onClick={() => setDatePreset("this_month")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              This Month
            </Button>
            <Button
              variant={datePreset === "last_30_days" ? "default" : "outline"}
              size="sm"
              onClick={() => setDatePreset("last_30_days")}
            >
              Last 30 Days
            </Button>
            <Button
              variant={datePreset === "last_3_months" ? "default" : "outline"}
              size="sm"
              onClick={() => setDatePreset("last_3_months")}
            >
              Last 3 Months
            </Button>
            <Button
              variant={datePreset === "this_year" ? "default" : "outline"}
              size="sm"
              onClick={() => setDatePreset("this_year")}
            >
              This Year
            </Button>
            
            {/* Custom Date Range */}
            <div className="flex gap-2 ml-auto">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="px-3 py-1 text-sm border rounded-md"
              />
              <span className="self-center text-muted-foreground">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="px-3 py-1 text-sm border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Using sample data. Backend analytics API may not be available.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Spending */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Pengeluaran
                  </p>
                  <h3 className="text-2xl font-bold mt-2">
                    {formatCurrencyCompact(summary.total_spending)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(summary.total_spending)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Receipts */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Transaksi
                  </p>
                  <h3 className="text-2xl font-bold mt-2">
                    {summary.total_receipts}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    receipts
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <ReceiptIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average per Transaction */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Rata-rata per Nota
                  </p>
                  <h3 className="text-2xl font-bold mt-2">
                    {formatCurrencyCompact(summary.average_per_transaction)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    per transaction
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biggest Expense */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pengeluaran Terbesar
                  </p>
                  <h3 className="text-lg font-bold mt-2 truncate">
                    {summary.biggest_expense.merchant}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrencyCompact(summary.biggest_expense.amount)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Spending Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tren Pengeluaran</CardTitle>
            <CardDescription>
              Perbandingan pengeluaran dari waktu ke waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tickFormatter={(value) => formatDateShort(value)}
                />
                <YAxis
                  className="text-xs"
                  tickFormatter={(value) => formatCurrencyCompact(value)}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => formatDateShort(label)}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Pengeluaran"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pengeluaran per Kategori</CardTitle>
              <CardDescription>Breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.name} ${entry.percentage.toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend with amounts */}
              <div className="mt-4 space-y-2">
                {categoryData.map((cat, index) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{cat.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {cat.count}
                      </Badge>
                    </div>
                    <span className="font-semibold">
                      {formatCurrencyCompact(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Merchants */}
        {merchantData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Merchants</CardTitle>
              <CardDescription>Berdasarkan total pembelian</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={merchantData.slice(0, 10)} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tickFormatter={(value) => formatCurrencyCompact(value)}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    className="text-xs"
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {!loading && summary && summary.total_receipts === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Upload some receipts to see your analytics
            </p>
            <Button onClick={() => window.location.href = "/dashboard/upload"}>
              Upload Receipt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
