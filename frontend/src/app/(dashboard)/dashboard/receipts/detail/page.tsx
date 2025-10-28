"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Receipt,
  ZoomIn,
  RotateCw,
  Download,
  Edit2,
  Trash2,
  Plus,
  X,
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/receipt-utils";
import ReceiptItems from "@/components/ReceiptItems";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.notaku.cloud";

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

interface ReceiptData {
  id: string;
  merchant_name: string;
  transaction_date: string;
  transaction_time?: string | null; // ✅ ADD: Time field (HH:MM format)
  total_amount: string | number;
  currency: string;
  category: string | null;
  notes: string | null;
  image_path: string | null;
  image_url?: string | null; // Alternative field name
  ocr_text: string | null;
  ocr_confidence: number | null;
  created_at: string;
  // Additional fields for editing
  items?: ReceiptItem[];
  tax?: number;
  discount?: number;
}

export default function ReceiptDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const receiptId = searchParams.get("id");

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [imageError, setImageError] = useState(false);

  // Fetch receipt data from API
  useEffect(() => {
    if (!receiptId) {
      setError("Receipt ID not provided");
      setIsLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("[ReceiptDetail] 📂 Loading receipt from localStorage:", receiptId);
        
        // ✅ Load from localStorage instead of API
        const saved = localStorage.getItem('notaku_receipts');
        
        if (!saved) {
          throw new Error("Tidak ada nota tersimpan");
        }
        
        const receipts = JSON.parse(saved);
        console.log("[ReceiptDetail] 📊 Total receipts in storage:", receipts.length);
        
        const foundReceipt = receipts.find((r: any) => r.id === receiptId);
        
        if (!foundReceipt) {
          console.error("[ReceiptDetail] ❌ Receipt not found in localStorage");
          throw new Error("Nota tidak ditemukan");
        }

        console.log("[ReceiptDetail] ✅ Found receipt:", foundReceipt);
        console.log("[ReceiptDetail] 🖼️ Image path:", foundReceipt.image_path);
        
        // Map localStorage format to component format
        const data = {
          id: foundReceipt.id,
          merchant_name: foundReceipt.merchant || foundReceipt.merchant_name,
          transaction_date: foundReceipt.date || foundReceipt.transaction_date,
          transaction_time: null,
          total_amount: foundReceipt.total_amount,
          currency: 'IDR',
          category: foundReceipt.category,
          notes: foundReceipt.notes,
          image_path: foundReceipt.image_base64 || foundReceipt.image_path,  // ✅ Use base64 if available
          image_url: foundReceipt.image_base64,  // ✅ Also set as image_url
          ocr_text: foundReceipt.ocr_text,
          ocr_confidence: foundReceipt.ocr_confidence,
          created_at: foundReceipt.created_at || foundReceipt.saved_at,
          items: foundReceipt.items || [],  // ✅ Load items from localStorage
        };
        
        console.log("[ReceiptDetail] 🖼️ Has image_base64:", !!foundReceipt.image_base64);
        console.log("[ReceiptDetail] 📦 Items count:", data.items.length);
        
        // ✅ Parse datetime if transaction_date contains time
        let date = data.transaction_date;
        let time = data.transaction_time;
        
        if (date && date.includes('T')) {
          const [datePart, timePart] = date.split('T');
          date = datePart;
          time = timePart.substring(0, 5); // Extract HH:MM
          console.log("[ReceiptDetail] ⏰ Parsed time from ISO datetime:", time);
        }
        
        setReceipt({
          ...data,
          transaction_date: date,
          transaction_time: time
        });
        
        /* DISABLED: API call until backend ready
        const response = await fetch(`${API_BASE_URL}/api/v1/receipts/${receiptId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Nota tidak ditemukan");
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        */
      } catch (err) {
        console.error("[ReceiptDetail] ❌ Error loading receipt:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat data nota");
        toast.error("Error", {
          description: err instanceof Error ? err.message : "Gagal memuat data nota",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptId]);

  const handleSave = async () => {
    if (!receipt || !receiptId) return;

    try {
      setIsSaving(true);
      
      console.log("[ReceiptDetail] 💾 Saving to localStorage...");

      // ✅ Combine date and time if both exist
      let fullDateTime = receipt.transaction_date;
      if (receipt.transaction_time) {
        fullDateTime = `${receipt.transaction_date}T${receipt.transaction_time}:00`;
        console.log("[ReceiptDetail] 📅 Combined datetime:", fullDateTime);
      }
      
      // Load existing receipts
      const saved = localStorage.getItem('notaku_receipts');
      if (!saved) {
        throw new Error("No receipts in storage");
      }
      
      const receipts = JSON.parse(saved);
      const index = receipts.findIndex((r: any) => r.id === receiptId);
      
      if (index === -1) {
        throw new Error("Receipt not found");
      }
      
      // Update receipt
      receipts[index] = {
        ...receipts[index],
        merchant: receipt.merchant_name,
        merchant_name: receipt.merchant_name,
        date: fullDateTime,
        total_amount: typeof receipt.total_amount === "string" 
          ? parseFloat(receipt.total_amount) 
          : receipt.total_amount,
        category: receipt.category,
        notes: receipt.notes,
        updated_at: new Date().toISOString(),
      };
      
      // Save back to localStorage
      localStorage.setItem('notaku_receipts', JSON.stringify(receipts));
      console.log("[ReceiptDetail] ✅ Saved to localStorage");
      
      toast.success("Berhasil", {
        description: "Perubahan berhasil disimpan",
      });
      setIsEditing(false);
      
      /* DISABLED: API call until backend ready
      const response = await fetch(`${API_BASE_URL}/api/v1/receipts/${receiptId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({...}),
      });
      */
    } catch (err) {
      console.error("[ReceiptDetail] ❌ Error saving:", err);
      toast.error("Error", {
        description: "Gagal menyimpan perubahan",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!receiptId) return;

    try {
      console.log("[ReceiptDetail] 🗑️ Deleting from localStorage:", receiptId);
      
      // Load existing receipts
      const saved = localStorage.getItem('notaku_receipts');
      if (!saved) {
        throw new Error("No receipts in storage");
      }
      
      const receipts = JSON.parse(saved);
      const filtered = receipts.filter((r: any) => r.id !== receiptId);
      
      console.log("[ReceiptDetail] 📊 Before:", receipts.length, "After:", filtered.length);
      
      // Save back to localStorage
      localStorage.setItem('notaku_receipts', JSON.stringify(filtered));
      console.log("[ReceiptDetail] ✅ Deleted from localStorage");

      toast.success("Berhasil", {
        description: "Nota berhasil dihapus",
      });
      setShowDeleteDialog(false);
      router.push("/dashboard/receipts");
      
      /* DISABLED: API call until backend ready
      const response = await fetch(`${API_BASE_URL}/api/v1/receipts/${receiptId}`, {
        method: "DELETE",
        credentials: "include",
      });
      */
    } catch (err) {
      console.error("[ReceiptDetail] ❌ Error deleting:", err);
      toast.error("Error", {
        description: "Gagal menghapus nota",
      });
    }
  };

  const handleDownloadImage = () => {
    const imageUrl = receipt?.image_path || receipt?.image_url;
    if (imageUrl) {
      console.log("[ReceiptDetail] 📥 Downloading image:", imageUrl);
      window.open(imageUrl, "_blank");
    } else {
      console.log("[ReceiptDetail] ⚠️ No image available for download");
      toast.info("Info", { description: "Gambar nota tidak tersedia" });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/receipts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Detail Nota
            </h1>
            <p className="text-muted-foreground mt-1">Memuat data...</p>
          </div>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground">Memuat data nota...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !receipt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/receipts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Detail Nota
            </h1>
            <p className="text-muted-foreground mt-1">Error</p>
          </div>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              {error || "Nota tidak ditemukan"}
            </h3>
            <p className="text-gray-600 mb-4">
              Silakan kembali ke daftar nota
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/receipts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const categoryColors = getCategoryColor(receipt.category || "other");
  const amount = typeof receipt.total_amount === "string" 
    ? parseFloat(receipt.total_amount) 
    : receipt.total_amount;
  
  // Try to get image from multiple possible field names
  const imageUrl = receipt.image_path || receipt.image_url;
  console.log("[ReceiptDetail] 🎨 Rendering with imageUrl:", imageUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/receipts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Detail Nota
          </h1>
          <p className="text-muted-foreground mt-1">ID: {receiptId}</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Receipt Image */}
        <Card className="h-fit">
          <CardContent className="p-6">
            {/* Image viewer */}
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex flex-col items-center justify-center mb-4 overflow-hidden">
              {imageUrl && !imageError ? (
                <>
                  <img
                    src={imageUrl}
                    alt={receipt.merchant_name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error("[ReceiptDetail] ❌ Image load error:", imageUrl);
                      setImageError(true);
                    }}
                    onLoad={() => {
                      console.log("[ReceiptDetail] ✅ Image loaded successfully:", imageUrl);
                    }}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center text-center p-4">
                  <Receipt className="h-24 w-24 text-gray-400 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No Image Available</p>
                  {imageUrl && imageError && (
                    <p className="text-xs text-red-500">Failed to load image</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2 break-all max-w-xs">
                    {imageUrl ? `Path: ${imageUrl}` : "No image path in database"}
                  </p>
                </div>
              )}
            </div>

            {/* Image controls */}
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline">
                <ZoomIn className="h-4 w-4 mr-2" />
                Zoom
              </Button>
              <Button size="sm" variant="outline">
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadImage}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Receipt Details */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Detail Nota</CardTitle>
                <CardDescription>ID: {receiptId}</CardDescription>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : null}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Merchant Name */}
            <div>
              <Label>Nama Merchant</Label>
              <Input
                value={receipt.merchant_name}
                onChange={(e) => setReceipt({ ...receipt, merchant_name: e.target.value })}
                className="mt-1"
                disabled={!isEditing}
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <Label>Tanggal Transaksi *</Label>
                <Input
                  type="date"
                  value={receipt.transaction_date}
                  onChange={(e) => setReceipt({ ...receipt, transaction_date: e.target.value })}
                  className="mt-1"
                  disabled={!isEditing}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(receipt.transaction_date)}
                </p>
              </div>
              
              {/* Time */}
              <div>
                <Label>Waktu Transaksi (opsional)</Label>
                <Input
                  type="time"
                  value={receipt.transaction_time || ''}
                  onChange={(e) => setReceipt({ ...receipt, transaction_time: e.target.value })}
                  className="mt-1"
                  placeholder="HH:MM"
                  disabled={!isEditing}
                />
                {receipt.transaction_time && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ⏰ {receipt.transaction_time}
                  </p>
                )}
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label>Total Nominal</Label>
              <div className="mt-1">
                {isEditing ? (
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setReceipt({ ...receipt, total_amount: e.target.value })}
                    className="font-bold text-2xl"
                  />
                ) : (
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(amount, receipt.currency)}
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <Label>Kategori</Label>
              <Select
                value={receipt.category || ""}
                onValueChange={(value) => setReceipt({ ...receipt, category: value })}
                disabled={!isEditing}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bahan Baku">Bahan Baku</SelectItem>
                  <SelectItem value="Operasional">Operasional</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Transportasi">Transportasi</SelectItem>
                  <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                </SelectContent>
              </Select>
              {receipt.category && (
                <Badge className={`mt-2 ${categoryColors.bg} ${categoryColors.text} border-none`}>
                  {receipt.category}
                </Badge>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label>Catatan</Label>
              <Textarea
                placeholder="Tambahkan catatan..."
                className="mt-1"
                rows={3}
                value={receipt.notes || ""}
                onChange={(e) => setReceipt({ ...receipt, notes: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* OCR Info */}
            {receipt.ocr_text && (
              <div>
                <Label>OCR Text</Label>
                <Textarea
                  className="mt-1 font-mono text-xs"
                  rows={6}
                  value={receipt.ocr_text}
                  readOnly
                />
                {receipt.ocr_confidence && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Confidence: {(receipt.ocr_confidence * 100).toFixed(2)}%
                  </p>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{formatDate(receipt.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-medium">{receipt.currency}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button 
                    className="flex-1" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Batal
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/dashboard/receipts">Kembali ke Daftar</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Items Section */}
      {receiptId && (
        <div className="mt-6">
          <ReceiptItems receiptId={receiptId} />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Nota?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus nota ini? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
