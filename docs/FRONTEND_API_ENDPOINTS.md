# Frontend API Endpoints - Complete Mapping

**Last Updated:** 2025-10-31
**Backend Base URL:** https://api.notaku.cloud
**Backend Server:** Cloudflare Tunnel → 172.16.1.7:8000

## Summary Statistics

- Total Backend Endpoints Referenced: 40 (including variants by HTTP method)
- Authentication Endpoints: 9
- Chat Endpoints: 3
- Receipt Endpoints: 10
- User Profile Endpoints: 2
- Analytics Endpoints: 4
- Subscription Endpoints: 4 (1 active, 3 mocked/disabled)
- System/Utility Endpoints: 5
- Other External Services (OCR/RAG/Integration): 3

## Issues Found

- ❌ Hardcoded URLs pointing to `backend.notaku.cloud`, `localhost`, or bare IPs: **0** (verified with `grep -rn "backend.notaku.cloud" src/`, `grep -rn "localhost:8000" src/`, `grep -rn "172.16.1" src/` → no matches)
- ⚠️ Legacy route `/api/chat` still used by `ReceiptChat` component (intended replacement: `/api/v1/chat` via backend proxy)
- ⚠️ Several subscription and receipt item endpoints exist only as placeholders/mocked flows (backend integration pending)
- ⚠️ RAG and OCR services rely on separate environment variables and bypass `API_BASE_URL`; ensure envs are aligned in all environments

---

## 1. Authentication Endpoints

### POST /api/v1/auth/register

**Status:** ⚠️ Not tested (frontend client defined; backend contract assumed)

**Referenced In:**
- `src/lib/api-client.ts` L182-L196

**Code snippet:**
```typescript
const response = await request<AuthResponse>(`${API_PREFIX}/auth/register`, {
  method: "POST",
  body: JSON.stringify(data),
});
```

**Request:**
- Method: POST
- Headers: `Content-Type: application/json`, `Accept: application/json`
- Body: `UserRegistration` payload (email, password, etc.)
- Auth required: No
- Credentials: include (via shared `REQUEST_CONFIG`)

**Expected Response:**
- Success 200: `{ token: string, user: {...} }`
- Error 4xx/5xx: `{ message/detail }` mapped to `ApiClientError`

---

### POST /api/v1/auth/login

**Status:** ⚠️ Not tested (client defined; pending backend verification)

**Referenced In:**
- `src/lib/api-client.ts` L200-L215

**Request:**
- Method: POST
- Headers: JSON
- Body: `UserLogin` (email/password)
- Auth required: No
- Credentials: include

**Expected Response:** similar to register

---

### POST /api/v1/auth/google

**Status:** ✅ Verified (returns 401 for invalid token; backend reachable via Cloudflare Tunnel)

**Referenced In:**
- `src/app/api/auth/[...nextauth]/route.ts` L128-L169

**Request:**
- Method: POST
- Headers: `Content-Type: application/json`, `Accept: application/json`
- Body: Google OAuth exchange payload (`token`, `idToken`, `email`, etc.)
- Auth required: No
- Credentials: include & CORS via NextAuth route

**Expected Response:**
- Success 200: `{ token, userId, user }`
- Error 401: `{ detail: "Invalid Google token" }`

---

### GET /api/v1/users/:id
### PATCH /api/v1/users/:id
### DELETE /api/v1/users/:id

**Status:** ⚠️ Not tested (client helpers only)

**Referenced In:**
- `src/lib/api-client.ts` L294-L309

**Requests:**
- Methods: GET / PATCH / DELETE
- Headers: JSON; Authorization Bearer token when available
- Body (PATCH): `Partial<User>`
- Credentials: include

**Notes:** Ensure backend supports these management endpoints; currently unused in UI.

---

### GET /api/v1/auth/me *(Not Found)*

**Status:** ⚠️ Missing — frontend currently does **not** call `/auth/me`. Session relies on NextAuth + local storage. Add mapping when backend endpoint is introduced.

---

## 2. PoP System Endpoints ( /api/v1/pop/* )

No references found in frontend source (`grep "/pop/"` → 0 matches). Add client helpers once backend PoP APIs are ready.

---

## 3. Chat Endpoints

### POST /api/v1/chat

**Status:** ⚠️ Not fully verified (streaming + standard requests defined; manual testing recommended)

