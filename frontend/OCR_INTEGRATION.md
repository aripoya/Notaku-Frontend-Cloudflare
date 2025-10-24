# OCR API Integration Guide

## Overview
Upload page (`/dashboard/upload`) sudah terintegrasi dengan OCR API backend untuk memproses nota/receipt secara otomatis.

## Architecture

### CORS Solution
Untuk menghindari masalah CORS, kami menggunakan **Next.js Rewrites** sebagai proxy:

```
Browser → Next.js Proxy → OCR Backend
localhost:3000/api/ocr/* → 172.16.1.7:8001/api/v1/ocr/*
```

### API Endpoints (via Proxy)

1. **Upload Receipt**
   - Frontend: `POST /api/ocr/upload`
   - Backend: `POST http://172.16.1.7:8001/api/v1/ocr/upload`
   - Body: `FormData` with `file` field

2. **Check Status**
   - Frontend: `GET /api/ocr/status/{job_id}`
   - Backend: `GET http://172.16.1.7:8001/api/v1/ocr/status/{job_id}`

3. **Get Result**
   - Frontend: `GET /api/ocr/result/{job_id}`
   - Backend: `GET http://172.16.1.7:8001/api/v1/ocr/result/{job_id}`

4. **Health Check**
   - Frontend: `GET /api/ocr-health`
   - Backend: `GET http://172.16.1.7:8001/health`

## Upload Flow

```
1. User selects file (camera/upload)
   ↓
2. File validation (size, type)
   ↓
3. Preview with optional notes
   ↓
4. Upload to OCR API
   POST /api/ocr/upload
   ↓
5. Receive job_id
   ↓
6. Poll status every 1 second
   GET /api/ocr/status/{job_id}
   ↓
7. When status = "finished"
   GET /api/ocr/result/{job_id}
   ↓
8. Display results:
   - Confidence score
   - Merchant name
   - Transaction date
   - Total amount
   - OCR text (raw)
```

## Components

### 1. OCRApiClient (`src/lib/ocr-api.ts`)
Client library untuk berkomunikasi dengan OCR API:
- `uploadReceipt()` - Upload file
- `checkStatus()` - Cek status job
- `getResult()` - Ambil hasil OCR
- `healthCheck()` - Cek health OCR service
- `pollStatus()` - Poll status sampai selesai

### 2. OcrStatusIndicator (`src/components/OcrStatusIndicator.tsx`)
Component untuk menampilkan status OCR service:
- Real-time health check setiap 30 detik
- Visual feedback (Online/Offline)
- Error messages

### 3. Upload Page (`src/app/(dashboard)/dashboard/upload/page.tsx`)
Main upload interface dengan stages:
- **Select**: Pilih file (camera/upload)
- **Preview**: Preview file + notes
- **Uploading**: Progress bar upload
- **Processing**: Animasi processing
- **Result**: Display hasil OCR

## Configuration

### next.config.ts
```typescript
{
  async rewrites() {
    return [
      {
        source: '/api/ocr/:path*',
        destination: 'http://172.16.1.7:8001/api/v1/ocr/:path*',
      },
      {
        source: '/api/ocr-health',
        destination: 'http://172.16.1.7:8001/health',
      },
    ];
  },
}
```

### Environment Variables
```env
NEXT_PUBLIC_OCR_API_URL=http://172.16.1.7:8001
```

## Error Handling

### Client-side
- File validation (size, type)
- Network errors dengan user-friendly messages
- Timeout handling (30 seconds)
- Retry logic di polling

### Server-side (via proxy)
- CORS headers handled by Next.js
- Request forwarding
- Error passthrough

## Features

### ✅ Implemented
- File upload (camera/file picker)
- Drag & drop support
- File validation
- Upload progress
- Real-time status polling
- Confidence score display
- OCR text preview
- Error handling
- Health monitoring

### 🚧 Future Enhancements
- Line items extraction
- Multi-file upload
- Batch processing
- Export results
- History/cache

## Testing

### Manual Test
1. Go to http://localhost:3000/dashboard/upload
2. Check OCR status indicator (should be green "OCR Ready")
3. Upload a receipt image
4. Wait for processing
5. Verify results display correctly

### Debug Mode
Enable debug logging in browser console:
```javascript
// Check logs prefixed with [OCR API]
[OCR API] Uploading to /api/ocr/upload
[OCR API] Status update: {status: "started"}
[OCR API] Final result: {...}
```

## Troubleshooting

### "Failed to fetch"
- Check if OCR backend is running: `curl http://172.16.1.7:8001/health`
- Restart Next.js dev server
- Check browser console for detailed errors

### "OCR Offline"
- Verify OCR service is accessible
- Check network connectivity
- Verify port 8001 is not blocked

### Slow Processing
- Check OCR backend worker count
- Monitor Redis queue
- Check system resources

## Backend Requirements

OCR backend must be running at `http://172.16.1.7:8001` with:
- Redis for queue management
- Workers for OCR processing
- CORS headers (handled by Next.js proxy)

## API Response Types

### UploadResponse
```typescript
{
  job_id: string;
  status: string;
  message: string;
  uploaded_at: string;
}
```

### JobStatus
```typescript
{
  job_id: string;
  status: 'queued' | 'started' | 'finished' | 'failed';
  progress?: string;
  created_at?: string;
  started_at?: string;
  ended_at?: string;
}
```

### OCRResult
```typescript
{
  job_id: string;
  status: string;
  receipt_id: string;
  ocr_text?: string;
  ocr_confidence?: number;
  line_count?: number;
  processing_time_ms?: number;
  extracted?: {
    merchant?: string;
    total_amount?: number;
    date?: string;
    category?: string;
  };
  error?: string;
}
```

## Performance

- Upload: < 1 second
- Processing: 2-5 seconds (depends on image quality)
- Polling interval: 1 second
- Timeout: 30 seconds

## Security

- File size limit: 10MB
- Allowed formats: JPG, PNG, WEBP
- User ID attached to uploads
- No sensitive data in URLs
- Proxy hides internal IP from client
