# 🚀 Notaku API Integration Guide - Part 3

**[← Back to Part 2](./API_INTEGRATION_PART2.md)**

---

## 9. Best Practices

### 9.1 Error Handling

#### ✅ Always Use Try-Catch

```typescript
// ❌ Bad - No error handling
async function createNote(data: CreateNoteInput) {
  const note = await ApiClient.createNote(data);
  return note;
}

// ✅ Good - Proper error handling
async function createNote(data: CreateNoteInput) {
  try {
    const note = await ApiClient.createNote(data);
    toast.success('Note created successfully!');
    return note;
  } catch (error) {
    if (error instanceof ApiClientError) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }
    throw error; // Re-throw for caller to handle
  }
}
```

#### ✅ Display User-Friendly Messages

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid input. Please check your data.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You do not have permission to do this.';
      case 404:
        return 'The requested item was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'Something went wrong.';
    }
  }
  return 'An unexpected error occurred.';
}

// Usage
try {
  await ApiClient.deleteNote(noteId);
} catch (error) {
  const message = getErrorMessage(error);
  toast.error(message);
}
```

#### ✅ Log Errors for Debugging

```typescript
import * as Sentry from '@sentry/react';

function handleError(error: unknown, context?: Record<string, any>) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('API Error:', error, context);
  }
  
  // Send to error tracking service in production
  if (import.meta.env.PROD && error instanceof ApiClientError) {
    Sentry.captureException(error, {
      extra: {
        statusCode: error.statusCode,
        details: error.details,
        ...context
      }
    });
  }
}
```

### 9.2 Loading States

#### ✅ Show Loading Indicators

```typescript
function NotesList() {
  const { data, loading, error } = useNotes();
  
  if (loading) {
    return (
      <div className="loading-container">
        <Spinner />
        <p>Loading notes...</p>
      </div>
    );
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  return <div>{/* Render notes */}</div>;
}
```

#### ✅ Disable Buttons During Operations

```typescript
function CreateNoteButton() {
  const [creating, setCreating] = useState(false);
  
  const handleCreate = async () => {
    setCreating(true);
    try {
      await ApiClient.createNote(data);
      toast.success('Note created!');
    } catch (error) {
      toast.error('Failed to create note');
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <button
      onClick={handleCreate}
      disabled={creating}
      className={creating ? 'opacity-50 cursor-not-allowed' : ''}
    >
      {creating ? (
        <>
          <Spinner size="sm" />
          <span>Creating...</span>
        </>
      ) : (
        'Create Note'
      )}
    </button>
  );
}
```

#### ✅ Prevent Double Submissions

```typescript
function SubmitForm() {
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (submitting) return;
    
    setSubmitting(true);
    try {
      await ApiClient.createNote(formData);
      toast.success('Submitted successfully!');
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### 9.3 Cleanup

#### ✅ Cancel Requests on Unmount

```typescript
function NotesComponent() {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    // Fetch data
    fetchNotes(abortControllerRef.current.signal);
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return <div>{/* Component content */}</div>;
}
```

#### ✅ Clear Intervals/Timeouts

```typescript
function AutoRefreshComponent() {
  const { refetch } = useNotes();
  
  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [refetch]);
  
  return <div>{/* Component content */}</div>;
}
```

#### ✅ Abort Ongoing Uploads

```typescript
function UploadWithCancel() {
  const [uploading, setUploading] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  
  const handleUpload = (file: File) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    
    // Upload logic...
    
    setUploading(true);
  };
  
  const handleCancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setUploading(false);
      toast.info('Upload cancelled');
    }
  };
  
  return (
    <div>
      <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
      {uploading && (
        <button onClick={handleCancel}>Cancel Upload</button>
      )}
    </div>
  );
}
```

### 9.4 Performance

#### ✅ Use Pagination for Large Lists

```typescript
function PaginatedNotes() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  const { data, loading } = useNotes({ page, pageSize });
  
  return (
    <div>
      {data?.items.map(note => <NoteCard key={note.id} note={note} />)}
      
      <Pagination
        currentPage={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />
    </div>
  );
}
```

#### ✅ Implement Debouncing for Search

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

function SearchNotes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearch(value);
    }, 500),
    []
  );
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSetSearch(value);
  };
  
  const { data } = useNotes({ search: debouncedSearch });
  
  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search notes..."
      />
      {/* Render results */}
    </div>
  );
}
```

#### ✅ Cache Frequently Accessed Data

```typescript
import { useQuery } from '@tanstack/react-query';

