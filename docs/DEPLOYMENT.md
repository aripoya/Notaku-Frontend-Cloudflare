# Deployment Guide

## Cloudflare Workers API Gateway
- Config: `workers/api-gateway/wrangler.toml`
- Commands:
```bash
cd workers/api-gateway
wrangler deploy
```

## Cloudflare Pages (Next.js frontend)
- Config: `frontend/next.config.js`
- Commands:
```bash
cd frontend
npm run build
wrangler pages deploy out --project-name=notaku
```

## Notes
- Set environment variables via `wrangler secret put` for `JWT_SECRET`, `BACKEND_URL`.
- Configure KV and R2 in `wrangler.toml`.
- Ensure Cloudflare Tunnel routes to your FastAPI backend.
