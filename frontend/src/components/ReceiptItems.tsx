"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, ShoppingBag, AlertCircle, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_BASE_URL } from "@/lib/api-config";

// Types
interface ReceiptItem {
  id: string;
  receipt_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  notes?: string;
  ocr_extracted: boolean;
  ocr_confidence?: number;
  created_at: string;
  updated_at: string;
}

interface ReceiptItemsProps {
  receiptId: string;
}

// Helper: Format Indonesian currency
const formatCurrency = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

export default function ReceiptItems({ receiptId }: ReceiptItemsProps) {
  console.log('[ReceiptItems] 🎬 Component mounted with receiptId:', receiptId);

  // State
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 1,
    unit_price: 0,
  });

  // Calculate total price
  const calculatedTotal = formData.quantity * formData.unit_price;

  // Fetch items from localStorage
  const fetchItems = async () => {
    console.log('[ReceiptItems] 📥 Loading items from localStorage for receipt:', receiptId);
    try {
      setLoading(true);
      setError(null);

      // Load receipt from localStorage
      const saved = localStorage.getItem('notaku_receipts');
      if (!saved) {
        console.log('[ReceiptItems] No receipts in localStorage');
        setItems([]);
        return;
      }

      const receipts = JSON.parse(saved);
      const receipt = receipts.find((r: any) => r.id === receiptId);
      
      if (!receipt) {
        console.log('[ReceiptItems] Receipt not found');
        setItems([]);
        return;
      }

      const itemsData = receipt.items || [];
      console.log('[ReceiptItems] ✅ Items loaded:', itemsData.length);
      setItems(itemsData);
      
      /* DISABLED: API call until backend ready
      const response = await fetch(`${API_BASE_URL}/api/v1/receipts/${receiptId}/items`);
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
      */
    } catch (err) {
      console.error('[ReceiptItems] ❌ Error loading items:', err);
      setError(err instanceof Error ? err.message : 'Gagal memuat item');
    } finally {
      setLoading(false);
    }
  };

  // Load items on mount
  useEffect(() => {
    if (receiptId) {
      fetchItems();
    }
  }, [receiptId]);

  // Add new item
  const handleAddItem = async () => {
    if (!formData.item_name.trim()) {
      toast.error('Error', { description: 'Nama item harus diisi' });
      return;
    }

    if (formData.quantity <= 0) {
      toast.error('Error', { description: 'Jumlah harus lebih dari 0' });
      return;
    }

    if (formData.unit_price < 0) {
      toast.error('Error', { description: 'Harga tidak boleh negatif' });
      return;
    }

    console.log('[ReceiptItems] ➕ Adding new item:', formData);

    try {
      // Load receipts from localStorage
      const saved = localStorage.getItem('notaku_receipts');
      if (!saved) throw new Error('No receipts found');
      
      const receipts = JSON.parse(saved);
      const receiptIndex = receipts.findIndex((r: any) => r.id === receiptId);
      
      if (receiptIndex === -1) throw new Error('Receipt not found');
      
      // Create new item
      const newItem = {
        id: `item_${Date.now()}`,
        item_name: formData.item_name.trim(),
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_price: calculatedTotal,
        ocr_extracted: false,
        created_at: new Date().toISOString(),
      };
      
      // Add item to receipt
      if (!receipts[receiptIndex].items) {
        receipts[receiptIndex].items = [];
      }
      receipts[receiptIndex].items.push(newItem);
      
      // Save back to localStorage
      localStorage.setItem('notaku_receipts', JSON.stringify(receipts));
      console.log('[ReceiptItems] ✅ Item added to localStorage');

      // Refresh items list
      await fetchItems();

      // Reset form
      setFormData({ item_name: '', quantity: 1, unit_price: 0 });
      setShowAddForm(false);

      toast.success('Berhasil', {
        description: 'Item berhasil ditambahkan',
      });
      
      /* DISABLED: API call until backend ready
      const response = await fetch(`${API_BASE_URL}/api/v1/receipts/${receiptId}/items`, {
        method: 'POST',
        body: JSON.stringify({...}),
      });
      */
    } catch (err) {
      console.error('[ReceiptItems] ❌ Error adding item:', err);
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Gagal menambah item',
      });
    }
  };

  // Edit item
  const handleEditItem = async (itemId: string) => {
    if (!formData.item_name.trim()) {
      toast.error('Error', { description: 'Nama item harus diisi' });
      return;
    }

    console.log('[ReceiptItems] ✏️ Updating item:', itemId);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/receipts/items/${itemId}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item_name: formData.item_name.trim(),
            quantity: formData.quantity,
            unit_price: formData.unit_price,
            total_price: calculatedTotal,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Gagal mengupdate item');
      }

      console.log('[ReceiptItems] ✅ Item updated');

      // Refresh items list
      await fetchItems();

      // Reset form
      setFormData({ item_name: '', quantity: 1, unit_price: 0 });
      setEditingItemId(null);

      toast.success('Berhasil', {
        description: 'Item berhasil diupdate',
      });
    } catch (err) {
      console.error('[ReceiptItems] ❌ Error updating item:', err);
      toast.error('Error', {
        description: 'Gagal mengupdate item',
      });
    }
  };

  // Delete item from localStorage
  const handleDeleteItem = async (itemId: string) => {
    console.log('[ReceiptItems] 🗑️ Deleting item:', itemId);

    try {
      setDeletingItemId(itemId);

      // Load receipts from localStorage
      const saved = localStorage.getItem('notaku_receipts');
      if (!saved) throw new Error('No receipts found');
      
      const receipts = JSON.parse(saved);
      const receiptIndex = receipts.findIndex((r: any) => r.id === receiptId);
      
      if (receiptIndex === -1) throw new Error('Receipt not found');
      
      // Filter out deleted item
      if (receipts[receiptIndex].items) {
        receipts[receiptIndex].items = receipts[receiptIndex].items.filter(
          (item: any) => item.id !== itemId
        );
      }
      
      // Save back to localStorage
      localStorage.setItem('notaku_receipts', JSON.stringify(receipts));
      console.log('[ReceiptItems] ✅ Item deleted from localStorage');

      // Refresh items list
      await fetchItems();

      toast.success('Berhasil', {
        description: 'Item berhasil dihapus',
      });
      
      /* DISABLED: API call until backend ready
      const response = await fetch(`${API_BASE_URL}/api/v1/receipts/items/${itemId}`, {
        method: 'DELETE',
      });
      */
    } catch (err) {
      console.error('[ReceiptItems] ❌ Error deleting item:', err);
      toast.error('Error', {
        description: 'Gagal menghapus item',
      });
    } finally {
      setDeletingItemId(null);
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  // Start editing
  const startEdit = (item: ReceiptItem) => {
    setEditingItemId(item.id);
    setFormData({
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    });
    setShowAddForm(false); // Close add form if open
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingItemId(null);
    setFormData({ item_name: '', quantity: 1, unit_price: 0 });
  };

  // Cancel add
  const cancelAdd = () => {
    setShowAddForm(false);
    setFormData({ item_name: '', quantity: 1, unit_price: 0 });
  };

  // Show delete confirmation
  const confirmDelete = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteDialog(true);
  };

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

  // Render item form (for add or edit)
  const renderItemForm = (isEdit: boolean, itemId?: string) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3 border border-gray-200 dark:border-gray-700">
      <div>
        <Label htmlFor={isEdit ? "edit-name" : "add-name"} className="text-sm font-medium">
          Nama Item *
        </Label>
        <Input
          id={isEdit ? "edit-name" : "add-name"}
          type="text"
          placeholder="Contoh: Indomie Goreng"
          value={formData.item_name}
          onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={isEdit ? "edit-qty" : "add-qty"} className="text-sm font-medium">
            Jumlah *
          </Label>
          <Input
            id={isEdit ? "edit-qty" : "add-qty"}
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor={isEdit ? "edit-price" : "add-price"} className="text-sm font-medium">
            Harga Satuan *
          </Label>
          <Input
            id={isEdit ? "edit-price" : "add-price"}
            type="number"
            min="0"
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
            className="mt-1"
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total: </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(calculatedTotal)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={isEdit ? cancelEdit : cancelAdd}
          >
            <X className="h-4 w-4 mr-1" />
            Batal
          </Button>
          <Button
            size="sm"
            onClick={() => isEdit && itemId ? handleEditItem(itemId) : handleAddItem()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-1" />
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Item Belanja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Item Belanja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button
              onClick={fetchItems}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Item Belanja
              {items.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {items.length}
                </Badge>
              )}
            </CardTitle>
            {!showAddForm && !editingItemId && (
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah Item
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Add Form */}
          {showAddForm && renderItemForm(false)}

          {/* Items List */}
          {items.length === 0 && !showAddForm ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada item.</p>
              <p className="text-sm mt-1">Klik "Tambah Item" untuk menambah</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id}>
                  {editingItemId === item.id ? (
                    // Edit Form
                    renderItemForm(true, item.id)
                  ) : (
                    // Item Display
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Item Name & OCR Badge */}
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                              {item.item_name}
                            </h4>
                            {item.ocr_extracted && (
                              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                OCR {Math.round((item.ocr_confidence || 0) * 100)}%
                              </Badge>
                            )}
                          </div>

                          {/* Quantity x Price = Total */}
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{item.quantity}x</span>
                            {' '}
                            <span>{formatCurrency(item.unit_price)}</span>
                            {' = '}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(item.total_price)}
                            </span>
                          </div>

                          {/* Notes (if any) */}
                          {item.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(item)}
                            className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            title="Edit item"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => confirmDelete(item.id)}
                            disabled={deletingItemId === item.id}
                            className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            title="Hapus item"
                          >
                            {deletingItemId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Subtotal */}
          {items.length > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Subtotal Items:
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Item?</DialogTitle>
            <DialogDescription>
              Item ini akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setItemToDelete(null);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
