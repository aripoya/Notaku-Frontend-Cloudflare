# 🚀 Notaku API Integration Guide - Part 2

**[← Back to Part 1](./API_INTEGRATION.md)**

---

## 6. React Hooks Guide

### 6.1 useAuth()

Complete authentication hook with session management.

**Available State:**
```typescript
interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  login: (credentials: UserLogin) => Promise<void>;
  register: (data: UserRegistration) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}
```

**Usage Example:**
```typescript
import { useAuth } from '@/hooks/useAuth';

function ProfilePage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  
  if (loading) return <Spinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <p>Email: {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Login Example:**
```typescript
function LoginForm() {
  const { login, loading, error } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Error is already in error state
      console.error('Login failed');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
        disabled={loading}
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        disabled={loading}
      />
      {error && <p className="error">{error.message}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### 6.2 useNotes()

Manage notes with automatic pagination and filtering.

**Available State & Methods:**
```typescript
interface UseNotesReturn {
  data: PaginatedResponse<Note> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createNote: (input: CreateNoteInput) => Promise<Note>;
  updateNote: (id: string, input: UpdateNoteInput) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
}
```

**Basic Usage:**
```typescript
import { useNotes } from '@/hooks/useApi';

function NotesList() {
  const { data, loading, error, createNote, deleteNote } = useNotes({
    page: 1,
    pageSize: 10,
    tags: ['important']
  });
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <h2>Notes ({data?.total})</h2>
      {data?.items.map(note => (
        <div key={note.id}>
          <h3>{note.title}</h3>
          <p>{note.content}</p>
          <div>Tags: {note.tags.join(', ')}</div>
          <button onClick={() => deleteNote(note.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

**Create Note Example:**
```typescript
function CreateNoteForm() {
  const { createNote, loading } = useNotes();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    isPublic: false
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newNote = await createNote(formData);
      console.log('Note created:', newNote);
      // Reset form or redirect
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      <textarea
        placeholder="Content"
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Note'}
      </button>
    </form>
  );
}
```

**Pagination Example:**
```typescript
function NotesWithPagination() {
  const [page, setPage] = useState(1);
  const { data, loading } = useNotes({ page, pageSize: 10 });
  
  return (
    <div>
      {/* Notes list */}
      {data?.items.map(note => <NoteCard key={note.id} note={note} />)}
      
      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page} of {data?.totalPages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page === data?.totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### 6.3 useNote(id)

Fetch single note by ID.

**Usage:**
```typescript
import { useNote } from '@/hooks/useApi';

function NoteDetailPage({ noteId }: { noteId: string }) {
  const { data: note, loading, error, refetch } = useNote(noteId);
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!note) return <NotFound />;
  
  return (
    <div>
      <h1>{note.title}</h1>
      <p>{note.content}</p>
      <div>Tags: {note.tags.join(', ')}</div>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### 6.4 useReceipts()

Manage receipts with filtering and sorting.

**Usage:**
```typescript
import { useReceipts } from '@/hooks/useApi';

function ReceiptsPage() {
  const [filters, setFilters] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    minAmount: 0
  });
  
  const { data, loading, error, deleteReceipt } = useReceipts(filters);
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <h2>Receipts ({data?.total})</h2>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
      </div>
      
      {/* Receipts list */}
      {data?.items.map(receipt => (
        <div key={receipt.id} className="receipt-card">
          <h3>{receipt.merchantName}</h3>
          <p>Amount: Rp {receipt.totalAmount.toLocaleString()}</p>
          <p>Date: {receipt.transactionDate}</p>
          <button onClick={() => deleteReceipt(receipt.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### 6.5 useFileUpload()

Upload files with progress tracking.

**Available State & Methods:**
```typescript
interface UseFileUploadReturn {
  uploading: boolean;
  progress: UploadProgress;
  error: Error | null;
  uploadReceipt: (file: File, metadata?: CreateReceiptInput) => Promise<Receipt>;
  uploadAttachment: (noteId: string, file: File) => Promise<Attachment>;
  uploadFile: (bucket: string, file: File) => Promise<FileUploadResponse>;
  reset: () => void;
}
```

**Receipt Upload Example:**
```typescript
import { useFileUpload } from '@/hooks/useApi';

function ReceiptUploader() {
  const { uploadReceipt, uploading, progress, error } = useFileUpload({
    onSuccess: (receipt) => {
      console.log('Receipt uploaded:', receipt);
      toast.success('Receipt uploaded successfully!');
    },
    onError: (err) => {
      console.error('Upload failed:', err);
      toast.error('Upload failed: ' + err.message);
    }
  });
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const receipt = await uploadReceipt(file, {
        merchantName: 'Auto-detected via OCR',
        currency: 'IDR'
      });
      console.log('OCR Result:', receipt.ocrData);
    } catch (err) {
      // Error already handled by onError callback
    }
  };
  
  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar" style={{ width: `${progress.percentage}%` }} />
          <p>{progress.percentage}% uploaded</p>
          <p>{(progress.loaded / 1024 / 1024).toFixed(2)} MB / {(progress.total / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
      
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

**Multiple File Upload:**
```typescript
function MultipleFileUploader() {
  const { uploadFile, uploading, progress } = useFileUpload();
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResponse[]>([]);
  
  const handleMultipleFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadFile('uploads', file);
        setUploadedFiles(prev => [...prev, result]);
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }
  };
  
  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => e.target.files && handleMultipleFiles(e.target.files)}
        disabled={uploading}
      />
      
      {uploading && <ProgressBar progress={progress} />}
      
      <div className="uploaded-files">
        {uploadedFiles.map((file, idx) => (
          <div key={idx}>
            <p>{file.filename}</p>
            <a href={file.url} target="_blank">View</a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6.6 useAI()

AI chat integration with streaming support.

**Available State & Methods:**
```typescript
interface UseAIReturn {
  loading: boolean;
  streaming: boolean;
  error: Error | null;
  response: string;
  chat: (request: ChatRequest) => Promise<ChatResponse>;
  chatStream: (request: ChatRequest) => Promise<void>;
  reset: () => void;
}
```

**Normal Chat Example:**
```typescript
import { useAI } from '@/hooks/useApi';

function ChatInterface() {
  const { chat, loading, response, error } = useAI();
  const [message, setMessage] = useState('');
  
  const handleSend = async () => {
    if (!message.trim()) return;
    
    try {
      const result = await chat({ message });
      console.log('AI Response:', result.message);
    } catch (err) {
      console.error('Chat failed:', err);
    }
    
    setMessage('');
  };
  
  return (
    <div>
      <div className="chat-messages">
        {response && (
          <div className="ai-message">
            <p>{response}</p>
          </div>
        )}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !message.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
      
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

**Streaming Chat Example:**
```typescript
function StreamingChat() {
  const { chatStream, streaming, response, reset } = useAI({
    onChunk: (chunk) => {
      console.log('Received chunk:', chunk);
    },
    onComplete: () => {
      console.log('Stream complete');
    }
  });
  
  const [message, setMessage] = useState('');
  
  const handleSend = async () => {
    if (!message.trim()) return;
    
    reset(); // Clear previous response
    
    try {
      await chatStream({ message });
    } catch (err) {
      console.error('Stream failed:', err);
    }
    
    setMessage('');
  };
  
  return (
    <div>
      <div className="chat-messages">
        {response && (
          <div className="ai-message streaming">
            <p>{response}</p>
            {streaming && <span className="typing-indicator">▋</span>}
          </div>
        )}
      </div>
      
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={streaming}
      />
      <button onClick={handleSend} disabled={streaming}>
        {streaming ? 'AI is typing...' : 'Send'}
      </button>
    </div>
  );
}
```

### 6.7 useAttachments()

Manage note attachments.

**Usage:**
```typescript
import { useAttachments } from '@/hooks/useApi';
import { useFileUpload } from '@/hooks/useApi';

function NoteAttachments({ noteId }: { noteId: string }) {
  const { data: attachments, loading, deleteAttachment, refetch } = useAttachments(noteId);
  const { uploadAttachment, uploading, progress } = useFileUpload({
    onSuccess: () => {
      refetch(); // Refresh attachments list
    }
  });
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await uploadAttachment(noteId, file);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      <h3>Attachments</h3>
      
      {/* Upload */}
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <ProgressBar progress={progress} />}
      
      {/* List */}
      <div className="attachments-list">
        {attachments?.map(attachment => (
          <div key={attachment.id} className="attachment-item">
            <span>{attachment.filename}</span>
            <span>{(attachment.fileSize / 1024).toFixed(2)} KB</span>
            <button onClick={() => deleteAttachment(attachment.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6.8 useApiHealth()

Monitor API health status.

**Usage:**
```typescript
import { useApiHealth } from '@/hooks/useApi';

function ApiHealthIndicator() {
  const { healthy, checking, error, checkHealth } = useApiHealth();
  
  return (
    <div className="health-indicator">
      {checking ? (
        <span>Checking...</span>
      ) : healthy ? (
        <span className="status-healthy">✅ API Healthy</span>
      ) : (
        <span className="status-unhealthy">❌ API Down</span>
      )}
      
      {error && <p className="error">{error.message}</p>}
      
      <button onClick={checkHealth}>Refresh</button>
    </div>
  );
}
```

---

## 7. Error Handling

### 7.1 Error Types

**ApiClientError:**
```typescript
class ApiClientError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}
```

**Usage:**
```typescript
import { ApiClientError } from '@/lib/api-client';

try {
  await ApiClient.createNote(data);
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Details:', error.details);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### 7.2 Error Response Format

**Standard Error Response:**
```json
{
  "error": "Validation failed",
  "details": {
    "field": "email",
    "message": "Email already exists"
  }
}
```

### 7.3 HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

### 7.4 Error Handling Patterns

**Component-Level Error Handling:**
```typescript
function MyComponent() {
  const { data, loading, error } = useNotes();
  
  if (loading) return <Spinner />;
  
  if (error) {
    return (
      <ErrorBoundary>
        <ErrorMessage
          title="Failed to load notes"
          message={error.message}
          onRetry={() => window.location.reload()}
        />
      </ErrorBoundary>
    );
  }
  
  return <div>{/* Render data */}</div>;
}
```

**Global Error Handler:**
```typescript
// src/lib/error-handler.ts
export function handleApiError(error: unknown) {
  if (error instanceof ApiClientError) {
    switch (error.statusCode) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;
      case 403:
        toast.error('You do not have permission to perform this action');
        break;
      case 404:
        toast.error('Resource not found');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(error.message);
    }
  } else {
    toast.error('An unexpected error occurred');
    console.error(error);
  }
}
```

**Try-Catch with Toast:**
```typescript
import { toast } from 'sonner';

async function handleCreateNote(data: CreateNoteInput) {
  try {
    const note = await ApiClient.createNote(data);
    toast.success('Note created successfully!');
    return note;
  } catch (error) {
    if (error instanceof ApiClientError) {
      toast.error(error.message);
    } else {
      toast.error('Failed to create note');
    }
    throw error;
  }
}
```

---

## 8. File Uploads

### 8.1 Receipt Upload with OCR

**Complete Example:**
```typescript
import { useFileUpload } from '@/hooks/useApi';
import { toast } from 'sonner';

function ReceiptUploadPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<Receipt | null>(null);
  
  const { uploadReceipt, uploading, progress, error } = useFileUpload({
    onSuccess: (receipt) => {
      setOcrResult(receipt);
      toast.success('Receipt processed successfully!');
    },
    onError: (err) => {
      toast.error('Upload failed: ' + err.message);
    },
    onProgress: (prog) => {
      console.log(`Upload progress: ${prog.percentage}%`);
    }
  });
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload
    uploadReceipt(file, {
      currency: 'IDR'
    });
  };
  
  return (
    <div className="receipt-upload">
      <h2>Upload Receipt</h2>
      
      {/* File Input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      
      {/* Preview */}
      {preview && (
        <div className="preview">
          <img src={preview} alt="Receipt preview" />
        </div>
      )}
      
      {/* Upload Progress */}
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p>{progress.percentage}% - Processing OCR...</p>
          <p className="hint">⏱️ This may take 2-5 seconds</p>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="error-message">
          <p>❌ {error.message}</p>
        </div>
      )}
      
      {/* OCR Result */}
      {ocrResult && (
        <div className="ocr-result">
          <h3>✅ Receipt Processed</h3>
          <div className="result-details">
            <p><strong>Merchant:</strong> {ocrResult.merchantName}</p>
            <p><strong>Total:</strong> Rp {ocrResult.totalAmount.toLocaleString()}</p>
            <p><strong>Date:</strong> {ocrResult.transactionDate}</p>
            <p><strong>Confidence:</strong> {(ocrResult.ocrData.confidence! * 100).toFixed(1)}%</p>
            
            {/* Items */}
            {ocrResult.ocrData.items && (
              <div className="items">
                <h4>Items:</h4>
                {ocrResult.ocrData.items.map((item, idx) => (
                  <div key={idx} className="item">
                    <span>{item.name}</span>
                    <span>{item.quantity} x Rp {item.price.toLocaleString()}</span>
                    <span>= Rp {item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 8.2 Attachment Upload

**Example:**
```typescript
function AttachmentUploader({ noteId }: { noteId: string }) {
  const { uploadAttachment, uploading, progress } = useFileUpload();
  
  const handleUpload = async (file: File) => {
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Max size: 50MB');
      return;
    }
    
    try {
      const attachment = await uploadAttachment(noteId, file);
      toast.success(`${attachment.filename} uploaded successfully!`);
    } catch (err) {
      // Error handled by hook
    }
  };
  
  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <ProgressBar progress={progress} />}
    </div>
  );
}
```

### 8.3 MinIO Direct Upload

**Upload to Different Buckets:**
```typescript
function FileUploader() {
  const { uploadFile, uploading, progress } = useFileUpload();
  
  const handleAvatarUpload = async (file: File) => {
    const result = await uploadFile('avatars', file);
    console.log('Avatar URL:', result.url);
  };
  
  const handleDocumentUpload = async (file: File) => {
    const result = await uploadFile('uploads', file);
    console.log('Document URL:', result.url);
  };
  
  return (
    <div>
      <div>
        <label>Avatar:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
        />
      </div>
      
      <div>
        <label>Document:</label>
        <input
          type="file"
          onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0])}
        />
      </div>
      
      {uploading && <ProgressBar progress={progress} />}
    </div>
  );
}
```

### 8.4 Progress Tracking Component

**Reusable Progress Bar:**
```typescript
interface ProgressBarProps {
  progress: UploadProgress;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${progress.percentage}%`,
            transition: 'width 0.3s ease'
          }}
        />
      </div>
      <div className="progress-info">
        <span>{progress.percentage}%</span>
        <span>
          {(progress.loaded / 1024 / 1024).toFixed(2)} MB /
          {(progress.total / 1024 / 1024).toFixed(2)} MB
        </span>
      </div>
    </div>
  );
}
```

---

**[Continue to Part 3: Best Practices & Troubleshooting →](./API_INTEGRATION_PART3.md)**
