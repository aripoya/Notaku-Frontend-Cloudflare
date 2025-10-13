export const analyticsHandlers = {
  async summary() {
    return new Response(JSON.stringify({ total: 0 }), { headers: { "content-type": "application/json" } });
  },
  async spending() {
    return new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } });
  },
  async categories() {
    return new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } });
  },
  async suppliers() {
    return new Response(JSON.stringify([]), { headers: { "content-type": "application/json" } });
  },
};