function CachedNotes() {
  const { data, isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => ApiClient.getNotes(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
  
  return <div>{/* Render notes */}</div>;
}
```

### 9.5 Security

#### ✅ Never Expose API Keys in Frontend

```typescript
// ❌ Bad - API key in frontend code
const API_KEY = 'sk-1234567890abcdef';

// ✅ Good - Use environment variables
const API_URL = import.meta.env.VITE_API_URL;
```

#### ✅ Use HTTPS in Production

```typescript
// .env.production
VITE_API_URL=https://api.notaku.cloud  // ✅ HTTPS

// .env.development
VITE_API_URL=http://localhost:8000  // ✅ OK for local dev
```

#### ✅ Validate User Input

```typescript
function CreateNoteForm() {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the errors');
      return;
    }
    
    try {
      await ApiClient.createNote(formData);
      toast.success('Note created!');
    } catch (error) {
      toast.error('Failed to create note');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        {errors.title && <p className="error">{errors.title}</p>}
      </div>
      
      <div>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />
        {errors.content && <p className="error">{errors.content}</p>}
      </div>
      
      <button type="submit">Create Note</button>
    </form>
  );
}
```

#### ✅ Handle CORS Properly

CORS is already configured in the backend for:
- `https://demo.notaku.cloud`
- `https://notaku.cloud`
- `https://*.notaku.cloud`
- `http://localhost:5173`
- `http://localhost:3000`

The API client automatically includes credentials:
```typescript
const REQUEST_CONFIG: RequestInit = {
  credentials: "include", // ✅ Includes cookies
  mode: "cors",           // ✅ CORS mode
};
```

---

## 10. Troubleshooting

### Common Issues and Solutions

#### 🔴 CORS Errors

**Error:**
```
Access to fetch at 'https://api.notaku.cloud/api/v1/notes' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**Causes:**
1. Origin not whitelisted in backend
2. Missing credentials in request
3. Preflight request failed

**Solutions:**
```typescript
// 1. Ensure credentials are included
fetch(url, {
  credentials: 'include', // ✅ Important!
  mode: 'cors'
});

// 2. Check environment variable
console.log('API URL:', import.meta.env.VITE_API_URL);

// 3. Contact backend team to whitelist your origin
```

#### 🔴 401 Unauthorized

**Error:**
```json
{
  "error": "Unauthorized",
  "statusCode": 401
}
```

**Causes:**
1. Not logged in
2. Session expired
3. Invalid credentials

**Solutions:**
```typescript
// 1. Check authentication status
const { isAuthenticated } = useAuth();
if (!isAuthenticated) {
  navigate('/login');
}

// 2. Refresh session
try {
  await ApiClient.refreshToken();
} catch (error) {
  // Session expired, redirect to login
  navigate('/login');
}

// 3. Re-login
await ApiClient.login({ email, password });
```

#### 🔴 File Upload Fails

**Error:**
```
Upload failed: Request Entity Too Large
```

**Causes:**
1. File size exceeds limit
2. Invalid file type
3. Network timeout

**Solutions:**
```typescript
// 1. Validate file size before upload
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_SIZE) {
  toast.error('File too large. Max size: 10MB');
  return;
}

// 2. Validate file type
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

if (!ALLOWED_TYPES.includes(file.type)) {
  toast.error('Invalid file type. Only JPG and PNG allowed.');
  return;
}

