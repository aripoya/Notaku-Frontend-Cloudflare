import { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  Store,
  RotateCcw,
} from "lucide-react";
import { useFileUpload } from "@/hooks/useApi";
import { Receipt } from "@/types/api";
import { toast } from "sonner";
import ErrorMessage from "./components/ErrorMessage";
import ProgressBar from "./components/ProgressBar";
import Spinner from "./components/Spinner";

/**
 * Receipt upload with OCR processing demonstration
 * Features: drag-and-drop, preview, progress tracking, OCR results display
 */
export default function ReceiptUploadExample() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<Receipt | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadReceipt, uploading, progress, error } = useFileUpload({
    onSuccess: (receipt) => {
      setOcrResult(receipt as Receipt);
      toast.success("Receipt processed successfully!");
    },
    onError: (err) => {
      toast.error("Upload failed: " + err.message);
    },
  });

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return "Please select an image file (JPG, PNG, etc.)";
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setSelectedFile(file);
    setOcrResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle upload
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadReceipt(selectedFile, {
        currency: "IDR",
      });
    } catch (err) {
      // Error already handled by hook
    }
  };

  /**
   * Reset form
   */
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Receipt OCR Upload
          </h1>
          <p className="text-slate-600">
            Upload a receipt image and let AI extract the data automatically
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Upload Section */}
          {!ocrResult && (
            <div className="p-8">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                  disabled={uploading}
                />

                {!preview ? (
                  <>
                    <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Upload Receipt Image
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Drag and drop your receipt here, or click to browse
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      Select File
                    </button>
                    <p className="text-xs text-slate-500 mt-4">
                      Supported formats: JPG, PNG • Max size: 10MB
                    </p>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Preview */}
                    <div className="relative inline-block">
                      <img
                        src={preview}
                        alt="Receipt preview"
                        className="max-h-64 rounded-lg shadow-md"
                      />
                      {!uploading && (
                        <button
                          onClick={handleReset}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                      <ImageIcon className="h-4 w-4" />
                      <span>{selectedFile?.name}</span>
                      <span>•</span>
                      <span>
                        {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                      <div className="space-y-4">
                        <ProgressBar progress={progress} />
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                          <Spinner size="sm" />
                          <span className="font-medium">
                            Processing OCR... This may take 2-5 seconds
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <ErrorMessage
                        error={error}
                        title="Upload Failed"
                        onRetry={handleUpload}
                      />
                    )}

                    {/* Upload Button */}
                    {!uploading && !error && (
                      <div className="flex gap-3">
                        <button
                          onClick={handleUpload}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-semibold flex items-center justify-center gap-2"
                        >
                          <Upload className="h-5 w-5" />
                          <span>Upload & Process</span>
                        </button>
                        <button
                          onClick={handleReset}
                          className="px-6 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OCR Results */}
          {ocrResult && (
            <div className="p-8">
              {/* Success Header */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Receipt Processed!
                  </h2>
                  <p className="text-sm text-slate-600">
                    OCR extraction completed successfully
                  </p>
                </div>
              </div>

              {/* Preview Image */}
              {preview && (
                <div className="mb-6 text-center">
                  <img
                    src={preview}
                    alt="Processed receipt"
                    className="max-h-48 rounded-lg shadow-md inline-block"
                  />
                </div>
              )}

              {/* Extracted Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Merchant Name */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Store className="h-4 w-4" />
                    <span className="font-medium">Merchant</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {ocrResult.merchantName || "Not detected"}
                  </p>
                </div>

                {/* Total Amount */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">Total Amount</span>
                  </div>
                  <p className="text-lg font-semibold text-green-900">
                    Rp {ocrResult.totalAmount.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Transaction Date */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Date</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-900">
                    {new Date(ocrResult.transactionDate).toLocaleDateString(
                      "id-ID",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>

                {/* Confidence Score */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Confidence</span>
                  </div>
                  <p className="text-lg font-semibold text-purple-900">
                    {((ocrResult.ocrData.confidence || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Items Table */}
              {ocrResult.ocrData.items && ocrResult.ocrData.items.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Extracted Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                            Item
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                            Price
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {ocrResult.ocrData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-900">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 text-center">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 text-right">
                              Rp {item.price.toLocaleString("id-ID")}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                              Rp {item.total.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Raw OCR Text (Collapsible) */}
              {ocrResult.ocrData.rawText && (
                <details className="mb-6">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 mb-2">
                    View Raw OCR Text
                  </summary>
                  <pre className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600 overflow-auto max-h-48 border border-slate-200">
                    {ocrResult.ocrData.rawText}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Upload Another</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Easy Upload</h3>
            <p className="text-sm text-slate-600">
              Drag and drop or click to upload receipt images
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">AI Powered</h3>
            <p className="text-sm text-slate-600">
              Advanced OCR extracts data automatically
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Fast Processing</h3>
            <p className="text-sm text-slate-600">
              Results ready in 2-5 seconds with high accuracy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
