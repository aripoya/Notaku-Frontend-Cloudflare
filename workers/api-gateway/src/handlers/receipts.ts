export const receiptsHandlers = {
  async get(req: Request, env: any, id: string) {
    return new Response(JSON.stringify({ id, status: "completed" }), { headers: { "content-type": "application/json" } });
  },
  async list(req: Request, env: any) {
    return new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } });
  },
  async update(req: Request, env: any, id: string) {
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  },
  async del(req: Request, env: any, id: string) {
    return new Response(null, { status: 204 });
  },
};
