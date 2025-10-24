# Expense AI Platform - Frontend Structure & API Documentation

## 📁 App Structure

### Route Groups

```
src/app/
├── (auth)/                    # Authentication routes (no layout)
│   ├── login/                 # Login page
│   └── register/              # Registration page
│
├── (dashboard)/               # Protected dashboard routes
│   ├── dashboard/
│   │   ├── page.tsx          # Main dashboard (/)
│   │   ├── analytics/        # Analytics & reports
│   │   ├── chat/             # AI chat interface
│   │   ├── receipts/         # Receipt management
│   │   │   └── detail/       # Receipt detail view
│   │   ├── settings/         # User settings
│   │   └── upload/           # OCR upload page ⭐
│   │
│   ├── analytics/            # (Duplicate - cleanup needed)
│   ├── chat/                 # (Duplicate - cleanup needed)
│   ├── ocr/                  # OCR standalone page
│   ├── receipts/             # (Duplicate - cleanup needed)
│   ├── settings/             # (Duplicate - cleanup needed)
│   └── upload/               # (Duplicate - cleanup needed)
│
└── (public)/                 # Public routes
    ├── about/                # About page
    └── pricing/              # Pricing page
```

### Key Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Landing page |
| `/login` | `app/(auth)/login/page.tsx` | User login |
| `/register` | `app/(auth)/register/page.tsx` | User registration |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Main dashboard |
| `/dashboard/upload` | `app/(dashboard)/dashboard/upload/page.tsx` | **OCR Upload** ⭐ |
| `/dashboard/receipts` | `app/(dashboard)/dashboard/receipts/page.tsx` | Receipt list |
| `/dashboard/analytics` | `app/(dashboard)/dashboard/analytics/page.tsx` | Analytics |
| `/dashboard/chat` | `app/(dashboard)/dashboard/chat/page.tsx` | AI Chat |
| `/dashboard/settings` | `app/(dashboard)/dashboard/settings/page.tsx` | Settings |

---

## 🔌 API Connections

### 1. Main Backend API (api.notaku.cloud)

**Base URL:** `https://api.notaku.cloud/api/v1`

**Client:** `src/lib/api-client.ts` → `ApiClient`

#### Authentication Endpoints

```typescript
// Register
POST /api/v1/auth/register
Body: { email, password, name }
Response: { token, user }

// Login
POST /api/v1/auth/login
Body: { email, password }
Response: { token, user }

// Logout
POST /api/v1/auth/logout
Response: { message }

// Get Current User
GET /api/v1/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { id, email, name, ... }

// Refresh Token
POST /api/v1/auth/refresh
Response: { token }
```

#### User Management

```typescript
// Get User
GET /api/v1/users/{userId}
Response: User

// Update User
PATCH /api/v1/users/{userId}
Body: Partial<User>
Response: User

// Delete User
DELETE /api/v1/users/{userId}
Response: { message }
```

#### Notes Management

```typescript
// Get Notes (Paginated)
GET /api/v1/notes?page=1&limit=10&search=...
Response: { items: Note[], total, page, pages }

// Get Single Note
GET /api/v1/notes/{noteId}
Response: Note

// Create Note
POST /api/v1/notes
Body: { title, content, category?, tags? }
Response: Note

// Update Note
PATCH /api/v1/notes/{noteId}
Body: Partial<Note>
Response: Note

// Delete Note
DELETE /api/v1/notes/{noteId}
Response: { message }
```

#### Receipts Management

```typescript
// Get Receipts (Paginated)
GET /api/v1/receipts?page=1&limit=10&date_from=...&date_to=...
Response: { items: Receipt[], total, page, pages }

// Get Single Receipt
GET /api/v1/receipts/{receiptId}
Response: Receipt

// Upload Receipt
POST /api/v1/receipts/upload
Body: FormData { file, merchant?, date?, amount? }
Response: Receipt
Progress: onProgress(loaded, total, percentage)

// Update Receipt
PATCH /api/v1/receipts/{receiptId}
Body: Partial<Receipt>
Response: Receipt

// Delete Receipt
DELETE /api/v1/receipts/{receiptId}
Response: { message }
```

#### Attachments

```typescript
// Get Attachments
GET /api/v1/notes/{noteId}/attachments
Response: Attachment[]

// Upload Attachment
POST /api/v1/notes/{noteId}/attachments
Body: FormData { file }
Response: Attachment
Progress: onProgress(loaded, total, percentage)

// Delete Attachment
DELETE /api/v1/attachments/{attachmentId}
Response: { message }
```

#### AI Chat

```typescript
// Chat (Single Response)
POST /api/v1/chat
Body: { message, context?, history? }
Response: { response, tokens_used }

// Chat (Streaming)
POST /api/v1/chat/stream
Body: { message, context?, history? }
Response: Stream<string>
Callbacks: onChunk(chunk), onComplete(), onError(error)
```

#### File Storage (MinIO)

