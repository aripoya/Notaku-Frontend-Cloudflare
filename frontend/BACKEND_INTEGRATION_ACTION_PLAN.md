# 🎯 NotaKu Backend Integration - Action Plan

## 📊 **Current Status Analysis**

### ✅ **What We Already Have:**

1. **API Client** (`src/lib/api-client.ts`)
   - ✅ Fetch-based implementation
   - ✅ Token management
   - ✅ Error handling
   - ✅ Upload progress tracking
   - ⚠️ **Gap:** Not using axios with interceptors (as recommended)

2. **Authentication**
   - ✅ Login/Register pages
   - ✅ Token storage
   - ✅ Auth API calls
   - ⚠️ **Gap:** No useAuth hook

3. **Receipts**
   - ✅ Upload with OCR (`/dashboard/upload`)
   - ✅ Receipt list (`/dashboard/receipts`)
   - ✅ Receipt detail page
   - ✅ Receipt edit form
   - ✅ Receipt items component
   - ✅ Transaction time support
   - ⚠️ **Gap:** Pagination not fully implemented
   - ⚠️ **Gap:** Advanced filters missing

4. **Types** (`src/types/`)
   - ✅ Receipt types
   - ✅ API types
   - ✅ OCR types
   - ⚠️ **Gap:** Analytics types missing

### ❌ **What's Missing:**

1. **Analytics Dashboard** - Not implemented
2. **Chat AI Interface** - Not implemented  
3. **Settings Page** - Not implemented (preferred_name feature)
4. **Custom Hooks** - useAuth, useReceipts, useAnalytics, useChat
5. **Axios Integration** - Still using fetch

---

## 🎯 **Priority Action Plan**

### **Phase 1: Core Infrastructure** (High Priority)

#### **Task 1.1: Migrate to Axios** ⏰ 2 hours
**Why:** Better error handling, interceptors, automatic retries

**Files to Create:**
- `src/lib/axios-client.ts` - New axios-based client

**Features:**
- Request interceptor (auto-add token)
- Response interceptor (auto-refresh token on 401)
- Error handling
- Timeout configuration
- Upload progress tracking

**Status:** 🟡 **Recommended but Optional**  
*Current fetch implementation works fine. Can be done later.*

---

#### **Task 1.2: Create Custom Hooks** ⏰ 3 hours
**Why:** Centralize API logic, better state management

**Files to Create:**

1. **`src/hooks/useAuth.ts`**
   ```typescript
   - useAuth()
     - user: User | null
     - loading: boolean
     - login(username, password)
     - logout()
     - register(data)
     - checkAuth()
   ```

2. **`src/hooks/useReceipts.ts`**
   ```typescript
   - useReceipts(filters?)
     - receipts: Receipt[]
     - loading: boolean
     - error: Error | null
     - pagination: {page, limit, total, hasMore}
     - fetchReceipts()
     - uploadReceipt(file)
     - updateReceipt(id, data)
     - deleteReceipt(id)
   ```

3. **`src/hooks/useAnalytics.ts`**
   ```typescript
   - useAnalytics(period?)
     - summary: AnalyticsSummary
     - categories: CategoryData[]
     - trend: TrendData[]
     - loading: boolean
     - fetchAnalytics(period)
   ```

4. **`src/hooks/useChat.ts`**
   ```typescript
   - useChat()
     - messages: Message[]
     - loading: boolean
     - sendMessage(text)
     - streamMessage(text, onChunk)
   ```

**Status:** 🔴 **HIGH PRIORITY**  
*Needed for cleaner component code*

---

### **Phase 2: Missing Pages** (High Priority)

#### **Task 2.1: Analytics Dashboard** ⏰ 6 hours

**File:** `src/app/(dashboard)/dashboard/analytics/page.tsx`

**Components to Create:**

1. **Summary Cards** (`src/components/analytics/SummaryCards.tsx`)
   - Total Spending
   - Total Receipts
   - Average per Transaction
   - Biggest Expense