// 3. Add timeout handling
const uploadWithTimeout = async (file: File) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Upload timeout')), 60000)
  );
  
  const uploadPromise = ApiClient.uploadReceipt(file);
  
  try {
    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch (error) {
    if (error.message === 'Upload timeout') {
      toast.error('Upload took too long. Please try again.');
    }
    throw error;
  }
};
```

#### 🔴 OCR Processing Timeout

**Error:**
```
OCR processing timeout
```

**Causes:**
1. Large image file
2. OCR service overloaded
3. Network issues

**Solutions:**
```typescript
// 1. Show loading state with timeout warning
function ReceiptUpload() {
  const [uploadTime, setUploadTime] = useState(0);
  
  useEffect(() => {
    if (uploading) {
      const interval = setInterval(() => {
        setUploadTime(t => t + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [uploading]);
  
  return (
    <div>
      {uploading && (
        <div>
          <p>Processing OCR... ({uploadTime}s)</p>
          {uploadTime > 5 && (
            <p className="warning">
              ⏱️ OCR is taking longer than usual. Please wait...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// 2. Compress image before upload
import imageCompression from 'browser-image-compression';

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  
  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Compression failed:', error);
    return file; // Return original if compression fails
  }
}

// Usage
const compressed = await compressImage(originalFile);
await ApiClient.uploadReceipt(compressed);
```

#### 🔴 Network Errors

**Error:**
```
Failed to fetch
```

**Causes:**
1. No internet connection
2. API server down
3. DNS issues

**Solutions:**
```typescript
// 1. Check network status
function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!online) {
    return (
      <div className="offline-banner">
        ⚠️ No internet connection. Please check your network.
      </div>
    );
  }
  
  return null;
}

// 2. Retry failed requests
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const notes = await fetchWithRetry(() => ApiClient.getNotes());
```

#### 🔴 Session Expired

**Error:**
```json
{
  "error": "Session expired",
  "statusCode": 401
}
```

**Solution:**
```typescript
// Global axios interceptor
import axios from 'axios';

axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await ApiClient.refreshToken();
        // Retry original request
        return axios.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Appendix

### A. TypeScript Types Reference

All types are defined in `src/types/api.ts`:

**Core Types:**
- `User` - User account
- `Note` - Note entity
- `Receipt` - Receipt with OCR data
- `Attachment` - File attachment
- `ChatMessage` - AI chat message

**Request Types:**
- `UserRegistration` - Register payload
- `UserLogin` - Login payload
- `CreateNoteInput` - Create note payload
- `UpdateNoteInput` - Update note payload
- `CreateReceiptInput` - Receipt metadata

**Response Types:**
- `ApiResponse<T>` - Generic API response
- `PaginatedResponse<T>` - Paginated list response
- `AuthResponse` - Authentication response
- `ChatResponse` - AI chat response
- `FileUploadResponse` - File upload response

**Error Types:**
- `ApiError` - API error structure

### B. Environment Variables

**Required Variables:**

```bash
# API Base URL
VITE_API_URL=https://api.notaku.cloud

# Optional: Enable debug mode
VITE_DEBUG=false

# Optional: API timeout (ms)
VITE_API_TIMEOUT=30000
```

**Development (.env.development):**
```bash
VITE_API_URL=http://localhost:8000
VITE_DEBUG=true
```

**Production (.env.production):**
```bash
VITE_API_URL=https://api.notaku.cloud
VITE_DEBUG=false
```

### C. API Client Class Reference

**Full Method List:**

```typescript
class ApiClient {
  // Health & System
  static getHealth(): Promise<HealthResponse>
  static getSystemInfo(): Promise<SystemInfo>
  static getApiInfo(): Promise<ApiInfo>
  
  // Authentication
  static register(data: UserRegistration): Promise<AuthResponse>
  static login(data: UserLogin): Promise<AuthResponse>
  static logout(): Promise<ApiResponse>
  static getCurrentUser(): Promise<User>
  static refreshToken(): Promise<AuthResponse>
  
  // Users
  static getUser(userId: string): Promise<User>
  static updateUser(userId: string, data: Partial<User>): Promise<User>
  static deleteUser(userId: string): Promise<ApiResponse>
  
  // Notes
  static getNotes(params?: NoteQueryParams): Promise<PaginatedResponse<Note>>
  static getNote(noteId: string): Promise<Note>
  static createNote(data: CreateNoteInput): Promise<Note>
  static updateNote(noteId: string, data: UpdateNoteInput): Promise<Note>
  static deleteNote(noteId: string): Promise<ApiResponse>
  
  // Receipts
  static getReceipts(params?: ReceiptQueryParams): Promise<PaginatedResponse<Receipt>>
  static getReceipt(receiptId: string): Promise<Receipt>
  static uploadReceipt(file: File, metadata?: CreateReceiptInput, onProgress?: (progress: UploadProgress) => void): Promise<Receipt>
  static updateReceipt(receiptId: string, data: Partial<Receipt>): Promise<Receipt>
  static deleteReceipt(receiptId: string): Promise<ApiResponse>
  
  // Attachments
  static getAttachments(noteId: string): Promise<Attachment[]>
  static uploadAttachment(noteId: string, file: File, onProgress?: (progress: UploadProgress) => void): Promise<Attachment>
  static deleteAttachment(attachmentId: string): Promise<ApiResponse>
  
  // AI Chat
  static chat(data: ChatRequest): Promise<ChatResponse>
  static chatStream(data: ChatRequest, onChunk: (chunk: string) => void, onComplete: () => void, onError: (error: Error) => void): Promise<void>
  
  // File Storage
  static uploadFile(bucket: 'uploads' | 'avatars' | 'exports' | 'backups', file: File, onProgress?: (progress: UploadProgress) => void): Promise<FileUploadResponse>
  static getFileUrl(storagePath: string): string
}
```

### D. Rate Limiting

**Current Limits:**
- No rate limiting implemented yet
- Future: 100 requests per minute per user
- Future: 1000 requests per hour per user

**Headers (Future):**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

**Handling Rate Limits:**
```typescript
if (error.statusCode === 429) {
  const resetTime = error.details?.resetTime;
  const waitSeconds = Math.ceil((resetTime - Date.now()) / 1000);
  
  toast.error(`Rate limit exceeded. Please wait ${waitSeconds} seconds.`);
}
```

---

## 📞 Support

**Issues & Questions:**
- GitHub Issues: [github.com/notaku/frontend/issues](https://github.com)
- Email: support@notaku.cloud
- Documentation: [docs.notaku.cloud](https://docs.notaku.cloud)

**Backend API:**
- Base URL: `https://api.notaku.cloud`
- API Docs: `https://api.notaku.cloud/docs`
- OpenAPI Spec: `https://api.notaku.cloud/openapi.json`

**Server Location:**
- Jakarta, Indonesia 🇮🇩
- All data stays in Indonesia (compliance)

---

## 📝 Changelog

**v1.0.0** (2025-10-19)
- ✅ Initial API client implementation
- ✅ TypeScript type definitions
- ✅ React hooks for all endpoints
- ✅ File upload with progress tracking
- ✅ AI chat with streaming support
- ✅ Comprehensive error handling
- ✅ Complete documentation

---

**Made with ❤️ for Notaku Platform**

**[← Back to Part 1](./API_INTEGRATION.md)** | **[← Back to Part 2](./API_INTEGRATION_PART2.md)**