```typescript
// Upload File
POST /api/v1/files/upload
Body: FormData { file, bucket: "uploads"|"avatars"|"exports"|"backups" }
Response: { url, storage_path, size, content_type }
Progress: onProgress(loaded, total, percentage)

// Get File URL
GET /api/v1/files/{storagePath}
Response: File (direct download)
```

#### Health & System

```typescript
// Health Check
GET /health
Response: { status: "healthy"|"unhealthy", timestamp }

// System Info
GET /
Response: { name, version, environment }

// API Info
GET /api/v1/info
Response: { version, endpoints, features }
```

---

### 2. OCR Backend API (ocr.notaku.cloud)

**Base URL (Dev):** `http://localhost:8001` (via SSH tunnel)  
**Base URL (Prod):** `https://ocr.notaku.cloud`

**Client:** `src/lib/ocr-api.ts` → `OCRApiClient`

#### OCR Endpoints

```typescript
// Upload Receipt for OCR
POST /api/v1/ocr/upload
Body: FormData { file, user_id? }
Response: {
  job_id: string,
  status: "queued",
  message: string,
  uploaded_at: string
}

// Check Job Status
GET /api/v1/ocr/status/{jobId}
Response: {
  job_id: string,
  status: "queued"|"started"|"finished"|"failed",
  progress?: string,
  created_at?: string,
  started_at?: string,
  ended_at?: string
}

// Get OCR Result
GET /api/v1/ocr/result/{jobId}
Response: {
  job_id: string,
  status: "finished",
  receipt_id: string,
  ocr_text: string,
  ocr_confidence: number,
  line_count: number,
  processing_time_ms: number,
  extracted: {
    merchant?: string,
    date?: string,
    total_amount?: number,
    tax?: number,
    subtotal?: number,
    items?: any[]
  },
  error?: string
}

// Health Check
GET /health
Response: {
  status: "healthy"|"unhealthy",
  redis: "ok"|"error",
  workers: number,
  queue_size: number,
  timestamp: string
}

// Get Stats
GET /api/v1/stats
Response: {
  workers: number,
  requests_per_second: number,
  active_jobs: number
}
```

#### OCR Client Helper Methods

```typescript
// Poll Status (Auto-retry)
OCRApiClient.pollStatus(
  jobId: string,
  onUpdate?: (status) => void,
  interval?: number,      // Default: 500ms
  maxAttempts?: number    // Default: 120 (60 seconds)
): Promise<JobStatus>

// Usage Example
const status = await OCRApiClient.pollStatus(
  jobId,
  (status) => {
    console.log('Status:', status.status);
    if (status.status === 'started') {
      setProcessingText('Processing...');
    }
  },
  1000  // Poll every 1 second
);
```

---

## 🔄 API Flow Examples

### 1. User Login Flow

```typescript
// 1. User submits login form
const { email, password } = formData;

// 2. Call login API
const response = await ApiClient.login({ email, password });
// Response: { token, user }

// 3. Token automatically stored in localStorage
// Key: "auth_token"

// 4. Update auth state (Zustand)
setUser(response.user);
setToken(response.token);
setIsAuthenticated(true);

// 5. Redirect to dashboard
router.push('/dashboard');
```

### 2. OCR Upload Flow

```typescript
// 1. User selects receipt image
const file = event.target.files[0];

// 2. Upload to OCR backend
const uploadResult = await OCRApiClient.uploadReceipt(file);
// Response: { job_id, status: "queued", ... }

// 3. Poll for status updates
const finalStatus = await OCRApiClient.pollStatus(
  uploadResult.job_id,
  (status) => {
    // Update UI based on status
    if (status.status === 'queued') {
      setProcessingText('Waiting in queue...');
    } else if (status.status === 'started') {
      setProcessingText('Processing receipt...');
    }
  },
  1000  // Poll every 1 second
);

// 4. Get final result
const ocrResult = await OCRApiClient.getResult(uploadResult.job_id);
// Response: { ocr_text, extracted: { merchant, date, total_amount }, ... }

// 5. Display result to user
setResult({
  merchant: ocrResult.extracted.merchant,
  date: ocrResult.extracted.date,
  total: ocrResult.extracted.total_amount,
  confidence: ocrResult.ocr_confidence,
  ocrText: ocrResult.ocr_text
});
```

### 3. Receipt Upload to Main Backend

```typescript
// 1. User uploads receipt file
const file = event.target.files[0];

// 2. Upload with progress tracking
const receipt = await ApiClient.uploadReceipt(
  file,
  { merchant: 'UNIQLO', date: '2025-10-24', amount: 259000 },
  (progress) => {
    // Update progress bar
    setUploadProgress(progress.percentage);
  }
);

// 3. Receipt saved to database
// Response: { id, file_url, merchant, date, amount, ... }

// 4. Update UI
setReceipts([receipt, ...receipts]);
```

### 4. AI Chat Flow

```typescript
// 1. User sends message
const message = "Analyze my spending this month";

// 2. Call chat API (streaming)
await ApiClient.chatStream(
  { message, context: receipts },
  (chunk) => {
    // Append chunk to response
    setResponse(prev => prev + chunk);
  },
  () => {
    // Stream complete
    setIsStreaming(false);
  },
  (error) => {
    // Handle error
    console.error('Chat error:', error);
  }
);
```