2. **Spending Chart** (`src/components/analytics/SpendingChart.tsx`)
   - Line/Area chart (Recharts)
   - Daily/Weekly/Monthly granularity
   - Interactive tooltips

3. **Category Pie Chart** (`src/components/analytics/CategoryPieChart.tsx`)
   - Pie chart with percentages
   - Click to filter

4. **Top Merchants** (`src/components/analytics/TopMerchants.tsx`)
   - Bar chart
   - Top 10 merchants by spending

**API Endpoints:**
```typescript
GET /api/v1/analytics/summary?period=this_month
GET /api/v1/analytics/by-category?period=this_month
GET /api/v1/analytics/trend?period=last_30_days&granularity=daily
GET /api/v1/analytics/top-merchants?limit=10
```

**Status:** 🔴 **HIGH PRIORITY**  
*Core feature requested by user*

---

#### **Task 2.2: Chat AI Interface** ⏰ 5 hours

**File:** `src/app/(dashboard)/dashboard/chat/page.tsx`

**Components:**
1. **`src/components/chat/ChatInterface.tsx`**
   - Message list with scroll
   - Input box with send button
   - Typing indicator
   - Avatar for Diajeng AI
   - User preferred_name display

2. **`src/components/chat/MessageBubble.tsx`**
   - User message (right, blue)
   - AI message (left, gray)
   - Timestamp
   - Emoji support 😊

3. **`src/components/chat/StreamingText.tsx`**
   - Typewriter effect
   - Show tokens as they arrive

**Key Features:**
- ✅ Streaming responses (SSE)
- ✅ Use user's `preferred_name`
- ✅ Indonesian language
- ✅ Emoji support
- ✅ Conversation history
- ✅ Error handling

**API:**
```typescript
POST /api/v1/chat
{
  message: "Berapa total pengeluaran bulan ini?",
  conversation_id: "uuid",
  stream: true
}

// Response: text/event-stream
data: {"chunk": "Halo ", "conversation_id": "uuid"}
data: {"chunk": "Ipoy! ", ...}
data: {"chunk": "Total pengeluaran..."}
```

**Status:** 🟡 **MEDIUM PRIORITY**  
*Nice to have, but analytics is more important*

---

#### **Task 2.3: Settings Page** ⏰ 2 hours

**File:** `src/app/(dashboard)/dashboard/settings/page.tsx`

**Sections:**
1. **Profile Settings**
   - Full Name
   - Email
   - Username (read-only)

2. **Personalization**
   - **Preferred Name** (for Chat AI)
   - Language (Indonesian/English)

3. **Subscription**
   - Current tier
   - Upgrade button

**API:**
```typescript
GET /api/v1/auth/me
PATCH /api/v1/users/{user_id}/preferred-name
{
  preferred_name: "Ipoy"
}
```

**Status:** 🟡 **MEDIUM PRIORITY**  
*Needed for Chat AI personalization*

---

### **Phase 3: Enhancements** (Medium Priority)

#### **Task 3.1: Receipt List Improvements** ⏰ 3 hours

**File:** `src/app/(dashboard)/dashboard/receipts/page.tsx`

**Enhancements:**
1. **Pagination**
   - Previous/Next buttons
   - Page numbers
   - Items per page selector

2. **Filters**
   - Date range picker
   - Category dropdown
   - Search merchant
   - Sort by (date, amount, merchant)

3. **Bulk Operations**
   - Select multiple
   - Delete selected
   - Export selected

**API:**
```typescript
GET /api/v1/receipts/?page=1&limit=20&sort_by=created_at&sort_order=desc&search=gramedia&category=books&date_from=2025-01-01&date_to=2025-01-31
```

**Status:** 🟡 **MEDIUM PRIORITY**  
*Enhancement, current version works*

---

#### **Task 3.2: Add Analytics Types** ⏰ 30 mins

**File:** `src/types/analytics.ts`

