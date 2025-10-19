# 📚 Notaku Frontend Documentation

Welcome to the Notaku Frontend documentation! This guide will help you integrate with the Notaku Backend API.

## 🚀 Quick Links

- **[API Integration Guide](./API_INTEGRATION.md)** - Complete API integration documentation
  - Part 1: Quick Start, Setup, Authentication, Endpoints
  - [Part 2](./API_INTEGRATION_PART2.md): React Hooks, Error Handling, File Uploads
  - [Part 3](./API_INTEGRATION_PART3.md): Best Practices, Troubleshooting

## 📖 Documentation Structure

### 1. API Integration Guide
Complete guide for integrating with Notaku Backend API (FastAPI + PostgreSQL + Redis + MinIO)

**Topics Covered:**
- ✅ Quick Start (5-minute setup)
- ✅ Installation & Environment Setup
- ✅ Authentication (Register, Login, Logout)
- ✅ API Client Usage
- ✅ All Available Endpoints
- ✅ React Hooks Guide
- ✅ Error Handling
- ✅ File Uploads with Progress
- ✅ Best Practices
- ✅ Troubleshooting

### 2. Code Files

**Type Definitions:**
- `src/types/api.ts` - All TypeScript interfaces

**API Client:**
- `src/lib/api-client.ts` - Complete API client with all methods

**React Hooks:**
- `src/hooks/useApi.ts` - Custom hooks for data fetching
- `src/hooks/useAuth.ts` - Authentication hook

## 🎯 Getting Started

### 1. Read the Documentation

Start with the [API Integration Guide](./API_INTEGRATION.md) for a comprehensive overview.

### 2. Setup Environment

Create `.env.development`:
```bash
VITE_API_URL=https://api.notaku.cloud
```

### 3. Use the Hooks

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

## 🔗 Backend API

**Base URL:** `https://api.notaku.cloud`  
**API Version:** v1  
**Location:** Jakarta, Indonesia 🇮🇩

**Tech Stack:**
- FastAPI (Python 3.11)
- PostgreSQL 15
- Redis (32GB cache)
- MinIO (S3-compatible storage)
- OCR Service (PaddleOCR on RTX 5080)
- AI Service (DeepSeek R1 14B on RTX 4090)

## 📝 Available Features

### ✅ Implemented
- [x] Type definitions for all API entities
- [x] Complete API client with error handling
- [x] React hooks for all endpoints
- [x] File upload with progress tracking
- [x] AI chat with streaming support
- [x] Authentication & session management
- [x] Notes CRUD operations
- [x] Receipts with OCR processing
- [x] Attachments management
- [x] Comprehensive documentation

### 🚧 Coming Soon
- [ ] Real-time updates with WebSockets
- [ ] Offline support with service workers
- [ ] Advanced caching with React Query
- [ ] Rate limiting handling
- [ ] Batch operations

## 🛠️ Development

### Project Structure

```
frontend/
├── src/
│   ├── types/
│   │   └── api.ts              # TypeScript type definitions
│   ├── lib/
│   │   └── api-client.ts       # API client library
│   ├── hooks/
│   │   ├── useApi.ts           # Data fetching hooks
│   │   └── useAuth.ts          # Authentication hook
│   └── components/
│       └── ...                 # React components
├── docs/
│   ├── README.md               # This file
│   ├── API_INTEGRATION.md      # Part 1: Setup & Endpoints
│   ├── API_INTEGRATION_PART2.md # Part 2: Hooks & Uploads
│   └── API_INTEGRATION_PART3.md # Part 3: Best Practices
└── .env.development            # Environment variables
```

### Available Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

## 📞 Support

**Need Help?**
- 📖 Read the [API Integration Guide](./API_INTEGRATION.md)
- 🐛 Report issues on GitHub
- 📧 Email: support@notaku.cloud
- 📚 API Docs: https://api.notaku.cloud/docs

## 🔐 Security

- All API requests use HTTPS in production
- Session management via HTTP-only cookies
- CORS properly configured
- Input validation on all forms
- File upload size limits enforced

## 📊 Performance

- Pagination for large lists
- Debounced search queries
- Request cancellation on unmount
- Optimistic UI updates
- Progress tracking for uploads

## 🌍 Localization

**Timezone:** Asia/Jakarta (WIB, UTC+7)  
**Currency:** IDR (Indonesian Rupiah)  
**Language:** Indonesian & English

## 📄 License

Proprietary - Notaku Platform © 2025

---

**Made with ❤️ for Notaku Platform**

Last Updated: October 19, 2025