---

## 🔐 Authentication

### Token Management

**Storage:** `localStorage` with key `"auth_token"`

**Header:** `Authorization: Bearer <token>`

**Methods:**
```typescript
// Get token
const token = ApiClient.getToken();

// Set token
ApiClient.setToken(token);

// Clear token
ApiClient.clearToken();
```

### Protected Routes

**Component:** `src/components/ProtectedRoute.tsx`

**Logic:**
```typescript
// 1. Check if authenticated
if (!isAuthenticated) {
  // 2. Try to restore session
  await checkAuth();
  
  // 3. If still not authenticated, redirect to login
  if (!isAuthenticated) {
    router.push('/login');
  }
}
```

---

## 🌐 Environment Variables

### Development (.env.local)

```bash
# OCR Backend (via SSH tunnel)
OCR_BACKEND_URL=http://localhost:8001

# Main Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Debug mode
NEXT_PUBLIC_DEBUG=true
```

### Production (Cloudflare Pages)

```bash
# OCR Backend (public URL)
NEXT_PUBLIC_OCR_API_URL=https://ocr.notaku.cloud

# Main Backend API
NEXT_PUBLIC_API_URL=https://api.notaku.cloud

# Debug mode
NEXT_PUBLIC_DEBUG=false
```

---

## 📊 Data Flow

### Development Mode

```
Browser (localhost:3000)
  ↓
Next.js Dev Server
  ↓ /api/ocr/* → Rewrite
  ↓
localhost:8001 (SSH Tunnel)
  ↓ SSH (encrypted)
  ↓
172.16.1.7:8001 (OCR Backend Server)
```

### Production Mode

```
Browser
  ↓
Cloudflare Pages (notaku.cloud)
  ↓ HTTPS
  ↓
ocr.notaku.cloud (Cloudflare Tunnel)
  ↓
172.16.1.7:8001 (OCR Backend Server)
```

---

## 🛠️ API Client Usage

### Import

```typescript
import { ApiClient } from '@/lib/api-client';
import { OCRApiClient } from '@/lib/ocr-api';
```

### Examples

```typescript
// Authentication
const user = await ApiClient.getCurrentUser();
await ApiClient.logout();

// Notes
const notes = await ApiClient.getNotes({ page: 1, limit: 10 });
const note = await ApiClient.createNote({ title: 'Test', content: 'Hello' });

// Receipts
const receipts = await ApiClient.getReceipts({ date_from: '2025-01-01' });
const receipt = await ApiClient.uploadReceipt(file, metadata, onProgress);

// OCR
const upload = await OCRApiClient.uploadReceipt(file);
const status = await OCRApiClient.checkStatus(jobId);
const result = await OCRApiClient.getResult(jobId);
const health = await OCRApiClient.healthCheck();

// Chat
const response = await ApiClient.chat({ message: 'Hello' });
await ApiClient.chatStream(request, onChunk, onComplete, onError);

// Files
const fileResponse = await ApiClient.uploadFile('uploads', file, onProgress);
const fileUrl = ApiClient.getFileUrl(storagePath);
```

---

## 📝 Type Definitions

All types are defined in:
- `src/types/api.ts` - Main backend types
- `src/types/ocr.ts` - OCR backend types

### Key Types

```typescript
// User
interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Receipt
interface Receipt {
  id: string;
  user_id: string;
  merchant: string;
  date: string;
  amount: number;
  file_url: string;
  ocr_text?: string;
  created_at: string;
}

// OCR Result
interface OCRResult {
  job_id: string;
  status: string;
  receipt_id: string;
  ocr_text: string;
  ocr_confidence: number;
  extracted: {
    merchant?: string;
    date?: string;
    total_amount?: number;
  };
}
```

---

## 🚀 Quick Reference

### Main Backend
- **URL:** `https://api.notaku.cloud`
- **Client:** `ApiClient`
- **Features:** Auth, Users, Notes, Receipts, Chat, Files

### OCR Backend
- **URL (Dev):** `http://localhost:8001` (SSH tunnel)
- **URL (Prod):** `https://ocr.notaku.cloud`
- **Client:** `OCRApiClient`
- **Features:** OCR Upload, Status Check, Result Retrieval

### Key Pages
- **Upload:** `/dashboard/upload` - OCR receipt upload
- **Receipts:** `/dashboard/receipts` - Receipt management
- **Chat:** `/dashboard/chat` - AI chat interface
- **Analytics:** `/dashboard/analytics` - Spending analytics

---

## 📖 Related Documentation

- `DEVELOPMENT_GUIDE.md` - Development workflow
- `SSH_TUNNEL_SETUP.md` - SSH tunnel for OCR backend
- `OCR_BACKEND_SETUP.md` - OCR backend setup
- `CLOUDFLARE_DEPLOYMENT.md` - Production deployment
- `FORMATTERS_GUIDE.md` - Date/currency formatting
- `ENHANCED_VISUAL_DESIGN.md` - UI design specs
