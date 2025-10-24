"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

interface OCRUploadProps {
  onUploadSuccess: (jobId: string) => void;
  onError: (error: string) => void;
}

export default function OCRUpload({ onUploadSuccess, onError }: OCRUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Format file tidak didukung. Gunakan JPG atau PNG.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Ukuran file terlalu besar. Maksimal 10MB.";
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      onError(error);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [onError]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadProgress(0);
  }, [previewUrl]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_OCR_API_URL || "http://172.16.1.7:8001"}/api/v1/ocr/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Upload gagal" }));
        throw new Error(error.message || `Upload gagal: ${response.status}`);
      }

      const data = await response.json();
      onUploadSuccess(data.job_id);
      
      // Clear after success
      setTimeout(() => {
        handleClear();
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      onError(error instanceof Error ? error.message : "Upload gagal");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileImage className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Upload Struk</h3>
        </div>

        {!selectedFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center
              transition-colors cursor-pointer
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-400"
              }
            `}
          >
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium mb-2">
              Drag & drop struk di sini
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              atau klik untuk browse file
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Format: JPG, PNG</p>
              <p>Maksimal: 10MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="w-full h-64 object-contain bg-slate-50 dark:bg-slate-900"
                />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleClear}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* File Info */}
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-slate-900 dark:text-white">
                {selectedFile.name}
              </p>
              <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={isUploading}
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
