"use client";
import { useState } from "react";
import ReceiptUpload from "@/components/receipt/ReceiptUpload";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("");

  const startUpload = async () => {
    if (!file) return;
    setProgress(10);
    setStatus("Mengunggah...");
    await new Promise((r) => setTimeout(r, 500));
    setProgress(50);
    setStatus("Memproses OCR...");
    await new Promise((r) => setTimeout(r, 1200));
    setProgress(100);
    setStatus("Selesai");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Upload Nota</h1>
      <ReceiptUpload onSelect={setFile} />
      <div className="flex gap-2">
        <button onClick={startUpload} disabled={!file} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50">Mulai Upload</button>
        {file && <span className="text-sm text-slate-600">{file.name}</span>}
      </div>
      {progress > 0 && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-slate-600">{status}</p>
        </div>
      )}
    </div>
  );
}
