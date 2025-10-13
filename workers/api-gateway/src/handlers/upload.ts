export async function uploadHandler(req: Request, env: any) {
  return new Response(JSON.stringify({ id: "job_123", url: "r2://mock" }), { headers: { "content-type": "application/json" } });
}
