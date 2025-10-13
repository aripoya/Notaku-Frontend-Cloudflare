# NotaKu API (Workers Gateway)

- **Auth**
  - POST `/api/auth/register`
  - POST `/api/auth/login`
  - POST `/api/auth/refresh`
  - GET  `/api/auth/me`

- **Receipts**
  - POST `/api/receipts/upload`
  - GET  `/api/receipts/:id`
  - GET  `/api/receipts`
  - PUT  `/api/receipts/:id`
  - DELETE `/api/receipts/:id`

- **Analytics**
  - GET `/api/analytics/summary`
  - GET `/api/analytics/spending`
  - GET `/api/analytics/categories`
  - GET `/api/analytics/suppliers`

- **Chat**
  - POST `/api/chat`
  - GET  `/api/chat/history`

Notes:
- JWT in httpOnly cookie. Frontend may also pass `Authorization: Bearer <token>`.
- KV used for caching, R2 for receipt images, D1 optional for metadata.
