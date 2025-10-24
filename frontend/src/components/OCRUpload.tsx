'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OCRUploadProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

export default function OCRUpload({ onUpload, isProcessing }: OCRUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Upload Receipt
      </h2>

      {!preview ? (
        <div
          {...getRootProps()}
          className={`upload-zone cursor-pointer text-center ${
            isDragActive ? 'drag-active' : ''
          }`}
        >
          <input {...getInputProps()} />
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-600">
              Drop file di sini...
            </p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Drag & drop receipt di sini
              </p>
              <p className="text-sm text-gray-500 mb-4">
                atau click untuk browse
              </p>
              <p className="text-xs text-gray-400">
                Format: JPG, PNG | Max: 10MB
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-contain bg-gray-50"
            />
            <Button
              onClick={handleClear}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ImageIcon className="w-4 h-4" />
            <span>{selectedFile?.name}</span>
            <span className="text-gray-400">
              ({(selectedFile!.size / 1024).toFixed(0)} KB)
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
