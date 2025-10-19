import { useState, useRef } from "react";
import {
  Upload,
  File,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Copy,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { useFileUpload } from "@/hooks/useApi";
import { FileUploadResponse } from "@/types/api";
import { toast } from "sonner";
import ProgressBar from "./components/ProgressBar";

type Bucket = "uploads" | "avatars" | "exports" | "backups";

interface FileItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: { loaded: number; total: number; percentage: number };
  result?: FileUploadResponse;
  error?: Error;
}

/**
 * Multi-file upload demonstration
 * Features: drag-and-drop, multiple files, bucket selection, progress tracking
 */
export default function FileUploadExample() {
  const [selectedBucket, setSelectedBucket] = useState<Bucket>("uploads");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, uploading } = useFileUpload();

  const bucketInfo = {
    uploads: {
      label: "Uploads",
      description: "General file uploads",
      icon: Upload,
      color: "blue",
    },
    avatars: {
      label: "Avatars",
      description: "Profile pictures",
      icon: ImageIcon,
      color: "purple",
    },
    exports: {
      label: "Exports",
      description: "Exported data files",
      icon: FolderOpen,
      color: "green",
    },
    backups: {
      label: "Backups",
      description: "Backup files",
      icon: File,
      color: "orange",
    },
  };

  /**
   * Add files to queue
   */
  const addFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const fileItems: FileItem[] = fileArray.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "pending",
      progress: { loaded: 0, total: file.size, percentage: 0 },
    }));

    setFiles((prev) => [...prev, ...fileItems]);
  };

  /**
   * Handle file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  /**
   * Upload single file
   */
  const uploadSingleFile = async (fileItem: FileItem) => {
    // Update status to uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileItem.id ? { ...f, status: "uploading" } : f
      )
    );

    try {
      const result = await uploadFile(selectedBucket, fileItem.file, (progress) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, progress } : f
          )
        );
      });

      // Update status to success
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? { ...f, status: "success", result }
            : f
        )
      );

      toast.success(`${fileItem.file.name} uploaded successfully!`);
    } catch (error) {
      // Update status to error
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? { ...f, status: "error", error: error as Error }
            : f
        )
      );

      toast.error(`Failed to upload ${fileItem.file.name}`);
    }
  };

  /**
   * Upload all pending files
   */
  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const file of pendingFiles) {
      await uploadSingleFile(file);
    }
  };

  /**
   * Retry failed upload
   */
  const retryUpload = (fileItem: FileItem) => {
    uploadSingleFile(fileItem);
  };

  /**
   * Remove file from queue
   */
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  /**
   * Clear all files
   */
  const clearAll = () => {
    setFiles([]);
    toast.success("All files cleared");
  };

  /**
   * Copy URL to clipboard
   */
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard!");
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            File Upload
          </h1>
          <p className="text-slate-600">
            Upload multiple files to different storage buckets
          </p>
        </div>

        {/* Bucket Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Select Storage Bucket
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(bucketInfo) as Bucket[]).map((bucket) => {
              const info = bucketInfo[bucket];
              const Icon = info.icon;
              const isSelected = selectedBucket === bucket;

              return (
                <button
                  key={bucket}
                  onClick={() => setSelectedBucket(bucket)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? `border-${info.color}-500 bg-${info.color}-50`
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                      isSelected
                        ? `bg-${info.color}-100`
                        : "bg-slate-100"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected
                          ? `text-${info.color}-600`
                          : "text-slate-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {info.label}
                  </h3>
                  <p className="text-xs text-slate-600">{info.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleInputChange}
              className="hidden"
              disabled={uploading}
            />

            <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-slate-600 mb-6">
              Upload multiple files at once
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              Select Files
            </button>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Files ({files.length})
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {successCount} uploaded • {pendingCount} pending
                  {errorCount > 0 && ` • ${errorCount} failed`}
                </p>
              </div>
              <div className="flex gap-2">
                {pendingCount > 0 && (
                  <button
                    onClick={uploadAll}
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    Upload All ({pendingCount})
                  </button>
                )}
                <button
                  onClick={clearAll}
                  disabled={uploading}
                  className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Files */}
            <div className="divide-y divide-slate-200">
              {files.map((fileItem) => (
                <FileListItem
                  key={fileItem.id}
                  fileItem={fileItem}
                  onRetry={() => retryUpload(fileItem)}
                  onRemove={() => removeFile(fileItem.id)}
                  onCopyUrl={(url) => copyUrl(url)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No files selected
            </h3>
            <p className="text-slate-600">
              Upload files to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * File List Item Component
 */
function FileListItem({
  fileItem,
  onRetry,
  onRemove,
  onCopyUrl,
}: {
  fileItem: FileItem;
  onRetry: () => void;
  onRemove: () => void;
  onCopyUrl: (url: string) => void;
}) {
  const { file, status, progress, result, error } = fileItem;

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "uploading":
        return (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <File className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "uploading":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className={`p-4 ${getStatusColor()} border-l-4`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {status === "success" && result?.url && (
                <button
                  onClick={() => onCopyUrl(result.url!)}
                  className="p-1.5 hover:bg-white rounded transition-colors"
                  aria-label="Copy URL"
                >
                  <Copy className="h-4 w-4 text-slate-600" />
                </button>
              )}
              {status === "error" && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              )}
              {status !== "uploading" && (
                <button
                  onClick={onRemove}
                  className="p-1.5 hover:bg-white rounded transition-colors"
                  aria-label="Remove file"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          {status === "uploading" && (
            <ProgressBar progress={progress} showSize={false} />
          )}

          {/* Success URL */}
          {status === "success" && result?.url && (
            <div className="mt-2 p-2 bg-white rounded border border-green-200">
              <p className="text-xs text-slate-600 truncate">{result.url}</p>
            </div>
          )}

          {/* Error Message */}
          {status === "error" && error && (
            <p className="text-xs text-red-600 mt-2">{error.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
