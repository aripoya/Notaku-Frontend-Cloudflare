"use client";

import { useState, useEffect } from "react";
import { X, Save, Trash2, Loader2, AlertCircle, CheckCircle, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ReceiptsAPI } from "@/lib/receipts-api";
import type { Receipt, ReceiptUpdateData } from "@/types/receipt";
import { CATEGORIES, formatCurrency, parseCurrency, formatDateForInput, formatDateDisplay } from "@/types/receipt";

interface ReceiptEditFormProps {
  receiptId: string;
  initialData?: Receipt;
  onSave?: (receipt: Receipt) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

export default function ReceiptEditForm({
  receiptId,
  initialData,
  onSave,
  onCancel,
  onDelete,
}: ReceiptEditFormProps) {
  console.log('[ReceiptEditForm] 🎬 Component mounted/re-rendered');
  console.log('[ReceiptEditForm] Props received:');
  console.log('[ReceiptEditForm]   - receiptId:', receiptId);
  console.log('[ReceiptEditForm]   - initialData:', initialData);
  console.log('[ReceiptEditForm]   - API_URL:', process.env.NEXT_PUBLIC_API_URL);
  
  // State
  const [receipt, setReceipt] = useState<Receipt | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOcrInfo, setShowOcrInfo] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Form fields
  const [merchant, setMerchant] = useState(initialData?.merchant || "");
  const [totalAmount, setTotalAmount] = useState(initialData?.total_amount?.toString() || "");
  const [date, setDate] = useState(formatDateForInput(initialData?.date || null));
  const [category, setCategory] = useState(initialData?.category || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  
  console.log('[ReceiptEditForm] Initial form state:');
  console.log('[ReceiptEditForm]   - merchant:', merchant);
  console.log('[ReceiptEditForm]   - totalAmount:', totalAmount);
  console.log('[ReceiptEditForm]   - date:', date);
  console.log('[ReceiptEditForm]   - category:', category);
  console.log('[ReceiptEditForm]   - notes:', notes);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track if form is dirty (has unsaved changes)
  const [isDirty, setIsDirty] = useState(false);

  // ✅ UPDATE: Populate form fields when initialData changes
  useEffect(() => {
    console.log('[ReceiptEditForm] 🔄 useEffect triggered - initialData dependency');
    console.log('[ReceiptEditForm] initialData value:', initialData);
    console.log('[ReceiptEditForm] initialData type:', typeof initialData);
    console.log('[ReceiptEditForm] initialData is null?', initialData === null);
    console.log('[ReceiptEditForm] initialData is undefined?', initialData === undefined);
    
    if (initialData) {
      console.log('[ReceiptEditForm] ✅ initialData exists, extracting fields...');
      console.log('[ReceiptEditForm] Full initialData object:', JSON.stringify(initialData, null, 2));
      
      // Extract values with detailed logging
      const merchantValue = initialData.merchant || "";
      const amountValue = initialData.total_amount?.toString() || "";
      const dateValue = formatDateForInput(initialData.date);
      const categoryValue = initialData.category || "";
      const notesValue = initialData.notes || "";
      
      console.log('[ReceiptEditForm] Extracted values:');
      console.log('[ReceiptEditForm]   - merchant:', merchantValue, '(type:', typeof merchantValue, ')');
      console.log('[ReceiptEditForm]   - totalAmount:', amountValue, '(type:', typeof amountValue, ')');
      console.log('[ReceiptEditForm]   - date:', dateValue, '(type:', typeof dateValue, ')');
      console.log('[ReceiptEditForm]   - category:', categoryValue);
      console.log('[ReceiptEditForm]   - notes:', notesValue);
      
      // Update state
      console.log('[ReceiptEditForm] 📝 Setting form state...');
      setReceipt(initialData);
      setMerchant(merchantValue);
      setTotalAmount(amountValue);
      setDate(dateValue);
      setCategory(categoryValue);
      setNotes(notesValue);
      setLoading(false);
      
      console.log('[ReceiptEditForm] ✅ Form state updated!');
      
      // Force a small delay to ensure state is set
      setTimeout(() => {
        console.log('[ReceiptEditForm] 🔍 Verifying state after update:');
        console.log('[ReceiptEditForm]   - Current merchant state should be:', merchantValue);
        console.log('[ReceiptEditForm]   - Current amount state should be:', amountValue);
      }, 100);
    } else {
      console.log('[ReceiptEditForm] ⚠️ initialData is null/undefined, skipping population');
    }
  }, [initialData]);
  
  // Fetch receipt data if not provided
  useEffect(() => {
    if (!initialData && receiptId) {
      console.log('[ReceiptEditForm] No initialData, fetching receipt from API...');
      fetchReceipt();
    }
  }, [receiptId, initialData]);

  // Track form changes
  useEffect(() => {
    if (receipt) {
      const hasChanges =
        merchant !== (receipt.merchant || "") ||
        totalAmount !== (receipt.total_amount?.toString() || "") ||
        date !== formatDateForInput(receipt.date) ||
        category !== (receipt.category || "") ||
        notes !== (receipt.notes || "");
      setIsDirty(hasChanges);
    }
  }, [merchant, totalAmount, date, category, notes, receipt]);

  const fetchReceipt = async () => {
    console.log('[ReceiptEditForm] 📥 Fetching receipt from API...');
    console.log('[ReceiptEditForm] Receipt ID:', receiptId);
    
    try {
      setLoading(true);
      const data = await ReceiptsAPI.getReceipt(receiptId);
      console.log('[ReceiptEditForm] ✅ Receipt fetched:', data);
      setReceipt(data);
      
      // Populate form fields
      setMerchant(data.merchant || "");
      setTotalAmount(data.total_amount?.toString() || "");
      setDate(formatDateForInput(data.date));
      setCategory(data.category || "");
      setNotes(data.notes || "");
      
      console.log('[ReceiptEditForm] Form populated from API data');
    } catch (error: any) {
      console.error("[ReceiptEditForm] ❌ Error fetching receipt:", error);
      console.error("[ReceiptEditForm] Error details:", error.message, error.statusCode);
      toast.error("Failed to load receipt", {
        description: error.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Merchant validation
    if (!merchant || merchant.trim().length < 2) {
      newErrors.merchant = "Merchant name must be at least 2 characters";
    }

    // Amount validation
    const amount = parseCurrency(totalAmount);
    if (!totalAmount || amount <= 0) {
      newErrors.totalAmount = "Amount must be greater than 0";
    }

    // Date validation
    if (!date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.date = "Date cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log("[ReceiptEditForm] 💾 Starting save process");
    console.log("[ReceiptEditForm] Receipt ID:", receiptId);
    console.log("[ReceiptEditForm] Initial data:", initialData);
    console.log("[ReceiptEditForm] Current receipt state:", receipt);
    console.log("[ReceiptEditForm] API_URL:", process.env.NEXT_PUBLIC_API_URL);
    
    // ✅ CRITICAL: Validate receiptId before proceeding
    if (!receiptId) {
      console.error('[ReceiptEditForm] ❌ ERROR: receiptId is undefined or empty!');
      toast.error('Error: Receipt ID tidak ditemukan', {
        description: 'Tidak dapat menyimpan tanpa ID receipt'
      });
      return;
    }
    
    if (!validate()) {
      toast.error("Validation Error", {
        description: "Please fix the errors before saving",
      });
      return;
    }

    try {
      setSaving(true);

      const saveData = {
        merchant: merchant.trim(),
        total_amount: parseCurrency(totalAmount),
        date,
        category: category || null,
        notes: notes.trim() || null,
      };

      console.log("[ReceiptEditForm] Save data:", saveData);

      let savedReceipt: Receipt;

      // ✅ SMART LOGIC: Determine if this is CREATE or UPDATE
      // CREATE if: initialData exists AND receipt.id doesn't match a real UUID
      const isNewReceipt = initialData && (!receipt?.id || receipt.id === receiptId);
      
      console.log('[ReceiptEditForm] 🤔 Determining operation type:');
      console.log('[ReceiptEditForm]   - initialData exists:', !!initialData);
      console.log('[ReceiptEditForm]   - receipt?.id:', receipt?.id);
      console.log('[ReceiptEditForm]   - receiptId:', receiptId);
      console.log('[ReceiptEditForm]   - isNewReceipt:', isNewReceipt);

      // If initialData is provided and has all OCR data, this is a NEW receipt from OCR
      // We need to CREATE it, not UPDATE
      if (isNewReceipt) {
        console.log("[ReceiptEditForm] ✨ Creating NEW receipt (from OCR)");
        
        const createData = {
          ...saveData,
          user_id: initialData.user_id,
          ocr_text: initialData.ocr_text,
          ocr_confidence: initialData.ocr_confidence,
          image_path: initialData.image_path,
        };
        
        console.log("[ReceiptEditForm] Create data:", createData);
        savedReceipt = await ReceiptsAPI.createReceipt(createData);
        console.log("[ReceiptEditForm] ✅ Receipt created:", savedReceipt);
      } else {
        // This is an existing receipt, UPDATE it
        console.log("[ReceiptEditForm] 🔄 Updating existing receipt");
        console.log("[ReceiptEditForm] Update URL will be: /api/v1/receipts/" + receiptId);
        savedReceipt = await ReceiptsAPI.updateReceipt(receiptId, saveData);
        console.log("[ReceiptEditForm] ✅ Receipt updated:", savedReceipt);
      }
      
      setReceipt(savedReceipt);
      setIsDirty(false);
      
      toast.success("Receipt saved!", {
        description: "Your changes have been saved successfully",
      });

      if (onSave) {
        onSave(savedReceipt);
      }
    } catch (error: any) {
      console.error("[ReceiptEditForm] ❌ Error saving receipt:", error);
      console.error("[ReceiptEditForm] Error details:", error.message, error.statusCode);
      toast.error("Failed to save receipt", {
        description: error.message || "Please try again",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      await ReceiptsAPI.deleteReceipt(receiptId);
      
      toast.success("Receipt deleted", {
        description: "The receipt has been permanently deleted",
      });

      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      console.error("[ReceiptEditForm] Error deleting receipt:", error);
      toast.error("Failed to delete receipt", {
        description: error.message || "Please try again",
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to cancel?"
      );
      if (!confirmed) return;
    }

    if (onCancel) {
      onCancel();
    }
  };

  // Format amount with thousands separator
  const handleAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    setTotalAmount(cleaned);
  };

  // Loading state
  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground">Loading receipt...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!receipt) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Receipt Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The receipt you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={onCancel}>Go Back</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Receipt</h2>
          <p className="text-muted-foreground mt-1">
            Review and correct the extracted information
          </p>
        </div>
        {receipt.is_edited && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Edited
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Receipt Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageModal(true)}
              >
                {receipt.image_path ? (
                  <img
                    src={receipt.image_path}
                    alt="Receipt"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 hover:opacity-100 transition-opacity">
                    Click to enlarge
                  </span>
                </div>
              </div>

              {/* OCR Confidence */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">OCR Confidence</span>
                  <Badge 
                    variant={receipt.ocr_confidence >= 0.8 ? "default" : "secondary"}
                    className={
                      receipt.ocr_confidence >= 0.8
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                    }
                  >
                    {(receipt.ocr_confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      receipt.ocr_confidence >= 0.8
                        ? "bg-green-500"
                        : "bg-orange-500"
                    }`}
                    style={{ width: `${receipt.ocr_confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* OCR Info Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-4"
                onClick={() => setShowOcrInfo(!showOcrInfo)}
              >
                {showOcrInfo ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Hide OCR Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show OCR Details
                  </>
                )}
              </Button>

              {/* OCR Details */}
              {showOcrInfo && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Raw OCR Text
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-xs max-h-40 overflow-y-auto">
                      {receipt.ocr_text || "No OCR text available"}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Merchant Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Merchant / Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g., Gramedia Yogya Sudirman"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.merchant ? "border-red-500" : "border-gray-300"
                  }`}
                  autoFocus={!merchant}
                />
                {errors.merchant && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.merchant}
                  </p>
                )}
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                  <input
                    type="text"
                    value={totalAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className={`w-full pl-12 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.totalAmount ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                </div>
                {totalAmount && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatCurrency(parseCurrency(totalAmount))}
                  </p>
                )}
                {errors.totalAmount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.totalAmount}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category (optional)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {notes.length} / 500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={saving || deleting}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                  disabled={saving || deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Receipt?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this receipt? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  disabled={deleting}
                  className="flex-1"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button
              onClick={() => setShowImageModal(false)}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={receipt.image_path}
              alt="Receipt Full Size"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
