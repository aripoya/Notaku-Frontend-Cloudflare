export async function signJwt(payload: object, secret: string, expSec: number) {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = (obj: any) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  const data = `${enc(header)}.${enc({ ...payload, exp: Math.floor(Date.now() / 1000) + expSec })}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${b64}`;
}

export async function verifyJwt(token: string, secret: string) {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return null;
  const data = `${h}.${p}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  if (b64 !== s) return null;
  const payload = JSON.parse(decodeURIComponent(escape(atob(p))));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
