const base = process.env.NEXT_PUBLIC_API_URL || "";

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.headers.get("content-type")?.includes("application/json") ? res.json() : (await res.text() as any);
}
