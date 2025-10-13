export const authHandlers = {
  async register(req: Request, env: any) {
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  },
  async login(req: Request, env: any) {
    return new Response(JSON.stringify({ ok: true, token: "mock" }), { headers: { "content-type": "application/json" } });
  },
  async refresh(req: Request, env: any) {
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  },
  async me(req: Request, env: any) {
    return new Response(JSON.stringify({ ok: true, user: { id: "u1", email: "user@example.com" } }), { headers: { "content-type": "application/json" } });
  },
};
