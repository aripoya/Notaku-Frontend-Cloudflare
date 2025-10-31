import type { ExportedHandler } from "@cloudflare/workers-types";

export interface Env {
  BACKEND_FASTAPI_URL: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_CLOUD_API_KEY?: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
  "Access-Control-Allow-Credentials": "true",
};

function applyCors(headers: Headers): Headers {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return headers;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = applyCors(new Headers(init.headers));
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function handlePreflight(): Response {
  const headers = applyCors(new Headers());
  headers.set("content-length", "0");
  return new Response(null, { status: 204, headers });
}

async function proxyToBackend(request: Request, env: Env, pathWithSearch: string): Promise<Response> {
  const backendUrl = `${env.BACKEND_FASTAPI_URL}${pathWithSearch}`;
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  const upperMethod = request.method.toUpperCase();
  if (upperMethod !== "GET" && upperMethod !== "HEAD") {
    init.body = request.body;
  }

  const backendRequest = new Request(backendUrl, init);

  const backendResponse = await fetch(backendRequest);
  const responseHeaders = applyCors(new Headers(backendResponse.headers));

  // TODO: Implement response caching when specific endpoints benefit from it.
  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

function logRequest(method: string, pathname: string, status: number, start: number): void {
  const duration = Date.now() - start;
  console.log(`[Gateway] ${method} ${pathname} → ${status} (${duration}ms)`);
}

const worker: ExportedHandler<Env> = {
  async fetch(request, env) {
    const start = Date.now();
    const url = new URL(request.url);
    const pathname = url.pathname;
    const pathWithSearch = `${pathname}${url.search}`;

    try {
      if (request.method === "OPTIONS") {
        const response = handlePreflight();
        logRequest(request.method, pathname, response.status, start);
        return response;
      }

      if (pathname === "/health") {
        const response = jsonResponse({
          status: "ok",
          gateway: "notaku-api-gateway",
          timestamp: new Date().toISOString(),
        });
        logRequest(request.method, pathname, response.status, start);
        return response;
      }

      if (pathname === "/api/chat") {
        const response = jsonResponse({
          message: "Legacy route moved to /api/v1/chat",
        }, { status: 301, headers: { Location: "/api/v1/chat" } });
        logRequest(request.method, pathname, response.status, start);
        return response;
      }

      if (pathname.startsWith("/api/auth/")) {
        const newLocation = pathname.replace("/api/auth", "/api/v1/auth");
        const response = jsonResponse({
          message: "Legacy route moved to /api/v1/auth",
        }, { status: 301, headers: { Location: newLocation } });
        logRequest(request.method, pathname, response.status, start);
        return response;
      }

      if (pathname.startsWith("/api/v1/")) {
        const response = await proxyToBackend(request, env, pathWithSearch);
        logRequest(request.method, pathname, response.status, start);
        return response;
      }

      const response = jsonResponse({ error: "Not Found" }, { status: 404 });
      logRequest(request.method, pathname, response.status, start);
      return response;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const response = jsonResponse({
        error: "Gateway error",
        detail: message,
      }, { status: 502 });
      logRequest(request.method, pathname, response.status, start);
      console.error(`[Gateway] ${request.method} ${pathname} → 502`, error);

      // TODO: Add rate limiting to protect backend resources per user/token.
      // TODO: Route chat requests to different LLM providers based on model selection.

      return response;
    }
  },
};

export default worker;
