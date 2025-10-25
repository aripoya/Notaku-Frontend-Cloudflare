"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, X, RotateCw, Check, Loader2, FileImage, Eye, AlertCircle, Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";
import { OCRApiClient } from "@/lib/ocr-api";
import { useAuth } from "@/hooks/useAuth";
import { OcrStatusIndicator } from "@/components/OcrStatusIndicator";
import { formatIndonesianDate, formatLongDate, formatCurrency } from "@/lib/formatters";
import { SubscriptionAPI } from "@/lib/subscription-api";
import { QuotaDisplay } from "@/components/QuotaDisplay";
import { UpgradeModal } from "@/components/UpgradeModal";
import ReceiptEditForm from "@/components/ReceiptEditForm";
import type { Receipt } from "@/types/receipt";

type UploadStage = "select" | "preview" | "uploading" | "processing" | "result";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [stage, setStage] = useState<UploadStage>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [processingText, setProcessingText] = useState<string>("Membaca nota...");
  const [jobId, setJobId] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [usePremiumOCR, setUsePremiumOCR] = useState<boolean>(false);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<string>("");
  const [ocrProvider, setOcrProvider] = useState<"paddle" | "google">("paddle");

  // Check if user is premium and can use Google Vision
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user?.id) return;
      
      try {
        const canUse = await SubscriptionAPI.canUseGoogleVision(user.id);
        setIsPremiumUser(canUse);
      } catch (error) {
        console.error("[Upload] Error checking premium status:", error);
        if (user && 'is_premium' in user) {
          setIsPremiumUser((user as any).is_premium === true);
        }
      }
    };
    
    checkPremiumStatus();
  }, [user]);

  // Processing text animation
  useEffect(() => {
    if (stage === "processing") {
      const texts = [
        "Membaca nota...",
        "Mengekstrak data...",
        "Menganalisa...",
        "Hampir selesai...",
      ];
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % texts.length;
        setProcessingText(texts[index]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [stage]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File terlalu besar", { description: "Maksimal ukuran file 10MB" });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format file tidak valid", { description: "Hanya menerima .jpg, .png, .webp" });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStage("preview");
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    console.log("[Upload] 🚀 Starting upload process");
    console.log("[Upload] Selected file:", selectedFile?.name);
    console.log("[Upload] User ID:", user?.id);
    console.log("[Upload] Premium OCR:", usePremiumOCR);
    
    if (!selectedFile || !user) {
      console.error("[Upload] ❌ Missing file or user");
      return;
    }

    try {
      console.log("[Upload] Checking OCR permission...");
      const hasPermission = await SubscriptionAPI.checkOCRPermission(
        user.id,
        usePremiumOCR ? "google" : "paddle"
      );
      console.log("[Upload] Permission check result:", hasPermission);

      if (!hasPermission) {
        console.warn("[Upload] ⚠️ Permission denied");
        setUpgradeReason("OCR quota habis! Upgrade untuk melanjutkan.");
        setShowUpgradeModal(true);
        return;
      }
    } catch (error) {
      console.error("[Upload] Error checking permission:", error);
    }

    console.log("[Upload] Setting stage to 'uploading'");
    setStage("uploading");
    setProgress(0);
    setError("");

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      console.log("[Upload] Calling OCRApiClient.uploadReceipt...");
      console.log("[Upload] Using provider:", usePremiumOCR ? "google (premium)" : "paddle (standard)");
      
      let response: any;
      
      if (usePremiumOCR) {
        // Use Premium OCR (Google Vision)
        const token = localStorage.getItem('auth_token');
        console.log("[Upload] Using Premium OCR with token:", token ? 'present' : 'missing');
        response = await OCRApiClient.uploadPremiumReceipt(selectedFile, token || undefined);
        console.log("[Upload] ✅ Premium OCR response:", response);
        
        // Premium OCR returns result immediately
        clearInterval(progressInterval);
        setProgress(100);
        
        setResult(response);
        setStage("result");
        toast.success("Nota berhasil diproses!");
      } else {
        // Use Standard OCR (PaddleOCR)
        response = await OCRApiClient.uploadReceipt(selectedFile, user.id);
        console.log("[Upload] ✅ Upload response received:", response);
        console.log("[Upload] Response status:", response.status);
        console.log("[Upload] Response keys:", Object.keys(response));

        clearInterval(progressInterval);
        setProgress(100);
        console.log("[Upload] Progress set to 100%");

        // Standard OCR returns job_id for polling
        console.log("[Upload] Starting poll for job:", response.job_id);
        setJobId(response.job_id);
        setStage("processing");
        pollJobStatus(response.job_id);
      }
    } catch (err: any) {
      console.error("[Upload] ❌ Upload error:", err);
      console.error("[Upload] Error message:", err.message);
      console.error("[Upload] Error stack:", err.stack);
      setError(err.message || "Gagal mengupload nota");
      setStage("preview");
      toast.error("Upload gagal", { description: err.message });
    }
  };

  const pollJobStatus = async (jobId: string) => {
    console.log("[Poll] 🔄 Starting to poll job status for:", jobId);
    const maxAttempts = 60;
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      console.log(`[Poll] Attempt ${attempts}/${maxAttempts}`);
      
      if (attempts > maxAttempts) {
        console.error("[Poll] ❌ Timeout reached");
        clearInterval(poll);
        setError("Timeout: Proses OCR memakan waktu terlalu lama");
        setStage("preview");
        toast.error("Timeout", { description: "Silakan coba lagi" });
        return;
      }

      try {
        const status = await OCRApiClient.checkStatus(jobId);
        console.log(`[Poll] Status response:`, status);
        console.log(`[Poll] Status value:`, status.status);
        
        if (status.status === "finished") {
          console.log("[Poll] ✅ Job finished! Fetching result...");
          clearInterval(poll);
          
          const resultData = await OCRApiClient.getResult(jobId);
          console.log("[Poll] ✨ Result data received:", resultData);
          console.log("[Poll] Result keys:", Object.keys(resultData));
          console.log("[Poll] Result job_id:", resultData.job_id);
          console.log("[Poll] Result extracted:", resultData.extracted);
          console.log("[Poll] Result ocr_text:", resultData.ocr_text);
          console.log("[Poll] Result ocr_confidence:", resultData.ocr_confidence);
          
          setResult(resultData);
          console.log("[Poll] Result state updated, setting stage to 'result'");
          setStage("result");
          console.log("[Poll] Stage set to 'result'");
          toast.success("Nota berhasil diproses!");
        } else if (status.status === "failed") {
          console.error("[Poll] ❌ Job failed");
          clearInterval(poll);
          setError("OCR processing gagal");
          setStage("preview");
          toast.error("Processing gagal", { description: "Silakan coba lagi" });
        } else {
          console.log(`[Poll] Job still processing, status: ${status.status}`);
        }
      } catch (err: any) {
        console.error("[Poll] ❌ Error polling status:", err);
        clearInterval(poll);
        setError(err.message || "Gagal memeriksa status");
        setStage("preview");
      }
    }, 1000);
  };

  const handleReset = () => {
    setStage("select");
    setSelectedFile(null);
    setPreviewUrl("");
    setNotes("");
    setProgress(0);
    setJobId("");
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // ✅ HELPER: Parse OCR text to extract structured data
  const parseOcrText = (ocrText: string): { merchant: string | null; amount: number | null; date: string | null } => {
    console.log("[ParseOCR] 🔍 Parsing OCR text...");
    console.log("[ParseOCR] Input:", ocrText);
    
    let merchant: string | null = null;
    let amount: number | null = null;
    let date: string | null = null;
    
    if (!ocrText) return { merchant, amount, date };
    
    // Parse merchant (usually first few lines, look for common patterns)
    const lines = ocrText.split('\n').filter(line => line.trim());
    console.log("[ParseOCR] Lines:", lines);
    
    // Try to find merchant name (usually first non-short line that's not a number)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 5 && !/^\d+$/.test(line) && !line.match(/^www\./i)) {
        merchant = line;
        console.log("[ParseOCR] Found merchant:", merchant);
        break;
      }
    }
    
    // Parse amount (look for "Rp" or "IDR" followed by numbers)
    const amountPatterns = [
      /(?:Rp|IDR|Total)[:\s]*([0-9,\.]+)/gi,
      /([0-9]{3,})[,\.]?(\d{3})?[,\.]?(\d{3})?/g,
    ];
    
    for (const pattern of amountPatterns) {
      const matches = ocrText.matchAll(pattern);
      for (const match of matches) {
        const amountStr = match[1] || match[0];
        const cleaned = amountStr.replace(/[^0-9]/g, '');
        const parsed = parseInt(cleaned);
        if (parsed > 100 && parsed < 100000000) { // Reasonable amount range
          amount = parsed;
          console.log("[ParseOCR] Found amount:", amount);
          break;
        }
      }
      if (amount) break;
    }
    
    // Parse date (look for DD/MM/YYYY or YYYY-MM-DD format)
    const datePatterns = [
      /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/,    // YYYY-MM-DD
      /(\d{2})-(\d{2})-(\d{4})/,    // DD-MM-YYYY
    ];
    
    for (const pattern of datePatterns) {
      const match = ocrText.match(pattern);
      if (match) {
        if (pattern.source.startsWith('(\\d{4})')) {
          // YYYY-MM-DD
          date = match[0];
        } else {
          // DD/MM/YYYY or DD-MM-YYYY -> convert to YYYY-MM-DD
          const day = match[1];
          const month = match[2];
          const year = match[3];
          date = `${year}-${month}-${day}`;
        }
        console.log("[ParseOCR] Found date:", date);
        break;
      }
    }
    
    console.log("[ParseOCR] ✅ Parsed result:", { merchant, amount, date });
    return { merchant, amount, date };
  };

  const mapResultToReceipt = (): Receipt => {
    console.log("[MapResult] 🗺️ Mapping result to Receipt format");
    console.log("[MapResult] Input result:", result);
    console.log("[MapResult] Result type:", typeof result);
    console.log("[MapResult] Result keys:", result ? Object.keys(result) : 'null');
    
    if (!result) {
      console.warn("[MapResult] ⚠️ No result data, returning empty receipt");
      return {
        id: "",
        user_id: user?.id || "",
        merchant: null,
        total_amount: null,
        date: null,
        category: null,
        notes: null,
        ocr_text: "",
        ocr_confidence: 0,
        image_path: "",
        is_edited: false,
        created_at: new Date().toISOString(),
      };
    }

    // Handle different response formats (Premium vs Standard OCR)
    const extracted = result.extracted || {};
    console.log("[MapResult] 📦 Extracted object:", extracted);
    console.log("[MapResult] Extracted keys:", extracted ? Object.keys(extracted) : 'no extracted');
    console.log("[MapResult] Extracted JSON:", JSON.stringify(extracted, null, 2));
    
    // ✅ EXPANDED: Try ALL possible field name variations
    const merchantOptions = [
      // From extracted object
      extracted.merchant,
      extracted.merchant_name,
      extracted.merchantName,
      extracted.supplier,
      extracted.store,
      extracted.store_name,
      extracted.storeName,
      extracted.vendor,
      // From result object directly
      result.merchant,
      result.merchant_name,
      result.merchantName,
      result.supplier,
      result.store,
      result.store_name,
      result.storeName,
      result.vendor,
    ];
    
    const amountOptions = [
      // From extracted object
      extracted.total_amount,
      extracted.totalAmount,
      extracted.total,
      extracted.grand_total,
      extracted.grandTotal,
      extracted.amount,
      extracted.price,
      extracted.sum,
      // From result object directly
      result.total_amount,
      result.totalAmount,
      result.total,
      result.grand_total,
      result.grandTotal,
      result.amount,
      result.price,
      result.sum,
    ];
    
    const dateOptions = [
      // From extracted object
      extracted.date,
      extracted.transaction_date,
      extracted.transactionDate,
      extracted.receipt_date,
      extracted.receiptDate,
      extracted.purchase_date,
      extracted.purchaseDate,
      // From result object directly
      result.date,
      result.transaction_date,
      result.transactionDate,
      result.receipt_date,
      result.receiptDate,
      result.purchase_date,
      result.purchaseDate,
    ];
    
    console.log("[MapResult] 🔍 Trying merchant from:", merchantOptions);
    console.log("[MapResult] 🔍 Trying amount from:", amountOptions);
    console.log("[MapResult] 🔍 Trying date from:", dateOptions);
    
    const finalMerchant = merchantOptions.find(v => v != null && v !== "") || null;
    const finalAmount = amountOptions.find(v => v != null && v !== 0 && v !== "") || null;
    const finalDate = dateOptions.find(v => v != null && v !== "") || null;
    
    console.log("[MapResult] ✅ Final values from extracted object:");
    console.log("[MapResult]   - merchant:", finalMerchant);
    console.log("[MapResult]   - total_amount:", finalAmount);
    console.log("[MapResult]   - date:", finalDate);
    
    // ✅ FALLBACK: If extracted values are null, parse OCR text
    let useMerchant = finalMerchant;
    let useAmount = finalAmount;
    let useDate = finalDate;
    
    if (!finalMerchant || !finalAmount || !finalDate) {
      console.log("[MapResult] ⚠️ Some fields are null, trying to parse OCR text...");
      const ocrText = result.ocr_text || result.ocrText || "";
      const parsed = parseOcrText(ocrText);
      
      useMerchant = finalMerchant || parsed.merchant;
      useAmount = finalAmount || parsed.amount;
      useDate = finalDate || parsed.date;
      
      console.log("[MapResult] 🔧 After OCR text parsing:");
      console.log("[MapResult]   - merchant:", useMerchant);
      console.log("[MapResult]   - total_amount:", useAmount);
      console.log("[MapResult]   - date:", useDate);
    }
    
    // ✅ Date fallback: Use current date if still null
    if (!useDate) {
      console.warn("[MapResult] ⚠️ WARNING: date is null, using current date as fallback");
      useDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    const mappedReceipt = {
      id: result.job_id || result.id || result.receipt_id || "",
      user_id: user?.id || "",
      merchant: useMerchant,
      total_amount: useAmount,
      date: useDate,
      category: null,
      notes: notes || null,
      ocr_text: result.ocr_text || result.ocrText || "",
      ocr_confidence: result.ocr_confidence || result.confidence || 0,
      image_path: result.image_path || previewUrl || "",
      is_edited: false,
      created_at: new Date().toISOString(),
    };
    
    console.log("[MapResult] ✅ Mapped receipt:", mappedReceipt);
    console.log("[MapResult] Full mapped object:", JSON.stringify(mappedReceipt, null, 2));
    
    // ⚠️ CRITICAL CHECK: Warn if final values are still null after parsing
    if (!useMerchant) {
      console.error("[MapResult] ❌ WARNING: merchant is STILL NULL after parsing!");
      console.error("[MapResult] ❌ Backend doesn't provide structured data");
      console.error("[MapResult] ❌ OCR text parsing also failed");
    }
    if (!useAmount) {
      console.error("[MapResult] ❌ WARNING: total_amount is STILL NULL after parsing!");
      console.error("[MapResult] ❌ Backend doesn't provide structured data");
      console.error("[MapResult] ❌ OCR text parsing also failed");
    }
    
    console.log("[MapResult] 🎯 RETURNING mapped receipt to ReceiptEditForm");
    
    return mappedReceipt;
  };

  const handleSaveReceipt = (receipt: Receipt) => {
    toast.success("Nota berhasil disimpan!", {
      description: `${receipt.merchant || "Nota"} telah tersimpan`,
    });
    
    setTimeout(() => {
      handleReset();
    }, 1500);
  };

  const handleCancelEdit = () => {
    handleReset();
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Upload Nota</h1>
        <p className="text-muted-foreground">
          Foto atau upload nota belanja Anda untuk otomatis mencatat pengeluaran
        </p>
      </div>

      {user && (
        <div className="mb-6">
          <QuotaDisplay userId={user.id} />
        </div>
      )}

      <div className="mb-6">
        <OcrStatusIndicator />
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />

      {stage === "select" && (
        <Card className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <FileImage className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pilih Nota</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Ambil foto atau upload gambar nota Anda
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                className="h-32 flex flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-8 w-8" />
                <span>Ambil Foto</span>
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraCapture}
              />

              <Button
                variant="outline"
                size="lg"
                className="h-32 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8" />
                <span>Upload File</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Format: JPG, PNG, WEBP • Maksimal: 10MB
            </div>
          </div>
        </Card>
      )}

      {stage === "preview" && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview Nota</span>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full max-h-96 overflow-hidden rounded-lg border">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto object-contain"
                />
              </div>

              {isPremiumUser && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-900">Google Vision API</p>
                      <p className="text-xs text-amber-700">Akurasi lebih tinggi untuk nota Anda</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usePremiumOCR}
                      onChange={(e) => setUsePremiumOCR(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </Button>
                <Button onClick={handleUpload} className="flex-1">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Proses Nota
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stage === "uploading" && (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Mengupload Nota...</h3>
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-muted-foreground">{progress}%</p>
            </div>
          </div>
        </Card>
      )}

      {stage === "processing" && (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <Sparkles className="absolute top-0 right-1/3 h-4 w-4 text-yellow-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{processingText}</h3>
              <p className="text-sm text-muted-foreground">
                {usePremiumOCR ? "Menggunakan Google Vision API" : "Menggunakan PaddleOCR"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {stage === "result" && result && (
        <div className="space-y-4">
          {/* Debug Info Card */}
          <Card className="p-4 bg-yellow-50 border-2 border-yellow-300">
            <div className="text-xs font-mono space-y-1">
              <p className="font-bold text-yellow-800">🐛 DEBUG INFO:</p>
              <p>Stage: <span className="font-bold">{stage}</span></p>
              <p>Result exists: <span className="font-bold">{result ? 'YES' : 'NO'}</span></p>
              <p>Job ID: <span className="font-bold">{result?.job_id || result?.id || result?.receipt_id || 'MISSING'}</span></p>
              <p>Merchant: <span className="font-bold">{result?.extracted?.merchant || result?.supplier || result?.merchant || 'N/A'}</span></p>
              <p>Total: <span className="font-bold">{result?.extracted?.total_amount || result?.total || result?.total_amount || 0}</span></p>
              <p>Date: <span className="font-bold">{result?.extracted?.date || result?.date || 'N/A'}</span></p>
              <p>Confidence: <span className="font-bold">{result?.ocr_confidence || result?.confidence || 0}</span></p>
              <p>Result keys: <span className="font-bold">{result ? Object.keys(result).join(', ') : 'none'}</span></p>
            </div>
          </Card>
          
          <Card className="p-4 border-2 border-green-500 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Nota Berhasil Diproses!</h3>
                <p className={`text-sm ${result.isPremium ? 'text-amber-700' : 'text-green-700'}`}>
                  {result.isPremium ? 'Diproses dengan Google Vision API' : 'Data telah diekstrak dari nota Anda'}
                </p>
              </div>
              {(result.confidence !== undefined || result.ocr_confidence !== undefined) && (
                <div className={`text-2xl font-bold ${result.isPremium ? 'text-amber-600' : 'text-green-600'}`}>
                  {Math.round((result.confidence || result.ocr_confidence || 0) * 100)}%
                </div>
              )}
            </div>
          </Card>

          {/* Conditional rendering based on receipt ID */}
          {(result.job_id || result.id || result.receipt_id) ? (
            <ReceiptEditForm
              receiptId={result.job_id || result.id || result.receipt_id || ""}
              initialData={mapResultToReceipt()}
              onSave={handleSaveReceipt}
              onCancel={handleCancelEdit}
            />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-bold mb-2">Error: Receipt ID tidak ditemukan</p>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