```typescript
interface AnalyticsSummary {
  total_spending: number;
  total_receipts: number;
  average_per_transaction: number;
  biggest_expense: number;
  period_start: string;
  period_end: string;
}

interface CategoryData {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

interface TrendData {
  date: string;
  total: number;
  count: number;
}

interface TopMerchant {
  merchant: string;
  total: number;
  count: number;
}
```

**Status:** 🟢 **EASY WIN**  
*Quick task, do this first*

---

#### **Task 3.3: Update Receipt Types** ⏰ 15 mins

**File:** `src/types/receipt.ts`

**Add missing fields from backend:**
```typescript
interface Receipt {
  // ... existing fields
  
  // Add these:
  currency: string;           // "IDR"
  items: ReceiptItem[];       // Array of line items
  is_edited: boolean;         // User edited the receipt
  ocr_engine?: string;        // "paddleocr" | "google_vision"
}

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}
```

**Status:** 🟢 **EASY WIN**

---

### **Phase 4: Polish** (Low Priority)

#### **Task 4.1: Error Boundaries** ⏰ 1 hour
- Add error boundaries to all pages
- Better error messages in Indonesian
- Retry buttons

#### **Task 4.2: Loading States** ⏰ 1 hour
- Skeleton loaders
- Spinners
- Progress bars

#### **Task 4.3: Toast Notifications** ⏰ 30 mins
- Success messages
- Error messages
- Indonesian text

**Status:** 🟢 **LOW PRIORITY**  
*Nice to have*

---

## 📋 **Implementation Priority Matrix**

| Task | Priority | Time | Impact | Difficulty |
|------|----------|------|--------|------------|
| **Analytics Types** | 🔴 HIGH | 30m | High | Easy |
| **Receipt Types Update** | 🔴 HIGH | 15m | Medium | Easy |
| **useAuth Hook** | 🔴 HIGH | 1h | High | Medium |
| **useReceipts Hook** | 🔴 HIGH | 1h | High | Medium |
| **Analytics Dashboard** | 🔴 HIGH | 6h | High | Medium |
| **useAnalytics Hook** | 🟡 MEDIUM | 1h | Medium | Medium |
| **Settings Page** | 🟡 MEDIUM | 2h | Medium | Easy |
| **Chat Interface** | 🟡 MEDIUM | 5h | Medium | Hard |
| **useChat Hook** | 🟡 MEDIUM | 1h | Medium | Medium |
| **Receipt List Filters** | 🟡 MEDIUM | 3h | Medium | Medium |
| **Axios Migration** | 🟢 LOW | 2h | Low | Easy |
| **Error Boundaries** | 🟢 LOW | 1h | Low | Easy |

---

## 🚀 **Recommended Implementation Order**

### **Week 1: Foundation**
1. ✅ Add Analytics types (30 mins)
2. ✅ Update Receipt types (15 mins)
3. ✅ Create useAuth hook (1 hour)
4. ✅ Create useReceipts hook (1 hour)
5. ✅ Create useAnalytics hook (1 hour)

**Total: ~4 hours**

---

### **Week 2: Analytics Dashboard**
1. ✅ Create SummaryCards component (2 hours)
2. ✅ Create SpendingChart component (2 hours)
3. ✅ Create CategoryPieChart component (1 hour)
4. ✅ Create TopMerchants component (1 hour)
5. ✅ Integrate all in analytics page (1 hour)
6. ✅ Add date range selector (1 hour)

**Total: ~8 hours**

---

### **Week 3: Settings & Chat**
1. ✅ Create Settings page (2 hours)
2. ✅ Add preferred_name feature (1 hour)
3. ✅ Create ChatInterface component (3 hours)
4. ✅ Implement streaming (2 hours)
5. ✅ Create useChat hook (1 hour)

**Total: ~9 hours**

---

### **Week 4: Polish**
1. ✅ Receipt list pagination (2 hours)
2. ✅ Advanced filters (2 hours)
3. ✅ Error boundaries (1 hour)
4. ✅ Loading states (1 hour)
5. ✅ Testing & bug fixes (2 hours)

