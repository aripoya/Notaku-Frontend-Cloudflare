"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Download, UploadCloud, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OCRResult as OCRResultType } from "@/types/ocr";
import { OCRApiClient } from "@/lib/ocr-api";

interface OCRResultProps {
  jobId: string;
  onNewUpload: () => void;
  onError: (error: string) => void;
}

export default function OCRResult({ jobId, onNewUpload, onError }: OCRResultProps) {
  const [result, setResult] = useState<OCRResultType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await OCRApiClient.getResult(jobId);
        setResult(data);
      } catch (error) {
        console.error('Failed to fetch result:', error);
        onError(error instanceof Error ? error.message : 'Gagal mengambil hasil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [jobId, onError]);

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "text-slate-500";
    if (confidence >= 95) return "text-green-600";
    if (confidence >= 85) return "text-blue-600";
    if (confidence >= 75) return "text-orange-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return "Unknown";
    if (confidence >= 95) return "Sangat Baik";
    if (confidence >= 85) return "Baik";
    if (confidence >= 75) return "Cukup";
    return "Rendah";
  };

  const handleCopyText = async () => {
    if (!result?.ocr_text) return;
    
    try {
      await navigator.clipboard.writeText(result.ocr_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadJSON = () => {
    if (!result) return;

    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ocr-result-${jobId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Tidak ada hasil</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">OCR Selesai!</h3>
            <p className="text-sm text-muted-foreground">
              Receipt ID: {result.receipt_id}
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Confidence</span>
              <Badge variant="outline" className={getConfidenceColor(result.ocr_confidence)}>
                {getConfidenceLabel(result.ocr_confidence)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    result.ocr_confidence && result.ocr_confidence >= 95
                      ? "bg-green-500"
                      : result.ocr_confidence && result.ocr_confidence >= 85
                      ? "bg-blue-500"
                      : result.ocr_confidence && result.ocr_confidence >= 75
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${result.ocr_confidence || 0}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${getConfidenceColor(result.ocr_confidence)}`}>
                {result.ocr_confidence?.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Processing Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Waktu Proses</span>
            </div>
            <p className="text-2xl font-bold">
              {result.processing_time_ms}
              <span className="text-sm font-normal text-muted-foreground ml-1">ms</span>
            </p>
          </div>
        </div>

        {/* OCR Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Teks Hasil OCR</h4>
            <Badge variant="secondary">{result.line_count} baris</Badge>
          </div>
          <div className="relative">
            <pre className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm overflow-x-auto max-h-64 overflow-y-auto">
              {result.ocr_text || "Tidak ada teks terdeteksi"}
            </pre>
          </div>
        </div>

        {/* Extracted Data */}
        {result.extracted && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Data Terekstrak
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {result.extracted.merchant && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-muted-foreground mb-1">Merchant</p>
                  <p className="font-medium">{result.extracted.merchant}</p>
                </div>
              )}
              {result.extracted.total_amount && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-muted-foreground mb-1">Total</p>
                  <p className="font-medium">
                    Rp {result.extracted.total_amount.toLocaleString('id-ID')}
                  </p>
                </div>
              )}
              {result.extracted.date && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-muted-foreground mb-1">Tanggal</p>
                  <p className="font-medium">{result.extracted.date}</p>
                </div>
              )}
              {result.extracted.category && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-muted-foreground mb-1">Kategori</p>
                  <p className="font-medium">{result.extracted.category}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {result.error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleCopyText}
            disabled={!result.ocr_text}
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Tersalin!" : "Salin Teks"}
          </Button>
          <Button variant="outline" onClick={handleDownloadJSON}>
            <Download className="h-4 w-4 mr-2" />
            Download JSON
          </Button>
          <Button onClick={onNewUpload} className="bg-blue-600 hover:bg-blue-700">
            <UploadCloud className="h-4 w-4 mr-2" />
            Upload Baru
          </Button>
        </div>
      </div>
    </Card>
  );
}
