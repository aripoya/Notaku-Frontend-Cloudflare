"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

interface ReceiptData {
  id: string;
  store: string;
  date: string;
  time: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  category: string;
  paymentMethod: string;
  notes: string;
}

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData>({
    id: receiptId,
    store: "Alfamart",
    date: "2025-01-15",
    time: "14:30",
    items: [
      { name: "Beras 5kg", qty: 2, price: 65000, total: 130000 },
      { name: "Minyak Goreng 2L", qty: 1, price: 35000, total: 35000 },
      { name: "Gula Pasir 1kg", qty: 3, price: 15000, total: 45000 },
    ],
    subtotal: 210000,
    tax: 0,
    discount: 0,
    total: 210000,
    category: "bahan-baku",
    paymentMethod: "cash",
    notes: "",
  });

  // Calculate totals
  useEffect(() => {
    const subtotal = receipt.items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + receipt.tax - receipt.discount;
    setReceipt((prev) => ({ ...prev, subtotal, total }));
  }, [receipt.items, receipt.tax, receipt.discount]);

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const newItems = [...receipt.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total for this item
    if (field === "qty" || field === "price") {
      newItems[index].total = newItems[index].qty * newItems[index].price;
    }

    setReceipt({ ...receipt, items: newItems });
  };

  const handleAddItem = () => {
    setReceipt({
      ...receipt,
      items: [...receipt.items, { name: "", qty: 1, price: 0, total: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = receipt.items.filter((_, i) => i !== index);
    setReceipt({ ...receipt, items: newItems });
  };

  const handleSave = () => {
    // TODO: Call mockApi.updateReceipt()
    toast.success("Perubahan berhasil disimpan!", {
      description: "Data nota telah diperbarui",
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    // TODO: Call mockApi.deleteReceipt()
    toast.success("Nota berhasil dihapus", {
      description: "Data nota telah dihapus dari sistem",
    });
    setShowDeleteDialog(false);
    router.push("/dashboard/receipts");
  };

  const handleDownloadImage = () => {
    toast.success("Download", { description: "Gambar nota berhasil diunduh" });
  };

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
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg flex flex-col items-center justify-center mb-4">
              <Receipt className="h-24 w-24 text-gray-400 mb-4" />
              <p className="text-sm text-muted-foreground">Receipt Image Preview</p>
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
            {/* Store Info */}
            <div>
              <Label>Nama Toko/Supplier</Label>
              <Input
                value={receipt.store}
                onChange={(e) => setReceipt({ ...receipt, store: e.target.value })}
                className="mt-1"
                disabled={!isEditing}
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={receipt.date}
                  onChange={(e) => setReceipt({ ...receipt, date: e.target.value })}
                  className="mt-1"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Waktu</Label>
                <Input
                  type="time"
                  value={receipt.time}
                  onChange={(e) => setReceipt({ ...receipt, time: e.target.value })}
                  className="mt-1"
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Daftar Barang</Label>
                {isEditing && (
                  <Button size="sm" variant="ghost" onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Item
                  </Button>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Item</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-32">Harga</TableHead>
                      <TableHead className="w-32">Total</TableHead>
                      {isEditing && <TableHead className="w-10"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(i, "name", e.target.value)
                            }
                            className="h-8"
                            disabled={!isEditing}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(i, "qty", parseInt(e.target.value) || 0)
                            }
                            className="h-8"
                            disabled={!isEditing}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              handleItemChange(i, "price", parseInt(e.target.value) || 0)
                            }
                            className="h-8"
                            disabled={!isEditing}
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          Rp {item.total.toLocaleString("id-ID")}
                        </TableCell>
                        {isEditing && (
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(i)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  Rp {receipt.subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Pajak</span>
                <Input
                  type="number"
                  value={receipt.tax}
                  onChange={(e) =>
                    setReceipt({ ...receipt, tax: parseInt(e.target.value) || 0 })
                  }
                  className="h-8 w-32 text-right"
                  disabled={!isEditing}
                />
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Diskon</span>
                <Input
                  type="number"
                  value={receipt.discount}
                  onChange={(e) =>
                    setReceipt({
                      ...receipt,
                      discount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8 w-32 text-right"
                  disabled={!isEditing}
                />
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-blue-600">
                  Rp {receipt.total.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Category & Payment Method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={receipt.category}
                  onValueChange={(value) =>
                    setReceipt({ ...receipt, category: value })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bahan-baku">Bahan Baku</SelectItem>
                    <SelectItem value="operasional">Operasional</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transportasi">Transportasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Metode Pembayaran</Label>
                <Select
                  value={receipt.paymentMethod}
                  onValueChange={(value) =>
                    setReceipt({ ...receipt, paymentMethod: value })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                    <SelectItem value="ewallet">E-Wallet</SelectItem>
                    <SelectItem value="credit">Kartu Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Catatan</Label>
              <Textarea
                placeholder="Tambahkan catatan..."
                className="mt-1"
                rows={3}
                value={receipt.notes}
                onChange={(e) => setReceipt({ ...receipt, notes: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button className="flex-1" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Perubahan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
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
