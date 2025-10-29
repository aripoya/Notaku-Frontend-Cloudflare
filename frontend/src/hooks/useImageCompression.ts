import { useState } from 'react';
import { getCompressionUrl } from '@/config/services';

export interface CompressionStats {
  originalSizeKB: number;
  compressedSizeKB: number;
  reductionPercent: number;
}

export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);

  const compressImage = async (file: File): Promise<File> => {
    console.log('[Compression] 🗜️ Starting compression for:', file.name, `(${(file.size / 1024).toFixed(0)}KB)`);
    setIsCompressing(true);
    setCompressionStats(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('[Compression] 📤 Sending to compression service...');
      const response = await fetch(getCompressionUrl('OPTIMIZE'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Compression failed: ${response.status} ${response.statusText}`);
      }

      // Get compression stats from header
      const statsHeader = response.headers.get('X-Compression-Stats');
      if (statsHeader) {
        try {
          console.log('[Compression] 📊 Raw stats header:', statsHeader);
          
          // Parse stats (Python dict format to JSON)
          const statsStr = statsHeader.replace(/'/g, '"');
          const stats = JSON.parse(statsStr);
          
          const compressionData: CompressionStats = {
            originalSizeKB: stats.original_size_kb || Math.round(file.size / 1024),
            compressedSizeKB: stats.compressed_size_kb || 0,
            reductionPercent: stats.reduction_percent || 0
          };
          
          setCompressionStats(compressionData);
          console.log('[Compression] 📈 Compression stats:', compressionData);
        } catch (e) {
          console.warn('[Compression] ⚠️ Failed to parse compression stats:', e);
        }
      }

      // Get compressed image blob
      const blob = await response.blob();
      
      // Create new File with .jpg extension (compression service returns JPEG)
      const fileName = file.name.replace(/\.[^/.]+$/, '.jpg');
      const compressedFile = new File([blob], fileName, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      const originalKB = Math.round(file.size / 1024);
      const compressedKB = Math.round(compressedFile.size / 1024);
      const reductionPercent = Math.round(((file.size - compressedFile.size) / file.size) * 100);

      console.log('[Compression] ✅ Compression success:', {
        original: `${originalKB}KB`,
        compressed: `${compressedKB}KB`,
        reduction: `${reductionPercent}%`,
        fileName: compressedFile.name
      });

      // Update stats if not already set from header
      if (!compressionStats) {
        setCompressionStats({
          originalSizeKB: originalKB,
          compressedSizeKB: compressedKB,
          reductionPercent: reductionPercent
        });
      }

      return compressedFile;

    } catch (error) {
      console.error('[Compression] ❌ Compression failed:', error);
      console.warn('[Compression] 🔄 Falling back to original file');
      
      // Return original file if compression fails (graceful fallback)
      return file;
      
    } finally {
      setIsCompressing(false);
    }
  };

  const resetStats = () => {
    setCompressionStats(null);
  };

  return {
    compressImage,
    isCompressing,
    compressionStats,
    resetStats
  };
}