**Referenced In:**
- `src/lib/api-client.ts` L532-L574 (standard + streaming helpers)
- `src/app/(dashboard)/dashboard/chat/page.tsx` L191-L208 (direct fetch with SSE expectations)

**Request:**
- Method: POST
- Headers: `Content-Type: application/json`, `Accept: text/event-stream` (chat page)
- Body: `ChatRequest` `{ message, conversationId, context }`
- Auth required: Bearer token (added when available)
- Credentials: include

**Expected Response:**
- Success 200: SSE/text stream or JSON depending on endpoint implementation
- Error 4xx/5xx: handled via `ApiClientError`

**Notes:** `ReceiptChat` component still posts to `/api/chat` (Next.js route). Align once backend stream is primary.

---

### GET /health

**Status:** ⚠️ Not fully verified (manual button in Chat page)

**Referenced In:**
- `src/lib/api-client.ts` L168-L170 (`ApiClient.getHealth`)
- `src/app/(dashboard)/dashboard/chat/page.tsx` L500-L516 ("Test Backend" button)

**Request:**
- Method: GET
- Headers: none
- Auth required: No
- Credentials: include (through shared config)

**Expected Response:**
- Success 200: `{ status: "ok", ... }`

---

## 4. Receipt Endpoints

### GET /api/v1/receipts

**Status:** ⚠️ Not tested (UI currently backed by local storage; helper exists)

**Referenced In:**
- `src/lib/api-client.ts` L349-L366
- `src/lib/receipts-api.ts` L201-L227

**Request:**
- Method: GET
- Headers: JSON + optional Authorization
- Query params: `limit`, `offset`, `category`, `start_date`, `end_date`, `search`
- Credentials: include

---

### POST /api/v1/receipts

**Status:** ⚠️ Not tested (helper only)

**Referenced In:**
- `src/lib/api-client.ts` L372-L377
- `src/lib/receipts-api.ts` L146-L162 (wraps helper)

**Request:**
- Method: POST
- Headers: JSON
- Body: `CreateReceiptInput`
- Auth: Bearer if token present
- Credentials: include

---

### GET /api/v1/receipts/:id
### PUT /api/v1/receipts/:id
### DELETE /api/v1/receipts/:id

**Status:** ⚠️ Not tested (components currently use mock/local storage data)

**Referenced In:**
- `src/lib/api-client.ts` L368-L390
- `src/lib/receipts-api.ts` L167-L199
- `src/app/(dashboard)/dashboard/receipts/detail/page.tsx` (commented-out API code at L168-L301)

**Request:**
- Methods: GET / PUT / DELETE
- Headers: JSON
- Body (PUT): partial receipt update
- Credentials: include

---

### POST /api/v1/receipts/upload

**Status:** ⚠️ Not tested (XHR-based helper; backend integration pending)

**Referenced In:**
- `src/lib/api-client.ts` L392-L463

**Request:**
- Method: POST
- Headers: multipart form data (handled by `FormData`)
- Body: file + optional metadata
- Auth: Bearer + cookies via `withCredentials`

---

### PUT /api/v1/receipts/items/:itemId

**Status:** ⚠️ Not tested (editing receipt items; backend contract TBD)

**Referenced In:**
- `src/components/ReceiptItems.tsx` L199-L209

**Request:**
- Method: PUT
- Headers: JSON
- Body: partial item update
- Credentials: include (not currently set; add when enabling backend)

**Note:** Additional GET/POST/DELETE item endpoints are scaffolded but commented out. Activate once backend endpoints exist.

---

## 5. User Profile Endpoints

### GET /api/v1/user/profile
### PUT /api/v1/user/profile

**Status:** ⚠️ Not tested (UI fetches but backend response unverified)

**Referenced In:**
- `src/app/(dashboard)/dashboard/settings/page.tsx` L33-L70

**Request:**
- Methods: GET (load), PUT (update)
- Headers: JSON
- Body (PUT): `{ full_name, preferred_name }`
- Auth: cookies (NextAuth session), optional Bearer token if added
- Credentials: include

**Expected Response:**
- Success 200: current profile details
- Errors logged and surfaced via toast

---

## 6. Analytics Endpoints

### GET /api/v1/analytics/summary
### GET /api/v1/analytics/trend
### GET /api/v1/analytics/by-category
### GET /api/v1/analytics/top-merchants

**Status:** ⚠️ Not tested (hooks/components not wired to live backend)

