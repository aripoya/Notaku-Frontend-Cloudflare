"use client";

import { useState } from "react";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  Percent,
  DollarSign,
  Receipt as ReceiptIcon,
  Calendar,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Mock Data
const spendingTrendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  }),
  current: Math.floor(Math.random() * 300000) + 200000,
  previous: Math.floor(Math.random() * 250000) + 180000,
}));

const categoryData = [
  { name: "Bahan Baku", value: 5200000, amount: 5200000, color: "#3b82f6" },
  { name: "Operasional", value: 3100000, amount: 3100000, color: "#10b981" },
  { name: "Marketing", value: 2400000, amount: 2400000, color: "#8b5cf6" },
  { name: "Transportasi", value: 1750000, amount: 1750000, color: "#f97316" },
];

const supplierData = Array.from({ length: 10 }, (_, i) => ({
  name: `Supplier ${String.fromCharCode(65 + i)}`,
  amount: Math.floor(Math.random() * 2000000) + 500000,
})).sort((a, b) => b.amount - a.amount);

const paymentMethodData = [
  { name: "Cash", value: 45, color: "#3b82f6" },
  { name: "Transfer", value: 30, color: "#10b981" },
  { name: "E-Wallet", value: 20, color: "#8b5cf6" },
  { name: "Kartu Kredit", value: 5, color: "#f97316" },
];

const dayOfWeekData = [
  { day: "Senin", amount: 1200000, transactions: 12 },
  { day: "Selasa", amount: 850000, transactions: 8 },
  { day: "Rabu", amount: 1500000, transactions: 15 },
  { day: "Kamis", amount: 980000, transactions: 9 },
  { day: "Jumat", amount: 2100000, transactions: 18 },
  { day: "Sabtu", amount: 1800000, transactions: 16 },
  { day: "Minggu", amount: 650000, transactions: 6 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30");

  const handleExportPDF = () => {
    toast.success("Export PDF", {
      description: "Laporan analitik sedang diproses",
    });
  };

  // Calculate key metrics
  const totalSpending = categoryData.reduce((sum, cat) => sum + cat.value, 0);
  const avgDailySpending = Math.floor(totalSpending / 30);
  const totalTransactions = dayOfWeekData.reduce((sum, day) => sum + day.transactions, 0);
  const avgTransactionValue = Math.floor(totalSpending / totalTransactions);

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
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 hari terakhir</SelectItem>
              <SelectItem value="30">30 hari terakhir</SelectItem>
              <SelectItem value="90">3 bulan terakhir</SelectItem>
              <SelectItem value="365">1 tahun terakhir</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Section 1: Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Pengeluaran
                </p>
                <h3 className="text-2xl font-bold mt-2">
                  Rp {(totalSpending / 1000000).toFixed(1)}M
                </h3>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  12% dari bulan lalu
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Rata-rata Harian
                </p>
                <h3 className="text-2xl font-bold mt-2">
                  Rp {(avgDailySpending / 1000).toFixed(0)}K
                </h3>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  5% dari minggu lalu
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Transaksi
                </p>
                <h3 className="text-2xl font-bold mt-2">{totalTransactions}</h3>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  8% dari bulan lalu
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                <ReceiptIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Rata-rata per Nota
                </p>
                <h3 className="text-2xl font-bold mt-2">
                  Rp {(avgTransactionValue / 1000).toFixed(0)}K
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Konsisten
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Spending Trend (Full Width) */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Pengeluaran</CardTitle>
          <CardDescription>
            Perbandingan pengeluaran dari waktu ke waktu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={spendingTrendData}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value: number) =>
                  `Rp ${value.toLocaleString("id-ID")}`
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="current"
                name="Periode Ini"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorCurrent)"
              />
              <Area
                type="monotone"
                dataKey="previous"
                name="Periode Sebelumnya"
                stroke="#94a3b8"
                strokeWidth={2}
                fill="url(#colorPrevious)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Section 3: Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (60%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* 3A. Category Breakdown (Pie Chart) */}
          <Card>
            <CardHeader>
              <CardTitle>Pengeluaran per Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      `${entry.name} ${(entry.percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `Rp ${value.toLocaleString("id-ID")}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend with amounts */}
              <div className="mt-4 space-y-2">
                {categoryData.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-semibold">
                      Rp {cat.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3B. Top Suppliers (Bar Chart) */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Supplier</CardTitle>
              <CardDescription>Berdasarkan total pembelian</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={supplierData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tickFormatter={(value) =>
                      `Rp ${(value / 1000000).toFixed(1)}M`
                    }
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    className="text-xs"
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      `Rp ${value.toLocaleString("id-ID")}`
                    }
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
        </div>

        {/* Right Column (40%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3C. Spending by Day of Week */}
          <Card>
            <CardHeader>
              <CardTitle>Pola Pengeluaran</CardTitle>
              <CardDescription>Per hari dalam seminggu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dayOfWeekData.map((item) => {
                  const maxAmount = 2100000;
                  const percentage = (item.amount / maxAmount) * 100;
                  return (
                    <div key={item.day} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.day}</span>
                        <span className="text-muted-foreground">
                          Rp {(item.amount / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-end pr-2"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs text-white font-semibold">
                            {item.transactions} nota
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 3D. Payment Methods (Donut Chart) */}
          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {paymentMethodData.map((method) => (
                  <div
                    key={method.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: method.color }}
                    />
                    <span>
                      {method.name} ({method.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 4: AI Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Insights & Rekomendasi</CardTitle>
          <CardDescription>
            Berdasarkan analisis data pengeluaran Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                icon: TrendingUp,
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-950",
                title: "Pengeluaran tertinggi di hari Jumat",
                description:
                  "Rata-rata Rp 2.1 juta per Jumat. Pertimbangkan bulk purchase di awal minggu.",
              },
              {
                icon: Package,
                color: "text-green-600",
                bg: "bg-green-50 dark:bg-green-950",
                title: "Supplier A 15% lebih murah",
                description:
                  "Untuk bahan plastik, Supplier A memberikan harga terbaik dibanding kompetitor.",
              },
              {
                icon: Percent,
                color: "text-purple-600",
                bg: "bg-purple-50 dark:bg-purple-950",
                title: "Potensi hemat Rp 850K/bulan",
                description:
                  "Dengan konsolidasi pembelian dan negosiasi volume discount.",
              },
            ].map((insight, i) => (
              <div key={i} className={`p-4 rounded-lg ${insight.bg}`}>
                <div className="flex gap-3">
                  <insight.icon
                    className={`h-5 w-5 ${insight.color} mt-0.5 shrink-0`}
                  />
                  <div>
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
