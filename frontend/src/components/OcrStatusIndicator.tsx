"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { OCRApiClient } from "@/lib/ocr-api";

export function OcrStatusIndicator() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    checkOcrStatus();
    // Check every 30 seconds
    const interval = setInterval(checkOcrStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkOcrStatus = async () => {
    try {
      await OCRApiClient.healthCheck();
      setStatus("online");
      setError("");
    } catch (err: any) {
      setStatus("offline");
      setError(err?.message || "Cannot connect to OCR service");
      console.error("[OCR Status] Offline:", err);
    }
  };

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking OCR...</span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <div>
          <div className="font-medium">OCR Offline</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
      <CheckCircle className="w-4 h-4" />
      <span>OCR Ready</span>
    </div>
  );
}