**Total: ~8 hours**

---

## 📝 **Quick Start Guide**

### **Step 1: Add Missing Types**

```bash
# Create analytics types
touch src/types/analytics.ts

# Update receipt types
# Edit src/types/receipt.ts
```

### **Step 2: Create Hooks**

```bash
# Create hooks directory if not exists
mkdir -p src/hooks

# Create hook files
touch src/hooks/useAuth.ts
touch src/hooks/useReceipts.ts
touch src/hooks/useAnalytics.ts
touch src/hooks/useChat.ts
```

### **Step 3: Create Analytics Components**

```bash
# Create analytics directory
mkdir -p src/components/analytics

# Create component files
touch src/components/analytics/SummaryCards.tsx
touch src/components/analytics/SpendingChart.tsx
touch src/components/analytics/CategoryPieChart.tsx
touch src/components/analytics/TopMerchants.tsx
```

### **Step 4: Create Analytics Page**

```bash
# Create analytics page
mkdir -p src/app/(dashboard)/dashboard/analytics
touch src/app/(dashboard)/dashboard/analytics/page.tsx
```

### **Step 5: Install Dependencies**

```bash
# For charts
npm install recharts

# For date pickers
npm install react-day-picker date-fns

# For streaming (if needed)
npm install eventsource-parser
```

---

## 🎯 **Success Criteria**

### **Phase 1 (Foundation):**
- ✅ All types match backend API
- ✅ All hooks working with proper error handling
- ✅ Token management improved

### **Phase 2 (Pages):**
- ✅ Analytics dashboard shows real data
- ✅ Charts render correctly
- ✅ Settings page updates preferred_name
- ✅ Chat interface streams responses

### **Phase 3 (Enhancement):**
- ✅ Receipt list has pagination
- ✅ Filters work correctly
- ✅ Bulk operations functional

### **Phase 4 (Polish):**
- ✅ No console errors
- ✅ All Indonesian text
- ✅ Smooth loading states
- ✅ Proper error handling

---

## 📚 **Resources**

### **Backend API Docs:**
- Production: https://api.notaku.cloud/docs
- Local: http://localhost:8000/docs

### **Tech Stack:**
- **Charts:** Recharts (https://recharts.org)
- **UI:** shadcn/ui (https://ui.shadcn.com)
- **Icons:** Lucide React (https://lucide.dev)
- **Date:** date-fns (https://date-fns.org)

### **Current Implementation:**
- `src/lib/api-client.ts` - Current API client
- `src/lib/receipts-api.ts` - Receipt-specific API
- `src/lib/analytics-api.ts` - Analytics API (check if exists)

---

## ⚠️ **Important Notes**

1. **Backend is Production-Ready**
   - All endpoints tested
   - OCR working (50 workers!)
   - Chat AI operational
   - Analytics endpoints ready

2. **Focus on Frontend Integration**
   - Don't modify backend
   - Use existing API contracts
   - Follow type definitions

3. **Indonesian Language**
   - All UI text must be in Indonesian
   - Error messages in Indonesian
   - Chat responses already in Indonesian

4. **Type Safety**
   - No `any` types
   - Strict TypeScript
   - Match backend types exactly

5. **Error Handling**
   - Handle 401 (redirect to login)
   - Handle 404 (show not found)
   - Handle 500 (show error message)
   - Toast notifications for feedback

---

## 🎉 **Let's Start!**

**Recommended First Task:**
```bash
# 1. Add analytics types (30 mins)
# This is quick and enables other work

# 2. Create useAuth hook (1 hour)
# Foundation for all authenticated requests

# 3. Create useAnalytics hook (1 hour)
# Enables analytics dashboard

# 4. Build analytics dashboard (6 hours)
# High-impact feature
```

**Total first day: ~8.5 hours of focused work = Complete analytics feature!** 🚀

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0  
**Status:** Ready to implement
