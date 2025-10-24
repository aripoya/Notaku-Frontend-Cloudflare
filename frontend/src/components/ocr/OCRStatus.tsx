"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobStatus } from "@/types/ocr";
import { OCRApiClient } from "@/lib/ocr-api";

interface OCRStatusProps {
  jobId: string;
  onComplete: (jobId: string) => void;
  onError: (error: string) => void;
}

export default function OCRStatus({ jobId, onComplete, onError }: OCRStatusProps) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;

    const startPolling = async () => {
      try {
        await OCRApiClient.pollStatus(
          jobId,
          (updatedStatus) => {
            setStatus(updatedStatus);
            
            if (updatedStatus.status === 'finished') {
              onComplete(jobId);
            } else if (updatedStatus.status === 'failed') {
              onError('OCR processing gagal');
            }
          },
          500 // Poll every 500ms
        );
      } catch (error) {
        console.error('Polling error:', error);
        onError(error instanceof Error ? error.message : 'Gagal mengecek status');
      }
    };

    // Start polling
    startPolling();

    // Start elapsed time counter
    timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 100);
    }, 100);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [jobId, onComplete, onError]);

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'queued':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'started':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'finished':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status?.status) {
      case 'queued':
        return <Badge variant="secondary">Dalam Antrian</Badge>;
      case 'started':
        return <Badge className="bg-blue-500">Memproses...</Badge>;
      case 'finished':
        return <Badge className="bg-green-500">Selesai</Badge>;
      case 'failed':
        return <Badge variant="destructive">Gagal</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold">Status Pemrosesan</h3>
              <p className="text-sm text-muted-foreground">Job ID: {jobId.slice(0, 8)}...</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Progress Info */}
        <div className="space-y-2">
          {status?.status === 'started' && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <p className="text-sm text-muted-foreground">
                Sedang mengekstrak teks dari struk...
              </p>
            </div>
          )}

          {/* Elapsed Time */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Waktu Proses:</span>
            <span className="font-mono font-medium">{formatTime(elapsedTime)}</span>
          </div>

          {/* Timestamps */}
          {status?.created_at && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Dibuat: {new Date(status.created_at).toLocaleTimeString('id-ID')}</p>
              {status.started_at && (
                <p>Dimulai: {new Date(status.started_at).toLocaleTimeString('id-ID')}</p>
              )}
              {status.ended_at && (
                <p>Selesai: {new Date(status.ended_at).toLocaleTimeString('id-ID')}</p>
              )}
            </div>
          )}
        </div>

        {/* Animated Progress Bar */}
        {(status?.status === 'queued' || status?.status === 'started') && (
          <div className="relative h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        )}
      </div>
    </Card>
  );
}
