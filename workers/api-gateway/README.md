# Notaku API Gateway

Cloudflare Worker that proxies the NotaKu frontend requests to the internal FastAPI backend. The gateway ensures consistent routing, CORS handling, logging, and is prepared for future multi-model routing.

## Features

- Proxies all `\u2fapi\u2fv1\u2f*` routes to the FastAPI backend
- Preserves method, headers, cookies, and body
- Adds CORS headers to every response
- Handles preflight `OPTIONS` requests
- Provides health endpoint at `/health`
- Redirects legacy endpoints (`/api/chat` and `/api/auth/*`)
- Structured request logging
- Extensible design for caching, multi-LLM routing, and rate limiting

## Project Structure

```
workers/api-gateway
├── package.json
├── tsconfig.json
├── wrangler.toml
└── src/
    └── index.ts
```

## Setup

1. Install dependencies
   ```bash
   cd workers/api-gateway
   npm install
   ```

2. Configure environment variables in `wrangler.toml` (see defaults)

3. Set secrets (optional, for future use)
   ```bash
   wrangler secret put OPENAI_API_KEY
   wrangler secret put ANTHROPIC_API_KEY
   wrangler secret put GOOGLE_CLOUD_API_KEY
   ```

## Local Development

```bash
wrangler dev
```

## Deployment

```bash
wrangler deploy
```

Tail production logs:
```bash
wrangler tail
```

## Testing

### Health Check
```bash
curl https://backend.notaku.cloud/health
# {"status":"ok","gateway":"notaku-api-gateway"}
```

### Forward to Backend - Models
```bash
curl https://backend.notaku.cloud/api/v1/pop/models
```

### Forward to Backend - Auth
```bash
curl -X POST https://backend.notaku.cloud/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}'
# Expect 401 for invalid token (backend response)
```

### CORS Preflight
```bash
curl -X OPTIONS https://backend.notaku.cloud/api/v1/chat \
  -H "Origin: https://notaku.cloud"
# Expect 204 with CORS headers
```

### Error Handling
```bash
curl https://backend.notaku.cloud/api/v999/nonexistent
# Expect 404 JSON error from backend
```

## Environment Variables

Defined in `wrangler.toml` under `[vars]`:
- `BACKEND_FASTAPI_URL` - Backend base URL (e.g., `http://172.16.1.7:8000`)
- `OPENAI_API_KEY` (secret) - For future multi-LLM routing
- `ANTHROPIC_API_KEY` (secret)
- `GOOGLE_CLOUD_API_KEY` (secret)

## Troubleshooting

- Use `wrangler tail` to inspect logs.
- Ensure the backend is reachable from the Worker environment.
- Verify `BACKEND_FASTAPI_URL` includes protocol and hostname.
- Check DNS and route bindings in `wrangler.toml`.
- For CORS issues, confirm the frontend origin is allowed.

## Future Enhancements

- Response caching for frequently accessed data (see TODO in code).
- Smart routing based on requested LLM model.
- Per-user rate limiting.
- Observability dashboards via Cloudflare.

This gateway is now production-ready for routing all NotaKu API traffic through Cloudflare Workers.
