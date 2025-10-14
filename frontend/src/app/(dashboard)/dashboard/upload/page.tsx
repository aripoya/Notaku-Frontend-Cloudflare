"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Upload, X, RotateCw, Check, Loader2, FileImage, Eye } from "lucide-react";
import { toast } from "sonner";
import { mockApi } from "@/lib/mockApi";

type UploadStage = "select" | "preview" | "uploading" | "processing" | "result";

export default function UploadPage() {
  const router = useRouter();
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
    if (!selectedFile) return;

    try {
      setStage("uploading");
      setProgress(0);

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Call mock API
      const uploadResult = await mockApi.uploadReceipt(selectedFile);
      clearInterval(uploadInterval);
      setProgress(100);

      // Start processing
      setStage("processing");
      setJobId(uploadResult.jobId);

      // Poll for result
      let attempts = 0;
      const maxAttempts = 60; // 30 seconds (500ms * 60)
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          setError("Timeout: Proses terlalu lama. Silakan coba lagi.");
          setStage("select");
          toast.error("Timeout", { description: "Proses terlalu lama" });
          return;
        }

        try {
          const receipt = await mockApi.getReceipt(uploadResult.jobId);
          
          if (receipt.status === "completed") {
            clearInterval(pollInterval);
            setResult(receipt);
            setStage("result");
            toast.success("Berhasil!", { description: "Nota berhasil diproses" });
          } else if (receipt.status === "failed") {
            clearInterval(pollInterval);
            setError("Gagal memproses nota. Silakan coba lagi.");
            setStage("select");
            toast.error("Gagal", { description: "Tidak dapat memproses nota" });
          }
        } catch (err) {
          clearInterval(pollInterval);
          setError("Terjadi kesalahan. Silakan coba lagi.");
          setStage("select");
          toast.error("Error", { description: "Terjadi kesalahan" });
        }
      }, 500);

    } catch (err: any) {
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
      <div>
        <h1 className="text-3xl font-bold">Upload Nota</h1>
        <p className="text-muted-foreground mt-1">Ambil foto atau upload file nota Anda</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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

            <div className="flex gap-2">
              <Button onClick={handleUpload} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Upload & Proses
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
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Nota Berhasil Diproses!</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Data telah diekstrak dari nota Anda</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Extracted Data */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Toko</p>
                <p className="font-semibold">{result.supplier || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <p className="font-semibold">{new Date(result.date).toLocaleDateString("id-ID")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-blue-600">Rp {result.total.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Item</p>
                <p className="font-semibold">{result.items?.length || 0} item</p>
              </div>
            </div>

            {/* Items List */}
            {result.items && result.items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Daftar Item:</h4>
                <div className="space-y-2">
                  {result.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <span>{item.name} (x{item.qty})</span>
                      <span className="font-medium">Rp {item.price.toLocaleString("id-ID")}</span>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
