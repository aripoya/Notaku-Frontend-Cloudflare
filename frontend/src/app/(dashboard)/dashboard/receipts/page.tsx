"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Search,
  RefreshCw,
  Receipt as ReceiptIcon,
  Wallet,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ReceiptCard, { Receipt } from "@/components/receipts/ReceiptCard";
import ReceiptCardSkeleton from "@/components/receipts/ReceiptCardSkeleton";
import StatsCard from "@/components/receipts/StatsCard";
import { calculateStats, formatCurrency } from "@/lib/receipt-utils";
import { getRAGUrl, RAG_DEFAULTS } from "@/config/services";
import { API_BASE_URL } from "@/lib/api-config";

export default function ReceiptsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ LOAD FROM MULTIPLE SOURCES: localStorage + RAG Service
  // Receipts are saved locally after upload and indexed in RAG for chat queries
  const fetchReceipts = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('[ReceiptsList] 📂 Loading receipts from multiple sources');
      
      // 1. Load from localStorage (immediate)
      const saved = localStorage.getItem('notaku_receipts');
      let localReceipts: any[] = [];
      if (saved) {
        localReceipts = JSON.parse(saved);
        console.log('[ReceiptsList] 📱 Local receipts:', localReceipts.length);
      }
      
      // 2. Try to fetch from RAG Service (indexed receipts)
      let ragReceipts: any[] = [];
      try {
        console.log('[ReceiptsList] 🔍 Fetching indexed receipts from RAG...');
        const ragUrl = getRAGUrl('SEARCH');
        const ragResponse = await fetch(ragUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: '*', // Get all receipts
            collection_name: RAG_DEFAULTS.COLLECTION_NAME,
            top_k: 100, // Get up to 100 receipts
            include_metadata: true,
          }),
        });
        
        if (ragResponse.ok) {
          const ragData = await ragResponse.json();
          console.log('[ReceiptsList] 🎯 RAG response:', ragData);
          
          // Extract receipts from RAG response
          if (ragData.results && Array.isArray(ragData.results)) {
            ragReceipts = ragData.results.map((item: any) => {
              const metadata = item.metadata || {};
              return {
                id: metadata.receipt_id || metadata.id || `rag_${Date.now()}_${Math.random()}`,
                merchant_name: metadata.merchant || metadata.merchant_name || 'Unknown',
                total_amount: metadata.total || metadata.total_amount || 0,
                currency: 'IDR',
                category: metadata.category || null,
                transaction_date: metadata.date || metadata.transaction_date || new Date().toISOString(),
                created_at: metadata.created_at || new Date().toISOString(),
                image_path: metadata.image_path || null,
                notes: metadata.notes || null,
                ocr_data: metadata,
                source: 'rag', // Mark as RAG source
              };
            });
            console.log('[ReceiptsList] 🗂️ RAG receipts processed:', ragReceipts.length);
          }
        } else {
          console.warn('[ReceiptsList] ⚠️ RAG fetch failed:', ragResponse.status);
        }
      } catch (ragError) {
        console.warn('[ReceiptsList] ⚠️ RAG service unavailable:', ragError);
      }
      
      // 3. Merge and deduplicate receipts
      const allReceipts = [...localReceipts, ...ragReceipts];
      const uniqueReceipts = allReceipts.reduce((acc: any[], receipt: any) => {
        // Check if receipt already exists (by ID or merchant+amount+date)
        const exists = acc.find(r => 
          r.id === receipt.id || 
          (r.merchant_name === receipt.merchant_name && 
           r.total_amount === receipt.total_amount && 
           r.transaction_date?.split('T')[0] === receipt.transaction_date?.split('T')[0])
        );
        
        if (!exists) {
          acc.push(receipt);
        } else {
          // Prefer local version over RAG version
          if (receipt.source !== 'rag') {
            const index = acc.findIndex(r => r.id === exists.id);
            if (index >= 0) acc[index] = receipt;
          }
        }
        return acc;
      }, []);
      
      console.log('[ReceiptsList] 🔄 Total unique receipts:', uniqueReceipts.length);
      console.log('[ReceiptsList] 📊 Sources - Local:', localReceipts.length, 'RAG:', ragReceipts.length, 'Unique:', uniqueReceipts.length);
      
      // Sort by date (newest first)
      const sorted = uniqueReceipts.sort((a: any, b: any) => {
        return new Date(b.saved_at || b.created_at || b.transaction_date).getTime() - 
               new Date(a.saved_at || a.created_at || a.transaction_date).getTime();
      });
      
      setReceipts(sorted);
      
      if (sorted.length === 0) {
        console.log('[ReceiptsList] 📭 No receipts found from any source');
      }
      
      /* FUTURE: Backend API integration
      const response = await fetch(`${API_BASE_URL}/api/v1/receipts/`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setReceipts(Array.isArray(data) ? data : []);
      */
    } catch (err) {
      console.error("[ReceiptsList] Error loading receipts:", err);
      setError(err instanceof Error ? err.message : "Failed to load receipts");
      toast.error("Error", {
        description: "Gagal memuat daftar nota. Silakan coba lagi.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  // Filter and sort receipts
  const filteredReceipts = receipts
    .filter((receipt) => {
      // Search filter
      const matchesSearch =
        receipt.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (receipt.category && receipt.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (receipt.notes && receipt.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory =
        categoryFilter === "all" ||
        receipt.category?.toLowerCase().replace(/\s+/g, "-") === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const amountA = typeof a.total_amount === "string" ? parseFloat(a.total_amount) : a.total_amount;
      const amountB = typeof b.total_amount === "string" ? parseFloat(b.total_amount) : b.total_amount;
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();

      switch (sortBy) {
        case "newest":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "highest":
          return amountB - amountA;
        case "lowest":
          return amountA - amountB;
        default:
          return 0;
      }
    });

  // Calculate statistics
  const stats = calculateStats(filteredReceipts);

  const handleRefresh = () => {
    fetchReceipts(true);
  };

  const handleViewReceipt = (id: string) => {
    router.push(`/dashboard/receipts/detail?id=${id}`);
  };

  const handleEditReceipt = (id: string) => {
    toast.info("Edit", { description: "Fitur edit akan segera hadir" });
  };

  // ✅ DELETE FROM LOCALSTORAGE
  const handleDeleteReceipt = async (id: string) => {
    try {
      console.log('[ReceiptsList] 🗑️ Deleting receipt:', id);
      
      // Get existing receipts
      const saved = localStorage.getItem('notaku_receipts');
      if (!saved) {
        toast.error("Tidak ada nota untuk dihapus");
        return;
      }
      
      const receipts = JSON.parse(saved);
      const filtered = receipts.filter((r: any) => r.id !== id);
      
      console.log('[ReceiptsList] 📊 Before:', receipts.length, 'After:', filtered.length);
      
      // Save back to localStorage
      localStorage.setItem('notaku_receipts', JSON.stringify(filtered));
      
      toast.success("Terhapus", { description: "Nota berhasil dihapus" });
      
      // Refresh list
      fetchReceipts();
      
      /* BACKEND API VERSION (DISABLED):
      const response = await fetch(`${API_BASE_URL}/api/v1/receipts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete receipt");
      }
      */
    } catch (err) {
      console.error('[ReceiptsList] ❌ Delete error:', err);
      toast.error("Error", { description: "Gagal menghapus nota" });
    }
  };

  const handleDownloadReceipt = (id: string) => {
    toast.info("Download", { description: "Fitur download akan segera hadir" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Daftar Nota
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola semua nota belanja Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="transition-all hover:border-blue-500"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Nota
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!isLoading && receipts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            label="Total Nota"
            value={stats.totalReceipts}
            icon={FileText}
            iconColor="text-blue-600"
          />
          <StatsCard
            label="Total Pengeluaran"
            value={formatCurrency(stats.totalAmount)}
            icon={Wallet}
            iconColor="text-emerald-600"
          />
          <StatsCard
            label="Rata-rata"
            value={formatCurrency(stats.averageAmount)}
            icon={TrendingUp}
            iconColor="text-purple-600"
          />
        </div>
      )}

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari merchant, kategori, atau catatan..."
                className="pl-9 w-full focus:ring-2 focus:ring-blue-500 transition-shadow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px] transition-all hover:border-blue-400">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="bahan-baku">Bahan Baku</SelectItem>
                <SelectItem value="operasional">Operasional</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="transportasi">Transportasi</SelectItem>
                <SelectItem value="food-&-dining">Food & Dining</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px] transition-all hover:border-blue-400">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
                <SelectItem value="highest">Termahal</SelectItem>
                <SelectItem value="lowest">Termurah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State - Skeleton Cards */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReceiptCardSkeleton key={i} index={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <ReceiptIcon className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Gagal Memuat Nota
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchReceipts()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
          </div>
        </Card>
      )}

      {/* Receipt Cards Grid */}
      {!isLoading && !error && filteredReceipts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredReceipts.map((receipt, index) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                index={index}
                onView={handleViewReceipt}
                onEdit={handleEditReceipt}
                onDelete={handleDeleteReceipt}
                onDownload={handleDownloadReceipt}
              />
            ))}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredReceipts.length} dari {receipts.length} nota
            </p>
          </div>
        </>
      )}

      {/* Empty State - No Results */}
      {!isLoading && !error && receipts.length > 0 && filteredReceipts.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Nota tidak ditemukan
            </h3>
            <p className="text-muted-foreground mb-4">
              Coba ubah filter atau kata kunci pencarian
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
              }}
            >
              Reset Filter
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State - No Receipts */}
      {!isLoading && !error && receipts.length === 0 && (
        <Card className="p-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-2xl font-semibold mb-2 text-gray-900">
              Belum ada nota
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              Upload nota pertama Anda untuk mulai mengelola keuangan
            </p>
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              <Link href="/dashboard/upload">
                <Upload className="mr-2 h-5 w-5" />
                Upload Nota
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
