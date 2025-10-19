# 🚀 Notaku API Integration Guide

Complete guide for integrating with Notaku Backend API (FastAPI + PostgreSQL + Redis + MinIO)

**Base URL:** `https://api.notaku.cloud`  
**API Version:** v1  
**Location:** Jakarta, Indonesia 🇮🇩

---

## 📚 Table of Contents

1. [Quick Start](#1-quick-start)
2. [Installation & Setup](#2-installation--setup)
3. [Authentication](#3-authentication)
4. [API Client Usage](#4-api-client-usage)
5. [Available Endpoints](#5-available-endpoints)
6. [React Hooks Guide](#6-react-hooks-guide)
7. [Error Handling](#7-error-handling)
8. [File Uploads](#8-file-uploads)
9. [Best Practices](#9-best-practices)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Quick Start

Get started in under 5 minutes! 🏃‍♂️

### Step 1: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 2: Configure Environment

Create `.env.development`:

```bash
VITE_API_URL=https://api.notaku.cloud
```

### Step 3: Your First API Call

```typescript
import { useNotes } from '@/hooks/useApi';

function MyComponent() {
  const { data, loading, error } = useNotes();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.items.map(note => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  );
}
```

That's it! You're ready to go! 🎉

---

## 2. Installation & Setup

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn
- TypeScript 5+

### Environment Variables

Create environment files in your project root:

**`.env.development`** (local development):
```bash
VITE_API_URL=http://localhost:8000
```

**`.env.production`** (production):
```bash
VITE_API_URL=https://api.notaku.cloud
```

### API Client Initialization

The API client is automatically configured. Just import and use:

```typescript
import ApiClient from '@/lib/api-client';

// Check API health
const health = await ApiClient.getHealth();
console.log(health); // { status: "healthy", app: "Notaku API" }
```

---

## 3. Authentication

### 3.1 Registration

**Endpoint:** `POST /api/v1/auth/register`

**Request:**
```typescript
import ApiClient from '@/lib/api-client';

const newUser = await ApiClient.register({
  email: 'user@example.com',
  username: 'johndoe',
  password: 'SecurePass123!'
});
```

**Request Body:**
```typescript
interface UserRegistration {
  email: string;
  username: string;
  password: string;
}
```

**Success Response (201):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2025-10-19T05:38:00Z",
    "isActive": true
  },
  "message": "User registered successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Email already exists",
  "details": {
    "field": "email"
  }
}
```

### 3.2 Login

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```typescript
const authResponse = await ApiClient.login({
  email: 'user@example.com',
  password: 'SecurePass123!'
});
```

**Request Body:**
```typescript
interface UserLogin {
  email: string;
  password: string;
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "lastLogin": "2025-10-19T05:38:00Z"
  },
  "message": "Login successful"
}
```

> 🔐 **Note:** Session is managed via HTTP-only cookies. No need to manually handle tokens.

### 3.3 Logout

**Endpoint:** `POST /api/v1/auth/logout`

```typescript
await ApiClient.logout();
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 3.4 Get Current User

**Endpoint:** `GET /api/v1/auth/me`

```typescript
const currentUser = await ApiClient.getCurrentUser();
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "johndoe",
  "createdAt": "2025-10-19T05:38:00Z",
  "lastLogin": "2025-10-19T05:38:00Z",
  "isActive": true
}
```

### 3.5 Using useAuth Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function LoginPage() {
  const { login, user, isAuthenticated, loading, error } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      // User is now logged in, redirect to dashboard
    } catch (err) {
      console.error('Login failed:', err);
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.username}!</p>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

---

## 4. API Client Usage

### 4.1 Direct API Client

Import and use the API client directly for one-off requests:

```typescript
import ApiClient from '@/lib/api-client';

// Get all notes
const notes = await ApiClient.getNotes({ page: 1, pageSize: 10 });

// Create a note
const newNote = await ApiClient.createNote({
  title: 'My First Note',
  content: 'Hello World!',
  tags: ['personal', 'important']
});

// Upload receipt
const receipt = await ApiClient.uploadReceipt(file, {
  merchantName: 'Supermarket',
  totalAmount: 150000
});
```

### 4.2 Available Methods

#### Health & System
- `ApiClient.getHealth()` - Check API health
- `ApiClient.getSystemInfo()` - Get system information
- `ApiClient.getApiInfo()` - Get API version info

#### Authentication
- `ApiClient.register(data)` - Register new user
- `ApiClient.login(data)` - Login user
- `ApiClient.logout()` - Logout user
- `ApiClient.getCurrentUser()` - Get current user
- `ApiClient.refreshToken()` - Refresh session token

#### Users
- `ApiClient.getUser(userId)` - Get user by ID
- `ApiClient.updateUser(userId, data)` - Update user
- `ApiClient.deleteUser(userId)` - Delete user

#### Notes
- `ApiClient.getNotes(params?)` - List notes (paginated)
- `ApiClient.getNote(noteId)` - Get single note
- `ApiClient.createNote(data)` - Create note
- `ApiClient.updateNote(noteId, data)` - Update note
- `ApiClient.deleteNote(noteId)` - Delete note

#### Receipts
- `ApiClient.getReceipts(params?)` - List receipts
- `ApiClient.getReceipt(receiptId)` - Get receipt
- `ApiClient.uploadReceipt(file, metadata?, onProgress?)` - Upload with OCR
- `ApiClient.updateReceipt(receiptId, data)` - Update receipt
- `ApiClient.deleteReceipt(receiptId)` - Delete receipt

#### Attachments
- `ApiClient.getAttachments(noteId)` - List attachments
- `ApiClient.uploadAttachment(noteId, file, onProgress?)` - Upload file
- `ApiClient.deleteAttachment(attachmentId)` - Delete attachment

#### AI Chat
- `ApiClient.chat(request)` - Send chat message
- `ApiClient.chatStream(request, onChunk, onComplete, onError)` - Streaming chat

#### File Storage
- `ApiClient.uploadFile(bucket, file, onProgress?)` - Upload to MinIO
- `ApiClient.getFileUrl(storagePath)` - Get file URL

---

## 5. Available Endpoints

### 5.1 Health & System

#### GET /

**Description:** API root endpoint with service status

**Request:**
```typescript
const info = await ApiClient.getSystemInfo();
```

**Response (200):**
```json
{
  "message": "Notaku API - Backend Infrastructure",
  "version": "1.0.0",
  "status": "running",
  "services": {
    "postgresql": "connected",
    "redis": "connected",
    "minio": "connected",
    "ocr": "http://172.16.1.2:8000",
    "ai": "http://172.16.1.6:8000"
  }
}
```

#### GET /health

**Description:** Health check endpoint

**Response (200):**
```json
{
  "status": "healthy",
  "app": "Notaku API",
  "environment": "production"
}
```

#### GET /api/v1/info

**Description:** API information

**Response (200):**
```json
{
  "name": "Notaku API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "docs": "/docs",
    "openapi": "/openapi.json"
  }
}
```

### 5.2 Authentication Endpoints

See [Section 3: Authentication](#3-authentication) for detailed documentation.

### 5.3 Users

#### GET /api/v1/users/:id

**Description:** Get user by ID

**Parameters:**
- `id` (path) - User UUID

**Request:**
```typescript
const user = await ApiClient.getUser('550e8400-e29b-41d4-a716-446655440000');
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "johndoe",
  "createdAt": "2025-10-19T05:38:00Z",
  "updatedAt": "2025-10-19T05:38:00Z",
  "isActive": true
}
```

#### PATCH /api/v1/users/:id

**Description:** Update user information

**Request:**
```typescript
const updated = await ApiClient.updateUser(userId, {
  username: 'newusername'
});
```

**Request Body:**
```typescript
interface UpdateUser {
  username?: string;
  email?: string;
  // Other updatable fields
}
```

#### DELETE /api/v1/users/:id

**Description:** Delete user account

**Request:**
```typescript
await ApiClient.deleteUser(userId);
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### 5.4 Notes

#### GET /api/v1/notes

**Description:** List notes with pagination and filtering

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `pageSize` (number) - Items per page (default: 20)
- `tags` (string[]) - Filter by tags
- `search` (string) - Search in title/content
- `isPublic` (boolean) - Filter public/private notes

**Request:**
```typescript
const notes = await ApiClient.getNotes({
  page: 1,
  pageSize: 10,
  tags: ['important'],
  search: 'meeting'
});
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "note-uuid",
      "userId": "user-uuid",
      "title": "Meeting Notes",
      "content": "Discussion points...",
      "tags": ["work", "important"],
      "isPublic": false,
      "createdAt": "2025-10-19T05:38:00Z",
      "updatedAt": "2025-10-19T05:38:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

#### POST /api/v1/notes

**Description:** Create a new note

**Request:**
```typescript
const note = await ApiClient.createNote({
  title: 'My Note',
  content: 'Note content here...',
  tags: ['personal'],
  isPublic: false
});
```

**Request Body:**
```typescript
interface CreateNoteInput {
  title: string;
  content: string;
  tags?: string[];
  isPublic?: boolean;
}
```

**Response (201):**
```json
{
  "id": "note-uuid",
  "userId": "user-uuid",
  "title": "My Note",
  "content": "Note content here...",
  "tags": ["personal"],
  "isPublic": false,
  "createdAt": "2025-10-19T05:38:00Z",
  "updatedAt": "2025-10-19T05:38:00Z"
}
```

#### GET /api/v1/notes/:id

**Description:** Get single note by ID

**Request:**
```typescript
const note = await ApiClient.getNote('note-uuid');
```

#### PATCH /api/v1/notes/:id

**Description:** Update note

**Request:**
```typescript
const updated = await ApiClient.updateNote('note-uuid', {
  title: 'Updated Title',
  tags: ['updated', 'important']
});
```

#### DELETE /api/v1/notes/:id

**Description:** Delete note

**Request:**
```typescript
await ApiClient.deleteNote('note-uuid');
```

### 5.5 Receipts

#### GET /api/v1/receipts

**Description:** List receipts with filtering

**Query Parameters:**
- `page`, `pageSize` - Pagination
- `startDate`, `endDate` - Date range filter
- `minAmount`, `maxAmount` - Amount range
- `merchantName` - Filter by merchant

**Request:**
```typescript
const receipts = await ApiClient.getReceipts({
  page: 1,
  pageSize: 20,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  minAmount: 10000
});
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "receipt-uuid",
      "userId": "user-uuid",
      "merchantName": "Supermarket ABC",
      "totalAmount": 150000,
      "currency": "IDR",
      "transactionDate": "2025-10-19",
      "ocrData": {
        "merchantName": "Supermarket ABC",
        "totalAmount": 150000,
        "items": [
          {
            "name": "Milk",
            "quantity": 2,
            "price": 15000,
            "total": 30000
          }
        ],
        "confidence": 0.95
      },
      "imagePath": "receipts/user-uuid/receipt-uuid.jpg",
      "createdAt": "2025-10-19T05:38:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

#### POST /api/v1/receipts/upload

**Description:** Upload receipt image for OCR processing

**Request:**
```typescript
const receipt = await ApiClient.uploadReceipt(
  file,
  {
    merchantName: 'Optional Override',
    currency: 'IDR'
  },
  (progress) => {
    console.log(`Upload: ${progress.percentage}%`);
  }
);
```

**Request:** `multipart/form-data`
- `file` (File) - Receipt image (JPG, PNG)
- `merchantName` (string, optional) - Override merchant name
- `totalAmount` (number, optional) - Override total amount
- `currency` (string, optional) - Currency code (default: IDR)
- `transactionDate` (string, optional) - Transaction date

**Response (201):**
```json
{
  "id": "receipt-uuid",
  "userId": "user-uuid",
  "merchantName": "Supermarket ABC",
  "totalAmount": 150000,
  "currency": "IDR",
  "transactionDate": "2025-10-19",
  "ocrData": {
    "merchantName": "Supermarket ABC",
    "totalAmount": 150000,
    "items": [...],
    "rawText": "Full OCR text...",
    "confidence": 0.95
  },
  "imagePath": "receipts/user-uuid/receipt-uuid.jpg",
  "createdAt": "2025-10-19T05:38:00Z"
}
```

> ⏱️ **Note:** OCR processing takes 2-5 seconds. Show loading state to users.

#### GET /api/v1/receipts/:id

**Description:** Get receipt by ID

#### PATCH /api/v1/receipts/:id

**Description:** Update receipt information

#### DELETE /api/v1/receipts/:id

**Description:** Delete receipt

### 5.6 Attachments

#### GET /api/v1/notes/:noteId/attachments

**Description:** List all attachments for a note

**Request:**
```typescript
const attachments = await ApiClient.getAttachments('note-uuid');
```

**Response (200):**
```json
[
  {
    "id": "attachment-uuid",
    "noteId": "note-uuid",
    "userId": "user-uuid",
    "filename": "document.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1024000,
    "storagePath": "attachments/user-uuid/document.pdf",
    "createdAt": "2025-10-19T05:38:00Z"
  }
]
```

#### POST /api/v1/notes/:noteId/attachments

**Description:** Upload attachment to note

**Request:**
```typescript
const attachment = await ApiClient.uploadAttachment(
  'note-uuid',
  file,
  (progress) => {
    console.log(`Upload: ${progress.percentage}%`);
  }
);
```

#### DELETE /api/v1/attachments/:id

**Description:** Delete attachment

### 5.7 AI Chat

#### POST /api/v1/chat

**Description:** Send message to AI (non-streaming)

**Request:**
```typescript
const response = await ApiClient.chat({
  message: 'Apa itu nota?',
  conversationId: 'optional-conversation-id'
});
```

**Request Body:**
```typescript
interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
}
```

**Response (200):**
```json
{
  "message": "Nota adalah bukti transaksi pembelian...",
  "conversationId": "conversation-uuid",
  "timestamp": "2025-10-19T05:38:00Z"
}
```

#### POST /api/v1/chat/stream

**Description:** Streaming chat response

**Request:**
```typescript
await ApiClient.chatStream(
  { message: 'Jelaskan tentang OCR' },
  (chunk) => {
    // Handle each chunk
    console.log('Received:', chunk);
  },
  () => {
    // On complete
    console.log('Stream complete');
  },
  (error) => {
    // On error
    console.error('Stream error:', error);
  }
);
```

**Response:** Server-Sent Events (SSE) stream

### 5.8 File Storage (MinIO)

#### POST /api/v1/files/upload

**Description:** Upload file to MinIO storage

**Request:**
```typescript
const result = await ApiClient.uploadFile(
  'uploads', // bucket: uploads | avatars | exports | backups
  file,
  (progress) => {
    console.log(`Upload: ${progress.percentage}%`);
  }
);
```

**Response (201):**
```json
{
  "filename": "image.jpg",
  "storagePath": "uploads/user-uuid/image.jpg",
  "fileSize": 2048000,
  "mimeType": "image/jpeg",
  "url": "https://api.notaku.cloud/api/v1/files/uploads/user-uuid/image.jpg"
}
```

#### GET /api/v1/files/:path

**Description:** Get file URL

```typescript
const url = ApiClient.getFileUrl('uploads/user-uuid/image.jpg');
// Returns: https://api.notaku.cloud/api/v1/files/uploads/user-uuid/image.jpg
```

---

**[Continue to Part 2: React Hooks Guide →](./API_INTEGRATION_PART2.md)**
