import { API_BASE_URL } from "./api-config";

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.headers.get("content-type")?.includes("application/json") ? res.json() : (await res.text() as any);
}
