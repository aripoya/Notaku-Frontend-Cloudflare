import { authHandlers } from "./handlers/auth";
import { uploadHandler } from "./handlers/upload";
import { receiptsHandlers } from "./handlers/receipts";
import { analyticsHandlers } from "./handlers/analytics";
import { chatHandler } from "./handlers/chat";
import { cors, handleOptions } from "./utils/cors";

export interface Env {
  KV_CACHE: KVNamespace;
  R2_RECEIPTS: R2Bucket;
  DB: D1Database;
  BACKEND_URL: string;
  JWT_SECRET: string;
}

function notFound(req: Request) {
  return new Response("Not found", { status: 404, headers: cors(req) });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === "OPTIONS") return handleOptions(req);
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      // Auth
      if (req.method === "POST" && path === "/api/auth/register") return withCors(req, await authHandlers.register(req, env));
      if (req.method === "POST" && path === "/api/auth/login") return withCors(req, await authHandlers.login(req, env));
      if (req.method === "POST" && path === "/api/auth/refresh") return withCors(req, await authHandlers.refresh(req, env));
      if (req.method === "GET" && path === "/api/auth/me") return withCors(req, await authHandlers.me(req, env));

      // Receipts
      if (req.method === "POST" && path === "/api/receipts/upload") return withCors(req, await uploadHandler(req, env));
      if (req.method === "GET" && path === "/api/receipts") return withCors(req, await receiptsHandlers.list(req, env));
      const receiptMatch = path.match(/^\/api\/receipts\/(\w[\w-]*)$/);
      if (receiptMatch) {
        const id = receiptMatch[1];
        if (req.method === "GET") return withCors(req, await receiptsHandlers.get(req, env, id));
        if (req.method === "PUT") return withCors(req, await receiptsHandlers.update(req, env, id));
        if (req.method === "DELETE") return withCors(req, await receiptsHandlers.del(req, env, id));
      }

      // Analytics
      if (req.method === "GET" && path === "/api/analytics/summary") return withCors(req, await analyticsHandlers.summary());
      if (req.method === "GET" && path === "/api/analytics/spending") return withCors(req, await analyticsHandlers.spending());
      if (req.method === "GET" && path === "/api/analytics/categories") return withCors(req, await analyticsHandlers.categories());
      if (req.method === "GET" && path === "/api/analytics/suppliers") return withCors(req, await analyticsHandlers.suppliers());

      // Chat
      if (req.method === "POST" && path === "/api/chat") return withCors(req, await chatHandler(req, env));
      if (req.method === "GET" && path === "/api/chat/history") return withCors(req, new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } }));

      return notFound(req);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || "Server error" }), { status: 500, headers: { ...cors(req), "content-type": "application/json" } });
    }
  },
} satisfies ExportedHandler<Env>;

function withCors(req: Request, res: Response) {
  const headers = new Headers(res.headers);
  const c = cors(req);
  for (const [k, v] of Object.entries(c)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
