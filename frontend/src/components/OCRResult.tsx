'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Upload, CheckCircle, AlertTriangle, Store, Calendar, DollarSign } from 'lucide-react';
import { useState } from 'react';
import type { OCRResult as OCRResultType } from '@/types/ocr';
import { formatIndonesianDate, formatLongDate, formatCurrency } from '@/lib/formatters';

interface OCRResultProps {
  result: OCRResultType;
  onNewUpload: () => void;
}

export default function OCRResult({ result, onNewUpload }: OCRResultProps) {
  const [copied, setCopied] = useState(false);

  const confidence = (result.ocr_confidence || 0) * 100;
  
  const getConfidenceColor = (conf: number) => {
    if (conf >= 95) return 'confidence-excellent';
    if (conf >= 85) return 'confidence-good';
    if (conf >= 75) return 'confidence-fair';
    return 'confidence-poor';
  };

  const handleCopy = () => {
    const extracted = result.extracted || {};
    const text = `
Toko: ${extracted.merchant || 'N/A'}
Tanggal: ${formatIndonesianDate(extracted.date)}
Total: ${formatCurrency(extracted.total_amount)}

${result.ocr_text || ''}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const data = JSON.stringify(result, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${result.receipt_id}.json`;
    a.click();
  };

  const extracted = result.extracted || {};
  const hasMissingData = !extracted.merchant || !extracted.total_amount || extracted.total_amount === 0;

  return (
    <div className="space-y-4 animate-bounce-in">
      {/* Success Header */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-green-900">Nota Berhasil Diproses!</h2>
          </div>
          <Badge className={getConfidenceColor(confidence)}>
            {confidence.toFixed(0)}% Confidence
          </Badge>
        </div>
      </Card>

      {/* KEY INFORMATION CARD - PROMINENT */}
      <Card className="p-6 border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-white shadow-lg">
        <h3 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
          <span className="text-lg">📋</span>
          Informasi Utama
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Merchant - Large & Bold */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Store className="w-4 h-4 text-gray-500" />
              <div className="text-xs text-gray-500">Toko</div>
            </div>
            <div className="text-2xl font-bold text-gray-900 min-h-[2rem] flex items-center justify-center">
              {extracted.merchant || (
                <span className="text-gray-400 text-lg">Tidak Terdeteksi</span>
              )}
            </div>
          </div>

          {/* Date - Large & Colored */}
          <div className="text-center md:border-x border-gray-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <div className="text-xs text-gray-500">Tanggal</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatIndonesianDate(extracted.date)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatLongDate(extracted.date)}
            </div>
          </div>

          {/* Total - VERY LARGE & Prominent */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-3xl font-black text-green-600">
              {extracted.total_amount && extracted.total_amount > 0 ? (
                formatCurrency(extracted.total_amount)
              ) : (
                <span className="text-gray-400 text-xl">Rp 0</span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          <Badge variant={extracted.merchant ? "default" : "destructive"} className="text-xs">
            {extracted.merchant ? "✓ Toko Terdeteksi" : "⚠ Toko Tidak Terdeteksi"}
          </Badge>
          
          <Badge variant={extracted.date ? "default" : "destructive"} className="text-xs">
            {extracted.date ? "✓ Tanggal Terdeteksi" : "⚠ Tanggal Tidak Terdeteksi"}
          </Badge>
          
          <Badge variant={extracted.total_amount && extracted.total_amount > 0 ? "default" : "destructive"} className="text-xs">
            {extracted.total_amount && extracted.total_amount > 0 ? "✓ Total Terdeteksi" : "⚠ Total Tidak Terdeteksi"}
          </Badge>
        </div>
      </Card>

      {/* Warning Card for Missing Data */}
      {hasMissingData && (
        <Card className="p-4 border-2 border-orange-400 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-800 mb-2">
                Beberapa Data Tidak Terdeteksi
              </h4>
              <div className="text-sm text-orange-700 space-y-1">
                {!extracted.merchant && <div>• Nama toko tidak ditemukan</div>}
                {(!extracted.total_amount || extracted.total_amount === 0) && <div>• Total pembelian tidak ditemukan</div>}
              </div>
              <p className="text-xs text-orange-600 mt-3">
                Anda dapat melihat teks OCR di bawah untuk melengkapi data secara manual.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Detailed Information */}
      <Card className="p-6">
        <div className="space-y-4">
        {/* Confidence Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Confidence Score</span>
            <Badge className={getConfidenceColor(confidence)}>
              {confidence.toFixed(1)}%
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {/* Processing Time */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Processing Time</span>
          <span className="font-medium">{result.processing_time_ms}ms</span>
        </div>

        {/* OCR Text */}
        <div>
          <label className="text-sm font-medium mb-2 block">Extracted Text</label>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {result.ocr_text}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Text
              </>
            )}
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
        </div>

        <Button onClick={onNewUpload} className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Upload Another Receipt
        </Button>

        {/* Metadata */}
        <div className="text-xs text-gray-400 space-y-1 pt-4 border-t">
          <div>Receipt ID: {result.receipt_id}</div>
          <div>Job ID: {result.job_id}</div>
        </div>
        </div>
      </Card>
    </div>
  );
}