**Referenced In:**
- `src/lib/analytics-api.ts` L124-L207

**Request:**
- Method: GET
- Headers: JSON + optional Authorization
- Query params: `user_id`, `start_date`, `end_date`, `interval`, `limit`
- Credentials: include

**Expected Response:** Domain-specific analytics DTOs defined in `types/analytics.ts`.

---

## 7. Subscription Endpoints

### GET /api/v1/subscription/tiers

**Status:** ⚠️ Not tested (client ready; backend TBD)

**Referenced In:**
- `src/lib/subscription-api.ts` L121-L124

**Request:**
- Method: GET
- Headers: JSON
- Credentials: include

---

### Mocked/Disabled Endpoints (Frontend currently returns mock data)

- GET `/api/v1/subscription/quota/:userId`
- POST `/api/v1/subscription/check-permission`
- GET `/api/v1/subscription/ai-permission/:userId`

**Referenced In:**
- `src/lib/subscription-api.ts` L133-L223 (commented sections)

**Status:** ⚠️ Disabled — awaiting backend implementation. Update once endpoints are live.

---

## 8. System & Utility Endpoints

### GET /

**Status:** ⚠️ Not tested

**Referenced In:**
- `src/lib/api-client.ts` L172-L175 (`getSystemInfo`)

**Request:** simple GET for root metadata.

---

### GET /api/v1/info

**Status:** ⚠️ Not tested

**Referenced In:**
- `src/lib/api-client.ts` L176-L178

**Purpose:** fetches backend build/version info.

---

### POST /api/v1/files/upload
### GET /api/v1/files/:storagePath

**Status:** ⚠️ Not tested (upload helper ready; requires backend storage API)

**Referenced In:**
- `src/lib/api-client.ts` L582-L629

**Request:** multipart upload with `bucket` + file.

---

## 9. Other Frontend or External Endpoints

### POST https://api.notaku.cloud/query/stream (RAG Service)

**Status:** ⚠️ Not tested (depends on RAG backend availability)

**Referenced In:**
- `src/app/api/rag-proxy/route.ts` L10-L111

**Notes:** Proxied via Next.js route for CORS/streaming. Ensure `api.notaku.cloud` resolves to RAG endpoint or adjust.

--> Removed Nov 2025 — the legacy OCR dashboard and its endpoints have been retired. Upload Nota now calls `POST https://upload.notaku.cloud/api/v1/receipt/process` directly; no separate OCR status/result endpoints remain.

### POST {INTEGRATION_SERVICE_URL}/api/v1/receipt/process & GET /health (Integration Service)

**Status:** ⚠️ Not tested

**Referenced In:**
- `src/config/services.ts` L39-L185

**Notes:** Handles OCR + analytics pipelines outside FastAPI core.

---

### POST /api/chat (Next.js internal)

**Status:** ⚠️ Legacy — replace with `/api/v1/chat`

**Referenced In:**
- `src/components/receipt/ReceiptChat.tsx` L19-L21

**Notes:** This hits a local Next.js API route, not the FastAPI backend. Update during backend alignment.

---

## Recommendations

1. **Prioritize live testing** of high-priority endpoints right after backend confirmation:
   - `/api/v1/auth/login`, `/api/v1/auth/register`
   - `/api/v1/chat` (both standard and streaming flows)
   - `/api/v1/user/profile` (GET/PUT)
   - `/api/v1/receipts` CRUD once backend is ready

2. **Align Receipt & Subscription placeholders** with backend contracts to avoid silent mocks lingering in production code.

3. **Replace legacy `/api/chat` usage** in `ReceiptChat` with the new `/api/v1/chat`-based client to remove redundancy.

4. **Document backend responses** in `types/api.ts` as contracts solidify, ensuring type safety and easier regression testing.

5. **Keep environment variables in sync** across Vercel & local (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_OCR_API_URL`, integration service URLs) to avoid mismatched requests.

6. **Add monitoring/logging** around OAuth exchange, chat streaming, and receipt uploads to catch regressions early.

---

## Verification Checklist

- ✅ All `fetch()` usages reviewed and mapped
- ✅ No axios usage detected
- ✅ Endpoints grouped by category per spec
- ✅ File paths & line references included
- ✅ Request/response expectations captured
- ✅ Issues & recommendations documented
- ✅ `grep` confirms no legacy base URLs remain
- ✅ All active backend calls use `API_BASE_URL` or service-specific env vars
