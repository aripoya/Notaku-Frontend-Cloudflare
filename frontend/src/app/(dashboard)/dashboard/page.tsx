"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Receipt, PieChart as PieChartIcon, ArrowUp, Upload, MessageSquare, BarChart3, Eye, Edit } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell, Legend } from "recharts";

// Generate 30 days of spending data
const spendingData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
  amount: Math.floor(Math.random() * 300000) + 200000,
}));

// Summary data
const summaryData = {
  totalSpending: 12450000,
  receiptCount: 127,
  topCategory: { name: "Bahan Baku", amount: 5200000, percentage: 42 },
  changeVsPrevious: { amount: 1200000, percentage: 18 },
};

const recentReceipts = [
  { id: "1", supplier: "Toko Sumber Rezeki", total: 250000, date: "Hari ini" },
  { id: "2", supplier: "Gudang Bahan", total: 780000, date: "Hari ini" },
  { id: "3", supplier: "PT Kertas", total: 120000, date: "Kemarin" },
  { id: "4", supplier: "CV Plastik Jaya", total: 450000, date: "Kemarin" },
  { id: "5", supplier: "PT Transport", total: 330000, date: "2 hari lalu" },
];

// Category breakdown data
const categoryData = [
  { name: "Bahan Baku", value: 42, amount: 5200000, color: "#3b82f6" },
  { name: "Operasional", value: 25, amount: 3100000, color: "#10b981" },
  { name: "Marketing", value: 19, amount: 2360000, color: "#a855f7" },
  { name: "Transportasi", value: 14, amount: 1740000, color: "#f97316" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview keuangan bisnis Anda</p>
        </div>
        <div className="text-sm text-muted-foreground">30 hari terakhir</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pengeluaran */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform duration-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Pengeluaran Bulan Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">Rp 12.450.000</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
              <ArrowUp className="h-3 w-3" />
              <span className="font-medium">+18%</span>
              <span className="text-blue-700 dark:text-blue-300">vs bulan lalu</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">+Rp 1.2 juta dari bulan lalu</p>
          </CardContent>
        </Card>

        {/* Card 2: Jumlah Nota */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform duration-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Jumlah Nota</CardTitle>
            <Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">127 nota</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
              <ArrowUp className="h-3 w-3" />
              <span className="font-medium">+12 dari minggu lalu</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Kategori Teratas */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:scale-105 transition-transform duration-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Kategori Teratas</CardTitle>
            <PieChart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">Bahan Baku</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-semibold text-orange-700 dark:text-orange-300">Rp 5.2M</span>
              <span className="text-xs text-orange-600 dark:text-orange-400">(42%)</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Hemat/Naik */}
        <Card className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950 dark:to-pink-900 border-red-200 dark:border-red-800 hover:scale-105 transition-transform duration-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Perubahan Pengeluaran</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">Naik Rp 850K</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600 dark:text-red-400">
              <ArrowUp className="h-3 w-3" />
              <span className="font-medium">+8.5%</span>
              <span>vs periode sebelumnya</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Trend Chart */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Tren Pengeluaran 30 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: "currentColor" }} />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "currentColor" }}
                  tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Pengeluaran"]}
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Recent Receipts (60%) */}
        <div className="lg:col-span-3">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nota Terbaru</CardTitle>
              <Link href="/dashboard/receipts">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  Lihat Semua
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentReceipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{receipt.supplier}</p>
                      <p className="text-xs text-muted-foreground">{receipt.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">Rp {receipt.total.toLocaleString("id-ID")}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Category Breakdown (40%) */}
        <div className="lg:col-span-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Breakdown Kategori</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value}% (Rp ${props.payload.amount.toLocaleString("id-ID")})`,
                        props.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.map((category) => (
                  <div key={category.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span>{category.name}</span>
                    </div>
                    <span className="font-medium">{category.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 4: Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload Nota Baru */}
        <Link href="/dashboard/upload">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105 transition-transform duration-200 shadow-lg cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="p-3 bg-white/20 rounded-full">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Upload Nota Baru</h3>
                <p className="text-sm text-blue-100 mt-1">Scan dan ekstrak data nota</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Tanya AI */}
        <Link href="/dashboard/chat">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:scale-105 transition-transform duration-200 shadow-lg cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="p-3 bg-white/20 rounded-full">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Tanya AI</h3>
                <p className="text-sm text-purple-100 mt-1">Konsultasi keuangan bisnis</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Lihat Laporan */}
        <Link href="/dashboard/analytics">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-105 transition-transform duration-200 shadow-lg cursor-pointer">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="p-3 bg-white/20 rounded-full">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Lihat Laporan</h3>
                <p className="text-sm text-green-100 mt-1">Analisis detail pengeluaran</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
