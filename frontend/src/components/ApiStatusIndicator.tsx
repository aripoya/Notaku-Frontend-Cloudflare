"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import ApiClient from "@/lib/api-client";

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    checkApiStatus();
    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    try {
      await ApiClient.getHealth();
      setStatus("online");
      setError("");
    } catch (err: any) {
      setStatus("offline");
      setError(err?.message || "Cannot connect to API");
      console.error("[API Status] Offline:", err);
    }
  };

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking API...</span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <div>
          <div className="font-medium">API Offline</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600">
      <CheckCircle className="w-4 h-4" />
      <span>API Online</span>
    </div>
  );
}
