"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Upload,
  Eye,
  MoreVertical,
  Search,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Mock data generator
const generateMockReceipts = (count: number) => {
  const stores = [
    "Alfamart",
    "Indomaret",
    "Warung Pak Budi",
    "Toko Sejahtera",
    "Supplier ABC",
    "Tokopedia",
    "Bukalapak",
    "Shopee",
  ];
  const categories = ["Bahan Baku", "Operasional", "Marketing", "Transportasi"];

  return Array.from({ length: count }, (_, i) => ({
    id: `receipt-${i + 1}`,
    store: stores[i % stores.length],
    date: new Date(Date.now() - i * 86400000).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    amount: Math.floor(Math.random() * 500000) + 50000,
    category: categories[i % categories.length],
    items: Math.floor(Math.random() * 10) + 1,
    status: "completed" as const,
  }));
};

export default function ReceiptsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("30");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Mock data
  const allReceipts = generateMockReceipts(20);

  // Filter and sort receipts
  const filteredReceipts = allReceipts
    .filter((receipt) => {
      // Search filter
      const matchesSearch =
        receipt.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        categoryFilter === "all" ||
        receipt.category.toLowerCase().replace(" ", "-") === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return 0; // Already sorted by date (newest first)
        case "oldest":
          return 0; // Would reverse
        case "highest":
          return b.amount - a.amount;
        case "lowest":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

  const handleViewReceipt = (id: string) => {
    router.push(`/dashboard/receipts/detail?id=${id}`);
  };

  const handleEditReceipt = (id: string) => {
    toast.info("Edit", { description: "Fitur edit akan segera hadir" });
  };

  const handleDeleteReceipt = (id: string) => {
    toast.success("Terhapus", { description: "Nota berhasil dihapus" });
  };

  const handleDownloadReceipt = (id: string) => {
    toast.success("Download", { description: "Nota berhasil diunduh" });
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
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Nota
          </Link>
        </Button>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari toko atau item..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Date Range */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 hari terakhir</SelectItem>
                <SelectItem value="30">30 hari terakhir</SelectItem>
                <SelectItem value="90">3 bulan terakhir</SelectItem>
                <SelectItem value="all">Semua waktu</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="bahan-baku">Bahan Baku</SelectItem>
                <SelectItem value="operasional">Operasional</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="transportasi">Transportasi</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
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

      {/* Receipt Cards Grid */}
      {filteredReceipts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredReceipts.map((receipt) => (
              <Card
                key={receipt.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                onClick={() => handleViewReceipt(receipt.id)}
              >
                {/* Image placeholder */}
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center border-b group-hover:from-blue-50 group-hover:to-blue-100 dark:group-hover:from-blue-950 dark:group-hover:to-blue-900 transition-all">
                  <Receipt className="h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>

                <CardContent className="p-4">
                  {/* Store name & date */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-slate-900 dark:text-white">
                        {receipt.store}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {receipt.date}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="ml-2 shrink-0 text-xs"
                    >
                      {receipt.category}
                    </Badge>
                  </div>

                  {/* Amount */}
                  <p className="text-2xl font-bold text-blue-600 mb-3">
                    Rp {receipt.amount.toLocaleString("id-ID")}
                  </p>

                  {/* Items count */}
                  <p className="text-sm text-muted-foreground mb-3">
                    {receipt.items} item
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReceipt(receipt.id);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditReceipt(receipt.id);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadReceipt(receipt.id);
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReceipt(receipt.id);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredReceipts.length} dari {allReceipts.length}{" "}
              nota
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled>
                Selanjutnya
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <Card className="p-12">
          <div className="text-center">
            <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nota tidak ditemukan
            </h3>
            <p className="text-muted-foreground mb-4">
              Coba ubah filter atau upload nota baru
            </p>
            <Button asChild>
              <Link href="/dashboard/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Nota
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
