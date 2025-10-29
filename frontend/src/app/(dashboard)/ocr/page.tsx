"use client";

import { useState } from "react";
import { FileText, AlertCircle } from "lucide-react";
import OCRUpload from "@/components/ocr/OCRUpload";
import OCRStatus from "@/components/ocr/OCRStatus";
import OCRResult from "@/components/ocr/OCRResult";
import StatsCard from "@/components/ocr/StatsCard";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ViewState = "upload" | "processing" | "result";

export default function OCRPage() {
  const [currentView, setCurrentView] = useState<ViewState>("upload");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = (jobId: string) => {
    setCurrentJobId(jobId);
    setCurrentView("processing");
    setError(null);
  };

  const handleProcessingComplete = (jobId: string) => {
    setCurrentView("result");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleNewUpload = () => {
    setCurrentView("upload");
    setCurrentJobId(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          NOTAKU OCR
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload struk belanja dan ekstrak data secara otomatis dengan AI
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload/Status/Result */}
        <div className="lg:col-span-2 space-y-6">
          {currentView === "upload" && (
            <OCRUpload
              onUploadSuccess={handleUploadSuccess}
              onError={handleError}
            />
          )}

          {currentView === "processing" && currentJobId && (
            <OCRStatus
              jobId={currentJobId}
              onComplete={handleProcessingComplete}
              onError={handleError}
            />
          )}

          {currentView === "result" && currentJobId && (
            <OCRResult
              jobId={currentJobId}
              onNewUpload={handleNewUpload}
              onError={handleError}
            />
          )}
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          <StatsCard workers={15} requestsPerSecond={21} activeJobs={0} />

          {/* Info Card */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Gunakan foto yang jelas dan terang</li>
              <li>• Pastikan teks struk terbaca</li>
              <li>• Format JPG atau PNG</li>
              <li>• Maksimal ukuran 10MB</li>
            </ul>
          </div>

          {/* Features */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
            <h4 className="font-semibold mb-3">Fitur OCR</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Ekstraksi teks otomatis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Deteksi merchant & total</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Confidence score tinggi (98%+)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Proses cepat (~233ms)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Export JSON & copy text</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-muted-foreground pt-6 border-t border-slate-200 dark:border-slate-700">
        <p>
          Powered by Notaku AI • 15 Workers • ~21 requests/second
        </p>
      </div>
    </div>
  );
}
