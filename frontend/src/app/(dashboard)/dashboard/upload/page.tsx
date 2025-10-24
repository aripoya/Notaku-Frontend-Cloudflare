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
        // Fallback to user object check
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
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File terlalu besar", { description: "Maksimal ukuran file 10MB" });
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format file tidak valid", { description: "Hanya menerima .jpg, .png, .webp" });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStage("preview");
    setError("");
  };

  // Handle drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;

    try {
      setStage("uploading");
      setProgress(0);
      setError("");

      // Determine OCR provider
      const provider = usePremiumOCR ? "google" : "paddle";
      
      // Check permission BEFORE upload (skip if API not available)
      try {
        console.log("[Upload] Checking permission for provider:", provider);
        const permission = await SubscriptionAPI.checkOCRPermission(user.id, provider);
        
        if (!permission.allowed) {
          console.log("[Upload] Permission denied:", permission.message);
          setUpgradeReason(permission.message || "Quota limit reached. Please upgrade your plan.");
          setShowUpgradeModal(true);
          setStage("select");
          toast.error("Upload Blocked", {
            description: permission.message || "Quota limit reached"
          });
          return;
        }
        
        console.log("[Upload] Permission granted, proceeding with upload");
      } catch (permError: any) {
        console.warn("[Upload] Permission check failed (API not available), allowing upload:", permError.message);
        // Continue with upload even if permission check fails
        // This allows the app to work without subscription backend
      }

      // Check if using Premium OCR
      if (usePremiumOCR) {
        console.log("[OCR] Using Premium OCR (Google Vision)");
        
        // Get auth token
        const token = localStorage.getItem('auth_token');
        
        // Upload to Premium OCR API
        console.log("[OCR] Uploading file to Premium OCR:", selectedFile.name);
        const premiumResult = await OCRApiClient.uploadPremiumReceipt(selectedFile, token || undefined);
        
        console.log("[OCR] Premium OCR result:", premiumResult);
        setProgress(100);
        
        // Premium OCR returns result immediately
        setStage("result");
        setResult({
          id: premiumResult.job_id,
          supplier: premiumResult.extracted?.merchant || "Tidak Terdeteksi",
          date: premiumResult.extracted?.date || new Date().toISOString(),
          total: premiumResult.extracted?.total_amount || 0,
          items: [],
          confidence: premiumResult.ocr_confidence || 0,
          ocrText: premiumResult.ocr_text,
          rawData: premiumResult,
          isPremium: true,
          ocrMethod: 'google_vision'
        });
        
        toast.success("Berhasil!", { 
          description: `Premium OCR selesai dengan confidence ${Math.round((premiumResult.ocr_confidence || 0) * 100)}%` 
        });
        return;
      }

      // Standard OCR flow
      console.log("[OCR] Using Standard OCR");
      console.log("[OCR] Uploading file:", selectedFile.name);
      const uploadResult = await OCRApiClient.uploadReceipt(selectedFile, user?.id);
      
      console.log("[OCR] Upload response:", uploadResult);
      setProgress(100);
      setJobId(uploadResult.job_id);

      // Start processing
      setStage("processing");
      toast.info("Memproses...", { description: "Menganalisa nota Anda" });

      // Poll for result with status updates
      await OCRApiClient.pollStatus(
        uploadResult.job_id,
        (status) => {
          console.log("[OCR] Status update:", status);
          
          // Update processing text based on status
          if (status.status === "started") {
            setProcessingText("Menganalisa nota...");
          } else if (status.status === "queued") {
            setProcessingText("Menunggu antrian...");
          }
        },
        1000 // Poll every 1 second
      );

      // Get final result
      const ocrResult = await OCRApiClient.getResult(uploadResult.job_id);
      console.log("[OCR] Final result:", ocrResult);
      console.log("[OCR] Extracted data:", ocrResult.extracted);
      console.log("[OCR] Available keys:", Object.keys(ocrResult));
      
      // Transform OCR result to match UI format
      const extractedData = ocrResult.extracted || {};
      console.log("[OCR] Extracted keys:", Object.keys(extractedData));
      console.log("[OCR] Merchant:", extractedData.merchant, extractedData.merchant_name);
      console.log("[OCR] Date:", extractedData.date, extractedData.transaction_date);
      console.log("[OCR] Total:", extractedData.total_amount, extractedData.total, extractedData.grand_total);
      
      const transformedResult = {
        id: uploadResult.job_id,
        supplier: extractedData.merchant || extractedData.merchant_name || "N/A",
        date: extractedData.date || extractedData.transaction_date || new Date().toISOString(),
        total: extractedData.total_amount || extractedData.total || extractedData.grand_total || 0,
        items: [], // OCR API doesn't provide line items yet
        confidence: ocrResult.ocr_confidence || 0,
        ocrText: ocrResult.ocr_text,
        rawData: ocrResult,
      };

      setResult(transformedResult);
      setStage("result");
      toast.success("Berhasil!", { 
        description: `Nota berhasil diproses (Confidence: ${Math.round((ocrResult.ocr_confidence || 0) * 100)}%)` 
      });

    } catch (err: any) {
      console.error("[OCR] Upload error:", err);
      setError(err?.message || "Terjadi kesalahan saat upload");
      setStage("select");
      toast.error("Upload gagal", { description: err?.message });
    }
  };

  // Reset
  const handleReset = () => {
    setStage("select");
    setSelectedFile(null);
    setPreviewUrl("");
    setNotes("");
    setProgress(0);
    setJobId("");
    setResult(null);
    setError("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload Nota</h1>
          <p className="text-muted-foreground mt-1">Ambil foto atau upload file nota Anda</p>
        </div>
        <OcrStatusIndicator />
      </div>

      {/* Quota Display */}
      {user?.id && (
        <QuotaDisplay 
          userId={user.id} 
          onUpgradeClick={() => setShowUpgradeModal(true)}
        />
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={user && 'subscription_tier' in user ? (user as any).subscription_tier : 'free'}
        reason={upgradeReason}
      />

      {/* Select Stage */}
      {stage === "select" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera Capture */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Ambil Foto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <Camera className="h-16 w-16 text-slate-400 mb-4" />
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Gunakan kamera perangkat Anda
                </p>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <Button onClick={() => cameraInputRef.current?.click()} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Buka Kamera
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="h-16 w-16 text-slate-400 mb-4" />
                <p className="text-sm font-medium mb-1">Drag & drop file di sini</p>
                <p className="text-xs text-muted-foreground mb-4">atau klik untuk pilih file</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (max 10MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Stage */}
      {stage === "preview" && previewUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview Nota</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <img src={previewUrl} alt="Preview" className="w-full max-h-96 object-contain rounded-lg border" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Input
                id="notes"
                placeholder="Tambahkan catatan untuk nota ini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Premium OCR Toggle */}
            <div className="space-y-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <Label htmlFor="premium-ocr" className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Premium OCR (Google Vision)
                  </Label>
                  {isPremiumUser && (
                    <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="premium-ocr"
                    type="checkbox"
                    checked={usePremiumOCR}
                    onChange={(e) => {
                      if (!isPremiumUser && e.target.checked) {
                        toast.error("Premium Required", {
                          description: "Upgrade to Premium to use Google Vision OCR"
                        });
                        return;
                      }
                      setUsePremiumOCR(e.target.checked);
                    }}
                    disabled={!isPremiumUser}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {isPremiumUser ? (
                  usePremiumOCR ? (
                    <>✨ Menggunakan Google Vision API untuk akurasi maksimal dan hasil instan</>
                  ) : (
                    <>Aktifkan untuk hasil OCR yang lebih akurat dan cepat</>
                  )
                ) : (
                  <>🔒 Upgrade ke Premium untuk akses Google Vision OCR dengan akurasi hingga 99%</>
                )}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                className={`flex-1 ${usePremiumOCR ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700' : ''}`}
              >
                {usePremiumOCR ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upload dengan Premium OCR
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Proses
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploading Stage */}
      {stage === "uploading" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
              <h3 className="text-lg font-semibold">Mengunggah...</h3>
              <Progress value={progress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground">{progress}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Stage */}
      {stage === "processing" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
              <h3 className="text-xl font-semibold">{processingText}</h3>
              <p className="text-sm text-muted-foreground">Mohon tunggu, ini mungkin memakan waktu beberapa detik...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Stage */}
      {stage === "result" && result && (
        <div className="space-y-4">
          {/* Success Header */}
          <Card className={`p-4 ${result.isPremium ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.isPremium ? (
                  <Sparkles className="h-6 w-6 text-amber-600" />
                ) : (
                  <Check className="h-6 w-6 text-green-600" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-xl font-semibold ${result.isPremium ? 'text-amber-900' : 'text-green-900'}`}>
                      Nota Berhasil Diproses!
                    </h2>
                    {result.isPremium && (
                      <Badge className="bg-amber-600 hover:bg-amber-700">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium OCR
                      </Badge>
                    )}
                  </div>
                  <p className={`text-sm ${result.isPremium ? 'text-amber-700' : 'text-green-700'}`}>
                    {result.isPremium ? 'Diproses dengan Google Vision API' : 'Data telah diekstrak dari nota Anda'}
                  </p>
                </div>
              </div>
              {result.confidence !== undefined && (
                <div className={`text-2xl font-bold ${result.isPremium ? 'text-amber-600' : 'text-green-600'}`}>
                  {Math.round(result.confidence * 100)}%
                </div>
              )}
            </div>
          </Card>

          {/* KEY INFORMATION CARD - PROMINENT */}
          <Card className="p-6 border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-lg">
            <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
              <span className="text-lg">📋</span>
              Informasi Utama
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Merchant - Large & Bold */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xl">🏪</span>
                  <div className="text-xs text-gray-500">Toko</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 min-h-[2rem] flex items-center justify-center">
                  {result.supplier && result.supplier !== "N/A" ? (
                    result.supplier
                  ) : (
                    <span className="text-gray-400 text-lg">Tidak Terdeteksi</span>
                  )}
                </div>
              </div>

              {/* Date - Large & Colored */}
              <div className="text-center md:border-x border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xl">📅</span>
                  <div className="text-xs text-gray-500">Tanggal</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatIndonesianDate(result.date)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatLongDate(result.date)}
                </div>
              </div>

              {/* Total - VERY LARGE & Prominent */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xl">💰</span>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-3xl font-black text-green-600">
                  {result.total && result.total > 0 ? (
                    formatCurrency(result.total)
                  ) : (
                    <span className="text-gray-400 text-xl">Rp 0</span>
                  )}
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <Badge variant={result.supplier && result.supplier !== "N/A" ? "default" : "destructive"} className="text-xs">
                {result.supplier && result.supplier !== "N/A" ? "✓ Toko Terdeteksi" : "⚠ Toko Tidak Terdeteksi"}
              </Badge>
              
              <Badge variant={result.date ? "default" : "destructive"} className="text-xs">
                {result.date ? "✓ Tanggal Terdeteksi" : "⚠ Tanggal Tidak Terdeteksi"}
              </Badge>
              
              <Badge variant={result.total && result.total > 0 ? "default" : "destructive"} className="text-xs">
                {result.total && result.total > 0 ? "✓ Total Terdeteksi" : "⚠ Total Tidak Terdeteksi"}
              </Badge>
            </div>
          </Card>

          {/* Warning Card for Missing Data */}
          {(!result.supplier || result.supplier === "N/A" || !result.total || result.total === 0) && (
            <Card className="p-4 border-2 border-orange-400 bg-orange-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-800 mb-2">
                    Beberapa Data Tidak Terdeteksi
                  </h4>
                  <div className="text-sm text-orange-700 space-y-1">
                    {(!result.supplier || result.supplier === "N/A") && <div>• Nama toko tidak ditemukan</div>}
                    {(!result.total || result.total === 0) && <div>• Total pembelian tidak ditemukan</div>}
                  </div>
                  <p className="text-xs text-orange-600 mt-3">
                    Anda dapat melihat teks OCR di bawah untuk melengkapi data secara manual.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Detailed Information Card */}
          <Card className="p-6">
            <div className="space-y-4">

            {/* OCR Text */}
            {result.ocrText && (
              <div>
                <h4 className="font-semibold mb-2">Teks yang Terdeteksi:</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg max-h-48 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">{result.ocrText}</pre>
                </div>
              </div>
            )}

            {/* Items List */}
            {result.items && result.items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Daftar Item:</h4>
                <div className="space-y-2">
                  {result.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <span>{item.name} (x{item.qty})</span>
                      <span className="font-medium">{formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={() => router.push(`/dashboard/receipts?id=${result.id}`)} className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </Button>
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Upload Lagi
              </Button>
            </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
